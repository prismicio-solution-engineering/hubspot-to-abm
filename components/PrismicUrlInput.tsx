"use client";

import { useState, type FormEvent } from "react";

import type { ErrorResponse, PrismicDocumentMetadata } from "@/lib/types";

interface Props {
  onDocumentSelected: (document: PrismicDocumentMetadata) => void;
}

function extractDocumentIdFromUrl(value: string): string | null {
  const trimmed = value.trim();
  if (/^[A-Za-z0-9_-]{8,}$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    const candidates = [
      url.searchParams.get("id"),
      url.searchParams.get("documentId"),
      url.searchParams.get("document"),
      ...url.pathname.split("/").filter(Boolean).reverse(),
    ];

    return candidates.find((part) => part && /^[A-Za-z0-9_-]{8,}$/.test(part)) ?? null;
  } catch {
    return null;
  }
}

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string };

export default function PrismicUrlInput({ onDocumentSelected }: Props) {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = url.trim();
    if (trimmed.length === 0) return;

    const id = extractDocumentIdFromUrl(trimmed);
    if (!id) {
      setState({
        status: "error",
        message: "Invalid Prismic URL. Paste a Prismic document URL or document ID.",
      });
      return;
    }

    setState({ status: "loading" });

    try {
      const res = await fetch(`/api/prismic/documents/${encodeURIComponent(id)}`);
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as ErrorResponse;
        setState({
          status: "error",
          message: data.error ?? `Prismic document not found (${res.status}).`,
        });
        return;
      }
      const document = (await res.json()) as PrismicDocumentMetadata;
      setState({ status: "idle" });
      setUrl("");
      onDocumentSelected(document);
    } catch {
      setState({ status: "error", message: "Network error." });
    }
  }

  const busy = state.status === "loading";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <label htmlFor="prismic-url" className="text-sm font-medium text-gray-700">
        Paste a Prismic document URL
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="prismic-url"
          type="text"
          autoComplete="off"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://your-repo.prismic.io/..."
          className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={busy || url.trim().length === 0}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300 sm:w-auto"
        >
          {busy ? "Loading..." : "Load"}
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
