"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import ListSearchBar from "../ListSearchBar";
import UrlInput from "../UrlInput";
import SelectedSegmentBox from "./SelectedSegmentBox";
import { useCampaign } from "@/lib/campaign-context";
import type { HubSpotList } from "@/lib/types";

export default function SelectSegmentStep() {
  const router = useRouter();
  const { campaign, setSelectedList } = useCampaign();
  const [searchResetKey, setSearchResetKey] = useState(0);
  const [urlResetKey, setUrlResetKey] = useState(0);

  function selectFromSearch(list: HubSpotList) {
    setUrlResetKey((k) => k + 1);
    setSelectedList(list);
  }

  function selectFromUrl(list: HubSpotList) {
    setSearchResetKey((k) => k + 1);
    setSelectedList(list);
  }

  function onContinue() {
    router.push("/campaigns/new?step=select-contacts");
  }

  function onBack() {
    router.push("/campaigns/new?step=select-prismic-document");
  }

  const hasSelection = campaign.selectedList !== null;
  const sectionTitle = hasSelection
    ? "Find a new segment"
    : "Find your segment";

  if (!campaign.selectedPrismicDocument) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-12 text-center transition-colors duration-200">
          <p className="text-sm font-medium text-gray-400">
            No Prismic document selected.
          </p>
          <p className="text-xs text-gray-400">
            Go back to the previous step to pick one.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="w-fit rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Back to step 1
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={!hasSelection}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          Continue
        </button>
      </div>

      <SelectedSegmentBox />

      <div className="flex flex-col gap-6 p-6">
        <h2 className="text-lg font-semibold text-gray-900">{sectionTitle}</h2>

        <UrlInput
          key={`url-${urlResetKey}`}
          onListSelected={selectFromUrl}
        />

        <ListSearchBar
          key={`search-${searchResetKey}`}
          onListSelected={selectFromSearch}
        />
      </div>
    </div>
  );
}
