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
                {/* Circle */}
                <div
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn(
                    "flex justify-center items-center rounded-full w-5 h-5 font-semibold text-xs shrink-0",
                    "transition-all duration-300 ease-in-out",
                    (isCompleted || isCurrent)
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                      : "bg-muted text-muted-foreground",
                    isCurrent && "scale-110 ring-2 ring-primary/20 ring-offset-1",
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
                    isCurrent  && "text-foreground",
                    isCompleted && "text-muted-foreground",
                    !isCompleted && !isCurrent && "text-muted-foreground/40",
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector */}
              {!isLast && (
                <div className="relative flex-1 mx-3 bg-border border-[1px] rounded-full h-px overflow-hidden">
                  <div
                    className={cn(
                      "left-0 absolute inset-y-0 bg-primary rounded-full",
                      "transition-all duration-500 ease-in-out",
                    )}
                    style={{ width: isCompleted ? "100%" : "0%" }}
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
