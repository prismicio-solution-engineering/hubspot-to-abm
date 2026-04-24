interface Props {
  selectedCount: number;
  maxSelection: number;
  isGenerating?: boolean;
  error?: string | null;
  onGenerate: () => void | Promise<void>;
}

export default function GeneratePagesBar({
  selectedCount,
  maxSelection,
  isGenerating = false,
  error = null,
  onGenerate,
}: Props) {
  const noun = selectedCount > 1 ? "contacts selected" : "contact selected";
  const isLimitReached = selectedCount >= maxSelection;
  const isEmpty = selectedCount === 0;

  const counterClass = isLimitReached
    ? "text-amber-700 font-medium"
    : isEmpty
      ? "text-gray-400"
      : "text-gray-700";

  return (
    <div className="flex flex-col gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm" aria-live="polite">
          <span className={counterClass}>
            {selectedCount} / {maxSelection} {noun}
          </span>
          {isLimitReached && (
            <span className="flex items-center gap-1 text-sm text-amber-700">
              <span aria-hidden="true">•</span>
              <svg
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0v-4.5zM10 15a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
              Limit reached
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onGenerate}
          disabled={selectedCount === 0 || isGenerating}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {isGenerating ? "Generating..." : "Generate pages"}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
