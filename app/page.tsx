"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import NewCampaignDialog from "@/components/NewCampaignDialog";
import LogoutButton from "@/components/LogoutButton";
import CampaignList from "@/components/CampaignList";
import { getCampaigns, type SavedCampaign } from "@/lib/campaigns-store";

export default function HomePage() {
  const [campaigns, setCampaigns] = useState<SavedCampaign[]>([]);
  const [search, setSearch] = useState("");

  function reload() {
    setCampaigns(getCampaigns());
  }

  useEffect(() => {
    reload();
  }, []);

  return (
    <div className="flex flex-col bg-background min-h-screen">
      <header className="flex justify-between items-center px-6 border-border border-b h-14">
        <div className="flex items-center gap-2">
          <div className="flex justify-center items-center bg-primary rounded w-7 h-7">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-semibold text-foreground text-sm">ABM Campaigns</span>
        </div>
        <div className="flex flex-1 items-center gap-3 px-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="top-1/2 left-3 absolute w-4 h-4 text-muted-foreground -translate-y-1/2" />
            <Input
              placeholder="Search for a campaign"
              className="bg-white pl-9 h-9 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <NewCampaignDialog onCreated={reload} />
          <LogoutButton />
        </div>
      </header>

      {campaigns.length === 0 ? (
        <main className="flex flex-1 justify-center items-center px-6 py-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex justify-center items-center bg-muted rounded-full w-12 h-12">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-medium text-foreground text-sm">No campaigns yet</p>
              <p className="text-muted-foreground text-xs">Create your first ABM campaign to get started</p>
            </div>
            <NewCampaignDialog onCreated={reload} />
          </div>
        </main>
      ) : (
        <main className="flex flex-col flex-1">
          <CampaignList campaigns={campaigns} search={search} onReload={reload} />
        </main>
      )}
    </div>
  );
}
