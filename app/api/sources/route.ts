import { NextResponse } from "next/server";
import "@/lib/sources";
import { listSources } from "@/lib/contact-source";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET() {
  const sources = await Promise.all(
    listSources().map(async (s) => ({
      id: s.id,
      label: s.label,
      available: await s.isAvailable(),
    })),
  );
  return NextResponse.json({ sources });
}
