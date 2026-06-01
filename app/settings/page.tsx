import Link from "next/link";
import { ArrowLeft, SlidersHorizontal } from "lucide-react";

import PrismicConnectionsSettings from "@/components/settings/PrismicConnectionsSettings";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-[72px] items-center justify-between border-border border-b bg-white px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded border border-gray-200 bg-white text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-semibold text-foreground text-base">Settings</h1>
            <p className="text-muted-foreground text-xs">
              Configure repository access and ABM generation context.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-5 px-6 py-6">
        <PrismicConnectionsSettings />

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-foreground text-base">
                ABM context designer
              </h2>
              <p className="mt-1 max-w-2xl text-muted-foreground text-sm">
                Choose which HubSpot company properties the agent can use when writing
                personalized instructions.
              </p>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <SlidersHorizontal className="h-4 w-4" />
            </div>
          </div>
          <Link
            href="/settings/context"
            className="mt-4 inline-flex rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm shadow-sm transition-colors hover:bg-primary/90"
          >
            Open context designer
          </Link>
        </section>
      </main>
    </div>
  );
}
