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
  onGenerate: () => void;
}

function formatAddress(c: Contact): string {
  return [c.address, c.city, c.zip, c.country]
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .join(", ");
}

function displayName(c: Contact): string {
  return [c.firstname, c.lastname].filter(Boolean).join(" ") || "—";
}

export default function ContactsTable({
  records,
  portalId,
  maxSelection,
  selectedIds,
  onSelectionChange,
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
          Cette liste contient {records.length} contacts. La génération de pages
          est limitée à {maxSelection} contacts par lot. Pour de meilleurs
          résultats, créez une liste plus ciblée dans HubSpot.
        </div>
      )}

      <GeneratePagesBar
        selectedCount={selectedIds.size}
        maxSelection={maxSelection}
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
                  aria-label="Sélectionner tous les contacts"
                  className="h-4 w-4 accent-blue-600"
                />
              </th>
              <th className="px-3 py-2">Prénom</th>
              <th className="px-3 py-2">Nom</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Téléphone</th>
              <th className="px-3 py-2">Adresse</th>
              <th className="px-3 py-2">Entreprise</th>
              <th className="px-3 py-2">Poste</th>
              <th className="px-3 py-2 text-right">Ouvrir</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.map((c) => {
              const isRowSelected = selectedIds.has(c.id);
              const isRowDisabled = isLimitReached && !isRowSelected;
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
                      aria-label={`Sélectionner ${displayName(c)}`}
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
                  <td className="whitespace-nowrap px-3 py-2">{c.phone ?? "—"}</td>
                  <td className="px-3 py-2">{formatAddress(c) || "—"}</td>
                  <td className="px-3 py-2">{c.company ?? "—"}</td>
                  <td className="px-3 py-2">{c.jobtitle ?? "—"}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <a
                      href={`https://app.hubspot.com/contacts/${portalId}/contact/${c.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                      aria-label={`Ouvrir ${displayName(c)} dans HubSpot`}
                    >
                      Ouvrir ↗
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
