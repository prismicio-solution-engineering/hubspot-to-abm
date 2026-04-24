"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

import type { HubSpotList, PrismicDocument } from "./types";

export interface CampaignState {
  id: string;
  selectedPrismicDocument: PrismicDocument | null;
  selectedList: HubSpotList | null;
  selectedContactIds: string[];
}

interface CampaignContextValue {
  campaign: CampaignState;
  portalId: string;
  setSelectedPrismicDocument: (document: PrismicDocument | null) => void;
  setSelectedList: (list: HubSpotList | null) => void;
  setSelectedContactIds: (ids: string[]) => void;
  resetCampaign: () => void;
}

const CampaignContext = createContext<CampaignContextValue | null>(null);

function createEmptyCampaign(): CampaignState {
  return {
    id: crypto.randomUUID(),
    selectedPrismicDocument: null,
    selectedList: null,
    selectedContactIds: [],
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
      })),
    setSelectedList: (list) =>
      setCampaign((c) => ({
        ...c,
        selectedList: list,
        selectedContactIds: [],
      })),
    setSelectedContactIds: (ids) =>
      setCampaign((c) => ({ ...c, selectedContactIds: ids })),
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
