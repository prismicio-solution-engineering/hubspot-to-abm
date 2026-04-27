"use client";

import { useRouter } from "next/navigation";

import PrismicUrlInput from "../PrismicUrlInput";
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
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onContinue}
          disabled={!hasSelection}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          Continue
        </button>
      </div>

      <div className="flex flex-col gap-6 p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Find your Prismic document
        </h2>
        <PrismicUrlInput onDocumentSelected={onDocumentSelected} />
      </div>

      <SelectedPrismicDocumentBox />
    </div>
  );
}
