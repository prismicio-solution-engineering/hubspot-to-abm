import { NextResponse } from "next/server";

import { getSampleCompany, HubSpotError } from "@/lib/hubspot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { companyId?: unknown; properties?: unknown };
    if (!Array.isArray(body.properties)) {
      return NextResponse.json({ error: "properties must be an array" }, { status: 400 });
    }
    const companyId =
      typeof body.companyId === "string" && body.companyId.trim().length > 0
        ? body.companyId.trim()
        : undefined;
    const result = await getSampleCompany(body.properties as string[], companyId);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof HubSpotError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Unknown error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
