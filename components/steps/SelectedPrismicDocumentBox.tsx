"use client";

import { useCampaign } from "@/lib/campaign-context";

export default function SelectedPrismicDocumentBox() {
  const { campaign, setSelectedPrismicDocument } = useCampaign();
  const { selectedPrismicDocument } = campaign;

  if (!selectedPrismicDocument) {
    return (
      <section
        aria-label="Selected Prismic document"
        aria-live="polite"
        className="flex flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-12 text-center transition-colors duration-200"
      >
        <p className="text-sm font-medium text-gray-400">
          No Prismic document selected yet
        </p>
        <p className="text-xs text-gray-400">
          Paste a Prismic document URL below.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Selected Prismic document"
      aria-live="polite"
      className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-blue-500 bg-blue-50 px-4 py-4 transition-colors duration-200"
    >
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-blue-700">
          Selected Prismic document
        </span>
        <span className="text-lg font-semibold text-gray-900">
          {selectedPrismicDocument.uid ?? selectedPrismicDocument.id}
        </span>
        <span className="text-xs text-gray-600">
          {selectedPrismicDocument.type} - {selectedPrismicDocument.lang}
        </span>
      </div>
      <button
        type="button"
        onClick={() => setSelectedPrismicDocument(null)}
        aria-label="Change selected Prismic document"
        className="rounded-md px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
      >
        Change
      </button>
    </section>
  );
}
