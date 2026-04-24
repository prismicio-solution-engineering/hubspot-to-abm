import { NextResponse } from "next/server";

import type { PrismicGenerationResult, RecommendationItem } from "@/lib/types";

export const runtime = "nodejs";

interface GenerateAbmPagesRequest {
  releaseName: string;
  baselineDocumentID: string;
  recommendationItems: RecommendationItem[];
}

interface PrismicReleaseResponse {
  id?: string;
  Id?: string;
  label?: string;
  Label?: string;
}

function getConfig() {
  const repository = process.env.PRISMIC_REPOSITORY;
  const token = process.env.PRISMIC_WRITE_TOKEN;

  if (!repository) throw new Error("PRISMIC_REPOSITORY is not set");
  if (!token) throw new Error("PRISMIC_WRITE_TOKEN is not set");

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

function isRequest(value: unknown): value is GenerateAbmPagesRequest {
  const body = value as Partial<GenerateAbmPagesRequest> | null;
  return (
    !!body &&
    typeof body.releaseName === "string" &&
    body.releaseName.trim().length > 0 &&
    typeof body.baselineDocumentID === "string" &&
    body.baselineDocumentID.trim().length > 0 &&
    Array.isArray(body.recommendationItems) &&
    body.recommendationItems.every(isRecommendationItem)
  );
}

async function readJsonResponse(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function createRelease(repository: string, token: string, label: string) {
  const res = await fetch(`https://${repository}.prismic.io/core/releases`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ label }),
  });

  const body = (await readJsonResponse(res)) as PrismicReleaseResponse;

  if (!res.ok) {
    throw new Error(`Prismic release error (${res.status}): ${JSON.stringify(body)}`);
  }

  const id = body.id ?? body.Id;
  const releaseLabel = body.label ?? body.Label ?? label;

  if (!id) {
    throw new Error("Prismic release response did not include an id.");
  }

  return {
    id,
    label: releaseLabel,
    url: `https://${repository}.prismic.io/builder/upcoming/${id}`,
  };
}

function toPersonalizationRow(item: RecommendationItem) {
  return {
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
  };
}

async function personalizePage({
  repository,
  token,
  baselineDocumentID,
  releaseLabel,
  item,
}: {
  repository: string;
  token: string;
  baselineDocumentID: string;
  releaseLabel: string;
  item: RecommendationItem;
}) {
  const url = new URL("https://abm.prismic.dev/api/personalize-page");
  url.searchParams.set("repository", repository);
  const requestBody = {
    baselineDocumentID,
    releaseLabel,
    row: toPersonalizationRow(item),
  };

  console.info(
    "Calling ABM personalization API",
    JSON.stringify({
      repository,
      companyName: item.companyName,
      baselineDocumentID,
      releaseLabel,
      row: requestBody.row,
    }),
  );

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const body = await readJsonResponse(res);

  return {
    ok: res.ok,
    status: res.status,
    body,
  };
}

export async function POST(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isRequest(body)) {
    return NextResponse.json(
      { error: "Invalid Prismic generation payload." },
      { status: 400 },
    );
  }

  try {
    const { repository, token } = getConfig();
    const release = await createRelease(repository, token, body.releaseName.trim());

    const items: PrismicGenerationResult["items"] = [];
    for (const item of body.recommendationItems) {
      const response = await personalizePage({
        repository,
        token,
        baselineDocumentID: body.baselineDocumentID,
        releaseLabel: release.label,
        item,
      });

      items.push({
        companyName: item.companyName,
        ok: response.ok,
        response: response.body,
        error: response.ok
          ? undefined
          : `ABM personalization error (${response.status}): ${JSON.stringify(response.body)}`,
      });
    }

    return NextResponse.json({ release, items } satisfies PrismicGenerationResult);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
