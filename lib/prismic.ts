import "server-only";

import type { PrismicDocument } from "./types";

class PrismicError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "PrismicError";
  }
}

interface RepositoryResponse {
  refs: Array<{
    ref: string;
    isMasterRef?: boolean;
  }>;
}

interface RawPrismicDocument {
  id: string;
  uid?: string | null;
  type: string;
  lang: string;
  url?: string | null;
  first_publication_date?: string | null;
  last_publication_date?: string | null;
  data: unknown;
}

interface SearchResponse {
  results: RawPrismicDocument[];
}

function getConfig() {
  const repository = process.env.PRISMIC_REPOSITORY;
  const token = process.env.PRISMIC_MASTER_TOKEN;

  if (!repository) {
    throw new PrismicError(500, "PRISMIC_REPOSITORY is not set");
  }
  if (!token) {
    throw new PrismicError(500, "PRISMIC_MASTER_TOKEN is not set");
  }

  return {
    repository,
    token,
    apiEndpoint: `https://${repository}.cdn.prismic.io/api/v2`,
    searchEndpoint: `https://${repository}.cdn.prismic.io/api/v2/documents/search`,
  };
}

async function prismicFetch<T>(url: URL): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new PrismicError(
      res.status,
      `Prismic error (${res.status}): ${text.slice(0, 200)}`,
    );
  }

  return (await res.json()) as T;
}

async function getMasterRef(): Promise<string> {
  const { apiEndpoint, token } = getConfig();
  const url = new URL(apiEndpoint);
  url.searchParams.set("access_token", token);

  const data = await prismicFetch<RepositoryResponse>(url);
  const master = data.refs.find((ref) => ref.isMasterRef) ?? data.refs[0];

  if (!master?.ref) {
    throw new PrismicError(404, "No Prismic master ref found.");
  }

  return master.ref;
}

function toPrismicDocument(doc: RawPrismicDocument): PrismicDocument {
  return {
    id: doc.id,
    uid: doc.uid ?? null,
    type: doc.type,
    lang: doc.lang,
    url: doc.url ?? null,
    firstPublicationDate: doc.first_publication_date ?? null,
    lastPublicationDate: doc.last_publication_date ?? null,
    data: doc.data,
    raw: doc,
  };
}

export { PrismicError };

export async function getPrismicDocument(documentId: string): Promise<PrismicDocument> {
  const { searchEndpoint, token } = getConfig();
  const ref = await getMasterRef();
  const url = new URL(searchEndpoint);

  url.searchParams.set("ref", ref);
  url.searchParams.set("access_token", token);
  url.searchParams.set("q", `[[at(document.id,"${documentId}")]]`);

  const data = await prismicFetch<SearchResponse>(url);
  const doc = data.results[0];

  if (!doc) {
    throw new PrismicError(404, "Prismic document not found.");
  }

  return toPrismicDocument(doc);
}
