"use client";

import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import TypeBadge from "../TypeBadge";
import { useCampaign } from "@/lib/campaign-context";

export default function SelectedSegmentBox() {
  const { campaign, setSelectedList } = useCampaign();
  const { selectedList } = campaign;

  if (!selectedList) {
    return (
      <section
        aria-label="Selected segment"
        aria-live="polite"
        className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-4 py-12 text-center"
      >
        <Users className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">
          No segment selected yet
        </p>
        <p className="text-xs text-muted-foreground/70">
          Search by name or paste a HubSpot URL above.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Selected segment"
      aria-live="polite"
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-accent px-4 py-4"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
          <Users className="h-4 w-4 text-primary" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">
            Selected segment
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{selectedList.name}</span>
            <TypeBadge type={selectedList.objectType} />
          </div>
          <span className="text-xs text-muted-foreground">
            {selectedList.size} {selectedList.size > 1 ? "records" : "record"}
          </span>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setSelectedList(null)}
        aria-label="Change selected segment"
      >
        Change
      </Button>
    </section>
  );
}
