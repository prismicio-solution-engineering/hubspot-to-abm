"use client";

import Link from "next/link";
import { useStepNavigation } from "@/lib/useStepNavigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import CompaniesTable from "../CompaniesTable";
import ContactsTable from "../ContactsTable";
import GeneratingModal from "../GeneratingModal";
import TypeBadge from "../TypeBadge";
import { useCampaign } from "@/lib/campaign-context";
import { buildPayload } from "@/lib/payload";
import type {
  ErrorResponse,
  GeneratePagesPayload,
  RecommendationResponse,
  RecordsResponse,
} from "@/lib/types";

const MAX_SELECTION = 20;

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: RecordsResponse };

type GenerationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string };

interface GeneratePagesResponse {
  recommendation: RecommendationResponse;
  openAIResponseId: string;
}

export default function SelectContactsStep() {
  const { goToStep } = useStepNavigation();
  const { campaign, portalId, setRecommendation, setSelectedContactIds } =
    useCampaign();
  const { selectedList, selectedContactIds } = campaign;
  const listId = selectedList?.id ?? null;

  const [state, setState] = useState<State>({ status: "idle" });
  const [reloadKey, setReloadKey] = useState(0);
  const [generationState, setGenerationState] = useState<GenerationState>({
    status: "idle",
  });

  useEffect(() => {
    if (!listId) {
      setState({ status: "idle" });
      return;
    }

    const controller = new AbortController();
    setState({ status: "loading" });

    (async () => {
      try {
        const res = await fetch(`/api/segments/${encodeURIComponent(listId)}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as ErrorResponse;
          setState({
            status: "error",
            message: data.error ?? `Error ${res.status}.`,
          });
          return;
        }
        const data = (await res.json()) as RecordsResponse;
        setState({ status: "success", data });
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setState({ status: "error", message: "Network error." });
      }
    })();

    return () => controller.abort();
  }, [listId, reloadKey]);

  const selectedIds = useMemo(
    () => new Set(selectedContactIds),
    [selectedContactIds],
  );

  function onBack() {
    goToStep("select-segment");
  }

  function onSelectionChange(next: ReadonlySet<string>) {
    setSelectedContactIds(Array.from(next));
  }

  async function onGenerate() {
    if (state.status !== "success" || state.data.type !== "contact") return;
    if (!selectedList) return;
    if (!campaign.selectedPrismicDocument) {
      setGenerationState({
        status: "error",
        message: "Select a Prismic document before generating pages.",
      });
      return;
    }

    const requestPayload: GeneratePagesPayload = buildPayload(
      state.data.records,
      selectedIds,
      campaign.selectedPrismicDocument,
      selectedList.id,
      selectedList.name,
    );

    setGenerationState({ status: "loading" });

    try {
      const res = await fetch("/api/generate-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as ErrorResponse;
        setGenerationState({
          status: "error",
          message: data.error ?? `Generation failed (${res.status}).`,
        });
        return;
      }

      const data = (await res.json()) as GeneratePagesResponse;
      setRecommendation(data.recommendation, data.openAIResponseId);
      setGenerationState({ status: "idle" });
      goToStep("review-recommendations");
    } catch {
      setGenerationState({ status: "error", message: "Network error." });
    }
  }

  if (!selectedList) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col justify-center items-center gap-2 bg-muted/30 px-4 py-12 border-2 border-border border-dashed rounded-lg text-center">
          <p className="font-medium text-muted-foreground text-sm">No segment selected.</p>
          <p className="text-muted-foreground/70 text-xs">Go back to the previous step to pick one.</p>
        </div>
        <Link
          href="/campaigns/new?step=select-segment"
          className="bg-card hover:bg-muted shadow-sm px-4 py-2 border border-border rounded-md w-fit font-medium text-foreground text-sm transition-colors"
        >
          Back to step 2
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <GeneratingModal open={generationState.status === "loading"} />
      <div className="flex justify-between items-center">
        <Button type="button" variant="outline" size="sm" onClick={onBack}>
          Back
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-accent px-4 py-3 border border-primary/30 rounded-lg">
        <div className="flex flex-col flex-1 gap-0.5">
          {campaign.selectedPrismicDocument && (
            <span className="text-muted-foreground text-xs">
              Document:{" "}
              <span className="font-medium text-foreground">
                {campaign.selectedPrismicDocument.uid ?? campaign.selectedPrismicDocument.id}
              </span>
            </span>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-foreground text-sm">{selectedList.name}</span>
            <TypeBadge type={selectedList.objectType} />
          </div>
          <span className="text-muted-foreground text-xs">
            {selectedList.size} {selectedList.size > 1 ? "records" : "record"}
          </span>
        </div>
      </div>

      {state.status === "loading" && <Skeleton />}

      {state.status === "error" && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 bg-destructive/5 px-4 py-3 border border-destructive/20 rounded-lg text-destructive text-sm"
        >
          <span>{state.message}</span>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="bg-background hover:bg-destructive/5 px-2 py-1 border border-destructive/30 rounded-md font-medium text-xs transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {state.status === "success" &&
        (state.data.records.length === 0 ? (
          <p className="bg-card px-4 py-8 border border-border border-dashed rounded-lg text-muted-foreground text-sm text-center">
            This segment is empty.
          </p>
        ) : state.data.type === "contact" ? (
          <ContactsTable
            records={state.data.records}
            portalId={portalId}
            maxSelection={MAX_SELECTION}
            selectedIds={selectedIds}
            onSelectionChange={onSelectionChange}
            isGenerating={generationState.status === "loading"}
            generationError={
              generationState.status === "error" ? generationState.message : null
            }
            onGenerate={onGenerate}
          />
        ) : (
          <CompaniesTable records={state.data.records} portalId={portalId} />
        ))}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-muted border border-border rounded-lg h-10 animate-pulse"
        />
      ))}
    </div>
  );
}
