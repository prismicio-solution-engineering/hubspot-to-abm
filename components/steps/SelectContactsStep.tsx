"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import CompaniesTable from "../CompaniesTable";
import ContactsTable from "../ContactsTable";
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
  const router = useRouter();
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
    router.push("/campaigns/new?step=select-segment");
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
      router.push("/campaigns/new?step=review-recommendations");
    } catch {
      setGenerationState({ status: "error", message: "Network error." });
    }
  }

  if (!selectedList) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-12 text-center transition-colors duration-200">
          <p className="text-sm font-medium text-gray-400">
            No segment selected.
          </p>
          <p className="text-xs text-gray-400">
            Go back to the previous step to pick one.
          </p>
        </div>
        <Link
          href="/campaigns/new?step=select-segment"
          className="w-fit rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Back to step 1
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Back
        </button>
      </div>
      
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-blue-200 border-blue-500 bg-blue-50 px-4 py-4 transition-colors duration-200">
        <div className="flex flex-col gap-1">
          {campaign.selectedPrismicDocument && (
            <span className="text-xs text-gray-600">
              Prismic document:{" "}
              {campaign.selectedPrismicDocument.uid ??
                campaign.selectedPrismicDocument.id}
            </span>
          )}
          <span className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Selected segment
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-semibold text-gray-900">
              {selectedList.name}
            </span>
            <TypeBadge type={selectedList.objectType} />
          </div>
          <span className="text-xs text-gray-600">
            {selectedList.size} {selectedList.size > 1 ? "records" : "record"}
          </span>
        </div>
      </header>

      {state.status === "loading" && <Skeleton />}

      {state.status === "error" && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span>{state.message}</span>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="rounded-md border border-red-300 bg-white px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      {state.status === "success" &&
        (state.data.records.length === 0 ? (
          <p className="rounded-md border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-500">
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
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-10 animate-pulse rounded-md border border-gray-200 bg-white"
        />
      ))}
    </div>
  );
}
