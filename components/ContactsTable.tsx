"use client";

import { useEffect, useState } from "react";

import type { Contact, ContactsResponse, ErrorResponse } from "@/lib/types";

interface Props {
  segmentId: string | null;
  portalId: string;
}

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; contacts: Contact[] };

function formatAddress(c: Contact): string {
  return [c.address, c.city, c.zip, c.country]
    .filter((v) => v && v.trim().length > 0)
    .join(", ");
}

function displayName(c: Contact): string {
  return [c.firstname, c.lastname].filter(Boolean).join(" ") || "—";
}

export default function ContactsTable({ segmentId, portalId }: Props) {
  const [state, setState] = useState<State>({ status: "idle" });

  useEffect(() => {
    if (!segmentId) {
      setState({ status: "idle" });
      return;
    }

    const controller = new AbortController();
    setState({ status: "loading" });

    (async () => {
      try {
        const res = await fetch(`/api/segments/${encodeURIComponent(segmentId)}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as ErrorResponse;
          setState({
            status: "error",
            message: data.error ?? `Erreur ${res.status}.`,
          });
          return;
        }
        const data = (await res.json()) as ContactsResponse;
        setState({ status: "success", contacts: data.contacts });
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setState({ status: "error", message: "Erreur réseau." });
      }
    })();

    return () => controller.abort();
  }, [segmentId]);

  if (!segmentId) {
    return (
      <p className="rounded-md border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-500">
        Sélectionnez un segment pour afficher les contacts.
      </p>
    );
  }

  if (state.status === "loading") {
    return <TableSkeleton />;
  }

  if (state.status === "error") {
    return (
      <p
        role="alert"
        className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        {state.message}
      </p>
    );
  }

  if (state.status === "success" && state.contacts.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-500">
        Aucun contact dans ce segment.
      </p>
    );
  }

  if (state.status !== "success") return null;

  return (
    <div className="overflow-x-auto rounded-md border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
          <tr>
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
          {state.contacts.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50">
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
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-10 animate-pulse rounded-md border border-gray-200 bg-white"
        />
      ))}
    </div>
  );
}
