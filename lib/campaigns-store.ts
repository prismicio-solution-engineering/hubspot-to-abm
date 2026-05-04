import type { HubSpotList, PrismicDocumentMetadata, RecommendationResponse } from "./types";

export interface SavedCampaign {
  id: string;
  name: string;
  // Summary fields (for the list page)
  segment?: string;
  contactsCount?: number;
  release?: { id: string; label: string; url: string };
  createdAt: string;
  currentStep?: string;
  // Full state (for resuming mid-flow)
  selectedPrismicDocument?: PrismicDocumentMetadata | null;
  selectedList?: HubSpotList | null;
  selectedContactIds?: string[];
  recommendation?: RecommendationResponse | null;
  openAIResponseId?: string | null;
}

const STORAGE_KEY = "abm_campaigns_v1";

export function getCampaigns(): SavedCampaign[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as SavedCampaign[];
  } catch {
    return [];
  }
}

export function getCampaignById(id: string): SavedCampaign | undefined {
  return getCampaigns().find((c) => c.id === id);
}

function persist(campaigns: SavedCampaign[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
}

export function createCampaign(campaign: SavedCampaign): void {
  persist([campaign, ...getCampaigns()]);
}

export function updateCampaign(id: string, updates: Partial<Omit<SavedCampaign, "id">>): void {
  const list = getCampaigns();
  const idx = list.findIndex((c) => c.id === id);
  if (idx < 0) return;
  list[idx] = { ...list[idx], ...updates };
  persist(list);
}

export function deleteCampaign(id: string): void {
  persist(getCampaigns().filter((c) => c.id !== id));
}
