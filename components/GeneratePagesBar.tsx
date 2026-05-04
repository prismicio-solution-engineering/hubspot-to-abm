import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

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

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm" aria-live="polite">
          <span className={isLimitReached ? "font-medium text-amber-600" : isEmpty ? "text-muted-foreground" : "text-foreground"}>
            {selectedCount} / {maxSelection} {noun}
          </span>
          {isLimitReached && (
            <span className="flex items-center gap-1 text-xs text-amber-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              Limit reached
            </span>
          )}
        </div>
        <Button
          type="button"
          onClick={onGenerate}
          disabled={selectedCount === 0 || isGenerating}
          size="sm"
        >
          {isGenerating ? "Generating…" : "Generate pages"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
