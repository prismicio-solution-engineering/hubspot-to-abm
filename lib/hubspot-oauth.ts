import "server-only";

const HUBSPOT_AUTHORIZE_URL = "https://app.hubspot.com/oauth/authorize";
const HUBSPOT_TOKEN_URL = "https://api.hubspot.com/oauth/v3/token";

export const HUBSPOT_OAUTH_STATE_COOKIE_NAME = "hubspot_oauth_state";

const DEFAULT_SCOPES = [
  "oauth",
  "crm.lists.read",
  "crm.objects.contacts.read",
  "crm.objects.companies.read",
];

interface HubSpotTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  hub_id?: number;
  hub_domain?: string;
  scope?: string;
  scopes?: string[];
}

export interface HubSpotOAuthTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number;
  portalId: string | null;
  hubDomain: string | null;
  scopes: string[];
}

function getCredentials() {
  const clientId = process.env.HUBSPOT_CLIENT_ID;
  const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;

  if (!clientId) throw new Error("HUBSPOT_CLIENT_ID is not set");
  if (!clientSecret) throw new Error("HUBSPOT_CLIENT_SECRET is not set");

  return { clientId, clientSecret };
}

export function getHubSpotScopes(): string[] {
  const raw = process.env.HUBSPOT_SCOPES;
  if (!raw) return DEFAULT_SCOPES;
  const scopes = raw.split(/[,\s]+/).map((scope) => scope.trim()).filter(Boolean);
  return scopes.length > 0 ? scopes : DEFAULT_SCOPES;
}

export function getHubSpotRedirectUri(origin: string): string {
  return process.env.HUBSPOT_REDIRECT_URI ?? `${origin}/api/auth/hubspot/callback`;
}

export function buildHubSpotAuthorizationUrl({
  redirectUri,
  state,
}: {
  redirectUri: string;
  state: string;
}): string {
  const { clientId } = getCredentials();
  const url = new URL(HUBSPOT_AUTHORIZE_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", getHubSpotScopes().join(" "));
  url.searchParams.set("state", state);
  return url.toString();
}

function normalizeTokenResponse(
  body: HubSpotTokenResponse,
  fallbackRefreshToken: string | null = null,
): HubSpotOAuthTokens {
  if (!body.access_token) {
    throw new Error("HubSpot token response did not include an access token.");
  }

  const refreshToken = body.refresh_token ?? fallbackRefreshToken;
  if (!refreshToken) {
    throw new Error("HubSpot token response did not include a refresh token.");
  }

  return {
    accessToken: body.access_token,
    refreshToken,
    expiresIn: typeof body.expires_in === "number" ? body.expires_in : 1800,
    portalId: typeof body.hub_id === "number" ? String(body.hub_id) : null,
    hubDomain: body.hub_domain ?? null,
    scopes: Array.isArray(body.scopes)
      ? body.scopes
      : typeof body.scope === "string"
        ? body.scope.split(/\s+/).filter(Boolean)
        : [],
  };
}

async function postTokenForm(
  params: URLSearchParams,
  fallbackRefreshToken: string | null = null,
): Promise<HubSpotOAuthTokens> {
  const res = await fetch(HUBSPOT_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
    cache: "no-store",
  });

  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!res.ok) {
    throw new Error(`HubSpot OAuth error (${res.status}): ${JSON.stringify(body)}`);
  }

  return normalizeTokenResponse(body as HubSpotTokenResponse, fallbackRefreshToken);
}

export function exchangeCodeForHubSpotTokens(
  code: string,
  redirectUri: string,
): Promise<HubSpotOAuthTokens> {
  const { clientId, clientSecret } = getCredentials();
  return postTokenForm(
    new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    }),
  );
}

export function refreshHubSpotTokens(
  refreshToken: string,
): Promise<HubSpotOAuthTokens> {
  const { clientId, clientSecret } = getCredentials();
  return postTokenForm(
    new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
    refreshToken,
  );
}
