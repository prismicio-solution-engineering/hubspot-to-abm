import { NextResponse } from "next/server";

import { HUBSPOT_OAUTH_STATE_COOKIE_NAME } from "@/lib/hubspot-oauth";
import { LEGACY_SESSION_COOKIE_NAME, SESSION_COOKIE_NAME } from "@/lib/session";

export const runtime = "nodejs";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };

  res.cookies.set(SESSION_COOKIE_NAME, "", options);
  res.cookies.set(LEGACY_SESSION_COOKIE_NAME, "", options);
  res.cookies.set(HUBSPOT_OAUTH_STATE_COOKIE_NAME, "", options);

  return res;
}
