"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createCampaign } from "@/lib/campaigns-store";

interface Props {
  onCreated?: () => void;
}

export default function NewCampaignDialog({ onCreated }: Props = {}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [context, setContext] = useState("");

  function handleCreate() {
    if (!name.trim()) return;
    const id = crypto.randomUUID();
    createCampaign({ id, name: name.trim(), createdAt: new Date().toISOString() });
    onCreated?.();
    const params = new URLSearchParams({ step: "select-prismic-document", name: name.trim(), id });
    if (context.trim()) params.set("context", context.trim());
    router.push(`/campaigns/new?${params.toString()}`);
  }

  function handleOpen() {
    setName("");
    setContext("");
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={buttonVariants({ size: "sm" })}
      >
        <PlusCircle className="w-4 h-4" />
        Create a campaign
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)}>
          <DialogHeader>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="flex justify-center items-center bg-primary rounded-lg w-8 h-8">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <DialogTitle className="text-lg">New Campaign</DialogTitle>
            </div>
          </DialogHeader>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="font-medium text-foreground text-sm" htmlFor="campaign-name">
                Campaign Name
              </label>
              <Input
                id="campaign-name"
                placeholder="e.g. Q3 2025 Enterprise Accounts"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
              />
              <p className="text-muted-foreground text-xs">
                Give your campaign a clear, descriptive name to identify it in the list.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-medium text-foreground text-sm" htmlFor="campaign-context">
                Campaign Context{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <Textarea
                id="campaign-context"
                placeholder="e.g. Targeting mid-market companies in the DACH region who recently raised Series B funding. Focus on reducing time-to-value and integration with existing ERP systems."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="min-h-[100px] resize-none"
              />
              <p className="text-muted-foreground text-xs">
                Describe what this campaign is about — the page personalization agent will use this context when crafting content for each account.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!name.trim()}>
              Create Campaign
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
