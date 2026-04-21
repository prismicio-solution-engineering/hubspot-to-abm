"use client";

import { useEffect, useState } from "react";

import CompaniesTable from "./CompaniesTable";
import ContactsTable from "./ContactsTable";
import TypeBadge from "./TypeBadge";
import type { ErrorResponse, RecordsResponse } from "@/lib/types";

interface Props {
  listId: string | null;
  portalId: string;
}

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: RecordsResponse };

export default function ListResultsPanel({ listId, portalId }: Props) {
  const [state, setState] = useState<State>({ status: "idle" });
  const [reloadKey, setReloadKey] = useState(0);

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

  if (!listId) {
    return (
      <p className="rounded-md border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-500">
        Recherchez une liste par nom ou collez une URL HubSpot pour commencer.
      </p>
    );
  }

  if (state.status === "loading") {
    return <Skeleton />;
  }

  if (state.status === "error") {
    return (
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
    );
  }

  if (state.status !== "success") return null;
  if (!listId) return null;

  const { type, records, listName } = state.data;
  const countLabel =
    type === "contact"
      ? records.length > 1
        ? "contacts"
        : "contact"
      : records.length > 1
        ? "companies"
        : "company";

  return (
    <section className="flex flex-col gap-3">
      <header className="flex flex-wrap items-center gap-3">
        <h2 className="text-base font-semibold text-gray-900">{listName}</h2>
        <TypeBadge type={type} />
        <span className="text-sm text-gray-500">
          · {records.length} {countLabel}
        </span>
      </header>

      {records.length === 0 ? (
        <p className="rounded-md border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-500">
          Cette liste est vide.
        </p>
      ) : type === "contact" ? (
        <ContactsTable
          records={records}
          portalId={portalId}
          listId={listId}
          listName={listName}
        />
      ) : (
        <CompaniesTable records={records} portalId={portalId} />
      )}
    </section>
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
