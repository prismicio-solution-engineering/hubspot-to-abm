"use client";

import { useEffect, useRef, useState } from "react";
import { Building2, ChevronDown, Loader2, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ErrorResponse } from "@/lib/types";

export interface CompanySampleOption {
  id: string;
  name?: string;
  domain?: string;
  industry?: string;
}

interface CompaniesResponse {
  companies: CompanySampleOption[];
}

interface Props {
  selectedCompany: CompanySampleOption | null;
  onCompanySelected: (company: CompanySampleOption) => void;
}

function companyLabel(company: CompanySampleOption): string {
  return company.name ?? company.domain ?? `Company ${company.id}`;
}

export default function CompanySampleCombobox({
  selectedCompany,
  onCompanySelected,
}: Props) {
  const [query, setQuery] = useState("");
  const [companies, setCompanies] = useState<CompanySampleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    else setQuery("");
  }, [open]);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());

      fetch(`/api/hs-properties/company/options?${params.toString()}`, {
        signal: controller.signal,
      })
        .then(async (res) => {
          if (!res.ok) {
            const data = (await res.json().catch(() => ({}))) as ErrorResponse;
            throw new Error(data.error ?? `Error ${res.status}`);
          }
          return res.json() as Promise<CompaniesResponse>;
        })
        .then(({ companies }) => {
          setCompanies(companies);
          setLoading(false);
        })
        .catch((err: Error) => {
          if (err.name === "AbortError") return;
          setError(err.message);
          setLoading(false);
        });
    }, query.trim() ? 250 : 0);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function handleSelect(company: CompanySampleOption) {
    setOpen(false);
    setQuery("");
    onCompanySelected(company);
  }

  return (
    <div className="mt-3 flex flex-col gap-1.5" ref={containerRef}>
      <label className="font-medium text-foreground text-xs">
        Example values from
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
          {selectedCompany ? (
            <span className="flex items-center gap-2 truncate">
              <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="font-medium text-foreground truncate">
                {companyLabel(selectedCompany)}
              </span>
              {selectedCompany.domain && (
                <span className="text-muted-foreground text-xs shrink-0">
                  {selectedCompany.domain}
                </span>
              )}
            </span>
          ) : (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="w-3.5 h-3.5" />
              {loading ? "Loading companies…" : "Select a company"}
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
                placeholder="Filter companies…"
                className="bg-transparent outline-none w-full placeholder:text-muted-foreground text-sm"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center gap-2 px-3 py-4 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading companies…
            </div>
          ) : error ? (
            <p className="px-3 py-3 text-destructive text-sm">{error}</p>
          ) : companies.length === 0 ? (
            <p className="px-3 py-3 text-muted-foreground text-sm">
              {query ? `No result for "${query}"` : "No companies available"}
            </p>
          ) : (
            <ul role="listbox" className="py-1 max-h-60 overflow-y-auto">
              {companies.map((company) => (
                <li
                  key={company.id}
                  role="option"
                  aria-selected={selectedCompany?.id === company.id}
                >
                  <button
                    type="button"
                    onClick={() => handleSelect(company)}
                    className={cn(
                      "flex items-center gap-3 hover:bg-muted px-3 py-2 w-full text-sm text-left transition-colors",
                      selectedCompany?.id === company.id && "bg-accent",
                    )}
                  >
                    <Building2
                      className={cn(
                        "w-4 h-4 shrink-0",
                        selectedCompany?.id === company.id
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    />
                    <span className="flex flex-col flex-1 gap-0.5 truncate">
                      <span className="font-medium text-foreground truncate">
                        {companyLabel(company)}
                      </span>
                      <span className="text-muted-foreground text-xs truncate">
                        {[company.domain, company.industry].filter(Boolean).join(" · ") ||
                          "No domain or industry"}
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
