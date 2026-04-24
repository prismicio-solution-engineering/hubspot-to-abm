import { NextResponse } from "next/server";

import { runAbmWebSearchAgent } from "@/abm/openai";
import { getPrismicDocument, PrismicError } from "@/lib/prismic";
import type { GeneratePagesPayload, RecommendationResponse } from "@/lib/types";

export const runtime = "nodejs";

function parseRecommendationJson(text: string): RecommendationResponse {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("OpenAI did not return a JSON object.");
    value = JSON.parse(match[0]);
  }
  return normalizeRecommendation(value);
}

function isGeneratePagesPayload(value: unknown): value is GeneratePagesPayload {
  const payload = value as Partial<GeneratePagesPayload> | null;
  return (
    !!payload &&
    payload.version === "1.0" &&
    payload.target?.type === "prismic_document" &&
    typeof payload.target.documentId === "string" &&
    payload.source?.type === "hubspot_list" &&
    typeof payload.source.listId === "string" &&
    typeof payload.source.listName === "string" &&
    Array.isArray(payload.contacts)
  );
}

function normalizeRecommendation(value: unknown): RecommendationResponse {
  const maybe = value as Partial<RecommendationResponse> | null;
  if (!maybe || !Array.isArray(maybe.recommendationItems)) {
    throw new Error("OpenAI returned an invalid recommendation JSON shape.");
  }

  return {
    recommendationItems: maybe.recommendationItems.map((item) => ({
      companyName: typeof item.companyName === "string" ? item.companyName : "",
      firstName: typeof item.firstName === "string" ? item.firstName : "",
      lastName: typeof item.lastName === "string" ? item.lastName : "",
      position: typeof item.position === "string" ? item.position : "",
      challenges: Array.isArray(item.challenges)
        ? item.challenges.filter((v): v is string => typeof v === "string")
        : [],
      specificPainPoints: Array.isArray(item.specificPainPoints)
        ? item.specificPainPoints.filter((v): v is string => typeof v === "string")
        : [],
      whyThisAccount:
        typeof item.whyThisAccount === "string" ? item.whyThisAccount : "",
      personalizedInstructions:
        typeof item.personalizedInstructions === "string"
          ? item.personalizedInstructions
          : "",
    })),
  };
}

export async function POST(req: Request) {
  let payload: unknown;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isGeneratePagesPayload(payload)) {
    return NextResponse.json(
      { error: "Invalid generate-pages payload." },
      { status: 400 },
    );
  }

  if (payload.contacts.length === 0 || payload.contacts.length > 20) {
    return NextResponse.json(
      { error: "Select between 1 and 20 contacts." },
      { status: 400 },
    );
  }

  try {
    const prismicDocument = await getPrismicDocument(payload.target.documentId);
    const ai = await runAbmWebSearchAgent({
      input: {
        prismicDocument,
        hubspot: {
          source: payload.source,
          contacts: payload.contacts,
        },
      },
    });

    const recommendation = parseRecommendationJson(ai.outputText);

    return NextResponse.json({
      recommendation,
      openAIResponseId: ai.id,
    });
  } catch (err) {
    if (err instanceof PrismicError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Unknown error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
