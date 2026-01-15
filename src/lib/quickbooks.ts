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

// ============ QuickBooks Payments API ============

const QB_PAYMENTS_URL = process.env.QUICKBOOKS_ENVIRONMENT === "production"
  ? "https://api.intuit.com/quickbooks/v4/payments"
  : "https://sandbox.api.intuit.com/quickbooks/v4/payments";

async function makePaymentsRequest(endpoint: string, method: string = "POST", body?: object) {
  const token = await getValidToken();
  if (!token) throw new Error("QuickBooks not connected");

  const url = `${QB_PAYMENTS_URL}/${endpoint}`;

  const options: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      "Request-Id": `req-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    console.error("QuickBooks Payments API error:", data);
    throw new Error(data.errors?.[0]?.message || "Payment processing failed");
  }

  return data;
}

// Process a card payment
export async function processCardPayment(payment: {
  amount: number;
  currency?: string;
  card: {
    number: string;
    expMonth: string;
    expYear: string;
    cvc: string;
    name: string;
    address?: {
      streetAddress?: string;
      city?: string;
      region?: string;
      country?: string;
      postalCode?: string;
    };
  };
  description?: string;
}) {
  const token = await getValidToken();
  if (!token) throw new Error("QuickBooks not connected");

  // Create a card token first
  const tokenResponse = await makePaymentsRequest("tokens", "POST", {
    card: {
      number: payment.card.number,
      expMonth: payment.card.expMonth,
      expYear: payment.card.expYear,
      cvc: payment.card.cvc,
      name: payment.card.name,
      address: payment.card.address,
    },
  });

  // Then process the charge
  const chargeResponse = await makePaymentsRequest("charges", "POST", {
    amount: payment.amount.toFixed(2),
    currency: payment.currency || "USD",
    token: tokenResponse.value,
    context: {
      mobile: false,
      isEcommerce: true,
    },
    description: payment.description,
  });

  return chargeResponse;
}

// Process a bank account (ACH) payment
export async function processBankPayment(payment: {
  amount: number;
  bankAccount: {
    name: string;
    routingNumber: string;
    accountNumber: string;
    accountType: "PERSONAL_CHECKING" | "PERSONAL_SAVINGS" | "BUSINESS_CHECKING" | "BUSINESS_SAVINGS";
    phone: string;
  };
  description?: string;
}) {
  const token = await getValidToken();
  if (!token) throw new Error("QuickBooks not connected");

  // Create bank account token
  const tokenResponse = await makePaymentsRequest("tokens", "POST", {
    bankAccount: {
      name: payment.bankAccount.name,
      routingNumber: payment.bankAccount.routingNumber,
      accountNumber: payment.bankAccount.accountNumber,
      accountType: payment.bankAccount.accountType,
      phone: payment.bankAccount.phone,
    },
  });

  // Process the echeck
  const echeckResponse = await makePaymentsRequest("echecks", "POST", {
    amount: payment.amount.toFixed(2),
    token: tokenResponse.value,
    context: {
      mobile: false,
      isEcommerce: true,
    },
    description: payment.description,
    paymentMode: "WEB",
  });

  return echeckResponse;
}

// Check if payments are enabled
export async function isPaymentsEnabled(): Promise<boolean> {
  try {
    const token = await getValidToken();
    if (!token) return false;

    // Try to access the payments API - if it works, payments are enabled
    const response = await fetch(`${QB_PAYMENTS_URL}/charges?count=1`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        Accept: "application/json",
      },
    });

    return response.ok || response.status === 404; // 404 means no charges, but API is accessible
  } catch {
    return false;
  }
}
