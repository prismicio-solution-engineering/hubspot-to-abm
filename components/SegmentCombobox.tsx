"use client";

import { useEffect, useRef, useState } from "react";
import { Search, ChevronDown, Loader2, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import TypeBadge from "./TypeBadge";
import type { ContactSourceId, ErrorResponse, Segment } from "@/lib/types";

interface Props {
  sourceId: ContactSourceId | null;
  value: Segment | null;
  onSelect: (segment: Segment | null) => void;
}

interface SegmentsResponse {
  segments: Segment[];
}

export default function SegmentCombobox({ sourceId, value, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    else setQuery("");
  }, [open]);

  useEffect(() => {
    if (!sourceId) {
      setSegments([]);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/sources/${encodeURIComponent(sourceId)}/segments`)
      .then(async (res) => {
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as ErrorResponse;
          throw new Error(data.error ?? `Error ${res.status}`);
        }
        return res.json() as Promise<SegmentsResponse>;
      })
      .then(({ segments: items }) => {
        if (!cancelled) {
          setSegments(items);
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
  }, [sourceId]);

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

  function handleSelect(seg: Segment) {
    setQuery("");
    setOpen(false);
    onSelect(seg);
  }

  const disabled = !sourceId;

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      <label className="font-medium text-foreground text-sm">
        Select a segment
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => {
            if (!disabled) setOpen((v) => !v);
          }}
          disabled={disabled}
          className={cn(
            "flex justify-between items-center gap-2 bg-background px-3 border rounded-md w-full h-9 text-sm transition-colors",
            disabled && "opacity-60 cursor-not-allowed",
            open
              ? "border-ring ring-2 ring-ring ring-offset-1"
              : "border-input hover:border-ring/50",
          )}
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          {value ? (
            <span className="flex items-center gap-2 truncate">
              <Users className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="font-medium text-foreground truncate">{value.name}</span>
              <TypeBadge type={value.objectType} />
            </span>
          ) : (
            <span className="flex items-center gap-2 text-muted-foreground">
              {disabled
                ? "Select a CRM source first"
                : loading
                  ? "Loading segments…"
                  : segments.length > 0
                    ? `${segments.length} segments available`
                    : "No segments found"}
            </span>
          )}
          <ChevronDown
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform shrink-0",
              open && "rotate-180",
            )}
          />
        </button>

        <div
          className={cn(
            "z-50 absolute bg-card shadow-lg mt-1 border border-border rounded-md w-full overflow-hidden",
            !open && "hidden",
          )}
        >
          <div className="px-3 py-2 border-border border-b">
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter segments…"
                className="bg-transparent outline-none w-full placeholder:text-muted-foreground text-sm"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center gap-2 px-3 py-4 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading segments…
            </div>
          ) : error ? (
            <p className="px-3 py-3 text-destructive text-sm">{error}</p>
          ) : filtered.length === 0 ? (
            <p className="px-3 py-3 text-muted-foreground text-sm">
              {query ? `No result for "${query}"` : "No segments available"}
            </p>
          ) : (
            <ul role="listbox" className="py-1 max-h-60 overflow-y-auto">
              {filtered.map((seg) => (
                <li key={seg.id} role="option" aria-selected={value?.id === seg.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(seg)}
                    className={cn(
                      "flex items-center gap-3 hover:bg-muted px-3 py-2 w-full text-sm text-left transition-colors",
                      value?.id === seg.id && "bg-accent",
                    )}
                  >
                    <Users
                      className={cn(
                        "w-4 h-4 shrink-0",
                        value?.id === seg.id
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    />
                    <span className="flex flex-col flex-1 gap-0.5 truncate">
                      <span className="font-medium text-foreground truncate">
                        {seg.name}
                      </span>
                      <span className="text-muted-foreground text-xs">
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
