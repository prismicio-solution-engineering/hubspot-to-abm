"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useCampaign } from "@/lib/campaign-context";

export default function CampaignInitializer() {
  const params = useSearchParams();
  const { setCampaignMeta } = useCampaign();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    const name = params.get("name") ?? "";
    const context = params.get("context") ?? "";
    if (name) {
      setCampaignMeta(name, context);
      done.current = true;
    }
  }, []);

  return null;
}
