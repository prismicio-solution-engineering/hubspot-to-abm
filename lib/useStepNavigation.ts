"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function useStepNavigation() {
  const router = useRouter();
  const params = useSearchParams();

  function goToStep(stepId: string) {
    const next = new URLSearchParams(params);
    next.set("step", stepId);
    router.push(`/campaigns/new?${next.toString()}`);
  }

  return { goToStep };
}
