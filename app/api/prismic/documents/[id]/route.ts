import { NextResponse } from "next/server";

import { getPrismicDocumentMetadata, PrismicError } from "@/lib/prismic";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const documentId = id.trim();

  if (!/^[A-Za-z0-9_-]{8,}$/.test(documentId)) {
    return NextResponse.json(
      { error: "Invalid Prismic document ID." },
      { status: 400 },
    );
  }

  try {
    const document = await getPrismicDocumentMetadata(documentId);
    return NextResponse.json(document);
  } catch (err) {
    if (err instanceof PrismicError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Unknown error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
