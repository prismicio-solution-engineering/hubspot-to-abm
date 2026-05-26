import { NextResponse } from "next/server";

import { getPrismicReadConfigForDemo } from "@/lib/demo-showcase-server";
import {
  getPrismicDocuments,
  getPrismicDocumentsByType,
  PrismicError,
} from "@/lib/prismic";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = (searchParams.get("type") ?? "all").trim();
  const repository = (searchParams.get("repository") ?? "").trim();

  try {
    const prismicConfig = getPrismicReadConfigForDemo(null, repository);
    const config = {
      repository: prismicConfig.repository,
      masterToken: prismicConfig.masterToken,
    };
    const documents =
      type === "all"
        ? await getPrismicDocuments(config)
        : await getPrismicDocumentsByType(type, config);
    return NextResponse.json({ documents });
  } catch (err) {
    if (err instanceof PrismicError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Unknown error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
