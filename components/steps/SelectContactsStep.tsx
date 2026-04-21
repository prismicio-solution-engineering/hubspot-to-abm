"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import CompaniesTable from "../CompaniesTable";
import ContactsTable from "../ContactsTable";
import JsonPreviewModal from "../JsonPreviewModal";
import TypeBadge from "../TypeBadge";
import { useCampaign } from "@/lib/campaign-context";
import { buildPayload } from "@/lib/payload";
import type {
  ErrorResponse,
  GeneratePagesPayload,
  RecordsResponse,
} from "@/lib/types";

const MAX_SELECTION = 20;

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: RecordsResponse };

export default function SelectContactsStep() {
  const router = useRouter();
  const { campaign, portalId, setSelectedContactIds } = useCampaign();
  const { selectedList, selectedContactIds } = campaign;
  const listId = selectedList?.id ?? null;

  const [state, setState] = useState<State>({ status: "idle" });
  const [reloadKey, setReloadKey] = useState(0);
  const [payload, setPayload] = useState<GeneratePagesPayload | null>(null);

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
            message: data.error ?? `Erreur ${res.status}.`,
          });
          return;
        }
        const data = (await res.json()) as RecordsResponse;
        setState({ status: "success", data });
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setState({ status: "error", message: "Erreur réseau." });
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

  function onGenerate() {
    if (state.status !== "success" || state.data.type !== "contact") return;
    if (!selectedList) return;
    setPayload(
      buildPayload(
        state.data.records,
        selectedIds,
        selectedList.id,
        selectedList.name,
      ),
    );
  }

  if (!selectedList) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-md border border-dashed border-gray-300 bg-white px-4 py-8 text-sm text-gray-600">
        <p>
          Aucun segment sélectionné. Revenez à l&apos;étape précédente pour en
          choisir un.
        </p>
        <Link
          href="/campaigns/new?step=select-segment"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          Aller à l&apos;étape 1
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center gap-3">
        <h2 className="text-base font-semibold text-gray-900">
          {selectedList.name}
        </h2>
        <TypeBadge type={selectedList.objectType} />
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
            Réessayer
          </button>
        </div>
      )}

      {state.status === "success" &&
        (state.data.records.length === 0 ? (
          <p className="rounded-md border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-500">
            Cette liste est vide.
          </p>
        ) : state.data.type === "contact" ? (
          <ContactsTable
            records={state.data.records}
            portalId={portalId}
            maxSelection={MAX_SELECTION}
            selectedIds={selectedIds}
            onSelectionChange={onSelectionChange}
            onGenerate={onGenerate}
          />
        ) : (
          <CompaniesTable records={state.data.records} portalId={portalId} />
        ))}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Précédent
        </button>
      </div>

      <JsonPreviewModal payload={payload} onClose={() => setPayload(null)} />
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
