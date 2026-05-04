"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import PrismicDocumentCombobox from "../PrismicDocumentCombobox";
import SelectedPrismicDocumentBox from "./SelectedPrismicDocumentBox";
import { useCampaign } from "@/lib/campaign-context";
import type { PrismicDocumentMetadata } from "@/lib/types";

export default function SelectPrismicDocumentStep() {
  const router = useRouter();
  const { campaign, setSelectedPrismicDocument } = useCampaign();

  function onDocumentSelected(document: PrismicDocumentMetadata) {
    setSelectedPrismicDocument(document);
    router.push("/campaigns/new?step=select-segment");
  }

  function onContinue() {
    router.push("/campaigns/new?step=select-segment");
  }

  const hasSelection = campaign.selectedPrismicDocument !== null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 shadow-sm">
        <PrismicDocumentCombobox onDocumentSelected={onDocumentSelected} />
      </div>

      <SelectedPrismicDocumentBox />

      <div className="flex justify-end">
        <Button onClick={onContinue} disabled={!hasSelection}>
          Continue
        </Button>
      </div>
    </div>
  );
}
