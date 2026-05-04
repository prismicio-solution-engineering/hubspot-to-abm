"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  async function onSubmitRelease(e: { preventDefault(): void }) {
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
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-4 py-12 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            No recommendations generated yet.
          </p>
          <p className="text-xs text-muted-foreground/70">
            Go back to select contacts and generate recommendations.
          </p>
        </div>
        <Link
          href="/campaigns/new?step=select-contacts"
          className="w-fit rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-muted transition-colors"
        >
          Back to step 3
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <Link
          href="/campaigns/new?step=select-contacts"
          className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-muted transition-colors"
        >
          Back
        </Link>
        <Button
          type="button"
          onClick={() => setIsReleaseModalOpen(true)}
          disabled={campaign.recommendation.recommendationItems.length === 0}
        >
          Ready to generate
        </Button>
      </div>

      {generationState.status === "error" && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {generationState.message}
        </p>
      )}

      {generationState.status === "success" && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {(() => {
            const failedItems = generationState.result.items.filter((item) => !item.ok);
            const successfulItems = generationState.result.items.length - failedItems.length;
            return (
              <>
                <p className="font-medium">
                  Release &ldquo;{generationState.result.release.label}&rdquo; is ready.
                </p>
                <p className="mt-1">
                  {successfulItems} personalized page{successfulItems === 1 ? "" : "s"} succeeded
                  {failedItems.length > 0 ? `, ${failedItems.length} failed.` : "."}
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="release-name-title"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsReleaseModalOpen(false)}
          />
          <form
            onSubmit={onSubmitRelease}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 flex w-full max-w-md flex-col gap-5 rounded-lg border border-border bg-card p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <h2 id="release-name-title" className="text-base font-semibold text-foreground">
                  Give a name to your release
                </h2>
                <p className="text-sm text-muted-foreground">
                  This will create a Prismic release and personalise each remaining recommendation.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsReleaseModalOpen(false)}
                aria-label="Close"
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="release-name">Release name</Label>
              <Input
                id="release-name"
                value={releaseName}
                onChange={(e) => setReleaseName(e.target.value)}
                autoFocus
                placeholder="e.g. Q3 ABM – Tech Companies"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsReleaseModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={releaseName.trim().length === 0 || generationState.status === "loading"}
              >
                {generationState.status === "loading" ? "Generating…" : "Create release"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
