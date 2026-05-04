"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Plus, Copy, Check, Eye, EyeOff, Trash2, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { RecommendationItem, RecommendationResponse } from "@/lib/types";

const MAX_PAIN_POINTS = 5;

interface Props {
  recommendation: RecommendationResponse | null;
  openAIResponseId?: string | null;
  onAddItem?: () => void;
  onUpdateItem?: (index: number, item: RecommendationItem) => void;
  onDiscardItem?: (index: number) => void;
}

type CopyState = "idle" | "copied" | "unavailable";

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export default function RecommendationCards({
  recommendation,
  openAIResponseId,
  onAddItem,
  onUpdateItem,
  onDiscardItem,
}: Props) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [openCards, setOpenCards] = useState<Set<number>>(new Set());
  const json = useMemo(
    () => (recommendation ? JSON.stringify(recommendation, null, 2) : ""),
    [recommendation],
  );
  const itemCount = recommendation?.recommendationItems.length ?? 0;

  useEffect(() => {
    setOpenCards((current) => {
      const next = new Set<number>();
      for (const index of current) {
        if (index < itemCount) next.add(index);
      }
      return next;
    });
  }, [itemCount]);

  if (!recommendation) return null;

  async function onCopyJson() {
    const ok = await copyText(json);
    setCopyState(ok ? "copied" : "unavailable");
    window.setTimeout(() => setCopyState("idle"), 2000);
  }

  function toggleCard(index: number) {
    setOpenCards((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  function showAll() {
    setOpenCards(new Set(Array.from({ length: itemCount }, (_item, index) => index)));
  }

  function hideAll() {
    setOpenCards(new Set());
  }

  function addItem() {
    onAddItem?.();
    window.setTimeout(() => {
      setOpenCards((current) => new Set([...current, itemCount]));
    }, 0);
  }

  return (
    <section className="flex flex-col gap-4" aria-label="ABM recommendations">
      <div className="flex flex-wrap justify-between items-center gap-3 pb-4 border-border border-b">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-semibold text-foreground text-sm">
            {itemCount} recommendation{itemCount === 1 ? "" : "s"}
          </h2>
          {openAIResponseId && (
            <p className="text-muted-foreground/60 text-xs">ID: {openAIResponseId}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={showAll}>
            <Eye className="w-3.5 h-3.5" />
            Show all
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={hideAll}>
            <EyeOff className="w-3.5 h-3.5" />
            Hide all
          </Button>
          <Button type="button" size="sm" onClick={addItem}>
            <Plus className="w-3.5 h-3.5" />
            Add card
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onCopyJson}>
            {copyState === "copied" ? (
              <><Check className="w-3.5 h-3.5" />Copied</>
            ) : (
              <><Copy className="w-3.5 h-3.5" />Copy JSON</>
            )}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {recommendation.recommendationItems.map((item, index) => (
          <RecommendationCard
            key={`${item.companyName}-${item.firstName}-${item.lastName}-${index}`}
            item={item}
            index={index}
            isOpen={openCards.has(index)}
            onToggle={() => toggleCard(index)}
            onUpdate={onUpdateItem}
            onDiscard={onDiscardItem}
          />
        ))}
      </div>
    </section>
  );
}

function RecommendationCard({
  item,
  index,
  isOpen,
  onToggle,
  onUpdate,
  onDiscard,
}: {
  item: RecommendationItem;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  onUpdate?: (index: number, item: RecommendationItem) => void;
  onDiscard?: (index: number) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<RecommendationItem>(item);
  const visibleItem = isEditing ? draft : item;

  function startEdit() {
    setDraft(item);
    setIsEditing(true);
  }

  function saveEdit() {
    onUpdate?.(index, draft);
    setIsEditing(false);
  }

  function updateText<K extends keyof RecommendationItem>(
    key: K,
    value: RecommendationItem[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function updateList(
    key: "challenges" | "specificPainPoints",
    listIndex: number,
    value: string,
  ) {
    setDraft((current) => ({
      ...current,
      [key]: current[key].map((item, i) => (i === listIndex ? value : item)),
    }));
  }

  function addListItem(key: "challenges" | "specificPainPoints") {
    setDraft((current) => ({ ...current, [key]: [...current[key], ""] }));
  }

  function removeListItem(key: "challenges" | "specificPainPoints", listIndex: number) {
    setDraft((current) => ({
      ...current,
      [key]: current[key].filter((_item, i) => i !== listIndex),
    }));
  }

  return (
    <article className="bg-card shadow-sm border border-border rounded-lg overflow-hidden">
      <div className="flex flex-wrap justify-between items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          className="flex flex-1 items-center gap-2.5 text-left"
        >
          <ChevronRight
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform shrink-0",
              isOpen && "rotate-90"
            )}
          />
          <span className="flex flex-col gap-0.5">
            <span className="font-semibold text-primary text-xs uppercase tracking-wide">
              {visibleItem.companyName || "Unknown company"}
            </span>
            <span className="font-medium text-foreground text-sm">
              {[visibleItem.firstName, visibleItem.lastName].filter(Boolean).join(" ") ||
                "Unknown contact"}
            </span>
            <span className="text-muted-foreground text-xs">
              {visibleItem.position || "Position unavailable"}
            </span>
          </span>
        </button>

        <div className="flex gap-2">
          {!isEditing && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!isOpen) onToggle();
                  startEdit();
                }}
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onDiscard?.(index)}
                className="hover:bg-destructive/5 border-destructive/30 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Discard
              </Button>
            </>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="px-4 py-4 border-border border-t">
          {isEditing ? (
            <EditContent
              draft={draft}
              onCancel={() => setIsEditing(false)}
              onSave={saveEdit}
              onTextChange={updateText}
              onListAdd={addListItem}
              onListChange={updateList}
              onListRemove={removeListItem}
            />
          ) : (
            <ViewContent item={visibleItem} />
          )}
        </div>
      )}
    </article>
  );
}

function ViewContent({ item }: { item: RecommendationItem }) {
  return (
    <>
      <div className="gap-3 grid lg:grid-cols-2">
        <FieldList title="Challenges" items={item.challenges} />
        <FieldList title="Specific pain points" items={item.specificPainPoints} />
      </div>
      <div className="mt-3">
        <FieldBlock title="Personalized instructions" value={item.personalizedInstructions} />
      </div>
    </>
  );
}

function EditContent({
  draft,
  onCancel,
  onSave,
  onTextChange,
  onListAdd,
  onListChange,
  onListRemove,
}: {
  draft: RecommendationItem;
  onCancel: () => void;
  onSave: () => void;
  onTextChange: <K extends keyof RecommendationItem>(key: K, value: RecommendationItem[K]) => void;
  onListAdd: (key: "challenges" | "specificPainPoints") => void;
  onListChange: (key: "challenges" | "specificPainPoints", index: number, value: string) => void;
  onListRemove: (key: "challenges" | "specificPainPoints", index: number) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="gap-3 grid md:grid-cols-2">
        <EditField label="Company" value={draft.companyName} onChange={(v) => onTextChange("companyName", v)} />
        <EditField label="Position" value={draft.position} onChange={(v) => onTextChange("position", v)} />
        <EditField label="First name" value={draft.firstName} onChange={(v) => onTextChange("firstName", v)} />
        <EditField label="Last name" value={draft.lastName} onChange={(v) => onTextChange("lastName", v)} />
      </div>

      <div className="gap-3 grid lg:grid-cols-2">
        <EditableList
          title="Challenges"
          items={draft.challenges}
          onAdd={() => onListAdd("challenges")}
          onChange={(i, v) => onListChange("challenges", i, v)}
          onRemove={(i) => onListRemove("challenges", i)}
        />
        <EditableList
          title="Specific pain points"
          items={draft.specificPainPoints}
          maxItems={MAX_PAIN_POINTS}
          onAdd={() => onListAdd("specificPainPoints")}
          onChange={(i, v) => onListChange("specificPainPoints", i, v)}
          onRemove={(i) => onListRemove("specificPainPoints", i)}
        />
      </div>

      <EditTextArea
        label="Personalized instructions"
        value={draft.personalizedInstructions}
        onChange={(v) => onTextChange("personalizedInstructions", v)}
      />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" size="sm" onClick={onSave}>
          Save
        </Button>
      </div>
    </div>
  );
}

function FieldList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-muted/40 p-3 rounded-md">
      <h4 className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">{title}</h4>
      {items.length > 0 ? (
        <ul className="flex flex-col gap-1.5 mt-2 text-foreground text-sm">
          {items.map((item, index) => (
            <li key={`${item}-${index}`} className="bg-card px-3 py-1.5 border border-border rounded-md">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-muted-foreground text-sm">No value returned.</p>
      )}
    </div>
  );
}

function FieldBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-muted/40 p-3 rounded-md">
      <h4 className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">{title}</h4>
      <p className="mt-2 text-foreground text-sm leading-6 whitespace-pre-wrap">
        {value || "No value returned."}
      </p>
    </div>
  );
}

function EditField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function EditTextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={5} />
    </div>
  );
}

function EditableList({
  title,
  items,
  onAdd,
  onChange,
  maxItems,
  onRemove,
}: {
  title: string;
  items: string[];
  onAdd: () => void;
  onChange: (index: number, value: string) => void;
  maxItems?: number;
  onRemove: (index: number) => void;
}) {
  const isAtLimit = typeof maxItems === "number" && items.length >= maxItems;

  return (
    <div className="bg-muted/40 p-3 rounded-md">
      <div className="flex justify-between items-center gap-2">
        <h4 className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">{title}</h4>
        <button
          type="button"
          onClick={onAdd}
          disabled={isAtLimit}
          className="hover:bg-accent px-2 py-0.5 rounded font-medium text-primary disabled:text-muted-foreground text-xs transition-colors disabled:cursor-not-allowed"
        >
          {isAtLimit ? `Max ${maxItems}` : "+ Add"}
        </button>
      </div>
      <div className="flex flex-col gap-2 mt-2">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2">
            <Textarea
              value={item}
              rows={2}
              onChange={(e) => onChange(index, e.target.value)}
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => onRemove(index)}
              aria-label={`Remove ${title} item ${index + 1}`}
              className="self-start bg-card hover:bg-destructive/5 p-1.5 border border-destructive/30 rounded-md text-destructive transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
