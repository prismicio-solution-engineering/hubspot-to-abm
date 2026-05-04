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
            <span className="font-semibold text-foreground text-sm">{selectedList.name}</span>
            <TypeBadge type={selectedList.objectType} />
          </div>
          <span className="text-muted-foreground text-xs">
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
Delete
      </Button>
    </section>
  );
}
