"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import PrismicConnectionCombobox from "../PrismicConnectionCombobox";
import PrismicDocumentCombobox from "../PrismicDocumentCombobox";
import SelectedPrismicDocumentBox from "./SelectedPrismicDocumentBox";
import { useCampaignStore } from "@/lib/campaign-store";
import { useStepNavigation } from "@/lib/useStepNavigation";
import { updateCampaign } from "@/lib/campaigns-store";
import { getPrismicConnection, type PrismicConnection } from "@/lib/prismic-connections";
import type { PrismicDocumentMetadata } from "@/lib/types";

export default function SelectPrismicDocumentStep() {
  const id = useCampaignStore((s) => s.id);
  const selectedPrismicConnectionId = useCampaignStore((s) => s.selectedPrismicConnectionId);
  const selectedPrismicDocument = useCampaignStore((s) => s.selectedPrismicDocument);
  const setSelectedPrismicConnectionId = useCampaignStore((s) => s.setSelectedPrismicConnectionId);
  const setSelectedPrismicDocument = useCampaignStore((s) => s.setSelectedPrismicDocument);
  const { goToStep } = useStepNavigation();
  const selectedConnection = getPrismicConnection(selectedPrismicConnectionId);

  function onConnectionSelected(connection: PrismicConnection) {
    setSelectedPrismicConnectionId(connection.id);
  }

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
        <PrismicConnectionCombobox
          selectedId={selectedPrismicConnectionId}
          onConnectionSelected={onConnectionSelected}
        />
        {!selectedConnection ? (
          <div className="rounded-md border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            Add a Prismic repository in Settings, then select it here before choosing a
            document.{" "}
            <Link href="/settings" className="font-medium text-primary underline">
              Open settings
            </Link>
          </div>
        ) : (
          <PrismicDocumentCombobox
            connection={selectedConnection}
            selectedDocument={selectedPrismicDocument}
            onDocumentSelected={onDocumentSelected}
          />
        )}
      </div>

      <SelectedPrismicDocumentBox />

      <div className="flex justify-end">
        <Button onClick={onContinue} disabled={!selectedConnection || !selectedPrismicDocument}>
          Continue
        </Button>
      </div>
    </div>
  );
}
