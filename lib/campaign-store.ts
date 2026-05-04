import { create } from "zustand";

import type { HubSpotList, PrismicDocumentMetadata, RecommendationResponse } from "./types";
import { getCampaignById, updateCampaign } from "./campaigns-store";

interface CampaignStore {
  id: string;
  portalId: string;
  selectedPrismicDocument: PrismicDocumentMetadata | null;
  selectedList: HubSpotList | null;
  selectedContactIds: string[];
  recommendation: RecommendationResponse | null;
  openAIResponseId: string | null;
  _persistEnabled: boolean;

  initCampaign: (id: string, portalId: string) => void;
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

export const useCampaignStore = create<CampaignStore>((set) => ({
  id: "",
  portalId: "",
  selectedPrismicDocument: null,
  selectedList: null,
  selectedContactIds: [],
  recommendation: null,
  openAIResponseId: null,
  _persistEnabled: false,

  initCampaign: (id, portalId) => {
    const saved = getCampaignById(id);
    set({
      id,
      portalId,
      _persistEnabled: true,
      selectedPrismicDocument: saved?.selectedPrismicDocument ?? null,
      selectedList: saved?.selectedList ?? null,
      selectedContactIds: saved?.selectedContactIds ?? [],
      recommendation: saved?.recommendation ?? null,
      openAIResponseId: saved?.openAIResponseId ?? null,
    });
  },

  setSelectedPrismicDocument: (document) =>
    set({ selectedPrismicDocument: document, selectedList: null, selectedContactIds: [], recommendation: null, openAIResponseId: null }),

  setSelectedList: (list) =>
    set({ selectedList: list, selectedContactIds: [], recommendation: null, openAIResponseId: null }),

  setSelectedContactIds: (ids) =>
    set({ selectedContactIds: ids, recommendation: null, openAIResponseId: null }),

  setRecommendation: (recommendation, openAIResponseId = null) =>
    set({ recommendation, openAIResponseId }),

  updateRecommendationItem: (index, item) =>
    set((s) => {
      if (!s.recommendation) return s;
      return {
        recommendation: {
          recommendationItems: s.recommendation.recommendationItems.map((current, i) =>
            i === index ? item : current,
          ),
        },
      };
    }),

  discardRecommendationItem: (index) =>
    set((s) => {
      if (!s.recommendation) return s;
      return {
        recommendation: {
          recommendationItems: s.recommendation.recommendationItems.filter((_, i) => i !== index),
        },
      };
    }),

  addRecommendationItem: () =>
    set((s) => ({
      recommendation: {
        recommendationItems: [
          ...(s.recommendation?.recommendationItems ?? []),
          {
            companyName: "",
            firstName: "",
            lastName: "",
            position: "",
            challenges: [""],
            specificPainPoints: [""],
            personalizedInstructions: "",
          },
        ],
      },
    })),

  resetCampaign: () =>
    set({
      id: "",
      portalId: "",
      selectedPrismicDocument: null,
      selectedList: null,
      selectedContactIds: [],
      recommendation: null,
      openAIResponseId: null,
      _persistEnabled: false,
    }),
}));

useCampaignStore.subscribe((state) => {
  if (!state._persistEnabled) return;
  updateCampaign(state.id, {
    selectedPrismicDocument: state.selectedPrismicDocument,
    selectedList: state.selectedList,
    selectedContactIds: state.selectedContactIds,
    recommendation: state.recommendation,
    openAIResponseId: state.openAIResponseId,
  });
});
