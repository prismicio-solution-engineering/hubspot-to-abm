import { NextResponse } from "next/server";

import { HubSpotError, listAllLists } from "@/lib/hubspot";
import type { HubSpotList, SearchResponse } from "@/lib/types";

export const runtime = "nodejs";
export const revalidate = 300;

const MAX_RESULTS = 10;

function rank(name: string, q: string): number {
  const lower = name.toLowerCase();
  if (lower === q) return 0;
  if (lower.startsWith(q)) return 1;
  return 2;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = url.searchParams.get("name") ?? "";
  const name = raw.trim();

  if (name.length < 1) {
    return NextResponse.json(
      { error: "Paramètre name requis (min 1 caractère)." },
      { status: 400 },
    );
  }

  try {
    const all = await listAllLists();
    const q = name.toLowerCase();

    const matches: HubSpotList[] = all.filter((l) =>
      l.name.toLowerCase().includes(q),
    );

    matches.sort((a, b) => {
      const r = rank(a.name, q) - rank(b.name, q);
      if (r !== 0) return r;
      return a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
    });

    const body: SearchResponse = { lists: matches.slice(0, MAX_RESULTS) };
    return NextResponse.json(body);
  } catch (err) {
    if (err instanceof HubSpotError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Erreur inconnue.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
