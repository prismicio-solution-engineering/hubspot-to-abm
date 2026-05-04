"use client";

import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { CAMPAIGN_STEPS, getStepIndex } from "@/lib/campaign-flow";

export default function StepIndicator() {
  const params = useSearchParams();
  const currentId = params.get("step") ?? CAMPAIGN_STEPS[0].id;
  const currentIndex = Math.max(0, getStepIndex(currentId));

  return (
    <nav aria-label="Campaign steps">
      <ol className="flex items-center gap-1">
        {CAMPAIGN_STEPS.map((step, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isLast = i === CAMPAIGN_STEPS.length - 1;

          return (
            <li key={step.id} className={cn("flex items-center", !isLast && "flex-1")}>
              <div className="flex items-center gap-2">
                <div
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold shrink-0",
                    isCompleted && "bg-primary text-primary-foreground",
                    isCurrent && "bg-primary text-primary-foreground",
                    !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                      <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 011.42-1.42l2.79 2.79 6.79-6.79a1 1 0 011.42 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium",
                    isCurrent && "text-foreground",
                    isCompleted && "text-muted-foreground",
                    !isCompleted && !isCurrent && "text-muted-foreground/50"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div
                  aria-hidden="true"
                  className={cn(
                    "mx-3 h-px flex-1",
                    isCompleted ? "bg-primary/40" : "bg-border"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
