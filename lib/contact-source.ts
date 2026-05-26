import "server-only";
import type { ContactSourceId, Segment, UiRecordsResponse } from "./types";

export interface ContactSource {
  id: ContactSourceId;
  label: string;
  /** Whether this source is currently usable (env vars set, mock present, etc.) */
  isAvailable(): Promise<boolean>;
  /** List all segments / campaigns / lists for this source. */
  listSegments(): Promise<Segment[]>;
  /** Get the contacts (or companies) of one segment. */
  getSegment(segmentId: string): Promise<UiRecordsResponse>;
}

const registry = new Map<ContactSourceId, ContactSource>();

export function registerSource(source: ContactSource) {
  registry.set(source.id, source);
}

export function getSource(id: ContactSourceId): ContactSource {
  const s = registry.get(id);
  if (!s) throw new Error(`Unknown contact source: ${id}`);
  return s;
}

export function listSources(): ContactSource[] {
  return Array.from(registry.values());
}
