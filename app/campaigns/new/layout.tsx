import { Suspense, type ReactNode } from "react";

import LogoutButton from "@/components/LogoutButton";
import StepIndicator from "@/components/StepIndicator";
import { CampaignProvider } from "@/lib/campaign-context";

export default function CampaignLayout({ children }: { children: ReactNode }) {
  const portalId = process.env.HUBSPOT_PORTAL_ID ?? "";

  return (
    <CampaignProvider portalId={portalId}>
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-6">
        <header className="flex items-center justify-between border-b border-gray-200 pb-4">
          <h1 className="text-lg font-semibold text-gray-900">ABM Campaigns</h1>
          <LogoutButton />
        </header>

        <Suspense>
          <StepIndicator />
        </Suspense>

        <div className="mt-2">{children}</div>
      </div>
    </CampaignProvider>
  );
}
