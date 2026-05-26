import { NextResponse } from "next/server";

import type { PrismicGenerationResult, RecommendationItem } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

function getConfig() {
  const repository = process.env.JPMORGAN_PRISMIC_REPOSITORY;
  const token = process.env.JPMORGAN_PRISMIC_WRITE_TOKEN;
  if (!repository) throw new Error("JPMORGAN_PRISMIC_REPOSITORY is not set");
  if (!token) throw new Error("JPMORGAN_PRISMIC_WRITE_TOKEN is not set");
  return { repository, token };
}

function isRecommendationItem(value: unknown): value is RecommendationItem {
  const item = value as Partial<RecommendationItem> | null;
  return (
    !!item &&
    typeof item.companyName === "string" &&
    typeof item.firstName === "string" &&
    typeof item.lastName === "string" &&
    typeof item.position === "string" &&
    Array.isArray(item.specificPainPoints) &&
    typeof item.personalizedInstructions === "string"
  );
}

async function readJsonResponse(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

async function createRelease(repository: string, token: string, label: string) {
  const res = await fetch(`https://${repository}.prismic.io/core/releases`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ label }),
  });
  const body = (await readJsonResponse(res)) as { id?: string; Id?: string; label?: string; Label?: string };
  if (!res.ok) throw new Error(`Prismic release error (${res.status}): ${JSON.stringify(body)}`);
  const id = body.id ?? body.Id;
  if (!id) throw new Error("Prismic release response did not include an id.");
  return {
    id,
    label: body.label ?? body.Label ?? label,
    url: `https://${repository}.prismic.io/builder/upcoming/${id}`,
  };
}

async function personalizePage(
  repository: string,
  token: string,
  baselineDocumentID: string,
  releaseLabel: string,
  item: RecommendationItem,
) {
  const url = new URL("https://abm.prismic.dev/api/personalize-page");
  url.searchParams.set("repository", repository);
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: token, "Content-Type": "application/json" },
    body: JSON.stringify({
      baselineDocumentID,
      releaseLabel,
      row: {
        companyName: item.companyName,
        firstName: item.firstName,
        lastName: item.lastName,
        jobTitle: item.position,
        painPointOne: item.specificPainPoints[0] ?? "",
        painPointTwo: item.specificPainPoints[1] ?? "",
        painPointThree: item.specificPainPoints[2] ?? "",
        painPointFour: item.specificPainPoints[3] ?? "",
        painPointFive: item.specificPainPoints[4] ?? "",
        personalizedInstructions: item.personalizedInstructions,
      },
    }),
  });
  return { ok: res.ok, status: res.status, body: await readJsonResponse(res) };
}

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const b = body as { releaseName?: string; baselineDocumentID?: string; recommendationItems?: unknown[] } | null;
  if (
    !b ||
    typeof b.releaseName !== "string" || !b.releaseName.trim() ||
    typeof b.baselineDocumentID !== "string" || !b.baselineDocumentID.trim() ||
    !Array.isArray(b.recommendationItems) || !b.recommendationItems.every(isRecommendationItem)
  ) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  try {
    const { repository, token } = getConfig();
    const release = await createRelease(repository, token, b.releaseName.trim());

    const items: PrismicGenerationResult["items"] = [];
    for (const item of b.recommendationItems as RecommendationItem[]) {
      const result = await personalizePage(repository, token, b.baselineDocumentID.trim(), release.label, item);
      items.push({
        companyName: item.companyName,
        ok: result.ok,
        response: result.body,
        error: result.ok ? undefined : `ABM error (${result.status}): ${JSON.stringify(result.body)}`,
      });
    }

    return NextResponse.json({ release, items } satisfies PrismicGenerationResult);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
