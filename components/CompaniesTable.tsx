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
    <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
      <table className="min-w-full divide-y divide-border text-sm">
        <thead>
          <tr className="bg-muted/50">
            <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Name</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Domain</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Address</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Industry</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Employees</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Website</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Open</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {records.map((c) => (
            <tr key={c.id} className="transition-colors hover:bg-muted/30">
              <td className="whitespace-nowrap px-4 py-2.5 text-foreground">{c.name ?? "—"}</td>
              <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">{c.domain ?? "—"}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{formatAddress(c) || "—"}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{c.industry ?? "—"}</td>
              <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">{c.numberofemployees ?? "—"}</td>
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
              <td className="whitespace-nowrap px-4 py-2.5 text-right">
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
