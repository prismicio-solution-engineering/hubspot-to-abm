"use client";

import { useEffect, useState } from "react";
import { Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import SegmentCombobox from "../SegmentCombobox";
import SelectedSegmentBox from "./SelectedSegmentBox";
import { useCampaignStore } from "@/lib/campaign-store";
import { useStepNavigation } from "@/lib/useStepNavigation";
import { updateCampaign } from "@/lib/campaigns-store";
import { cn } from "@/lib/utils";
import type { ContactSourceId, Segment } from "@/lib/types";

interface SourceInfo {
  id: ContactSourceId;
  label: string;
  available: boolean;
}

interface SourcesResponse {
  sources: SourceInfo[];
}

function HubSpotIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="-1 -0.5 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.164 7.931V5.085a2.198 2.198 0 0 0 1.266-1.978V3.06A2.198 2.198 0 0 0 17.233.863h-.047a2.198 2.198 0 0 0-2.196 2.198v.047c0 .87.507 1.627 1.266 1.978v2.846a6.232 6.232 0 0 0-2.962 1.302L6.023 4.382a2.44 2.44 0 0 0 .07-.556 2.46 2.46 0 1 0-2.46 2.46c.44 0 .856-.12 1.213-.327l7.198 4.424a6.23 6.23 0 0 0-.806 3.073c0 1.138.306 2.204.84 3.118L9.84 17.81a1.98 1.98 0 0 0-.58-.094 1.994 1.994 0 1 0 1.994 1.994 1.978 1.978 0 0 0-.324-1.084l2.21-2.196a6.257 6.257 0 1 0 5.025-8.5zm-.978 9.504a3.282 3.282 0 1 1 0-6.564 3.282 3.282 0 0 1 0 6.564z" fill="#FF7A59"/>
    </svg>
  );
}

function SourceIcon({ id, className }: { id: ContactSourceId; className?: string }) {
  if (id === "hubspot") return <HubSpotIcon className={className} />;
  return <Cloud className={cn(className, "text-sky-500")} />;
}

export default function SelectSegmentStep() {
  const id = useCampaignStore((s) => s.id);
  const selectedPrismicDocument = useCampaignStore((s) => s.selectedPrismicDocument);
  const selectedSourceId = useCampaignStore((s) => s.selectedSourceId);
  const setSelectedSourceId = useCampaignStore((s) => s.setSelectedSourceId);
  const selectedSegment = useCampaignStore((s) => s.selectedSegment);
  const setSelectedSegment = useCampaignStore((s) => s.setSelectedSegment);
  const { goToStep } = useStepNavigation();

  const [sources, setSources] = useState<SourceInfo[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(true);
  const [sourcesError, setSourcesError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSourcesLoading(true);
    setSourcesError(null);

    fetch("/api/sources")
      .then(async (res) => {
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return res.json() as Promise<SourcesResponse>;
      })
      .then(({ sources: items }) => {
        if (cancelled) return;
        setSources(items.filter((s) => s.available));
        setSourcesLoading(false);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setSourcesError(err.message);
        setSourcesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function onSegmentSelected(segment: Segment | null) {
    setSelectedSegment(segment);
  }

  function onSourceChange(sourceId: ContactSourceId) {
    setSelectedSourceId(sourceId);
  }

  function onContinue() {
    if (selectedSegment) {
      updateCampaign(id, {
        segment: selectedSegment.name,
        currentStep: "select-contacts",
      });
    }
    goToStep("select-contacts");
  }

  function onBack() {
    goToStep("select-prismic-document");
  }

  if (!selectedPrismicDocument) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col justify-center items-center gap-2 bg-muted/30 px-4 py-12 border-2 border-border border-dashed rounded-lg text-center">
          <p className="font-medium text-muted-foreground text-sm">
            No Prismic document selected.
          </p>
          <p className="text-muted-foreground/70 text-xs">
            Go back to the previous step to pick one.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={onBack} className="w-fit">
          Back to step 1
        </Button>
      </div>
    );
  }

  const sourceLabel =
    sources.find((s) => s.id === selectedSourceId)?.label ??
    (selectedSourceId === "hubspot" ? "HubSpot" : selectedSourceId === "salesforce" ? "Salesforce" : null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 bg-card shadow-sm p-5 border border-border rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-foreground text-sm">Choose a CRM source</span>
          {sourceLabel && (
            <span className="inline-flex items-center gap-1.5 bg-green-50 px-2.5 py-1 border border-green-200 rounded-full font-medium text-green-700 text-xs">
              <span className="bg-green-500 rounded-full w-1.5 h-1.5" />
              {sourceLabel} connected
            </span>
          )}
        </div>

        {sourcesLoading ? (
          <p className="text-muted-foreground text-sm">Loading sources…</p>
        ) : sourcesError ? (
          <p className="text-destructive text-sm">{sourcesError}</p>
        ) : sources.length === 0 ? (
          <p className="text-muted-foreground text-sm">No CRM sources available.</p>
        ) : (
          <fieldset>
            <legend className="sr-only">CRM source</legend>
            <div className="flex flex-wrap gap-3">
              {sources.map((src) => {
                const checked = selectedSourceId === src.id;
                return (
                  <label
                    key={src.id}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer transition-colors",
                      checked
                        ? "border-primary bg-accent"
                        : "border-input hover:border-ring/50",
                    )}
                  >
                    <input
                      type="radio"
                      name="contact-source"
                      value={src.id}
                      checked={checked}
                      onChange={() => onSourceChange(src.id)}
                      className="accent-primary"
                    />
                    <SourceIcon id={src.id} className="w-4 h-4" />
                    <span className="font-medium text-foreground text-sm">{src.label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        <SegmentCombobox
          sourceId={selectedSourceId}
          value={selectedSegment}
          onSelect={onSegmentSelected}
        />
      </div>

      <SelectedSegmentBox />

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={onContinue} disabled={!selectedSegment}>
          Continue
        </Button>
      </div>
    </div>
  );
}
