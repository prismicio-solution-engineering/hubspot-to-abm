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
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-semibold text-foreground">
            {itemCount} recommendation{itemCount === 1 ? "" : "s"}
          </h2>
          {openAIResponseId && (
            <p className="text-xs text-muted-foreground/60">ID: {openAIResponseId}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={showAll}>
            <Eye className="h-3.5 w-3.5" />
            Show all
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={hideAll}>
            <EyeOff className="h-3.5 w-3.5" />
            Hide all
          </Button>
          <Button type="button" size="sm" onClick={addItem}>
            <Plus className="h-3.5 w-3.5" />
            Add card
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onCopyJson}>
            {copyState === "copied" ? (
              <><Check className="h-3.5 w-3.5" />Copied</>
            ) : (
              <><Copy className="h-3.5 w-3.5" />Copy JSON</>
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
    <article className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          className="flex flex-1 items-center gap-2.5 text-left"
        >
          <ChevronRight
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              isOpen && "rotate-90"
            )}
          />
          <span className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">
              {visibleItem.companyName || "Unknown company"}
            </span>
            <span className="text-sm font-medium text-foreground">
              {[visibleItem.firstName, visibleItem.lastName].filter(Boolean).join(" ") ||
                "Unknown contact"}
            </span>
            <span className="text-xs text-muted-foreground">
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
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onDiscard?.(index)}
                className="border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Discard
              </Button>
            </>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-border px-4 py-4">
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
      <div className="grid gap-3 lg:grid-cols-2">
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
      <div className="grid gap-3 md:grid-cols-2">
        <EditField label="Company" value={draft.companyName} onChange={(v) => onTextChange("companyName", v)} />
        <EditField label="Position" value={draft.position} onChange={(v) => onTextChange("position", v)} />
        <EditField label="First name" value={draft.firstName} onChange={(v) => onTextChange("firstName", v)} />
        <EditField label="Last name" value={draft.lastName} onChange={(v) => onTextChange("lastName", v)} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
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
    <div className="rounded-md bg-muted/40 p-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
      {items.length > 0 ? (
        <ul className="mt-2 flex flex-col gap-1.5 text-sm text-foreground">
          {items.map((item, index) => (
            <li key={`${item}-${index}`} className="rounded-md border border-border bg-card px-3 py-1.5">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">No value returned.</p>
      )}
    </div>
  );
}

function FieldBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/40 p-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">
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
    <div className="rounded-md bg-muted/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
        <button
          type="button"
          onClick={onAdd}
          disabled={isAtLimit}
          className="rounded px-2 py-0.5 text-xs font-medium text-primary hover:bg-accent disabled:cursor-not-allowed disabled:text-muted-foreground transition-colors"
        >
          {isAtLimit ? `Max ${maxItems}` : "+ Add"}
        </button>
      </div>
      <div className="mt-2 flex flex-col gap-2">
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
              className="self-start rounded-md border border-destructive/30 bg-card p-1.5 text-destructive transition-colors hover:bg-destructive/5"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
