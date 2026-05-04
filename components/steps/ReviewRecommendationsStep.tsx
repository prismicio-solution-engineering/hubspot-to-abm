"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RecommendationCards from "../RecommendationCards";
import { useCampaignStore } from "@/lib/campaign-store";
import { updateCampaign } from "@/lib/campaigns-store";
import { useStepNavigation } from "@/lib/useStepNavigation";
import type { ErrorResponse, PrismicGenerationResult } from "@/lib/types";

type GenerationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; result: PrismicGenerationResult };

export default function ReviewRecommendationsStep() {
  const { goToStep } = useStepNavigation();
  const id = useCampaignStore((s) => s.id);
  const selectedPrismicDocument = useCampaignStore((s) => s.selectedPrismicDocument);
  const selectedList = useCampaignStore((s) => s.selectedList);
  const selectedContactIds = useCampaignStore((s) => s.selectedContactIds);
  const recommendation = useCampaignStore((s) => s.recommendation);
  const openAIResponseId = useCampaignStore((s) => s.openAIResponseId);
  const addRecommendationItem = useCampaignStore((s) => s.addRecommendationItem);
  const discardRecommendationItem = useCampaignStore((s) => s.discardRecommendationItem);
  const updateRecommendationItem = useCampaignStore((s) => s.updateRecommendationItem);

  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [releaseName, setReleaseName] = useState("");
  const [generationState, setGenerationState] = useState<GenerationState>({
    status: "idle",
  });

  async function onSubmitRelease(e: { preventDefault(): void }) {
    e.preventDefault();
    const name = releaseName.trim();
    if (!name || !recommendation || !selectedPrismicDocument) return;

    setGenerationState({ status: "loading" });

    try {
      const res = await fetch("/api/prismic/generate-abm-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          releaseName: name,
          baselineDocumentID: selectedPrismicDocument.id,
          recommendationItems: recommendation.recommendationItems,
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
      updateCampaign(id, {
        segment: selectedList?.name,
        contactsCount: selectedContactIds.length,
        release: result.release,
      });
    } catch {
      setGenerationState({ status: "error", message: "Network error." });
    }
  }

  if (!recommendation) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col justify-center items-center gap-2 bg-muted/30 px-4 py-12 border-2 border-border border-dashed rounded-lg text-center">
          <p className="font-medium text-muted-foreground text-sm">
            No recommendations generated yet.
          </p>
          <p className="text-muted-foreground/70 text-xs">
            Go back to select contacts and generate recommendations.
          </p>
        </div>
        <button
          type="button"
          onClick={() => goToStep("select-contacts")}
          className="bg-card hover:bg-muted shadow-sm px-4 py-2 border border-border rounded-md w-fit font-medium text-foreground text-sm transition-colors"
        >
          Back to step 3
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={() => goToStep("select-contacts")}
          className="bg-card hover:bg-muted shadow-sm px-4 py-2 border border-border rounded-md font-medium text-foreground text-sm transition-colors"
        >
          Back
        </button>
        <Button
          type="button"
          onClick={() => setIsReleaseModalOpen(true)}
          disabled={recommendation.recommendationItems.length === 0}
        >
          Ready to generate
        </Button>
      </div>

      {generationState.status === "error" && (
        <p
          role="alert"
          className="bg-destructive/5 px-4 py-3 border border-destructive/20 rounded-lg text-destructive text-sm"
        >
          {generationState.message}
        </p>
      )}

      {generationState.status === "success" && (
        <div className="bg-green-50 px-4 py-3 border border-green-200 rounded-lg text-green-800 text-sm">
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
                  <ul className="space-y-1 mt-2 pl-5 text-green-900 list-disc">
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
                  className="inline-flex mt-2 text-green-900 underline"
                >
                  Open release
                </a>
              </>
            );
          })()}
        </div>
      )}

      <RecommendationCards
        recommendation={recommendation}
        openAIResponseId={openAIResponseId}
        onAddItem={addRecommendationItem}
        onUpdateItem={updateRecommendationItem}
        onDiscardItem={discardRecommendationItem}
      />

      {isReleaseModalOpen && (
        <div
          className="z-50 fixed inset-0 flex justify-center items-center p-4"
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
            className="z-10 relative flex flex-col gap-5 bg-card shadow-xl p-6 border border-border rounded-lg w-full max-w-md"
          >
            <div className="flex justify-between items-start gap-3">
              <div className="flex flex-col gap-1">
                <h2 id="release-name-title" className="font-semibold text-foreground text-base">
                  Give a name to your release
                </h2>
                <p className="text-muted-foreground text-sm">
                  This will create a Prismic release and personalise each remaining recommendation.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsReleaseModalOpen(false)}
                aria-label="Close"
                className="hover:bg-muted p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="top-4 right-4 absolute">
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
