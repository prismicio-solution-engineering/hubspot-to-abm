import ContactsTable from "@/components/ContactsTable";
import LogoutButton from "@/components/LogoutButton";
import SegmentSelector from "@/components/SegmentSelector";
import { SEGMENTS, isValidSegmentId } from "@/config/segments";

interface Props {
  searchParams: Promise<{ segment?: string }>;
}

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams;
  const raw = params.segment;
  const selectedId = raw && isValidSegmentId(raw) ? raw : null;
  const portalId = process.env.HUBSPOT_PORTAL_ID ?? "";

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-6">
      <header className="flex items-center justify-between border-b border-gray-200 pb-4">
        <h1 className="text-lg font-semibold text-gray-900">HubSpot Segments</h1>
        <LogoutButton />
      </header>

      <SegmentSelector segments={SEGMENTS} selectedId={selectedId} />

      <ContactsTable segmentId={selectedId} portalId={portalId} />
    </div>
  );
}
