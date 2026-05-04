"use client";

import { useEffect, useRef, useState } from "react";
import { Search, ChevronDown, Loader2, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import TypeBadge from "./TypeBadge";
import type { ErrorResponse, HubSpotList, SearchResponse } from "@/lib/types";

interface Props {
  onSegmentSelected: (segment: HubSpotList) => void;
}

export default function SegmentCombobox({ onSegmentSelected }: Props) {
  const [query, setQuery] = useState("");
  const [segments, setSegments] = useState<HubSpotList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<HubSpotList | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    else setQuery("");
  }, [open]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch("/api/lists")
      .then(async (res) => {
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as ErrorResponse;
          throw new Error(data.error ?? `Error ${res.status}`);
        }
        return res.json() as Promise<SearchResponse>;
      })
      .then(({ lists }) => {
        if (!cancelled) {
          setSegments(lists);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const filtered = query.trim()
    ? segments.filter((seg) =>
        seg.name.toLowerCase().includes(query.toLowerCase()),
      )
    : segments;

  function handleSelect(seg: HubSpotList) {
    setSelected(seg);
    setQuery("");
    setOpen(false);
    onSegmentSelected(seg);
  }

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      <label className="text-sm font-medium text-foreground">
        Select a segment
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-background px-3 text-sm transition-colors",
            open
              ? "border-ring ring-2 ring-ring ring-offset-1"
              : "border-input hover:border-ring/50",
          )}
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          {selected ? (
            <span className="flex items-center gap-2 truncate">
              <Users className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="truncate font-medium text-foreground">{selected.name}</span>
              <TypeBadge type={selected.objectType} />
            </span>
          ) : (
            <span className="text-muted-foreground">
              {loading
                ? "Loading segments…"
                : segments.length > 0
                  ? `${segments.length} segments available…`
                  : "No segments found"}
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </button>

        <div
          className={cn(
            "absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-card shadow-lg",
            !open && "hidden",
          )}
        >
          <div className="border-b border-border px-3 py-2">
            <div className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter segments…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 px-3 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading segments…
            </div>
          ) : error ? (
            <p className="px-3 py-3 text-sm text-destructive">{error}</p>
          ) : filtered.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              {query ? `No result for "${query}"` : "No segments available"}
            </p>
          ) : (
            <ul role="listbox" className="max-h-60 overflow-y-auto py-1">
              {filtered.map((seg) => (
                <li key={seg.id} role="option" aria-selected={selected?.id === seg.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(seg)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                      selected?.id === seg.id && "bg-accent",
                    )}
                  >
                    <Users
                      className={cn(
                        "h-4 w-4 shrink-0",
                        selected?.id === seg.id
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    />
                    <span className="flex flex-1 flex-col gap-0.5 truncate">
                      <span className="truncate font-medium text-foreground">
                        {seg.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {seg.size} {seg.size > 1 ? "records" : "record"}
                      </span>
                    </span>
                    <TypeBadge type={seg.objectType} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
