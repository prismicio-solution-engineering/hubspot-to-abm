export interface PrismicConnection {
  id: string;
  label: string;
  repository: string;
  masterToken: string;
  writeToken: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "abm_prismic_connections_v1";

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

function normalizeConnection(value: unknown): PrismicConnection | null {
  const item = value as Partial<PrismicConnection> | null;
  if (
    !item ||
    typeof item.id !== "string" ||
    typeof item.label !== "string" ||
    typeof item.repository !== "string" ||
    typeof item.masterToken !== "string" ||
    typeof item.writeToken !== "string"
  ) {
    return null;
  }

  return {
    id: item.id,
    label: item.label,
    repository: item.repository,
    masterToken: item.masterToken,
    writeToken: item.writeToken,
    createdAt: item.createdAt ?? new Date().toISOString(),
    updatedAt: item.updatedAt ?? new Date().toISOString(),
  };
}

function persist(connections: PrismicConnection[]): void {
  getStorage()?.setItem(STORAGE_KEY, JSON.stringify(connections));
}

export function getPrismicConnections(): PrismicConnection[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = JSON.parse(storage.getItem(STORAGE_KEY) ?? "[]") as unknown[];
    if (!Array.isArray(raw)) return [];
    return raw
      .map(normalizeConnection)
      .filter((connection): connection is PrismicConnection => connection !== null);
  } catch {
    return [];
  }
}

export function getPrismicConnection(id: string | null | undefined): PrismicConnection | null {
  if (!id) return null;
  return getPrismicConnections().find((connection) => connection.id === id) ?? null;
}

export function savePrismicConnection(
  input: Pick<PrismicConnection, "label" | "repository" | "masterToken" | "writeToken"> & {
    id?: string;
  },
): PrismicConnection {
  const now = new Date().toISOString();
  const connections = getPrismicConnections();
  const existing = input.id
    ? connections.find((connection) => connection.id === input.id)
    : null;
  const id =
    input.id ??
    (`${input.repository}-${input.label}`
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") ||
      crypto.randomUUID());

  const next: PrismicConnection = {
    id,
    label: input.label.trim(),
    repository: input.repository.trim(),
    masterToken: input.masterToken.trim(),
    writeToken: input.writeToken.trim(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  persist([next, ...connections.filter((connection) => connection.id !== next.id)]);
  return next;
}

export function deletePrismicConnection(id: string): void {
  persist(getPrismicConnections().filter((connection) => connection.id !== id));
}
