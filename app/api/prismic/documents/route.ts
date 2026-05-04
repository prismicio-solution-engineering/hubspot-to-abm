import { NextResponse } from "next/server";

import { getPrismicDocumentsByType, PrismicError } from "@/lib/prismic";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = (searchParams.get("type") ?? "").trim();

  if (!type) {
    return NextResponse.json({ error: "Missing ?type= parameter." }, { status: 400 });
  }

  try {
    const documents = await getPrismicDocumentsByType(type);
    return NextResponse.json({ documents });
  } catch (err) {
    if (err instanceof PrismicError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Unknown error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
