"use client";

import { useEffect, useRef, useState } from "react";
import { Search, ChevronDown, FileText } from "lucide-react";

import { cn } from "@/lib/utils";
import type { PrismicConnection } from "@/lib/prismic-connections";
import type { ErrorResponse, PrismicDocumentMetadata } from "@/lib/types";

interface DocumentsResponse {
  documents: PrismicDocumentMetadata[];
}

interface Props {
  connection: PrismicConnection;
  selectedDocument?: PrismicDocumentMetadata | null;
  onDocumentSelected: (document: PrismicDocumentMetadata) => void;
}

const cachedDocuments = new Map<string, PrismicDocumentMetadata[]>();
const fetchPromises = new Map<string, Promise<PrismicDocumentMetadata[]>>();

function fetchDocuments(connection: PrismicConnection): Promise<PrismicDocumentMetadata[]> {
  const cacheKey = `${connection.repository}:${connection.masterToken}`;
  const cached = cachedDocuments.get(cacheKey);
  if (cached) return Promise.resolve(cached);

  const existingPromise = fetchPromises.get(cacheKey);
  if (existingPromise) return existingPromise;

  const promise = fetch("/api/prismic/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      repository: connection.repository,
      masterToken: connection.masterToken,
      type: "landing",
    }),
  })
    .then(async (res) => {
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as ErrorResponse;
        throw new Error(data.error ?? `Error ${res.status}`);
      }
      return res.json() as Promise<DocumentsResponse>;
    })
    .then(({ documents }) => {
      cachedDocuments.set(cacheKey, documents);
      return documents;
    })
    .catch((err) => {
      fetchPromises.delete(cacheKey);
      throw err;
    });

  fetchPromises.set(cacheKey, promise);
  return promise;
}

export default function PrismicDocumentCombobox({
  connection,
  selectedDocument,
  onDocumentSelected,
}: Props) {
  const [query, setQuery] = useState("");
  const [documents, setDocuments] = useState<PrismicDocumentMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<PrismicDocumentMetadata | null>(
    selectedDocument ?? null,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    else setQuery("");
  }, [open]);

  useEffect(() => {
    let cancelled = false;
    const cacheKey = `${connection.repository}:${connection.masterToken}`;
    const cached = cachedDocuments.get(cacheKey);

    setError(null);
    setLoading(!cached);
    setDocuments(cached ?? []);

    fetchDocuments(connection)
      .then((docs) => {
        if (!cancelled) {
          setDocuments(docs);
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
  }, [connection]);

  useEffect(() => {
    setSelected(selectedDocument ?? null);
  }, [selectedDocument]);

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
          (doc.metaTitle ?? "").toLowerCase().includes(q) ||
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

  const displayValue = selected
    ? (selected.metaTitle ?? selected.uid ?? selected.id)
    : "";
  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      <label className="font-medium text-foreground text-sm">
        Select a landing document
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex justify-between items-center gap-2 bg-background px-3 border rounded-md w-full h-9 text-sm transition-colors",
            open ? "border-ring ring-2 ring-ring ring-offset-1" : "border-input hover:border-ring/50",
          )}
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          {selected ? (
            <span className="flex items-center gap-2 truncate">
              <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="font-medium text-foreground truncate">{displayValue}</span>
              <span className="text-muted-foreground text-xs shrink-0">{selected.lang}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">
              {loading
                ? "Select a document…"
                : documents.length > 0
                  ? `${documents.length} documents available…`
                  : "No documents found"}
            </span>
          )}
          <ChevronDown
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform shrink-0",
              open && "rotate-180"
            )}
          />
        </button>

        <div className={cn("z-50 absolute bg-card shadow-lg mt-1 border border-border rounded-md w-full overflow-hidden", !open && "hidden")}>
          <div className="px-3 py-2 border-border border-b">
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter documents…"
                className="bg-transparent outline-none w-full placeholder:text-muted-foreground text-sm"
              />
            </div>
          </div>

          {loading ? (
            <ul className="py-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="flex items-center gap-3 px-3 py-2">
                  <div className="bg-muted rounded w-4 h-4 shrink-0 animate-pulse" />
                  <span className="flex flex-col flex-1 gap-1.5">
                    <span className="bg-muted rounded w-2/3 h-3 animate-pulse" />
                    <span className="bg-muted rounded w-1/3 h-2.5 animate-pulse" />
                  </span>
                </li>
              ))}
            </ul>
          ) : error ? (
            <p className="px-3 py-3 text-destructive text-sm">{error}</p>
          ) : filtered.length === 0 ? (
            <p className="px-3 py-3 text-muted-foreground text-sm">
              {query ? `No result for "${query}"` : "No documents available"}
            </p>
          ) : (
            <ul role="listbox" className="py-1 max-h-60 overflow-y-auto">
              {filtered.map((doc) => (
                <li key={doc.id} role="option" aria-selected={selected?.id === doc.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(doc)}
                    className={cn(
                      "flex items-center gap-3 hover:bg-muted px-3 py-2 w-full text-sm text-left transition-colors",
                      selected?.id === doc.id && "bg-accent"
                    )}
                  >
                    <FileText className={cn(
                      "w-4 h-4 shrink-0",
                      selected?.id === doc.id ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className="flex flex-col flex-1 gap-0.5 truncate">
                      <span className="font-medium text-foreground truncate">
                        {doc.metaTitle ?? doc.uid ?? doc.id}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {doc.uid ?? doc.id} · {doc.lang}
                      </span>
                    </span>
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
