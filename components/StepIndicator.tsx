"use client";

import { useSearchParams } from "next/navigation";

import { CAMPAIGN_STEPS, getStepIndex } from "@/lib/campaign-flow";

export default function StepIndicator() {
  const params = useSearchParams();
  const currentId = params.get("step") ?? CAMPAIGN_STEPS[0].id;
  const currentIndex = Math.max(0, getStepIndex(currentId));

  return (
    <nav aria-label="Campaign steps">
      <ol className="flex items-center">
        {CAMPAIGN_STEPS.map((step, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isLast = i === CAMPAIGN_STEPS.length - 1;

          const circleClass = isCompleted
            ? "bg-blue-600 border-blue-600 text-white"
            : isCurrent
              ? "bg-blue-600 border-blue-600 text-white"
              : "bg-white border-gray-300 text-gray-400";

          const labelClass = isCurrent
            ? "text-blue-700 font-semibold"
            : isCompleted
              ? "text-gray-700"
              : "text-gray-400";

          const connectorClass = isCompleted ? "bg-blue-600" : "bg-gray-200";

          return (
            <li
              key={step.id}
              className={`flex items-center ${isLast ? "" : "flex-1"}`}
            >
              <div className="flex flex-col items-center gap-1.5">
                <div
                  aria-current={isCurrent ? "step" : undefined}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold ${circleClass}`}
                >
                  {isCompleted ? (
                    <svg
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 011.42-1.42l2.79 2.79 6.79-6.79a1 1 0 011.42 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>
                <span className={`text-xs ${labelClass}`}>{step.label}</span>
              </div>
              {!isLast && (
                <div
                  aria-hidden="true"
                  className={`mx-2 h-0.5 flex-1 ${connectorClass}`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
