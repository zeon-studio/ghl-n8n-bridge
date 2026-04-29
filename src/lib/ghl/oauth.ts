import { TokenError } from "../errors";

const OAUTH_BASE_URL = "https://services.leadconnectorhq.com/oauth/token";
const API_BASE_URL = "https://services.leadconnectorhq.com";

export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  userType: "Company" | "Location";
  companyId: string;
  locationId?: string;
  planId?: string;
}

export interface InstalledLocation {
  _id: string;
  name: string;
  isInstalled: boolean;
  installedAt: string;
}

function getAppVersionId() {
  const versionId = process.env.GHL_APP_VERSION_ID;
  if (!versionId)
    throw new Error("Missing GHL_APP_VERSION_ID environment variable");
  return versionId;
}

function getMarketplaceAppId() {
  const appId = process.env.GHL_MARKETPLACE_APP_ID;
  if (!appId) {
    throw new TokenError(
      "Missing GHL_MARKETPLACE_APP_ID environment variable. This must be the Marketplace App ID (24 hex characters), not the OAuth Client ID.",
    );
  }

  if (!/^[a-fA-F0-9]{24}$/.test(appId)) {
    throw new TokenError(
      "Invalid GHL_MARKETPLACE_APP_ID format. Expected a 24-character hex string (Marketplace App ID).",
    );
  }

  return appId;
}

/**
 * Exchanges an authorization code for an access and refresh token.
 * Appends version_id as required by the constraints.
 */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri?: string,
): Promise<OAuthTokenResponse> {
  const bodyParams: Record<string, string> = {
    client_id: process.env.NEXT_PUBLIC_GHL_CLIENT_ID!,
    client_secret: process.env.GHL_CLIENT_SECRET!,
    grant_type: "authorization_code",
    code,
  };

  if (redirectUri) {
    bodyParams.redirect_uri = redirectUri;
  }

  const body = new URLSearchParams(bodyParams);

  const url = `${OAUTH_BASE_URL}?version_id=${getAppVersionId()}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const errorData = await res.text();
    throw new TokenError(`Failed to exchange code: ${res.status} ${errorData}`);
  }

  return res.json() as Promise<OAuthTokenResponse>;
}

/**
 * Refreshes an access token using a refresh token.
 * Appends version_id as required.
 */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<OAuthTokenResponse> {
  const body = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_GHL_CLIENT_ID!,
    client_secret: process.env.GHL_CLIENT_SECRET!,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const url = `${OAUTH_BASE_URL}?version_id=${getAppVersionId()}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const errorData = await res.text();
    throw new TokenError(`Failed to refresh token: ${res.status} ${errorData}`);
  }

  return res.json() as Promise<OAuthTokenResponse>;
}

/**
 * Fetches all locations where the app is installed for a given company.
 * Required for bulk installation handling.
 */
export async function getInstalledLocations(
  companyId: string,
  companyAccessToken: string,
): Promise<InstalledLocation[]> {
  const url = new URL(`${API_BASE_URL}/oauth/installedLocations`);
  url.searchParams.append("companyId", companyId);
  url.searchParams.append("appId", getMarketplaceAppId());

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${companyAccessToken}`,
      Accept: "application/json",
      Version: "2021-07-28",
    },
  });

  if (!res.ok) {
    const errorData = await res.text();
    throw new TokenError(
      `Failed to fetch installed locations: ${res.status} ${errorData}`,
    );
  }

  const data = await res.json();
  return data.locations || [];
}

/**
 * Exchanges a company access token for a location-specific access token.
 */
export async function getLocationToken(
  companyId: string,
  locationId: string,
  companyAccessToken: string,
): Promise<OAuthTokenResponse> {
  const body = new URLSearchParams({
    companyId,
    locationId,
  });

  const url = `${API_BASE_URL}/oauth/locationToken`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${companyAccessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Version: "2021-07-28",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const errorData = await res.text();
    throw new TokenError(
      `Failed to get location token: ${res.status} ${errorData}`,
    );
  }

  return res.json() as Promise<OAuthTokenResponse>;
}
