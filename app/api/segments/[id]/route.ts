import { NextResponse } from "next/server";

import { isValidSegmentId } from "@/config/segments";
import { HubSpotError, getContactsForSegment } from "@/lib/hubspot";
import type { ContactsResponse } from "@/lib/types";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!isValidSegmentId(id)) {
    return NextResponse.json({ error: "Segment inconnu." }, { status: 404 });
  }

  try {
    const contacts = await getContactsForSegment(id);
    const body: ContactsResponse = { contacts };
    return NextResponse.json(body);
  } catch (err) {
    if (err instanceof HubSpotError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Erreur inconnue.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
