"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

import type {
  HubSpotList,
  PrismicDocumentMetadata,
  RecommendationResponse,
} from "./types";

export interface CampaignState {
  id: string;
  selectedPrismicDocument: PrismicDocumentMetadata | null;
  selectedList: HubSpotList | null;
  selectedContactIds: string[];
  recommendation: RecommendationResponse | null;
  openAIResponseId: string | null;
}

interface CampaignContextValue {
  campaign: CampaignState;
  portalId: string;
  setSelectedPrismicDocument: (document: PrismicDocumentMetadata | null) => void;
  setSelectedList: (list: HubSpotList | null) => void;
  setSelectedContactIds: (ids: string[]) => void;
  setRecommendation: (
    recommendation: RecommendationResponse | null,
    openAIResponseId?: string | null,
  ) => void;
  resetCampaign: () => void;
}

const CampaignContext = createContext<CampaignContextValue | null>(null);

function createEmptyCampaign(): CampaignState {
  return {
    id: crypto.randomUUID(),
    selectedPrismicDocument: null,
    selectedList: null,
    selectedContactIds: [],
    recommendation: null,
    openAIResponseId: null,
  };
}

interface ProviderProps {
  children: ReactNode;
  portalId: string;
}

export function CampaignProvider({ children, portalId }: ProviderProps) {
  const [campaign, setCampaign] = useState<CampaignState>(createEmptyCampaign);

  const value: CampaignContextValue = {
    campaign,
    portalId,
    setSelectedPrismicDocument: (document) =>
      setCampaign((c) => ({
        ...c,
        selectedPrismicDocument: document,
        selectedList: null,
        selectedContactIds: [],
        recommendation: null,
        openAIResponseId: null,
      })),
    setSelectedList: (list) =>
      setCampaign((c) => ({
        ...c,
        selectedList: list,
        selectedContactIds: [],
        recommendation: null,
        openAIResponseId: null,
      })),
    setSelectedContactIds: (ids) =>
      setCampaign((c) => ({
        ...c,
        selectedContactIds: ids,
        recommendation: null,
        openAIResponseId: null,
      })),
    setRecommendation: (recommendation, openAIResponseId = null) =>
      setCampaign((c) => ({ ...c, recommendation, openAIResponseId })),
    resetCampaign: () => setCampaign(createEmptyCampaign()),
  };

  return (
    <CampaignContext.Provider value={value}>{children}</CampaignContext.Provider>
  );
}

export function useCampaign(): CampaignContextValue {
  const ctx = useContext(CampaignContext);
  if (!ctx) throw new Error("useCampaign must be used inside CampaignProvider");
  return ctx;
}
