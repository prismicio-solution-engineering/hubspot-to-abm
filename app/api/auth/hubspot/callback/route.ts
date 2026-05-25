import { NextResponse, type NextRequest } from "next/server";

import {
  HUBSPOT_OAUTH_STATE_COOKIE_NAME,
  exchangeCodeForHubSpotTokens,
  getHubSpotRedirectUri,
} from "@/lib/hubspot-oauth";
import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
  createSessionToken,
  sessionCookieOptions,
  type HubSpotSession,
} from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirectToLogin(origin: string, message: string): NextResponse {
  const url = new URL("/login", origin);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const error = requestUrl.searchParams.get("error");
  const storedState = req.cookies.get(HUBSPOT_OAUTH_STATE_COOKIE_NAME)?.value;

  if (error) {
    return redirectToLogin(requestUrl.origin, `HubSpot rejected the login: ${error}`);
  }

  if (!code) {
    return redirectToLogin(requestUrl.origin, "HubSpot did not return an authorization code.");
  }

  if (!state || !storedState || state !== storedState) {
    return redirectToLogin(requestUrl.origin, "HubSpot login state could not be verified.");
  }

  try {
    const redirectUri = getHubSpotRedirectUri(requestUrl.origin);
    const tokens = await exchangeCodeForHubSpotTokens(code, redirectUri);
    const now = Date.now();
    const session: HubSpotSession = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken ?? "",
      accessTokenExpiresAt: now + tokens.expiresIn * 1000,
      sessionExpiresAt: now + SESSION_DURATION_SECONDS * 1000,
      portalId: tokens.portalId,
      hubDomain: tokens.hubDomain,
      scopes: tokens.scopes,
    };

    const res = NextResponse.redirect(new URL("/", requestUrl.origin));
    res.cookies.set(
      SESSION_COOKIE_NAME,
      await createSessionToken(session),
      sessionCookieOptions(),
    );
    res.cookies.set(HUBSPOT_OAUTH_STATE_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return res;
  } catch (err) {
    return redirectToLogin(
      requestUrl.origin,
      err instanceof Error ? err.message : "HubSpot login failed.",
    );
  }
}
