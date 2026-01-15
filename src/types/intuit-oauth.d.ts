declare module "intuit-oauth" {
  interface OAuthClientConfig {
    clientId: string;
    clientSecret: string;
    environment: "sandbox" | "production";
    redirectUri: string;
  }

  interface AuthorizeUriOptions {
    scope: string[];
    state?: string;
  }

  interface TokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    x_refresh_token_expires_in: number;
    realmId: string;
  }

  interface TokenData {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    x_refresh_token_expires_in: number;
    realmId: string;
  }

  interface AuthResponse {
    getJson(): TokenResponse;
  }

  class OAuthClient {
    static scopes: {
      Accounting: string;
      Payment: string;
      OpenId: string;
      Profile: string;
      Email: string;
      Phone: string;
      Address: string;
    };

    constructor(config: OAuthClientConfig);
    authorizeUri(options: AuthorizeUriOptions): string;
    createToken(url: string): Promise<AuthResponse>;
    refresh(): Promise<AuthResponse>;
    setToken(token: TokenData): void;
  }

  export default OAuthClient;
}
