import { NextResponse } from "next/server";

import { getPrismicReadConfigForDemo } from "@/lib/demo-showcase-server";
import {
  getPrismicDocuments,
  getPrismicDocumentsByType,
  PrismicError,
} from "@/lib/prismic";

export const runtime = "nodejs";
export const revalidate = 0;

interface DocumentsRequest {
  repository?: string;
  masterToken?: string;
  type?: string;
}

async function getDocuments({
  repository,
  masterToken,
  type = "all",
}: DocumentsRequest) {
  const prismicConfig = getPrismicReadConfigForDemo(null, repository, masterToken);
  const config = {
    repository: prismicConfig.repository,
    masterToken: prismicConfig.masterToken,
  };
  return type === "all"
    ? getPrismicDocuments(config)
    : getPrismicDocumentsByType(type, config);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = (searchParams.get("type") ?? "all").trim();
  const repository = (searchParams.get("repository") ?? "").trim();

  try {
    const documents = await getDocuments({ repository, type });
    return NextResponse.json({ documents });
  } catch (err) {
    if (err instanceof PrismicError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Unknown error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let body: DocumentsRequest;

  try {
    body = (await req.json()) as DocumentsRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (
    (body.repository !== undefined && typeof body.repository !== "string") ||
    (body.masterToken !== undefined && typeof body.masterToken !== "string") ||
    (body.type !== undefined && typeof body.type !== "string")
  ) {
    return NextResponse.json({ error: "Invalid Prismic documents payload." }, { status: 400 });
  }

  try {
    const documents = await getDocuments(body);
    return NextResponse.json({ documents });
  } catch (err) {
    if (err instanceof PrismicError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Unknown error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
