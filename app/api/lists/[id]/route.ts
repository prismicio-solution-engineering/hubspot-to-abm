import { NextResponse } from "next/server";

import { HubSpotError, getListMetadata } from "@/lib/hubspot";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Invalid segment ID." }, { status: 400 });
  }

  try {
    const metadata = await getListMetadata(id);
    return NextResponse.json(metadata);
  } catch (err) {
    if (err instanceof HubSpotError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Unknown error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
