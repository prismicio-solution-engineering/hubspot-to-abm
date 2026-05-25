import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    { error: "Password login is disabled. Sign in with HubSpot." },
    { status: 410 },
  );
}
