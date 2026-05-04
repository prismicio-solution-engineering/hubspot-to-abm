import { NextResponse } from "next/server";

import { HubSpotError, listAllLists } from "@/lib/hubspot";
import type { SearchResponse } from "@/lib/types";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET() {
  try {
    const lists = await listAllLists();
    const body: SearchResponse = { lists };
    return NextResponse.json(body);
  } catch (err) {
    if (err instanceof HubSpotError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Unknown error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
