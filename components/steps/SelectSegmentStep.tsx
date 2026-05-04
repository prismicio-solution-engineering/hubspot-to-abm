"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
    router.push("/campaigns/new?step=select-contacts");
  }

  function selectFromUrl(list: HubSpotList) {
    setSearchResetKey((k) => k + 1);
    setSelectedList(list);
    router.push("/campaigns/new?step=select-contacts");
  }

  function onContinue() {
    router.push("/campaigns/new?step=select-contacts");
  }

  function onBack() {
    router.push("/campaigns/new?step=select-prismic-document");
  }

  const hasSelection = campaign.selectedList !== null;

  if (!campaign.selectedPrismicDocument) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-4 py-12 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            No Prismic document selected.
          </p>
          <p className="text-xs text-muted-foreground/70">
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
      <div className="flex flex-col gap-5 rounded-lg border border-border bg-card p-5 shadow-sm">
        <UrlInput key={`url-${urlResetKey}`} onListSelected={selectFromUrl} />
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>
        <ListSearchBar key={`search-${searchResetKey}`} onListSelected={selectFromSearch} />
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
