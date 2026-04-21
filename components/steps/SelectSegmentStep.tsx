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

  const hasSelection = campaign.selectedList !== null;
  const sectionTitle = hasSelection
    ? "Or search for a segment"
    : "Find your segment";

  return (
    <div className="flex flex-col gap-6">
      <SelectedSegmentBox />

      <div className="flex flex-col gap-6">
        <h2 className="text-sm font-medium text-gray-500">{sectionTitle}</h2>

        <ListSearchBar
          key={`search-${searchResetKey}`}
          onListSelected={selectFromSearch}
        />

        <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-gray-400">
          <span className="h-px flex-1 bg-gray-200" aria-hidden />
          <span>ou</span>
          <span className="h-px flex-1 bg-gray-200" aria-hidden />
        </div>

        <UrlInput
          key={`url-${urlResetKey}`}
          onListSelected={selectFromUrl}
        />
      </div>

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
    </div>
  );
}
