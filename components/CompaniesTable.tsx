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
    <div className="bg-card shadow-sm border border-border rounded-lg overflow-x-auto">
      <table className="divide-y divide-border min-w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            <th className="px-4 py-2.5 font-medium text-muted-foreground text-xs text-left uppercase tracking-wide">Name</th>
            <th className="px-4 py-2.5 font-medium text-muted-foreground text-xs text-left uppercase tracking-wide">Domain</th>
            <th className="px-4 py-2.5 font-medium text-muted-foreground text-xs text-left uppercase tracking-wide">Address</th>
            <th className="px-4 py-2.5 font-medium text-muted-foreground text-xs text-left uppercase tracking-wide">Industry</th>
            <th className="px-4 py-2.5 font-medium text-muted-foreground text-xs text-left uppercase tracking-wide">Employees</th>
            <th className="px-4 py-2.5 font-medium text-muted-foreground text-xs text-left uppercase tracking-wide">Website</th>
            <th className="px-4 py-2.5 font-medium text-muted-foreground text-xs text-right uppercase tracking-wide">Open</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {records.map((c) => (
            <tr key={c.id} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-2.5 text-foreground whitespace-nowrap">{c.name ?? "—"}</td>
              <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{c.domain ?? "—"}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{formatAddress(c) || "—"}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{c.industry ?? "—"}</td>
              <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{c.numberofemployees ?? "—"}</td>
              <td className="px-4 py-2.5">
                {c.website ? (
                  <a
                    className="text-primary hover:underline"
                    href={websiteHref(c.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {c.website}
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-4 py-2.5 text-right whitespace-nowrap">
                <a
                  href={`https://app.hubspot.com/contacts/${portalId}/company/${c.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
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
