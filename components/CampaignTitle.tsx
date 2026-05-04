"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil } from "lucide-react";

import { useCampaignStore } from "@/lib/campaign-store";
import { updateCampaign } from "@/lib/campaigns-store";

export default function CampaignTitle() {
  const params = useSearchParams();
  const router = useRouter();
  const id = useCampaignStore((s) => s.id);

  const currentName = params.get("name") ?? "New campaign";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  function startEdit() {
    setDraft(currentName);
    setEditing(true);
  }

  function save() {
    const trimmed = draft.trim() || currentName;
    setEditing(false);
    if (trimmed === currentName) return;

    const next = new URLSearchParams(params.toString());
    next.set("name", trimmed);
    router.replace(`?${next.toString()}`);

    if (id) updateCampaign(id, { name: trimmed });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") save();
    if (e.key === "Escape") setEditing(false);
  }

  if (editing) {
    return (
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={onKeyDown}
        autoFocus
        className="border-b border-foreground/30 bg-transparent outline-none text-sm font-semibold text-foreground min-w-20"
        style={{ width: `${Math.max(draft.length + 1, 12)}ch` }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      className="group flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-foreground/70 transition-colors cursor-text"
    >
      {currentName}
      <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity shrink-0" />
    </button>
  );
}
