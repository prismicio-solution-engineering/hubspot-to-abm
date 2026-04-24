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
  updateRecommendationItem: (
    index: number,
    item: RecommendationResponse["recommendationItems"][number],
  ) => void;
  discardRecommendationItem: (index: number) => void;
  addRecommendationItem: () => void;
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
    updateRecommendationItem: (index, item) =>
      setCampaign((c) => {
        if (!c.recommendation) return c;
        return {
          ...c,
          recommendation: {
            recommendationItems: c.recommendation.recommendationItems.map((current, i) =>
              i === index ? item : current,
            ),
          },
        };
      }),
    discardRecommendationItem: (index) =>
      setCampaign((c) => {
        if (!c.recommendation) return c;
        return {
          ...c,
          recommendation: {
            recommendationItems: c.recommendation.recommendationItems.filter(
              (_item, i) => i !== index,
            ),
          },
        };
      }),
    addRecommendationItem: () =>
      setCampaign((c) => {
        const nextItem: RecommendationResponse["recommendationItems"][number] = {
          companyName: "",
          firstName: "",
          lastName: "",
          position: "",
          challenges: [""],
          specificPainPoints: [""],
          whyThisAccount: "Manually added recommendation.",
          personalizedInstructions: "",
        };

        return {
          ...c,
          recommendation: {
            recommendationItems: [
              ...(c.recommendation?.recommendationItems ?? []),
              nextItem,
            ],
          },
        };
      }),
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
