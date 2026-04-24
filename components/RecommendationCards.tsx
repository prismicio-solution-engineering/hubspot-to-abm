"use client";

import { useEffect, useMemo, useState } from "react";

import type { RecommendationItem, RecommendationResponse } from "@/lib/types";

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
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-200 pb-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-gray-900">
            Recommended ABM pages
          </h2>
          <p className="text-sm text-gray-500">
            {itemCount} recommendation{itemCount === 1 ? "" : "s"} in JSON
          </p>
          {openAIResponseId && (
            <p className="text-xs text-gray-400">OpenAI response {openAIResponseId}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={showAll}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Show all
          </button>
          <button
            type="button"
            onClick={hideAll}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Hide all
          </button>
          <button
            type="button"
            onClick={addItem}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            Add card
          </button>
          <button
            type="button"
            onClick={onCopyJson}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            {copyState === "copied"
              ? "Copied"
              : copyState === "unavailable"
                ? "Copy unavailable"
                : "Copy JSON"}
          </button>
        </div>
      </div>

      <div className="grid gap-3">
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
    onUpdate?.(index, {
      ...draft,
      whyThisAccount: item.whyThisAccount,
    });
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
    <article className="rounded-md border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          className="flex flex-1 items-center gap-3 text-left"
        >
          <span
            aria-hidden="true"
            className={`text-gray-500 transition-transform ${isOpen ? "rotate-90" : ""}`}
          >
            ▶
          </span>
          <span className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              {visibleItem.companyName || "Unknown company"}
            </span>
            <span className="text-base font-semibold text-gray-900">
              {[visibleItem.firstName, visibleItem.lastName].filter(Boolean).join(" ") ||
                "Unknown contact"}
            </span>
            <span className="text-sm text-gray-500">
              {visibleItem.position || "Position unavailable"}
            </span>
          </span>
        </button>

        <div className="flex flex-wrap gap-2">
          {!isEditing && (
            <>
              <button
                type="button"
                onClick={() => {
                  if (!isOpen) onToggle();
                  startEdit();
                }}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDiscard?.(index)}
                className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Discard
              </button>
            </>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-gray-200 px-4 py-4">
          {isEditing ? (
            <EditContent
              draft={draft}
              whyThisAccount={item.whyThisAccount}
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
      <div className="grid gap-4 lg:grid-cols-2">
        <FieldList title="Challenges" items={item.challenges} />
        <FieldList title="Specific pain points" items={item.specificPainPoints} />
      </div>

      <div className="mt-4 grid gap-4">
        <FieldBlock
          title="Personalized instructions"
          value={item.personalizedInstructions}
        />
        <NoteBlock title="Why this account" value={item.whyThisAccount} />
      </div>
    </>
  );
}

function EditContent({
  draft,
  whyThisAccount,
  onCancel,
  onSave,
  onTextChange,
  onListAdd,
  onListChange,
  onListRemove,
}: {
  draft: RecommendationItem;
  whyThisAccount: string;
  onCancel: () => void;
  onSave: () => void;
  onTextChange: <K extends keyof RecommendationItem>(
    key: K,
    value: RecommendationItem[K],
  ) => void;
  onListAdd: (key: "challenges" | "specificPainPoints") => void;
  onListChange: (
    key: "challenges" | "specificPainPoints",
    index: number,
    value: string,
  ) => void;
  onListRemove: (key: "challenges" | "specificPainPoints", index: number) => void;
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-2">
        <EditField
          label="Company"
          value={draft.companyName}
          onChange={(value) => onTextChange("companyName", value)}
        />
        <EditField
          label="Position"
          value={draft.position}
          onChange={(value) => onTextChange("position", value)}
        />
        <EditField
          label="First name"
          value={draft.firstName}
          onChange={(value) => onTextChange("firstName", value)}
        />
        <EditField
          label="Last name"
          value={draft.lastName}
          onChange={(value) => onTextChange("lastName", value)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <EditableList
          title="Challenges"
          items={draft.challenges}
          onAdd={() => onListAdd("challenges")}
          onChange={(i, value) => onListChange("challenges", i, value)}
          onRemove={(i) => onListRemove("challenges", i)}
        />
        <EditableList
          title="Specific pain points"
          items={draft.specificPainPoints}
          onAdd={() => onListAdd("specificPainPoints")}
          onChange={(i, value) => onListChange("specificPainPoints", i, value)}
          onRemove={(i) => onListRemove("specificPainPoints", i)}
        />
      </div>

      <EditTextArea
        label="Personalized instructions"
        value={draft.personalizedInstructions}
        onChange={(value) => onTextChange("personalizedInstructions", value)}
      />

      <NoteBlock title="Why this account" value={whyThisAccount} />

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </div>
  );
}

function FieldList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </h4>
      {items.length > 0 ? (
        <ul className="mt-2 flex flex-col gap-2 text-sm text-gray-700">
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="rounded-md border border-gray-200 bg-white px-3 py-2"
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-gray-400">No value returned.</p>
      )}
    </div>
  );
}

function FieldBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </h4>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
        {value || "No value returned."}
      </p>
    </div>
  );
}

function NoteBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-amber-700">
        {title}
      </h4>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-amber-900">
        {value || "No value returned."}
      </p>
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-gray-700">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </label>
  );
}

function EditTextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-gray-700">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </label>
  );
}

function EditableList({
  title,
  items,
  onAdd,
  onChange,
  onRemove,
}: {
  title: string;
  items: string[];
  onAdd: () => void;
  onChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {title}
        </h4>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-md px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
        >
          Add
        </button>
      </div>
      <div className="mt-2 flex flex-col gap-2">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2">
            <textarea
              value={item}
              rows={2}
              onChange={(e) => onChange(index, e.target.value)}
              className="min-h-16 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => onRemove(index)}
              aria-label={`Remove ${title} item ${index + 1}`}
              className="h-fit rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
