"use client";

import TypeBadge from "../TypeBadge";
import { useCampaign } from "@/lib/campaign-context";

export default function SelectedSegmentBox() {
  const { campaign, setSelectedList } = useCampaign();
  const { selectedList } = campaign;

  if (!selectedList) {
    return (
      <section
        aria-label="Selected segment"
        aria-live="polite"
        className="flex flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-12 text-center transition-colors duration-200"
      >
        <p className="text-sm font-medium text-gray-400">
          No segment selected yet
        </p>
        <p className="text-xs text-gray-400">
          Search by name or paste a HubSpot URL below.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Selected segment"
      aria-live="polite"
      className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-blue-200 border-l-4 border-l-blue-500 bg-blue-50 px-4 py-4 transition-colors duration-200"
    >
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-blue-700">
          Selected segment
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-lg font-semibold text-gray-900">
            {selectedList.name}
          </span>
          <TypeBadge type={selectedList.objectType} />
        </div>
        <span className="text-xs text-gray-600">
          {selectedList.size} {selectedList.size > 1 ? "records" : "record"}
        </span>
      </div>
      <button
        type="button"
        onClick={() => setSelectedList(null)}
        aria-label="Change selected segment"
        className="rounded-md px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
      >
        Change
      </button>
    </section>
  );
}
