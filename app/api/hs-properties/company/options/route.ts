import { NextResponse } from "next/server";

import { HubSpotError, searchCompaniesForSample } from "@/lib/hubspot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = url.searchParams.get("q") ?? "";

  try {
    const companies = await searchCompaniesForSample(query);
    return NextResponse.json({ companies });
  } catch (err) {
    if (err instanceof HubSpotError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Unknown error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
