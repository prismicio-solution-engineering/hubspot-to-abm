"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { CAMPAIGN_STEPS, getStepIndex } from "@/lib/campaign-flow";
import { useCampaignStore } from "@/lib/campaign-store";

export default function StepIndicator() {
  const params = useSearchParams();
  const router = useRouter();
  const currentId = params.get("step") ?? CAMPAIGN_STEPS[0].id;
  const currentIndex = Math.max(0, getStepIndex(currentId));

  const selectedPrismicDocument = useCampaignStore((s) => s.selectedPrismicDocument);
  const selectedList = useCampaignStore((s) => s.selectedList);
  const recommendation = useCampaignStore((s) => s.recommendation);

  function isNavigable(i: number): boolean {
    if (i === currentIndex) return false;
    if (i < currentIndex) return true;
    // Forward: only if prerequisites are met
    if (i === 1) return selectedPrismicDocument !== null;
    if (i === 2) return selectedPrismicDocument !== null && selectedList !== null;
    if (i === 3) return recommendation !== null;
    return false;
  }

  function navigateTo(i: number) {
    if (!isNavigable(i)) return;
    const next = new URLSearchParams(params.toString());
    next.set("step", CAMPAIGN_STEPS[i].id);
    router.push(`/campaigns/new?${next.toString()}`);
  }

  return (
    <nav aria-label="Campaign steps">
      <ol className="flex items-center gap-1">
        {CAMPAIGN_STEPS.map((step, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isLast = i === CAMPAIGN_STEPS.length - 1;
          const navigable = isNavigable(i);

          return (
            <li key={step.id} className={cn("flex items-center", !isLast && "flex-1")}>
              <div
                className={cn("flex items-center gap-2", navigable && "cursor-pointer group")}
                onClick={() => navigateTo(i)}
                role={navigable ? "button" : undefined}
                tabIndex={navigable ? 0 : undefined}
                onKeyDown={(e) => e.key === "Enter" && navigateTo(i)}
                aria-label={navigable ? `Go to ${step.label}` : undefined}
              >
                {/* Circle */}
                <div
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn(
                    "flex justify-center items-center rounded-full w-5 h-5 font-semibold text-xs shrink-0",
                    "transition-all duration-300 ease-in-out",
                    (isCompleted || isCurrent)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                    isCompleted && "shadow-sm shadow-primary/30",
                    isCurrent && "scale-130 animate-step-glow",
                    navigable && "group-hover:opacity-75",
                  )}
                >
                  {isCompleted ? (
                    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                      <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 011.42-1.42l2.79 2.79 6.79-6.79a1 1 0 011.42 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "font-medium text-xs transition-colors duration-300",
                    isCurrent && "text-foreground",
                    isCompleted && "text-muted-foreground",
                    !isCompleted && !isCurrent && "text-muted-foreground/40",
                    navigable && "group-hover:opacity-75",
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector */}
              {!isLast && (
                <div className="relative flex-1 mx-3 bg-border rounded-full h-[1.5px] overflow-hidden">
                  <div
                    className="absolute inset-0 bg-primary rounded-full origin-left transition-transform duration-500 ease-in-out"
                    style={{ transform: isCompleted ? "scaleX(1)" : "scaleX(0)" }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
