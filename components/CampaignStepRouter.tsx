"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { CAMPAIGN_STEPS, getStepById } from "@/lib/campaign-flow";

export default function CampaignStepRouter() {
  const params = useSearchParams();
  const router = useRouter();
  const stepId = params.get("step");
  const step = stepId ? getStepById(stepId) : undefined;

  useEffect(() => {
    if (!step) {
      router.replace(`/campaigns/new?step=${CAMPAIGN_STEPS[0].id}`);
    }
  }, [step, router]);

  if (!step) return null;

  const StepComponent = step.Component;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">{step.title}</h1>
      <div className="mt-6">
        <StepComponent />
      </div>
    </div>
  );
}
