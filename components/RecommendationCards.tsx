"use client";

import { useMemo, useState } from "react";

import type { RecommendationResponse } from "@/lib/types";

interface Props {
  recommendation: RecommendationResponse | null;
  openAIResponseId?: string | null;
}

type CopyState = "idle" | "copied" | "unavailable";

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export default function RecommendationCards({
  recommendation,
  openAIResponseId,
}: Props) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const json = useMemo(
    () => (recommendation ? JSON.stringify(recommendation, null, 2) : ""),
    [recommendation],
  );

  if (!recommendation) return null;

  async function onCopyJson() {
    const ok = await copyText(json);
    setCopyState(ok ? "copied" : "unavailable");
    window.setTimeout(() => setCopyState("idle"), 2000);
  }

  return (
    <section className="flex flex-col gap-4" aria-label="ABM recommendations">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-200 pb-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-gray-900">
            Recommended ABM pages
          </h2>
          <p className="text-sm text-gray-500">
            {recommendation.recommendationItems.length} recommendation
            {recommendation.recommendationItems.length === 1 ? "" : "s"} generated
          </p>
          {openAIResponseId && (
            <p className="text-xs text-gray-400">OpenAI response {openAIResponseId}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onCopyJson}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          {copyState === "copied"
            ? "Copied"
            : copyState === "unavailable"
              ? "Copy unavailable"
              : "Copy JSON"}
        </button>
      </div>

      <div className="grid gap-4">
        {recommendation.recommendationItems.map((item, index) => (
          <article
            key={`${item.companyName}-${item.firstName}-${item.lastName}-${index}`}
            className="rounded-md border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  {item.companyName || "Unknown company"}
                </span>
                <h3 className="text-base font-semibold text-gray-900">
                  {[item.firstName, item.lastName].filter(Boolean).join(" ") ||
                    "Unknown contact"}
                </h3>
                <p className="text-sm text-gray-500">
                  {item.position || "Position unavailable"}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <FieldList title="Challenges" items={item.challenges} />
              <FieldList title="Specific pain points" items={item.specificPainPoints} />
            </div>

            <div className="mt-4 grid gap-4">
              <FieldBlock title="Why this account" value={item.whyThisAccount} />
              <FieldBlock
                title="Personalized instructions"
                value={item.personalizedInstructions}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function FieldList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </h4>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-1.5 text-sm text-gray-700">
          {items.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-gray-400">No value returned.</p>
      )}
    </div>
  );
}

function FieldBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </h4>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
        {value || "No value returned."}
      </p>
    </div>
  );
}
