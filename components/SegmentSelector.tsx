"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import type { Segment } from "@/lib/types";

interface Props {
  segments: readonly Segment[];
  selectedId: string | null;
}

export default function SegmentSelector({ segments, selectedId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("segment", value);
    } else {
      params.delete("segment");
    }
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `/?${qs}` : "/");
    });
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="segment" className="text-sm font-medium text-gray-700">
        Segment
      </label>
      <select
        id="segment"
        value={selectedId ?? ""}
        onChange={onChange}
        disabled={isPending}
        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
      >
        <option value="">— Sélectionner —</option>
        {segments.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
