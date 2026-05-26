import { NextResponse } from "next/server";

import { getPrismicDocumentForRepo, PrismicError } from "@/lib/prismic";
import { runAbmWebSearchAgent } from "@/abm/openai";
import type { GeneratePagesPayload, RecommendationResponse } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

function getConfig() {
  const repository = process.env.JPMORGAN_PRISMIC_REPOSITORY;
  const token = process.env.JPMORGAN_PRISMIC_MASTER_TOKEN;
  if (!repository) throw new Error("JPMORGAN_PRISMIC_REPOSITORY is not set");
  if (!token) throw new Error("JPMORGAN_PRISMIC_MASTER_TOKEN is not set — add the Prismic read access token to .env.local");
  return { repository, token };
}

function isValidPayload(value: unknown): value is GeneratePagesPayload {
  const p = value as Partial<GeneratePagesPayload> | null;
  return (
    !!p &&
    p.version === "1.0" &&
    p.target?.type === "prismic_document" &&
    typeof p.target.documentId === "string" &&
    !!p.source &&
    (p.source.type === "hubspot_list" || p.source.type === "salesforce_campaign") &&
    Array.isArray(p.contacts) &&
    p.contacts.length >= 1 &&
    p.contacts.length <= 20
  );
}

function normalizeRecommendation(raw: unknown): RecommendationResponse {
  const r = raw as { recommendationItems?: unknown[] } | null;
  const items = Array.isArray(r?.recommendationItems) ? r.recommendationItems : [];
  return {
    recommendationItems: items.map((item) => {
      const i = item as Record<string, unknown>;
      return {
        companyName: String(i.companyName ?? ""),
        firstName: String(i.firstName ?? ""),
        lastName: String(i.lastName ?? ""),
        position: String(i.position ?? ""),
        challenges: Array.isArray(i.challenges) ? i.challenges.map(String) : [],
        specificPainPoints: Array.isArray(i.specificPainPoints) ? i.specificPainPoints.map(String) : [],
        personalizedInstructions: String(i.personalizedInstructions ?? ""),
      };
    }),
  };
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isValidPayload(body)) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  try {
    const { repository, token } = getConfig();
    const prismicDocument = await getPrismicDocumentForRepo(
      body.target.documentId,
      repository,
      token,
    );

    const agentResult = await runAbmWebSearchAgent({
      input: { prismicDocument, contacts: body.contacts },
    });

    let parsed: unknown;
    try {
      parsed = JSON.parse(agentResult.outputText);
    } catch {
      const match = agentResult.outputText.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Agent returned no valid JSON.");
      parsed = JSON.parse(match[0]);
    }

    const recommendation = normalizeRecommendation(parsed);

    return NextResponse.json({
      recommendation,
      openAIResponseId: agentResult.id,
    });
  } catch (err) {
    if (err instanceof PrismicError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Unknown error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
