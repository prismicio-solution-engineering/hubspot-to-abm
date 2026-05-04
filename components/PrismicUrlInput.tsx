"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  async function onSubmit(e: { preventDefault(): void }) {
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
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="prismic-url">Paste a Prismic document URL</Label>
        <div className="flex gap-2">
          <Input
            id="prismic-url"
            type="text"
            autoComplete="off"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-repo.prismic.io/…"
            className="flex-1"
          />
          <Button type="submit" disabled={busy || url.trim().length === 0}>
            {busy ? "Loading…" : "Load"}
          </Button>
        </div>
      </div>

      {state.status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
    </form>
  );
}
