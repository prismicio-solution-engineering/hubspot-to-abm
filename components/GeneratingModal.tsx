"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const PHRASES = [
  "Reading CRM…",
  "Thinking…",
  "Writing personalization instructions…",
];

const PAGES = [
  { bt: "translate(-8px, 10px) rotate(-4deg)", delay: "0s",     z: 1 },
  { bt: "translate(-4px, 5px)  rotate(-2deg)", delay: "-0.8s",  z: 2 },
  { bt: "translate(0px,  0px)  rotate(0deg)",  delay: "-1.6s",  z: 3 },
];

export default function GeneratingModal({ open }: { open: boolean }) {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    if (!open) {
      setPhraseIndex(0);
      return;
    }
    const t = setTimeout(
      () => setPhraseIndex((i) => (i + 1) % PHRASES.length),
      1800,
    );
    return () => clearTimeout(t);
  }, [phraseIndex, open]);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent showClose={false} className="max-w-sm">
        <div className="flex flex-col items-center gap-10 py-4">
          <div className="relative w-44 h-36">
            {PAGES.map(({ bt, delay, z }, i) => (
              <div
                key={i}
                className="absolute inset-0 bg-card shadow-md border border-border rounded-lg animate-page-rise"
                style={{ "--bt": bt, animationDelay: delay, zIndex: z } as React.CSSProperties}
              >
                <div className="flex flex-col gap-2 p-3 h-full">
                  <div className="bg-primary/25 rounded-sm w-2/3 h-2.5" />
                  <div className="flex flex-col flex-1 gap-1.5 mt-1">
                    <div className="bg-muted-foreground/15 rounded-sm w-full h-1.5" />
                    <div className="bg-muted-foreground/15 rounded-sm w-5/6 h-1.5" />
                    <div className="bg-muted-foreground/15 rounded-sm w-4/5 h-1.5" />
                    <div className="bg-muted-foreground/15 rounded-sm w-3/4 h-1.5" />
                    <div className="bg-muted-foreground/15 rounded-sm w-full h-1.5" />
                    <div className="bg-muted-foreground/15 rounded-sm w-2/3 h-1.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center gap-1.5 text-center overflow-hidden">
            <p key={phraseIndex} className="animate-slide-in-right font-semibold text-foreground text-base">
              {PHRASES[phraseIndex]}
            </p>
            <p className="text-muted-foreground text-sm">This may take a moment</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
