"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { CAMPAIGN_STEPS, getStepById, getStepIndex } from "@/lib/campaign-flow";
import type { CampaignStep } from "@/lib/campaign-flow";

type AnimPhase = "idle" | "exit-forward" | "exit-backward" | "between" | "enter-forward" | "enter-backward";

const EXIT_MS = 160;
const BETWEEN_MS = 120;
const ENTER_MS = 280;

export default function CampaignStepRouter() {
  const params = useSearchParams();
  const router = useRouter();
  const stepId = params.get("step");
  const targetStep = stepId ? getStepById(stepId) : undefined;

  const [displayStep, setDisplayStep] = useState<CampaignStep | undefined>(targetStep);
  const [phase, setPhase] = useState<AnimPhase>("idle");
  const prevIndexRef = useRef(targetStep ? getStepIndex(targetStep.id) : 0);
  const pendingRef = useRef<CampaignStep | undefined>(undefined);
  const forwardRef = useRef(true);

  useEffect(() => {
    if (!targetStep) {
      router.replace(`/campaigns/new?step=${CAMPAIGN_STEPS[0].id}`);
      return;
    }

    if (displayStep?.id === targetStep.id) return;

    const prevIndex = prevIndexRef.current;
    const nextIndex = getStepIndex(targetStep.id);
    forwardRef.current = nextIndex > prevIndex;
    prevIndexRef.current = nextIndex;
    pendingRef.current = targetStep;

    setPhase(forwardRef.current ? "exit-forward" : "exit-backward");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetStep?.id]);

  useEffect(() => {
    if (phase !== "exit-forward" && phase !== "exit-backward") return;

    const t = setTimeout(() => setPhase("between"), EXIT_MS);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "between") return;

    const t = setTimeout(() => {
      setDisplayStep(pendingRef.current);
      setPhase(forwardRef.current ? "enter-forward" : "enter-backward");
    }, BETWEEN_MS);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "enter-forward" && phase !== "enter-backward") return;

    const t = setTimeout(() => setPhase("idle"), ENTER_MS);
    return () => clearTimeout(t);
  }, [phase]);

  if (!displayStep) return null;

  const StepComponent = displayStep.Component;
  const isBetween = phase === "between";

  return (
    <div className="relative">
      <div
        className={cn(
          "transition-opacity duration-100",
          isBetween ? "opacity-0 pointer-events-none" : "opacity-100",
          phase === "exit-forward"   && "animate-slide-out-left  pointer-events-none",
          phase === "exit-backward"  && "animate-slide-out-right pointer-events-none",
          phase === "enter-forward"  && "animate-slide-in-right",
          phase === "enter-backward" && "animate-slide-in-left",
        )}
      >
        <h1 className="mb-6 font-semibold text-foreground text-lg">{displayStep.title}</h1>
        <StepComponent />
      </div>

      {isBetween && (
        <div className="absolute inset-0 flex justify-center items-center">
          <Loader2 className="w-12 h-12 text-muted-foreground animate-spin" />
        </div>
      )}
    </div>
  );
}
