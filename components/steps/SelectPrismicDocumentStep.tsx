"use client";

import { Button } from "@/components/ui/button";
import PrismicDocumentCombobox from "../PrismicDocumentCombobox";
import SelectedPrismicDocumentBox from "./SelectedPrismicDocumentBox";
import { useCampaignStore } from "@/lib/campaign-store";
import { useStepNavigation } from "@/lib/useStepNavigation";
import { updateCampaign } from "@/lib/campaigns-store";
import type { PrismicDocumentMetadata } from "@/lib/types";

export default function SelectPrismicDocumentStep() {
  const id = useCampaignStore((s) => s.id);
  const selectedPrismicDocument = useCampaignStore((s) => s.selectedPrismicDocument);
  const setSelectedPrismicDocument = useCampaignStore((s) => s.setSelectedPrismicDocument);
  const { goToStep } = useStepNavigation();

  function onDocumentSelected(document: PrismicDocumentMetadata) {
    setSelectedPrismicDocument(document);
  }

  function onContinue() {
    updateCampaign(id, { currentStep: "select-segment" });
    goToStep("select-segment");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 shadow-sm">
        <PrismicDocumentCombobox onDocumentSelected={onDocumentSelected} />
      </div>

      <SelectedPrismicDocumentBox />

      <div className="flex justify-end">
        <Button onClick={onContinue} disabled={!selectedPrismicDocument}>
          Continue
        </Button>
      </div>
    </div>
  );
}
