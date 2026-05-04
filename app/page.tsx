"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Search, ChevronDown, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import NewCampaignDialog from "@/components/NewCampaignDialog";
import LogoutButton from "@/components/LogoutButton";
import { getCampaigns, deleteCampaign, type SavedCampaign } from "@/lib/campaigns-store";

function CampaignMenu({ campaign, onDelete }: { campaign: SavedCampaign; onDelete: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="flex justify-center items-center hover:bg-muted border border-border rounded-md w-7 h-7 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Campaign options"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div className="right-[55px] z-50 absolute bg-card shadow-md mt-1 py-1 border border-border rounded-md w-fit">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpen(false); router.push(campaignUrl(campaign)); }}
            className="flex items-center gap-2 hover:bg-muted px-3 py-1.5 w-full text-foreground text-sm transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpen(false); deleteCampaign(campaign.id); onDelete(); }}
            className="flex items-center gap-2 hover:bg-destructive/5 px-3 py-1.5 w-full text-destructive text-sm transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

function campaignUrl(c: SavedCampaign): string {
  const step = c.currentStep ?? "select-prismic-document";
  const params = new URLSearchParams({ step, name: c.name, id: c.id });
  return `/campaigns/new?${params.toString()}`;
}

export default function HomePage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<SavedCampaign[]>([]);
  const [search, setSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);

  function reload() {
    setCampaigns(getCampaigns());
  }

  useEffect(() => {
    reload();
  }, []);

  const segments = useMemo(() => {
    const all = campaigns.map((c) => c.segment).filter(Boolean) as string[];
    return [...new Set(all)];
  }, [campaigns]);

  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
      const matchesSegment = segmentFilter === "all" || c.segment === segmentFilter;
      return matchesSearch && matchesSegment;
    });
  }, [campaigns, search, segmentFilter]);

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
          <div className="flex items-center gap-3 px-6 py-2.5 border-border border-b">
            <span className="font-medium text-foreground text-sm">
              {filtered.length} Campaign{filtered.length !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-sm">Filter:</span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setFilterOpen((o) => !o)}
                  className="flex items-center gap-1.5 bg-background bg-white hover:bg-muted px-2.5 py-1 border border-border rounded-md text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                  <span>
                    Creator
                  </span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <div className="mx-6">
            <table className="mt-10 border border-border rounded-xl w-full text-sm">
              <thead >
                <tr className="border-border border-b">
                  <th className="px-6 py-3 font-semibold text-muted-foreground text-xs text-left uppercase tracking-wide">Name</th>
                  <th className="px-6 py-3 font-semibold text-muted-foreground text-xs text-left uppercase tracking-wide">Segment</th>
                  <th className="px-6 py-3 font-semibold text-muted-foreground text-xs text-left uppercase tracking-wide">Contacts</th>
                  <th className="px-6 py-3 font-semibold text-muted-foreground text-xs text-left uppercase tracking-wide">Release</th>
                  <th className="px-6 py-3 font-semibold text-muted-foreground text-xs text-left uppercase tracking-wide">Date</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="bg-white">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-muted-foreground text-sm text-center">
                      No campaigns match your search.
                    </td>
                  </tr>
                ) : (
                  filtered.map((campaign) => (
                    <tr
                      key={campaign.id}
                      onClick={() => router.push(campaignUrl(campaign))}
                      className="group hover:bg-muted/30 border-border border-b transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <span className="font-medium text-foreground">{campaign.name}</span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {campaign.segment ?? <span className="text-muted-foreground/40">—</span>}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {campaign.contactsCount != null
                          ? campaign.contactsCount
                          : <span className="text-muted-foreground/40">—</span>}
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        {campaign.release ? (
                          <a
                            href={campaign.release.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {campaign.release.label}
                          </a>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {formatDate(campaign.createdAt)}
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <CampaignMenu campaign={campaign} onDelete={reload} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      )}
    </div>
  );
}
