import "server-only";

import { Client } from "@hubspot/api-client";

import type { Contact } from "./types";

const CONTACT_PROPERTIES = [
  "firstname",
  "lastname",
  "email",
  "phone",
  "address",
  "city",
  "zip",
  "country",
  "company",
  "jobtitle",
] as const;

export class HubSpotError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: "unauthorized" | "not_found" | "rate_limited" | "unknown",
    message: string,
  ) {
    super(message);
    this.name = "HubSpotError";
  }
}

let cachedClient: Client | null = null;
function getClient(): Client {
  if (cachedClient) return cachedClient;
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!accessToken) {
    throw new HubSpotError(500, "unknown", "HUBSPOT_ACCESS_TOKEN is not set");
  }
  cachedClient = new Client({ accessToken });
  return cachedClient;
}

function translateError(status: number, body: string): HubSpotError {
  if (status === 401) {
    return new HubSpotError(401, "unauthorized", "Token HubSpot invalide ou expiré.");
  }
  if (status === 404) {
    return new HubSpotError(404, "not_found", "Liste HubSpot introuvable.");
  }
  if (status === 429) {
    return new HubSpotError(
      429,
      "rate_limited",
      "Limite de taux HubSpot atteinte, réessayez dans un instant.",
    );
  }
  return new HubSpotError(
    status,
    "unknown",
    `Erreur HubSpot (${status}): ${body.slice(0, 200)}`,
  );
}

interface RequestOptions {
  method: "GET" | "POST";
  path: string;
  qs?: Record<string, string>;
  body?: unknown;
}

async function hubspotRequest<T>({ method, path, qs, body }: RequestOptions): Promise<T> {
  const client = getClient();
  try {
    const response = await client.apiRequest({
      method,
      path,
      qs,
      body,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw translateError(response.status, text);
    }

    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof HubSpotError) throw err;
    const maybe = err as { code?: number; message?: string; body?: string };
    if (typeof maybe.code === "number") {
      throw translateError(maybe.code, maybe.body ?? maybe.message ?? "");
    }
    throw new HubSpotError(
      500,
      "unknown",
      err instanceof Error ? err.message : "Erreur inconnue.",
    );
  }
}

interface MembershipsResponse {
  results: Array<{ recordId: string }>;
  paging?: { next?: { after: string } };
}

async function getListMemberships(listId: string): Promise<string[]> {
  const ids: string[] = [];
  let after: string | undefined;

  do {
    const qs: Record<string, string> = { limit: "100" };
    if (after) qs.after = after;
    const data = await hubspotRequest<MembershipsResponse>({
      method: "GET",
      path: `/crm/v3/lists/${encodeURIComponent(listId)}/memberships`,
      qs,
    });
    for (const r of data.results) ids.push(r.recordId);
    after = data.paging?.next?.after;
  } while (after);

  return ids;
}

interface BatchReadResponse {
  results: Array<{
    id: string;
    properties: Record<string, string | null>;
  }>;
}

function toContact(entry: BatchReadResponse["results"][number]): Contact {
  const p = entry.properties;
  return {
    id: entry.id,
    firstname: p.firstname ?? null,
    lastname: p.lastname ?? null,
    email: p.email ?? null,
    phone: p.phone ?? null,
    address: p.address ?? null,
    city: p.city ?? null,
    zip: p.zip ?? null,
    country: p.country ?? null,
    company: p.company ?? null,
    jobtitle: p.jobtitle ?? null,
  };
}

async function batchReadContacts(ids: string[]): Promise<Contact[]> {
  if (ids.length === 0) return [];

  const contacts: Contact[] = [];
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const data = await hubspotRequest<BatchReadResponse>({
      method: "POST",
      path: "/crm/v3/objects/contacts/batch/read",
      body: {
        inputs: chunk.map((id) => ({ id })),
        properties: CONTACT_PROPERTIES,
        propertiesWithHistory: [],
      },
    });
    for (const r of data.results) contacts.push(toContact(r));
  }
  return contacts;
}

export async function getContactsForSegment(listId: string): Promise<Contact[]> {
  const ids = await getListMemberships(listId);
  return batchReadContacts(ids);
}
