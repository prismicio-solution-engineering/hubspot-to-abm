"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  async function onSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    const trimmed = url.trim();
    if (trimmed.length === 0) return;

    const id = extractListIdFromUrl(trimmed);
    if (!id) {
      setState({
        status: "error",
        message:
          "Invalid URL. Expected format: …/objectLists/12345/…, …/lists/manager/12345/…, or …/lists/12345",
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
          message: data.error ?? `Segment not found (${res.status}).`,
        });
        return;
      }
      const list = (await res.json()) as HubSpotList;
      setState({ status: "idle" });
      setUrl("");
      onListSelected(list);
    } catch {
      setState({ status: "error", message: "Network error." });
    }
  }

  const busy = state.status === "loading";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="list-url">Paste a HubSpot segment URL</Label>
        <div className="flex gap-2">
          <Input
            id="list-url"
            type="url"
            autoFocus
            autoComplete="off"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://app.hubspot.com/contacts/…/lists/…/12345"
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
