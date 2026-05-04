"use client";

import { useEffect, useRef, useState } from "react";
import { Search, ChevronDown, FileText, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ErrorResponse, PrismicDocumentMetadata } from "@/lib/types";

interface DocumentsResponse {
  documents: PrismicDocumentMetadata[];
}

interface Props {
  onDocumentSelected: (document: PrismicDocumentMetadata) => void;
}

export default function PrismicDocumentCombobox({ onDocumentSelected }: Props) {
  const [query, setQuery] = useState("");
  const [documents, setDocuments] = useState<PrismicDocumentMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<PrismicDocumentMetadata | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch("/api/prismic/documents?type=landing")
      .then(async (res) => {
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as ErrorResponse;
          throw new Error(data.error ?? `Error ${res.status}`);
        }
        return res.json() as Promise<DocumentsResponse>;
      })
      .then(({ documents }) => {
        if (!cancelled) {
          setDocuments(documents);
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
    ? documents.filter((doc) => {
        const q = query.toLowerCase();
        return (
          (doc.uid ?? "").toLowerCase().includes(q) ||
          doc.type.toLowerCase().includes(q) ||
          doc.lang.toLowerCase().includes(q)
        );
      })
    : documents;

  function handleSelect(doc: PrismicDocumentMetadata) {
    setSelected(doc);
    setQuery("");
    setOpen(false);
    onDocumentSelected(doc);
  }

  const displayValue = selected ? (selected.uid ?? selected.id) : "";

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      <label className="text-sm font-medium text-foreground">
        Select a landing document
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => {
            if (!loading) setOpen((v) => !v);
          }}
          className={cn(
            "flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-background px-3 text-sm transition-colors",
            open ? "border-ring ring-2 ring-ring ring-offset-1" : "border-input hover:border-ring/50",
            loading && "opacity-50 cursor-not-allowed"
          )}
          aria-expanded={open}
          aria-haspopup="listbox"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading documents…
            </span>
          ) : selected ? (
            <span className="flex items-center gap-2 truncate">
              <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="truncate font-medium text-foreground">{displayValue}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{selected.lang}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">
              {documents.length > 0
                ? `${documents.length} documents available…`
                : "No documents found"}
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-card shadow-lg">
            <div className="border-b border-border px-3 py-2">
              <div className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter documents…"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {error ? (
              <p className="px-3 py-3 text-sm text-destructive">{error}</p>
            ) : filtered.length === 0 ? (
              <p className="px-3 py-3 text-sm text-muted-foreground">
                {query ? `No result for "${query}"` : "No documents available"}
              </p>
            ) : (
              <ul
                role="listbox"
                className="max-h-60 overflow-y-auto py-1"
              >
                {filtered.map((doc) => (
                  <li key={doc.id} role="option" aria-selected={selected?.id === doc.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(doc)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                        selected?.id === doc.id && "bg-accent"
                      )}
                    >
                      <FileText className={cn(
                        "h-4 w-4 shrink-0",
                        selected?.id === doc.id ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span className="flex flex-1 flex-col gap-0.5 truncate">
                        <span className="truncate font-medium text-foreground">
                          {doc.uid ?? doc.id}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {doc.type} · {doc.lang}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
