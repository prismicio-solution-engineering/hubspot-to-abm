import type { Company } from "@/lib/types";

interface Props {
  records: Company[];
  portalId: string;
}

function formatAddress(c: Company): string {
  return [c.address, c.city, c.zip, c.country]
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .join(", ");
}

function websiteHref(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

export default function CompaniesTable({ records, portalId }: Props) {
  return (
    <div className="overflow-x-auto rounded-md border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Domain</th>
            <th className="px-3 py-2">Address</th>
            <th className="px-3 py-2">Industry</th>
            <th className="px-3 py-2">Employees</th>
            <th className="px-3 py-2">Website</th>
            <th className="px-3 py-2 text-right">Open</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {records.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-3 py-2">{c.name ?? "—"}</td>
              <td className="whitespace-nowrap px-3 py-2">{c.domain ?? "—"}</td>
              <td className="px-3 py-2">{formatAddress(c) || "—"}</td>
              <td className="px-3 py-2">{c.industry ?? "—"}</td>
              <td className="whitespace-nowrap px-3 py-2">{c.numberofemployees ?? "—"}</td>
              <td className="px-3 py-2">
                {c.website ? (
                  <a
                    className="text-blue-600 hover:underline"
                    href={websiteHref(c.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {c.website}
                  </a>
                ) : (
                  "—"
                )}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-right">
                <a
                  href={`https://app.hubspot.com/contacts/${portalId}/company/${c.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                  aria-label={`Open ${c.name ?? c.id} in HubSpot`}
                >
                  Open ↗
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
