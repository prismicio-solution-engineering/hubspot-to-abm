"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import GeneratePagesBar from "./GeneratePagesBar";
import JsonPreviewModal from "./JsonPreviewModal";
import { buildPayload } from "@/lib/payload";
import type { Contact, GeneratePagesPayload } from "@/lib/types";

interface Props {
  records: Contact[];
  portalId: string;
  listId: string;
  listName: string;
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
  listId,
  listName,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [payload, setPayload] = useState<GeneratePagesPayload | null>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [listId]);

  const allSelected = useMemo(
    () => records.length > 0 && selectedIds.size === records.length,
    [records.length, selectedIds.size],
  );
  const someSelected = selectedIds.size > 0 && !allSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(records.map((c) => c.id)));
    }
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function onGenerate() {
    setPayload(buildPayload(records, selectedIds, listId, listName));
  }

  return (
    <div className="flex flex-col gap-3">
      <GeneratePagesBar selectedCount={selectedIds.size} onGenerate={onGenerate} />

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
              const checked = selectedIds.has(c.id);
              return (
                <tr key={c.id} className={checked ? "bg-blue-50" : "hover:bg-gray-50"}>
                  <td className="w-10 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRow(c.id)}
                      aria-label={`Sélectionner ${displayName(c)}`}
                      className="h-4 w-4 accent-blue-600"
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

      <JsonPreviewModal payload={payload} onClose={() => setPayload(null)} />
    </div>
  );
}
