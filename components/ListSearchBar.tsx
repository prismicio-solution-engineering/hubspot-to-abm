"use client";

import { useState, type FormEvent } from "react";

import TypeBadge from "./TypeBadge";
import type { ErrorResponse, HubSpotList, SearchResponse } from "@/lib/types";

interface Props {
  onListSelected: (listId: string) => void;
}

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty"; query: string }
  | { status: "results"; query: string; lists: HubSpotList[] };

export default function ListSearchBar({ onListSelected }: Props) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length === 0) return;

    setState({ status: "loading" });

    try {
      const res = await fetch(`/api/lists/search?name=${encodeURIComponent(trimmed)}`);
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as ErrorResponse;
        setState({
          status: "error",
          message: data.error ?? `Erreur ${res.status}.`,
        });
        return;
      }
      const data = (await res.json()) as SearchResponse;
      if (data.lists.length === 0) {
        setState({ status: "empty", query: trimmed });
        return;
      }
      if (data.lists.length === 1) {
        setState({ status: "idle" });
        onListSelected(data.lists[0].id);
        return;
      }
      setState({ status: "results", query: trimmed, lists: data.lists });
    } catch {
      setState({ status: "error", message: "Erreur réseau." });
    }
  }

  function select(list: HubSpotList) {
    setState({ status: "idle" });
    onListSelected(list.id);
  }

  const busy = state.status === "loading";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <label htmlFor="list-search" className="text-sm font-medium text-gray-700">
        Rechercher une liste par nom
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="list-search"
          type="text"
          autoFocus
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tapez un nom de liste…"
          className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={busy || query.trim().length === 0}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 sm:w-auto"
        >
          {busy ? "Chargement…" : "Rechercher"}
        </button>
      </div>

      {state.status === "error" && (
        <p role="alert" className="text-sm text-red-700">
          {state.message}
        </p>
      )}

      {state.status === "empty" && (
        <p className="text-sm text-gray-500">
          Aucune liste trouvée pour « {state.query} ».
        </p>
      )}

      {state.status === "results" && (
        <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 bg-white shadow-sm">
          {state.lists.map((l, index) => {
            const safeId = typeof l.id === "string" && l.id.length > 0 ? l.id : "";
            const key = safeId ? `${safeId}-${index}` : `list-${index}`;
            return (
            <li key={key}>
              <button
                type="button"
                onClick={() => select(l)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50"
              >
                <span className="truncate font-medium text-gray-900">{l.name}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <TypeBadge type={l.objectType} />
                  <span className="text-xs text-gray-500">
                    {l.size} {l.size > 1 ? "records" : "record"}
                  </span>
                </span>
              </button>
            </li>
            );
          })}
        </ul>
      )}
    </form>
  );
}
