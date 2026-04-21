import { NextResponse } from "next/server";

import {
  HubSpotError,
  getCompaniesForList,
  getContactsForList,
  getListMetadata,
} from "@/lib/hubspot";
import type { RecordsResponse } from "@/lib/types";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Invalid segment ID." }, { status: 400 });
  }

  try {
    const meta = await getListMetadata(id);

    const body: RecordsResponse =
      meta.objectType === "contact"
        ? {
            type: "contact",
            records: await getContactsForList(id),
            listName: meta.name,
            listSize: meta.size,
          }
        : {
            type: "company",
            records: await getCompaniesForList(id),
            listName: meta.name,
            listSize: meta.size,
          };

    return NextResponse.json(body);
  } catch (err) {
    if (err instanceof HubSpotError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Unknown error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
