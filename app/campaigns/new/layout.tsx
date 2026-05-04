import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import LogoutButton from "@/components/LogoutButton";
import StepIndicator from "@/components/StepIndicator";
import { CampaignProvider } from "@/lib/campaign-context";

export default function CampaignLayout({ children }: { children: ReactNode }) {
  const portalId = process.env.HUBSPOT_PORTAL_ID ?? "";

  return (
    <CampaignProvider portalId={portalId}>
      <div className="flex min-h-screen flex-col bg-background">
        <header className="flex h-14 items-center justify-between border-b border-border px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back</span>
            </Link>
            <span className="text-muted-foreground/40">|</span>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-foreground">New campaign</span>
            </div>
          </div>
          <LogoutButton />
        </header>

        <div className="border-b border-border px-6 py-3">
          <Suspense>
            <StepIndicator />
          </Suspense>
        </div>

        <main className="flex-1 px-6 py-6">
          <div className="mx-auto max-w-4xl">
            {children}
          </div>
        </main>
      </div>
    </CampaignProvider>
  );
}
