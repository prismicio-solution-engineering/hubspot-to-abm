"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";

const PAGES = [
  { bt: "translate(-8px, 10px) rotate(-4deg)", delay: "0s",     z: 1 },
  { bt: "translate(-4px, 5px)  rotate(-2deg)", delay: "-0.8s",  z: 2 },
  { bt: "translate(0px,  0px)  rotate(0deg)",  delay: "-1.6s",  z: 3 },
];

export default function GeneratingModal({ open }: { open: boolean }) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent showClose={false} className="max-w-xs">
        <div className="flex flex-col items-center gap-10 py-4">
          <div className="relative h-36 w-44">
            {PAGES.map(({ bt, delay, z }, i) => (
              <div
                key={i}
                className="absolute inset-0 animate-page-rise rounded-lg border border-border bg-card shadow-md"
                style={{ "--bt": bt, animationDelay: delay, zIndex: z } as React.CSSProperties}
              >
                <div className="flex h-full flex-col gap-2 p-3">
                  <div className="h-2.5 w-2/3 rounded-sm bg-primary/25" />
                  <div className="mt-1 flex flex-1 flex-col gap-1.5">
                    <div className="h-1.5 w-full rounded-sm bg-muted-foreground/15" />
                    <div className="h-1.5 w-5/6 rounded-sm bg-muted-foreground/15" />
                    <div className="h-1.5 w-4/5 rounded-sm bg-muted-foreground/15" />
                    <div className="h-1.5 w-3/4 rounded-sm bg-muted-foreground/15" />
                    <div className="h-1.5 w-full rounded-sm bg-muted-foreground/15" />
                    <div className="h-1.5 w-2/3 rounded-sm bg-muted-foreground/15" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center gap-1.5 text-center">
            <p className="text-base font-semibold text-foreground">Generating pages…</p>
            <p className="text-sm text-muted-foreground">This may take a moment</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
