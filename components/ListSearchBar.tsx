"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TypeBadge from "./TypeBadge";
import type { ErrorResponse, HubSpotList, SearchResponse } from "@/lib/types";

interface Props {
  onListSelected: (list: HubSpotList) => void;
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

  async function onSubmit(e: { preventDefault(): void }) {
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
          message: data.error ?? `Error ${res.status}.`,
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
        onListSelected(data.lists[0]);
        return;
      }
      setState({ status: "results", query: trimmed, lists: data.lists });
    } catch {
      setState({ status: "error", message: "Network error." });
    }
  }

  function select(list: HubSpotList) {
    setState({ status: "idle" });
    onListSelected(list);
  }

  const busy = state.status === "loading";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="list-search">Search by segment name</Label>
        <div className="flex gap-2">
          <Input
            id="list-search"
            type="text"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a segment name…"
            className="flex-1"
          />
          <Button type="submit" disabled={busy || query.trim().length === 0}>
            {busy ? "Searching…" : "Search"}
          </Button>
        </div>
      </div>

      {state.status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}

      {state.status === "empty" && (
        <p className="text-sm text-muted-foreground">
          No segment found for &ldquo;{state.query}&rdquo;.
        </p>
      )}

      {state.status === "results" && (
        <ul className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
          {state.lists.map((l, index) => {
            const safeId = typeof l.id === "string" && l.id.length > 0 ? l.id : "";
            const key = safeId ? `${safeId}-${index}` : `list-${index}`;
            return (
              <li key={key} className="border-b border-border last:border-0">
                <button
                  type="button"
                  onClick={() => select(l)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted"
                >
                  <span className="truncate font-medium text-foreground">{l.name}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    <TypeBadge type={l.objectType} />
                    <span className="text-xs text-muted-foreground">
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
