"use client";

import { useEffect, useMemo, useRef } from "react";
import GeneratePagesBar from "./GeneratePagesBar";
import type { Contact } from "@/lib/types";

interface Props {
  records: Contact[];
  portalId: string;
  maxSelection: number;
  selectedIds: ReadonlySet<string>;
  onSelectionChange: (next: ReadonlySet<string>) => void;
  isGenerating?: boolean;
  generationError?: string | null;
  onGenerate: () => void | Promise<void>;
}

function formatAddress(c: Contact): string {
  return [c.address, c.city, c.zip, c.country]
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .join(", ");
}

function displayName(c: Contact): string {
  return [c.firstname, c.lastname].filter(Boolean).join(" ") || "—";
}

function displayCompany(c: Contact): string {
  return c.associatedCompany?.name ?? c.company ?? "—";
}

function companyDetails(c: Contact): Array<{ label: string; value: string }> {
  const company = c.associatedCompany;
  if (!company) return [];

  return [
    { label: "Domain", value: company.domain },
    { label: "Website", value: company.website },
    { label: "Industry", value: company.industry },
    { label: "Employees", value: company.numberofemployees },
    { label: "Country", value: company.country },
    { label: "City", value: company.city },
    {
      label: "Address",
      value: [company.address, company.zip].filter(Boolean).join(", "),
    },
  ].filter((item): item is { label: string; value: string } =>
    Boolean(item.value),
  );
}

export default function ContactsTable({
  records,
  portalId,
  maxSelection,
  selectedIds,
  onSelectionChange,
  isGenerating = false,
  generationError = null,
  onGenerate,
}: Props) {
  const selectAllRef = useRef<HTMLInputElement>(null);

  const isLimitReached = selectedIds.size >= maxSelection;
  const effectiveSelectAllTarget = Math.min(records.length, maxSelection);
  const allSelected = useMemo(
    () => records.length > 0 && selectedIds.size === effectiveSelectAllTarget,
    [records.length, selectedIds.size, effectiveSelectAllTarget],
  );
  const someSelected = selectedIds.size > 0 && !allSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  function toggleAll() {
    if (allSelected) {
      onSelectionChange(new Set());
      return;
    }
    onSelectionChange(
      new Set(records.slice(0, maxSelection).map((c) => c.id)),
    );
  }

  function toggleRow(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
      onSelectionChange(next);
      return;
    }
    if (next.size >= maxSelection) return;
    next.add(id);
    onSelectionChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      {records.length > maxSelection && (
        <div
          role="status"
          className="bg-amber-50 px-4 py-2.5 border border-amber-200 rounded-lg text-amber-800 text-sm"
        >
          This segment contains {records.length} contacts. Page generation is
          limited to {maxSelection} contacts per batch. For best results,
          create a more targeted segment in HubSpot.
        </div>
      )}

      <GeneratePagesBar
        selectedCount={selectedIds.size}
        maxSelection={maxSelection}
        isGenerating={isGenerating}
        error={generationError}
        onGenerate={onGenerate}
      />

      <div className="bg-card shadow-sm border border-border rounded-lg overflow-x-auto">
        <table className="divide-y divide-border min-w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-4 py-2.5 w-10">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all contacts"
                  className="rounded w-4 h-4 accent-primary"
                />
              </th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground text-xs text-left uppercase tracking-wide">First name</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground text-xs text-left uppercase tracking-wide">Last name</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground text-xs text-left uppercase tracking-wide">Email</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground text-xs text-left uppercase tracking-wide">Address</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground text-xs text-left uppercase tracking-wide">Company</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground text-xs text-left uppercase tracking-wide">Job title</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground text-xs text-right uppercase tracking-wide">Open</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {records.map((c) => {
              const isRowSelected = selectedIds.has(c.id);
              const isRowDisabled = isLimitReached && !isRowSelected;
              const details = companyDetails(c);
              return (
                <tr
                  key={c.id}
                  className={
                    isRowSelected
                      ? "bg-accent/30"
                      : isRowDisabled
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:bg-muted/30 transition-colors cursor-pointer"
                  }
                  onClick={()=>toggleRow(c.id)}
                >
                  <td className="px-4 py-2.5 w-10">
                    <input
                      type="checkbox"
                      checked={isRowSelected}
                      disabled={isRowDisabled}
                      onChange={() => toggleRow(c.id)}
                      aria-label={`Select ${displayName(c)}`}
                      className="rounded w-4 h-4 accent-primary disabled:cursor-not-allowed"
                    />
                  </td>
                  <td className="px-4 py-2.5 text-foreground whitespace-nowrap">{c.firstname ?? "—"}</td>
                  <td className="px-4 py-2.5 text-foreground whitespace-nowrap">{c.lastname ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    {c.email ? (
                      <a className="text-primary hover:underline" href={`mailto:${c.email}`}>
                        {c.email}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{formatAddress(c) || "—"}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-col gap-0.5 min-w-48">
                      <span className="font-medium text-foreground">{displayCompany(c)}</span>
                      {details.length > 0 && (
                        <div className="flex flex-col gap-0.5 text-muted-foreground text-xs">
                          {details.map((detail) => (
                            <span key={detail.label}>
                              <span className="font-medium">{detail.label}:</span>{" "}
                              {detail.value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{c.jobtitle ?? "—"}</td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <a
                      href={`https://app.hubspot.com/contacts/${portalId}/contact/${c.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                      aria-label={`Open ${displayName(c)} in HubSpot`}
                    >
                      Open ↗
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
