"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Database } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  getPrismicConnections,
  type PrismicConnection,
} from "@/lib/prismic-connections";

interface Props {
  selectedId: string | null;
  onConnectionSelected: (connection: PrismicConnection) => void;
}

export default function PrismicConnectionCombobox({
  selectedId,
  onConnectionSelected,
}: Props) {
  const [connections, setConnections] = useState<PrismicConnection[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setConnections(getPrismicConnections());
  }, []);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const selected = connections.find((connection) => connection.id === selectedId) ?? null;

  function handleSelect(connection: PrismicConnection) {
    onConnectionSelected(connection);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-1.5">
      <label className="font-medium text-foreground text-sm">
        Select a Prismic repository
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          disabled={connections.length === 0}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-md border bg-background px-3 text-sm transition-colors",
            open
              ? "border-ring ring-2 ring-ring ring-offset-1"
              : "border-input hover:border-ring/50",
            connections.length === 0 && "cursor-not-allowed opacity-60",
          )}
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          {selected ? (
            <span className="flex min-w-0 items-center gap-2">
              <Database className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="truncate font-medium text-foreground">{selected.label}</span>
              <span className="shrink-0 text-muted-foreground text-xs">
                {selected.repository}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">
              {connections.length > 0 ? "Choose a saved repository" : "No repositories saved"}
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </button>

        {open && connections.length > 0 && (
          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-border bg-card py-1 shadow-lg">
            {connections.map((connection) => (
              <button
                key={connection.id}
                type="button"
                onClick={() => handleSelect(connection)}
                className={cn(
                  "flex w-full flex-col gap-0.5 px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                  selectedId === connection.id && "bg-accent",
                )}
              >
                <span className="truncate font-medium text-foreground">
                  {connection.label}
                </span>
                <span className="truncate text-muted-foreground text-xs">
                  {connection.repository}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
