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
          className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900"
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

      <div className="overflow-x-auto rounded-md border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
            <tr>
              <th className="w-10 px-3 py-2">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all contacts"
                  className="h-4 w-4 accent-blue-600"
                />
              </th>
              <th className="px-3 py-2">First name</th>
              <th className="px-3 py-2">Last name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Address</th>
              <th className="px-3 py-2">Company</th>
              <th className="px-3 py-2">Job title</th>
              <th className="px-3 py-2 text-right">Open</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.map((c) => {
              const isRowSelected = selectedIds.has(c.id);
              const isRowDisabled = isLimitReached && !isRowSelected;
              const details = companyDetails(c);
              const rowClass = isRowSelected
                ? "bg-blue-50"
                : isRowDisabled
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-gray-50";
              return (
                <tr key={c.id} className={rowClass}>
                  <td className="w-10 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={isRowSelected}
                      disabled={isRowDisabled}
                      onChange={() => toggleRow(c.id)}
                      aria-label={`Select ${displayName(c)}`}
                      className="h-4 w-4 accent-blue-600 disabled:cursor-not-allowed"
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">{c.firstname ?? "—"}</td>
                  <td className="whitespace-nowrap px-3 py-2">{c.lastname ?? "—"}</td>
                  <td className="px-3 py-2">
                    {c.email ? (
                      <a className="text-blue-600 hover:underline" href={`mailto:${c.email}`}>
                        {c.email}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2">{formatAddress(c) || "—"}</td>
                  <td className="px-3 py-2">
                    <div className="flex min-w-56 flex-col gap-1">
                      <span className="font-medium text-gray-900">
                        {displayCompany(c)}
                      </span>
                      {details.length > 0 && (
                        <div className="flex flex-col gap-0.5 text-xs text-gray-500">
                          {details.map((detail) => (
                            <span key={detail.label}>
                              <span className="font-medium text-gray-600">
                                {detail.label}:
                              </span>{" "}
                              {detail.value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">{c.jobtitle ?? "—"}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <a
                      href={`https://app.hubspot.com/contacts/${portalId}/contact/${c.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
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
