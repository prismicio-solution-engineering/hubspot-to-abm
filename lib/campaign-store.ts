import { create } from "zustand";

import type {
  ContactSourceId,
  HubSpotContextPropertySelection,
  HubSpotList,
  PrismicDocumentMetadata,
  RecommendationResponse,
  Segment,
} from "./types";
import { getCampaignById, updateCampaign } from "./campaigns-store";

interface CampaignStore {
  id: string;
  portalId: string;
  selectedPrismicDocument: PrismicDocumentMetadata | null;
  selectedList: HubSpotList | null;
  selectedSourceId: ContactSourceId | null;
  selectedSegment: Segment | null;
  selectedContactIds: string[];
  selectedContextProperties: HubSpotContextPropertySelection[];
  recommendation: RecommendationResponse | null;
  openAIResponseId: string | null;
  _persistEnabled: boolean;

  initCampaign: (id: string, portalId: string) => void;
  setSelectedPrismicDocument: (document: PrismicDocumentMetadata | null) => void;
  setSelectedList: (list: HubSpotList | null) => void;
  setSelectedSourceId: (id: ContactSourceId | null) => void;
  setSelectedSegment: (segment: Segment | null) => void;
  setSelectedContactIds: (ids: string[]) => void;
  setSelectedContextProperties: (properties: HubSpotContextPropertySelection[]) => void;
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

function inferLegacyState(saved: ReturnType<typeof getCampaignById>): {
  selectedSourceId: ContactSourceId | null;
  selectedSegment: Segment | null;
} {
  if (saved?.selectedSegment) {
    return {
      selectedSourceId:
        saved.selectedSourceId ?? saved.selectedSegment.sourceId ?? null,
      selectedSegment: saved.selectedSegment,
    };
  }
  if (saved?.selectedList) {
    const segment: Segment = {
      id: saved.selectedList.id,
      name: saved.selectedList.name,
      objectType: saved.selectedList.objectType,
      size: saved.selectedList.size,
      sourceId: "hubspot",
      raw: saved.selectedList,
    };
    return {
      selectedSourceId: saved.selectedSourceId ?? "hubspot",
      selectedSegment: segment,
    };
  }
  return {
    selectedSourceId: saved?.selectedSourceId ?? null,
    selectedSegment: null,
  };
}

export const useCampaignStore = create<CampaignStore>((set) => ({
  id: "",
  portalId: "",
  selectedPrismicDocument: null,
  selectedList: null,
  selectedSourceId: null,
  selectedSegment: null,
  selectedContactIds: [],
  selectedContextProperties: [],
  recommendation: null,
  openAIResponseId: null,
  _persistEnabled: false,

  initCampaign: (id, portalId) => {
    const saved = getCampaignById(id);
    const legacy = inferLegacyState(saved);
    set({
      id,
      portalId,
      _persistEnabled: true,
      selectedPrismicDocument: saved?.selectedPrismicDocument ?? null,
      selectedList: saved?.selectedList ?? null,
      selectedSourceId: legacy.selectedSourceId,
      selectedSegment: legacy.selectedSegment,
      selectedContactIds: saved?.selectedContactIds ?? [],
      selectedContextProperties: saved?.selectedContextProperties ?? [],
      recommendation: saved?.recommendation ?? null,
      openAIResponseId: saved?.openAIResponseId ?? null,
    });
  },

  setSelectedPrismicDocument: (document) =>
    set({
      selectedPrismicDocument: document,
      selectedList: null,
      selectedSegment: null,
      selectedContactIds: [],
      recommendation: null,
      openAIResponseId: null,
    }),

  setSelectedList: (list) =>
    set({
      selectedList: list,
      selectedContactIds: [],
      recommendation: null,
      openAIResponseId: null,
    }),

  setSelectedSourceId: (id) =>
    set({
      selectedSourceId: id,
      selectedSegment: null,
      selectedList: null,
      selectedContactIds: [],
      recommendation: null,
      openAIResponseId: null,
    }),

  setSelectedSegment: (segment) =>
    set({
      selectedSegment: segment,
      selectedList:
        segment && segment.sourceId === "hubspot"
          ? {
              id: segment.id,
              name: segment.name,
              objectType: segment.objectType,
              size: segment.size,
            }
          : null,
      selectedContactIds: [],
      recommendation: null,
      openAIResponseId: null,
    }),

  setSelectedContactIds: (ids) =>
    set({ selectedContactIds: ids, recommendation: null, openAIResponseId: null }),

  setSelectedContextProperties: (properties) =>
    set({ selectedContextProperties: properties }),

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
      selectedSourceId: null,
      selectedSegment: null,
      selectedContactIds: [],
      selectedContextProperties: [],
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
    selectedSourceId: state.selectedSourceId,
    selectedSegment: state.selectedSegment,
    selectedContactIds: state.selectedContactIds,
    selectedContextProperties: state.selectedContextProperties,
    recommendation: state.recommendation,
    openAIResponseId: state.openAIResponseId,
  });
});
