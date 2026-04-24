"use client";

import Link from "next/link";

import RecommendationCards from "../RecommendationCards";
import { useCampaign } from "@/lib/campaign-context";

export default function ReviewRecommendationsStep() {
  const { campaign } = useCampaign();

  if (!campaign.recommendation) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-12 text-center transition-colors duration-200">
          <p className="text-sm font-medium text-gray-400">
            No recommendations generated yet.
          </p>
          <p className="text-xs text-gray-400">
            Go back to select contacts and generate recommendations.
          </p>
        </div>
        <Link
          href="/campaigns/new?step=select-contacts"
          className="w-fit rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Back to step 3
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between">
        <Link
          href="/campaigns/new?step=select-contacts"
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Back
        </Link>
      </div>

      <RecommendationCards
        recommendation={campaign.recommendation}
        openAIResponseId={campaign.openAIResponseId}
      />
    </div>
  );
}
