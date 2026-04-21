interface Props {
  selectedCount: number;
  onGenerate: () => void;
}

export default function GeneratePagesBar({ selectedCount, onGenerate }: Props) {
  const noun = selectedCount > 1 ? "contacts sélectionnés" : "contact sélectionné";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-gray-200 bg-white px-4 py-2 shadow-sm">
      <span className="text-sm text-gray-600" aria-live="polite">
        {selectedCount} {noun}
      </span>
      <button
        type="button"
        onClick={onGenerate}
        disabled={selectedCount === 0}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
      >
        Generate pages
      </button>
    </div>
  );
}
