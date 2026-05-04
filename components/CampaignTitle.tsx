"use client";

import { useSearchParams } from "next/navigation";

export default function CampaignTitle() {
  const params = useSearchParams();
  const name = params.get("name");
  return <span className="text-sm font-semibold text-foreground">{name ?? "New campaign"}</span>;
}
