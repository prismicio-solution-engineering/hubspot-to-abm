import { NextResponse } from "next/server";
import "@/lib/sources";
import { getSource } from "@/lib/contact-source";
import type { ContactSourceId } from "@/lib/types";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ sourceId: string; segmentId: string }> },
) {
  const { sourceId, segmentId } = await ctx.params;
  try {
    const source = getSource(sourceId as ContactSourceId);
    const data = await source.getSegment(segmentId);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
