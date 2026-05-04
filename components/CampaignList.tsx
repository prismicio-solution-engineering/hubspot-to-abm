"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { ChevronDown, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteCampaign, type SavedCampaign } from "@/lib/campaigns-store";

function campaignUrl(c: SavedCampaign): string {
  const step = c.currentStep ?? "select-prismic-document";
  const params = new URLSearchParams({ step, name: c.name, id: c.id });
  return `/campaigns/new?${params.toString()}`;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

function CampaignMenu({ campaign, onDelete }: { campaign: SavedCampaign; onDelete: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation();
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setOpen((o) => !o);
  }

  return (
    <div ref={ref}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpen}
        className="flex justify-center items-center hover:bg-muted border border-border rounded-md w-7 h-7 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Campaign options"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div
          style={{ top: menuPos.top, right: menuPos.right }}
          className="z-50 fixed bg-card shadow-md py-1 border border-border rounded-md w-fit"
        >
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

function ContextCell({ context }: { context?: string }) {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  if (!context) return <span className="text-muted-foreground/40">—</span>;

  return (
    <div
      className="relative"
      onMouseEnter={() => { timer.current = setTimeout(() => setVisible(true), 100); }}
      onMouseLeave={() => { clearTimeout(timer.current); setVisible(false); }}
    >
      <span className="block max-w-[240px] text-muted-foreground truncate">{context}</span>
      {visible && (
        <div className="bottom-full left-0 z-50 absolute bg-popover shadow-md mb-1 px-3 py-2 border border-border rounded-md max-w-xs text-foreground text-xs break-words whitespace-pre-wrap">
          {context}
        </div>
      )}
    </div>
  );
}

interface CampaignListProps {
  campaigns: SavedCampaign[];
  search: string;
  onReload: () => void;
}

export default function CampaignList({ campaigns, search, onReload }: CampaignListProps) {
  const router = useRouter();
  const [segmentFilter, setSegmentFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);

  const segments = useMemo(
    () => Array.from(new Set(campaigns.map((c) => c.segment).filter(Boolean) as string[])),
    [campaigns],
  );

  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
      const matchesSegment = segmentFilter === "all" || c.segment === segmentFilter;
      return matchesSearch && matchesSegment;
    });
  }, [campaigns, search, segmentFilter]);

  return (
    <div className="flex flex-col flex-1">
      <div className="flex items-center gap-3 shadow px-6 py-2.5 border-border border-b">
        <span className="font-medium text-foreground text-sm">
          {filtered.length} Campaign{filtered.length !== 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground text-sm">Filter:</span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setFilterOpen((o) => !o)}
              className="flex items-center gap-1.5 bg-white hover:bg-muted px-2.5 py-1 border border-border rounded-md text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
              <span>{segmentFilter === "all" ? "Segment" : segmentFilter}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {filterOpen && (
              <div className="top-full left-0 z-50 absolute bg-card shadow-md mt-1 py-1 border border-border rounded-md min-w-[140px]">
                <button
                  type="button"
                  onClick={() => { setSegmentFilter("all"); setFilterOpen(false); }}
                  className="flex items-center gap-2 hover:bg-muted px-3 py-1.5 w-full text-foreground text-sm transition-colors"
                >
                  All segments
                </button>
                {segments.map((seg) => (
                  <button
                    key={seg}
                    type="button"
                    onClick={() => { setSegmentFilter(seg); setFilterOpen(false); }}
                    className="flex items-center gap-2 hover:bg-muted px-3 py-1.5 w-full text-foreground text-sm transition-colors"
                  >
                    {seg}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-6">
        <div className="mt-10 border border-border border-b-0 rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-border border-b">
              <th className="px-6 py-3 font-semibold text-muted-foreground text-xs text-left uppercase tracking-wide">Name</th>
              <th className="px-6 py-3 font-semibold text-muted-foreground text-xs text-left uppercase tracking-wide">Context</th>
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
                <td colSpan={7} className="px-6 py-12 text-muted-foreground text-sm text-center">
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
                  <td className="px-6 py-4">
                    <ContextCell context={campaign.context} />
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
                    <CampaignMenu campaign={campaign} onDelete={onReload} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
