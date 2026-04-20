export const SEGMENTS = [
  { id: "6687", label: "2026 MarTech Paris" },
  { id: "6637", label: "ABM forum event 26.03.26 - BDR sequence" },
] as const;

export type SegmentId = (typeof SEGMENTS)[number]["id"];

export function isValidSegmentId(id: string): id is SegmentId {
  return SEGMENTS.some((s) => s.id === id);
}
