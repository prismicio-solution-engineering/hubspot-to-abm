import "server-only";

import { Client } from "@hubspot/api-client";

import type { Company, Contact, HubSpotList, ObjectType } from "./types";

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

const COMPANY_PROPERTIES = [
  "name",
  "domain",
  "phone",
  "address",
  "city",
  "zip",
  "country",
  "industry",
  "numberofemployees",
  "website",
] as const;

const OBJECT_PATH: Record<ObjectType, string> = {
  contact: "contacts",
  company: "companies",
};

const OBJECT_TYPE_FROM_ID: Record<string, ObjectType | undefined> = {
  "0-1": "contact",
  "0-2": "company",
};

export class HubSpotError extends Error {
  constructor(
    public readonly status: number,
    public readonly code:
      | "unauthorized"
      | "not_found"
      | "rate_limited"
      | "unsupported_object_type"
      | "unknown",
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
  if (status === 403) {
    return new HubSpotError(
      403,
      "unauthorized",
      "Scope HubSpot manquant. Vérifie les scopes de la Private App.",
    );
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

function nonEmpty(value: string | null | undefined): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

function toContact(entry: BatchReadResponse["results"][number]): Contact {
  const p = entry.properties;
  return {
    id: entry.id,
    firstname: nonEmpty(p.firstname),
    lastname: nonEmpty(p.lastname),
    email: nonEmpty(p.email),
    phone: nonEmpty(p.phone),
    address: nonEmpty(p.address),
    city: nonEmpty(p.city),
    zip: nonEmpty(p.zip),
    country: nonEmpty(p.country),
    company: nonEmpty(p.company),
    jobtitle: nonEmpty(p.jobtitle),
  };
}

function toCompany(entry: BatchReadResponse["results"][number]): Company {
  const p = entry.properties;
  return {
    id: entry.id,
    name: nonEmpty(p.name),
    domain: nonEmpty(p.domain),
    phone: nonEmpty(p.phone),
    address: nonEmpty(p.address),
    city: nonEmpty(p.city),
    zip: nonEmpty(p.zip),
    country: nonEmpty(p.country),
    industry: nonEmpty(p.industry),
    numberofemployees: nonEmpty(p.numberofemployees),
    website: nonEmpty(p.website),
  };
}

async function batchRead<T>(
  objectType: ObjectType,
  ids: string[],
  properties: readonly string[],
  mapper: (entry: BatchReadResponse["results"][number]) => T,
): Promise<T[]> {
  if (ids.length === 0) return [];
  const out: T[] = [];
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const data = await hubspotRequest<BatchReadResponse>({
      method: "POST",
      path: `/crm/v3/objects/${OBJECT_PATH[objectType]}/batch/read`,
      body: {
        inputs: chunk.map((id) => ({ id })),
        properties,
        propertiesWithHistory: [],
      },
    });
    for (const r of data.results) out.push(mapper(r));
  }
  return out;
}

export async function getContactsForList(listId: string): Promise<Contact[]> {
  const ids = await getListMemberships(listId);
  return batchRead("contact", ids, CONTACT_PROPERTIES, toContact);
}

export async function getCompaniesForList(listId: string): Promise<Company[]> {
  const ids = await getListMemberships(listId);
  return batchRead("company", ids, COMPANY_PROPERTIES, toCompany);
}

interface RawList {
  listId: string;
  name: string;
  objectTypeId: string;
  additionalProperties?: Record<string, string | null | undefined>;
  size?: number;
}

interface ListSearchResponse {
  lists?: RawList[];
  total?: number;
  hasMore?: boolean;
  offset?: number;
}

function extractSize(raw: RawList): number {
  if (typeof raw.size === "number") return raw.size;
  const prop = raw.additionalProperties?.hs_list_size;
  if (typeof prop === "string") {
    const n = Number(prop);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function toHubSpotList(raw: RawList): HubSpotList | null {
  const objectType = OBJECT_TYPE_FROM_ID[raw.objectTypeId];
  if (!objectType) return null;
  return {
    id: raw.listId,
    name: raw.name,
    objectType,
    size: extractSize(raw),
  };
}

export async function listAllLists(): Promise<HubSpotList[]> {
  const collected: HubSpotList[] = [];
  const pageSize = 500;
  let offset: number | undefined;

  while (true) {
    const body: Record<string, unknown> = { count: pageSize };
    if (typeof offset === "number") body.offset = offset;

    const data = await hubspotRequest<ListSearchResponse>({
      method: "POST",
      path: "/crm/v3/lists/search",
      body,
    });

    const batch = data.lists ?? [];
    for (const raw of batch) {
      const item = toHubSpotList(raw);
      if (item) collected.push(item);
    }

    if (data.hasMore !== true) break;
    if (typeof data.offset !== "number") break;
    if (data.offset === offset) break;
    offset = data.offset;
  }

  const dedupedMap = new Map<string, HubSpotList>();
  for (const item of collected) dedupedMap.set(item.id, item);
  return Array.from(dedupedMap.values());
}

interface ListFetchResponse {
  list: RawList;
}

export async function getListMetadata(listId: string): Promise<HubSpotList> {
  const data = await hubspotRequest<ListFetchResponse>({
    method: "GET",
    path: `/crm/v3/lists/${encodeURIComponent(listId)}`,
  });
  const item = toHubSpotList(data.list);
  if (!item) {
    throw new HubSpotError(
      422,
      "unsupported_object_type",
      "Type d'objet non supporté (ni contact, ni company).",
    );
  }
  return item;
}
