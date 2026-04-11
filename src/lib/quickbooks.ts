import OAuthClient from "intuit-oauth";
import { db } from "./db";

const oauthClient = new OAuthClient({
  clientId: process.env.QUICKBOOKS_CLIENT_ID!,
  clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET!,
  environment: process.env.QUICKBOOKS_ENVIRONMENT === "production" ? "production" : "sandbox",
  redirectUri: process.env.QUICKBOOKS_REDIRECT_URI!,
});

export function getAuthUri(): string {
  return oauthClient.authorizeUri({
    scope: [
      OAuthClient.scopes.Accounting,
      OAuthClient.scopes.Payment,
      OAuthClient.scopes.OpenId,
    ],
    state: "himalayan-properties",
  });
}

export async function handleCallback(url: string) {
  const authResponse = await oauthClient.createToken(url);
  const tokens = authResponse.getJson();

  // Store tokens in database
  await db.quickBooksToken.upsert({
    where: { realmId: tokens.realmId },
    update: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      accessTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      refreshTokenExpiresAt: new Date(Date.now() + tokens.x_refresh_token_expires_in * 1000),
    },
    create: {
      realmId: tokens.realmId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      accessTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      refreshTokenExpiresAt: new Date(Date.now() + tokens.x_refresh_token_expires_in * 1000),
    },
  });

  return tokens.realmId;
}

export async function getValidToken() {
  const stored = await db.quickBooksToken.findFirst();
  if (!stored) return null;

  // Check if access token is expired
  if (new Date() >= stored.accessTokenExpiresAt) {
    // Refresh the token
    oauthClient.setToken({
      access_token: stored.accessToken,
      refresh_token: stored.refreshToken,
      token_type: "Bearer",
      expires_in: 0,
      x_refresh_token_expires_in: 0,
      realmId: stored.realmId,
    });

    try {
      const refreshResponse = await oauthClient.refresh();
      const newTokens = refreshResponse.getJson();

      await db.quickBooksToken.update({
        where: { id: stored.id },
        data: {
          accessToken: newTokens.access_token,
          refreshToken: newTokens.refresh_token,
          accessTokenExpiresAt: new Date(Date.now() + newTokens.expires_in * 1000),
          refreshTokenExpiresAt: new Date(Date.now() + newTokens.x_refresh_token_expires_in * 1000),
        },
      });

      return {
        accessToken: newTokens.access_token,
        realmId: stored.realmId,
      };
    } catch {
      // Refresh token expired, need to re-authenticate
      await db.quickBooksToken.delete({ where: { id: stored.id } });
      return null;
    }
  }

  return {
    accessToken: stored.accessToken,
    realmId: stored.realmId,
  };
}

export async function isConnected(): Promise<boolean> {
  const token = await db.quickBooksToken.findFirst();
  return !!token;
}

export async function disconnect(): Promise<void> {
  await db.quickBooksToken.deleteMany();
}

// QuickBooks API calls
const QB_BASE_URL = process.env.QUICKBOOKS_ENVIRONMENT === "production"
  ? "https://quickbooks.api.intuit.com"
  : "https://sandbox-quickbooks.api.intuit.com";

export async function makeQBRequest(endpoint: string, method: string = "GET", body?: object) {
  const token = await getValidToken();
  if (!token) throw new Error("QuickBooks not connected");

  const url = `${QB_BASE_URL}/v3/company/${token.realmId}/${endpoint}`;

  const options: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`QuickBooks API error: ${error}`);
  }

  return response.json();
}

// Get company info
export async function getCompanyInfo() {
  const token = await getValidToken();
  if (!token) return null;

  const data = await makeQBRequest(`companyinfo/${token.realmId}`);
  return data.CompanyInfo;
}

// Get profit and loss report
export async function getProfitAndLoss(startDate: string, endDate: string) {
  const data = await makeQBRequest(
    `reports/ProfitAndLoss?start_date=${startDate}&end_date=${endDate}`
  );
  return data;
}

// Get balance sheet
export async function getBalanceSheet(asOfDate: string) {
  const data = await makeQBRequest(
    `reports/BalanceSheet?date_macro=Today`
  );
  return data;
}

// Create a payment receipt in QuickBooks
export async function createPaymentReceipt(payment: {
  tenantName: string;
  amount: number;
  date: string;
  memo?: string;
}) {
  // First, find or create the customer
  const customerQuery = await makeQBRequest(
    `query?query=select * from Customer where DisplayName = '${payment.tenantName.replace(/'/g, "\\'")}'`
  );

  let customerId: string;

  if (customerQuery.QueryResponse.Customer && customerQuery.QueryResponse.Customer.length > 0) {
    customerId = customerQuery.QueryResponse.Customer[0].Id;
  } else {
    // Create customer
    const newCustomer = await makeQBRequest("customer", "POST", {
      DisplayName: payment.tenantName,
    });
    customerId = newCustomer.Customer.Id;
  }

  // Find the rent income account (or use a default)
  const accountQuery = await makeQBRequest(
    "query?query=select * from Account where AccountType = 'Income' MAXRESULTS 1"
  );

  const incomeAccountId = accountQuery.QueryResponse.Account?.[0]?.Id || "1";

  // Create sales receipt (simpler than invoice for rent payments)
  const salesReceipt = await makeQBRequest("salesreceipt", "POST", {
    CustomerRef: { value: customerId },
    TxnDate: payment.date,
    PrivateNote: payment.memo || "Rent payment",
    Line: [
      {
        Amount: payment.amount,
        DetailType: "SalesItemLineDetail",
        SalesItemLineDetail: {
          ItemRef: { value: "1" }, // Default item
          Qty: 1,
          UnitPrice: payment.amount,
        },
      },
    ],
  });

  return salesReceipt.SalesReceipt;
}

// Get recent transactions
export async function getRecentTransactions(limit: number = 10) {
  const data = await makeQBRequest(
    `query?query=select * from SalesReceipt orderby TxnDate DESC MAXRESULTS ${limit}`
  );
  return data.QueryResponse.SalesReceipt || [];
}

// Get accounts receivable summary
export async function getAccountsReceivable() {
  const data = await makeQBRequest("reports/AgedReceivables");
  return data;
}

