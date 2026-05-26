"use client";

import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import TypeBadge from "../TypeBadge";
import { useCampaignStore } from "@/lib/campaign-store";
import type { ContactSourceId } from "@/lib/types";

function sourceLabel(id: ContactSourceId): string {
  if (id === "hubspot") return "HubSpot";
  if (id === "salesforce") return "Salesforce";
  return id;
}

export default function SelectedSegmentBox() {
  const selectedSegment = useCampaignStore((s) => s.selectedSegment);
  const setSelectedSegment = useCampaignStore((s) => s.setSelectedSegment);

  if (!selectedSegment) {
    return (
      <section
        aria-label="Selected segment"
        aria-live="polite"
        className="flex flex-col justify-center items-center gap-2 bg-muted/30 px-4 py-12 border border-border rounded-lg text-center"
      >
        <Users className="w-8 h-8 text-muted-foreground/40" />
        <p className="font-medium text-muted-foreground text-sm">
          No segment selected yet
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Selected segment"
      aria-live="polite"
      className="flex flex-wrap justify-between items-center gap-3 bg-accent px-4 py-4 border border-primary/30 rounded-lg"
    >
      <div className="flex items-start gap-3">
        <div className="flex justify-center items-center bg-primary/10 mt-0.5 rounded-md w-8 h-8 shrink-0">
          <Users className="w-4 h-4 text-primary" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-primary text-xs uppercase tracking-wide">
            Selected segment
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-foreground text-sm">
              {sourceLabel(selectedSegment.sourceId)} · {selectedSegment.name}
            </span>
            <TypeBadge type={selectedSegment.objectType} />
          </div>
          <span className="text-muted-foreground text-xs">
            {selectedSegment.size} {selectedSegment.size > 1 ? "records" : "record"}
          </span>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setSelectedSegment(null)}
        aria-label="Change selected segment"
      >
        Delete
      </Button>
    </section>
  );
}
