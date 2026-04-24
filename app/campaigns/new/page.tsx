import { Suspense } from "react";

import CampaignStepRouter from "@/components/CampaignStepRouter";

export default function CampaignPage() {
  return (
    <Suspense>
      <CampaignStepRouter />
    </Suspense>
  );
}
