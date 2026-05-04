"use client";

import { useEffect, useRef, useState } from "react";
import { Search, ChevronDown, Loader2, Users } from "lucide-react";

function HubSpotIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="-1 -0.5 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.164 7.931V5.085a2.198 2.198 0 0 0 1.266-1.978V3.06A2.198 2.198 0 0 0 17.233.863h-.047a2.198 2.198 0 0 0-2.196 2.198v.047c0 .87.507 1.627 1.266 1.978v2.846a6.232 6.232 0 0 0-2.962 1.302L6.023 4.382a2.44 2.44 0 0 0 .07-.556 2.46 2.46 0 1 0-2.46 2.46c.44 0 .856-.12 1.213-.327l7.198 4.424a6.23 6.23 0 0 0-.806 3.073c0 1.138.306 2.204.84 3.118L9.84 17.81a1.98 1.98 0 0 0-.58-.094 1.994 1.994 0 1 0 1.994 1.994 1.978 1.978 0 0 0-.324-1.084l2.21-2.196a6.257 6.257 0 1 0 5.025-8.5zm-.978 9.504a3.282 3.282 0 1 1 0-6.564 3.282 3.282 0 0 1 0 6.564z" fill="#FF7A59"/>
    </svg>
  );
}

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
      <label className="font-medium text-foreground text-sm">
        Select a segment
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex justify-between items-center gap-2 bg-background px-3 border rounded-md w-full h-9 text-sm transition-colors",
            open
              ? "border-ring ring-2 ring-ring ring-offset-1"
              : "border-input hover:border-ring/50",
          )}
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          {selected ? (
            <span className="flex items-center gap-2 truncate">
              <Users className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="font-medium text-foreground truncate">{selected.name}</span>
              <TypeBadge type={selected.objectType} />
            </span>
          ) : (
            <span className="flex items-center gap-2 text-muted-foreground">
              <HubSpotIcon className="w-5 h-5" />
              {loading
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
                <li key={seg.id} role="option" aria-selected={selected?.id === seg.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(seg)}
                    className={cn(
                      "flex items-center gap-3 hover:bg-muted px-3 py-2 w-full text-sm text-left transition-colors",
                      selected?.id === seg.id && "bg-accent",
                    )}
                  >
                    <Users
                      className={cn(
                        "w-4 h-4 shrink-0",
                        selected?.id === seg.id
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
