import { NextResponse } from "next/server";

import { getCompanyProperties, HubSpotError } from "@/lib/hubspot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const properties = await getCompanyProperties();
    return NextResponse.json({ properties });
  } catch (err) {
    if (err instanceof HubSpotError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Unknown error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
