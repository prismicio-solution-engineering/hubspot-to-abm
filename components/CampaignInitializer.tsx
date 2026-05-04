"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useCampaignStore } from "@/lib/campaign-store";

interface Props {
  portalId: string;
}

export default function CampaignInitializer({ portalId }: Props) {
  const params = useSearchParams();
  const initCampaign = useCampaignStore((s) => s.initCampaign);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    const id = params.get("id");
    if (id) {
      initCampaign(id, portalId);
      done.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
