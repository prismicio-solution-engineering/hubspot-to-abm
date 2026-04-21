import type { ComponentType } from "react";

import SelectContactsStep from "@/components/steps/SelectContactsStep";
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
    id: "select-segment",
    number: 1,
    label: "Select segment",
    title: "Select your HubSpot Segment",
    Component: SelectSegmentStep,
  },
  {
    id: "select-contacts",
    number: 2,
    label: "Select contacts",
    title: "Select contacts for your campaign",
    Component: SelectContactsStep,
  },
];

export function getStepById(id: string): CampaignStep | undefined {
  return CAMPAIGN_STEPS.find((s) => s.id === id);
}

export function getStepIndex(id: string): number {
  return CAMPAIGN_STEPS.findIndex((s) => s.id === id);
}
