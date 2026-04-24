"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import RecommendationCards from "../RecommendationCards";
import { useCampaign } from "@/lib/campaign-context";
import type { ErrorResponse, PrismicGenerationResult } from "@/lib/types";

type GenerationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; result: PrismicGenerationResult };

export default function ReviewRecommendationsStep() {
  const {
    addRecommendationItem,
    campaign,
    discardRecommendationItem,
    updateRecommendationItem,
  } = useCampaign();
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [releaseName, setReleaseName] = useState("");
  const [generationState, setGenerationState] = useState<GenerationState>({
    status: "idle",
  });

  async function onSubmitRelease(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = releaseName.trim();
    if (!name || !campaign.recommendation || !campaign.selectedPrismicDocument) return;

    setGenerationState({ status: "loading" });

    try {
      const res = await fetch("/api/prismic/generate-abm-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          releaseName: name,
          baselineDocumentID: campaign.selectedPrismicDocument.id,
          recommendationItems: campaign.recommendation.recommendationItems,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as ErrorResponse;
        setGenerationState({
          status: "error",
          message: data.error ?? `Generation failed (${res.status}).`,
        });
        return;
      }

      const result = (await res.json()) as PrismicGenerationResult;
      setGenerationState({ status: "success", result });
      setIsReleaseModalOpen(false);
    } catch {
      setGenerationState({ status: "error", message: "Network error." });
    }
  }

  if (!campaign.recommendation) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-12 text-center transition-colors duration-200">
          <p className="text-sm font-medium text-gray-400">
            No recommendations generated yet.
          </p>
          <p className="text-xs text-gray-400">
            Go back to select contacts and generate recommendations.
          </p>
        </div>
        <Link
          href="/campaigns/new?step=select-contacts"
          className="w-fit rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Back to step 3
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between">
        <Link
          href="/campaigns/new?step=select-contacts"
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Back
        </Link>
        <button
          type="button"
          onClick={() => setIsReleaseModalOpen(true)}
          disabled={campaign.recommendation.recommendationItems.length === 0}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          Ready to generate
        </button>
      </div>

      {generationState.status === "error" && (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {generationState.message}
        </p>
      )}

      {generationState.status === "success" && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {(() => {
            const failedItems = generationState.result.items.filter((item) => !item.ok);
            const successfulItems = generationState.result.items.length - failedItems.length;
            return (
              <>
          <p className="font-medium">
            Release &ldquo;{generationState.result.release.label}&rdquo; is ready.
          </p>
          <p className="mt-1">
                  {successfulItems} personalized page
                  {successfulItems === 1 ? "" : "s"} succeeded
                  {failedItems.length > 0
                    ? `, ${failedItems.length} failed.`
                    : "."}
          </p>
                {failedItems.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-green-900">
                    {failedItems.map((item, index) => (
                      <li key={`${item.companyName}-${index}`}>
                        {item.companyName || "Unknown company"}: {item.error}
                      </li>
                    ))}
                  </ul>
                )}
          <a
            href={generationState.result.release.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex text-green-900 underline"
          >
            Open release
          </a>
              </>
            );
          })()}
        </div>
      )}

      <RecommendationCards
        recommendation={campaign.recommendation}
        openAIResponseId={campaign.openAIResponseId}
        onAddItem={addRecommendationItem}
        onUpdateItem={updateRecommendationItem}
        onDiscardItem={discardRecommendationItem}
      />

      {isReleaseModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="release-name-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsReleaseModalOpen(false)}
        >
          <form
            onSubmit={onSubmitRelease}
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-md flex-col gap-4 rounded-lg bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <h2
                  id="release-name-title"
                  className="text-base font-semibold text-gray-900"
                >
                  Give a name to your release
                </h2>
                <p className="text-sm text-gray-500">
                  This will create a Prismic release and personalize each remaining
                  recommendation.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsReleaseModalOpen(false)}
                aria-label="Close release modal"
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <span aria-hidden>✕</span>
              </button>
            </div>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">Release name</span>
              <input
                value={releaseName}
                onChange={(e) => setReleaseName(e.target.value)}
                autoFocus
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsReleaseModalOpen(false)}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  releaseName.trim().length === 0 ||
                  generationState.status === "loading"
                }
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {generationState.status === "loading" ? "Generating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
