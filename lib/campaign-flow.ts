import type { ComponentType } from "react";

import ReviewRecommendationsStep from "@/components/steps/ReviewRecommendationsStep";
import SelectContactsStep from "@/components/steps/SelectContactsStep";
import SelectPrismicDocumentStep from "@/components/steps/SelectPrismicDocumentStep";
import SelectSegmentStep from "@/components/steps/SelectSegmentStep";

export interface CampaignStep {
  id: string;
  number: number;
  label: string;
  title: string;
  Component: ComponentType;
}

export const CAMPAIGN_STEPS: CampaignStep[] = [
  {
    id: "select-prismic-document",
    number: 1,
    label: "Select document",
    title: "Select Your Prismic Document",
    Component: SelectPrismicDocumentStep,
  },
  {
    id: "select-segment",
    number: 2,
    label: "Select segment",
    title: "Select Your HubSpot Segment",
    Component: SelectSegmentStep,
  },
  {
    id: "select-contacts",
    number: 3,
    label: "Select contacts",
    title: "Select Contacts for Your Campaign",
    Component: SelectContactsStep,
  },
  {
    id: "review-recommendations",
    number: 4,
    label: "Review",
    title: "Review ABM Recommendations",
    Component: ReviewRecommendationsStep,
  },
];

export function getStepById(id: string): CampaignStep | undefined {
  return CAMPAIGN_STEPS.find((s) => s.id === id);
}

export function getStepIndex(id: string): number {
  return CAMPAIGN_STEPS.findIndex((s) => s.id === id);
}
