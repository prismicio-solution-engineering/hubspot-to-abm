import ListResultsPanel from "@/components/ListResultsPanel";
import ListSearch from "@/components/ListSearch";
import LogoutButton from "@/components/LogoutButton";

interface Props {
  searchParams: Promise<{ listId?: string }>;
}

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams;
  const listId =
    params.listId && /^\d+$/.test(params.listId) ? params.listId : null;
  const portalId = process.env.HUBSPOT_PORTAL_ID ?? "";

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-6">
      <header className="flex items-center justify-between border-b border-gray-200 pb-4">
        <h1 className="text-lg font-semibold text-gray-900">
          HubSpot Segments Viewer
        </h1>
        <LogoutButton />
      </header>

      <ListSearch />

      <ListResultsPanel listId={listId} portalId={portalId} />
    </div>
  );
}
