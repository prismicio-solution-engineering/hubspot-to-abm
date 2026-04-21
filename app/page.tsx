import Link from "next/link";

import LogoutButton from "@/components/LogoutButton";

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6">
      <header className="flex items-center justify-between border-b border-gray-200 pb-4">
        <h1 className="text-lg font-semibold text-gray-900">ABM Campaigns</h1>
        <LogoutButton />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <div className="flex max-w-2xl flex-col gap-3">
          <h2 className="text-3xl font-semibold text-gray-900">
            ABM Campaigns
          </h2>
          <p className="text-base text-gray-600">
            Create your first campaign to start generating personalised ABM
            pages from HubSpot segments.
          </p>
        </div>

        <Link
          href="/campaigns/new?step=select-segment"
          className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          Start generating
        </Link>
      </main>
    </div>
  );
}
