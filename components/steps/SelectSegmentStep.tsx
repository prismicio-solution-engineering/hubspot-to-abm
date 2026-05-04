"use client";

import { Button } from "@/components/ui/button";
import SegmentCombobox from "../SegmentCombobox";
import SelectedSegmentBox from "./SelectedSegmentBox";
import { useCampaignStore } from "@/lib/campaign-store";
import { useStepNavigation } from "@/lib/useStepNavigation";
import { updateCampaign } from "@/lib/campaigns-store";
import type { HubSpotList } from "@/lib/types";

export default function SelectSegmentStep() {
  const id = useCampaignStore((s) => s.id);
  const selectedPrismicDocument = useCampaignStore((s) => s.selectedPrismicDocument);
  const selectedList = useCampaignStore((s) => s.selectedList);
  const setSelectedList = useCampaignStore((s) => s.setSelectedList);
  const { goToStep } = useStepNavigation();

  function onSegmentSelected(list: HubSpotList) {
    setSelectedList(list);
  }

  function onContinue() {
    if (selectedList) {
      updateCampaign(id, {
        segment: selectedList.name,
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 bg-card shadow-sm p-5 border border-border rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-foreground text-sm">HubSpot Segments</span>
          <span className="inline-flex items-center gap-1.5 bg-green-50 px-2.5 py-1 border border-green-200 rounded-full font-medium text-green-700 text-xs">
            <span className="bg-green-500 rounded-full w-1.5 h-1.5" />
            HubSpot connected
          </span>
        </div>
        <SegmentCombobox onSegmentSelected={onSegmentSelected} />
      </div>

      <SelectedSegmentBox />

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={onContinue} disabled={!selectedList}>
          Continue
        </Button>
      </div>
    </div>
  );
}
