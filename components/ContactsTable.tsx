import type { Contact } from "@/lib/types";

interface Props {
  records: Contact[];
  portalId: string;
}

function formatAddress(c: Contact): string {
  return [c.address, c.city, c.zip, c.country]
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .join(", ");
}

function displayName(c: Contact): string {
  return [c.firstname, c.lastname].filter(Boolean).join(" ") || "—";
}

export default function ContactsTable({ records, portalId }: Props) {
  return (
    <div className="overflow-x-auto rounded-md border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-3 py-2">Prénom</th>
            <th className="px-3 py-2">Nom</th>
            <th className="px-3 py-2">Email</th>
            <th className="px-3 py-2">Téléphone</th>
            <th className="px-3 py-2">Adresse</th>
            <th className="px-3 py-2">Entreprise</th>
            <th className="px-3 py-2">Poste</th>
            <th className="px-3 py-2 text-right">Ouvrir</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {records.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-3 py-2">{c.firstname ?? "—"}</td>
              <td className="whitespace-nowrap px-3 py-2">{c.lastname ?? "—"}</td>
              <td className="px-3 py-2">
                {c.email ? (
                  <a className="text-blue-600 hover:underline" href={`mailto:${c.email}`}>
                    {c.email}
                  </a>
                ) : (
                  "—"
                )}
              </td>
              <td className="whitespace-nowrap px-3 py-2">{c.phone ?? "—"}</td>
              <td className="px-3 py-2">{formatAddress(c) || "—"}</td>
              <td className="px-3 py-2">{c.company ?? "—"}</td>
              <td className="px-3 py-2">{c.jobtitle ?? "—"}</td>
              <td className="whitespace-nowrap px-3 py-2 text-right">
                <a
                  href={`https://app.hubspot.com/contacts/${portalId}/contact/${c.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                  aria-label={`Ouvrir ${displayName(c)} dans HubSpot`}
                >
                  Ouvrir ↗
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
