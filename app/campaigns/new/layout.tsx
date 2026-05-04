import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import LogoutButton from "@/components/LogoutButton";
import StepIndicator from "@/components/StepIndicator";
import CampaignTitle from "@/components/CampaignTitle";
import CampaignInitializer from "@/components/CampaignInitializer";

export default function CampaignLayout({ children }: { children: ReactNode }) {
  const portalId = process.env.HUBSPOT_PORTAL_ID ?? "";

  return (
      <div className="flex flex-col bg-background min-h-screen">
        <header className="flex justify-between items-center px-6 border-border border-b h-14">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1 bg-white p-2 border border-gray-200 rounded text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="font-semibold text-foreground text-muted-foreground/100 text-sm">                          Campaigns</span>
            <span className="text-muted-foreground/40">|</span>
            <div className="flex items-center gap-2">
              <div className="flex justify-center items-center bg-primary rounded w-6 h-6">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <Suspense fallback={<span className="font-semibold text-foreground text-sm">New campaign</span>}>
                <CampaignTitle />
              </Suspense>
            </div>
          </div>
          <LogoutButton />
        </header>

        <div className="bg-white mx-6 mt-6 px-6 py-3 border border-border rounded-lg">
          <Suspense>
            <StepIndicator />
          </Suspense>
        </div>

        <Suspense>
          <CampaignInitializer portalId={portalId} />
        </Suspense>

        <main className="flex-1 px-6 py-6">
          <div className="mx-auto max-w-8xl">
            {children}
          </div>
        </main>
      </div>
  );
}
