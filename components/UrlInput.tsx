"use client";

import { useState, type FormEvent } from "react";

import type { ErrorResponse, HubSpotList } from "@/lib/types";

interface Props {
  onListSelected: (list: HubSpotList) => void;
}

function extractListIdFromUrl(url: string): string | null {
  const match = url.match(
    /\/(?:lists\/(?:manager\/)?|objectLists\/)(\d+)(?:\/|\?|#|$)/,
  );
  return match ? match[1] : null;
}

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string };

export default function UrlInput({ onListSelected }: Props) {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = url.trim();
    if (trimmed.length === 0) return;

    const id = extractListIdFromUrl(trimmed);
    if (!id) {
      setState({
        status: "error",
        message:
          "URL invalide. Formats acceptés : …/objectLists/12345/…, …/lists/manager/12345/… ou …/lists/12345",
      });
      return;
    }

    setState({ status: "loading" });

    try {
      const res = await fetch(`/api/lists/${encodeURIComponent(id)}`);
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as ErrorResponse;
        setState({
          status: "error",
          message: data.error ?? `Liste introuvable (${res.status}).`,
        });
        return;
      }
      const list = (await res.json()) as HubSpotList;
      setState({ status: "idle" });
      setUrl("");
      onListSelected(list);
    } catch {
      setState({ status: "error", message: "Erreur réseau." });
    }
  }

  const busy = state.status === "loading";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <label htmlFor="list-url" className="text-sm font-medium text-gray-700">
        Coller l&apos;URL d&apos;une liste HubSpot
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="list-url"
          type="url"
          autoComplete="off"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://app.hubspot.com/contacts/…/lists/…/12345"
          className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={busy || url.trim().length === 0}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300 sm:w-auto"
        >
          {busy ? "Chargement…" : "Charger"}
        </button>
      </div>

      {state.status === "error" && (
        <p role="alert" className="text-sm text-red-700">
          {state.message}
        </p>
      )}
    </form>
  );
}
