import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { buttonVariants } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-foreground">ABM Campaigns</span>
        </div>
        <LogoutButton />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="flex max-w-md flex-col gap-3">
          <h2 className="text-2xl font-semibold text-foreground">
            Generate ABM pages
          </h2>
          <p className="text-sm text-muted-foreground">
            Create personalised ABM pages from HubSpot segments and your Prismic documents.
          </p>
        </div>
        <Link href="/campaigns/new?step=select-prismic-document" className={buttonVariants({ size: "lg" })}>
          Start generating
        </Link>
      </main>
    </div>
  );
}
