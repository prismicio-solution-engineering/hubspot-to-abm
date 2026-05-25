import { NextResponse } from "next/server";

import {
  HUBSPOT_OAUTH_STATE_COOKIE_NAME,
  buildHubSpotAuthorizationUrl,
  getHubSpotRedirectUri,
} from "@/lib/hubspot-oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const state = crypto.randomUUID();

  try {
    const redirectUri = getHubSpotRedirectUri(requestUrl.origin);
    const authorizationUrl = buildHubSpotAuthorizationUrl({ redirectUri, state });
    const res = NextResponse.redirect(authorizationUrl);

    res.cookies.set(HUBSPOT_OAUTH_STATE_COOKIE_NAME, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60,
    });

    return res;
  } catch (err) {
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set(
      "error",
      err instanceof Error ? err.message : "HubSpot OAuth is not configured.",
    );
    return NextResponse.redirect(loginUrl);
  }
}
