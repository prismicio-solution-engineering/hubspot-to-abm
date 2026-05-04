"use client";

import { Button } from "@/components/ui/button";
import SegmentCombobox from "../SegmentCombobox";
import SelectedSegmentBox from "./SelectedSegmentBox";
import { useCampaign } from "@/lib/campaign-context";
import { useStepNavigation } from "@/lib/useStepNavigation";
import type { HubSpotList } from "@/lib/types";

export default function SelectSegmentStep() {
  const { campaign, setSelectedList } = useCampaign();
  const { goToStep } = useStepNavigation();

  function onSegmentSelected(list: HubSpotList) {
    setSelectedList(list);
  }

  function onContinue() {
    goToStep("select-contacts");
  }

  function onBack() {
    goToStep("select-prismic-document");
  }

  const hasSelection = campaign.selectedList !== null;

  if (!campaign.selectedPrismicDocument) {
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
        <SegmentCombobox onSegmentSelected={onSegmentSelected} />
      </div>

      <SelectedSegmentBox />

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={onContinue} disabled={!hasSelection}>
          Continue
        </Button>
      </div>
    </div>
  );
}
