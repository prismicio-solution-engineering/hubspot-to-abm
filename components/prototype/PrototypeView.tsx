"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  ExternalLink,
  MonitorPlay,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SegmentCombobox from "@/components/SegmentCombobox";
import AccountsModal from "./AccountsModal";
import {
  DEMO_SHOWCASES,
  createDemoShowcase,
  getDefaultDemoShowcase,
  type DemoShowcase,
} from "@/lib/demo-showcase";
import type {
  HubSpotList,
  Contact,
  Company,
  RecordsResponse,
  GeneratePagesContact,
  GeneratePagesPayload,
  RecommendationResponse,
  PrismicGenerationResult,
} from "@/lib/types";

type Step =
  | "idle"
  | "segment_selecting"
  | "loading_contacts"
  | "accounts_modal"
  | "generating_recommendations"
  | "generating_pages"
  | "done";

interface GenerationResult {
  releaseName: string;
  releaseUrl: string;
  successCount: number;
  total: number;
}

interface ChatMessage {
  role: "ai" | "user";
  text: string;
  generationResult?: GenerationResult;
}

interface GenState {
  releaseName: string;
  total: number;
  fakeProgress: number;
}

interface DemoFormState {
  name: string;
  documentLabel: string;
  repository: string;
  baselineDocumentId: string;
  documentUid: string;
  customType: string;
  lang: string;
  previewUrl: string;
  canEmbedPreview: boolean;
  releasePrefix: string;
}

const CUSTOM_DEMO_STORAGE_KEY = "abm_prototype_custom_demo_v1";

function toGeneratePagesContact(
  record: Contact | Company,
  type: "contact" | "company",
): GeneratePagesContact {
  if (type === "contact") {
    const c = record as Contact;
    return {
      id: c.id,
      firstName: c.firstname,
      lastName: c.lastname,
      company: c.associatedCompany?.name ?? c.company,
      companyDomain: c.associatedCompany?.domain,
      companyIndustry: c.associatedCompany?.industry,
      jobTitle: c.jobtitle,
      associatedCompany: c.associatedCompany,
    };
  }
  const co = record as Company;
  return {
    id: co.id,
    company: co.name,
    companyDomain: co.domain,
    companyIndustry: co.industry,
  };
}

function demoToFormState(demo: DemoShowcase): DemoFormState {
  return {
    name: demo.name,
    documentLabel: demo.documentLabel,
    repository: demo.repository,
    baselineDocumentId: demo.baselineDocumentId,
    documentUid: demo.documentUid ?? "",
    customType: demo.customType,
    lang: demo.lang,
    previewUrl: demo.previewUrl,
    canEmbedPreview: demo.canEmbedPreview,
    releasePrefix: demo.releasePrefix,
  };
}

function loadCustomDemo(): DemoShowcase | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CUSTOM_DEMO_STORAGE_KEY);
    if (!raw) return null;
    return createDemoShowcase(JSON.parse(raw) as DemoFormState);
  } catch {
    return null;
  }
}

function saveCustomDemo(form: DemoFormState): DemoShowcase {
  const isBuilderUrl = isPrismicBuilderUrl(form.previewUrl);
  const demo = createDemoShowcase({
    ...form,
    canEmbedPreview: isBuilderUrl ? false : form.canEmbedPreview,
    id: "custom-demo",
    editedLabel: "Custom demo",
  });
  localStorage.setItem(
    CUSTOM_DEMO_STORAGE_KEY,
    JSON.stringify({ ...form, canEmbedPreview: isBuilderUrl ? false : form.canEmbedPreview }),
  );
  return demo;
}

function isPrismicBuilderUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.endsWith(".prismic.io") && parsed.pathname.includes("/builder/");
  } catch {
    return false;
  }
}

export default function PrototypeView() {
  const [selectedDemo, setSelectedDemo] = useState<DemoShowcase>(
    getDefaultDemoShowcase(),
  );
  const [isDemoMenuOpen, setIsDemoMenuOpen] = useState(false);
  const [isDemoDialogOpen, setIsDemoDialogOpen] = useState(false);
  const [customDemo, setCustomDemo] = useState<DemoShowcase | null>(null);
  const [step, setStep] = useState<Step>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "ai",
      text: `Hi! I'm connected to the ${getDefaultDemoShowcase().documentLabel} demo page. I can help you create personalized variations of this page for your ABM campaigns.`,
    },
  ]);
  const [selectedSegment, setSelectedSegment] = useState<HubSpotList | null>(null);
  const [records, setRecords] = useState<(Contact | Company)[]>([]);
  const [recordType, setRecordType] = useState<"contact" | "company">("contact");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [genState, setGenState] = useState<GenState | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, step, genState]);

  useEffect(() => {
    const saved = loadCustomDemo();
    if (!saved) return;
    setCustomDemo(saved);
    setSelectedDemo(saved);
    setMessages([
      {
        role: "ai",
        text: `Demo restored: ${saved.documentLabel}. I'm connected to this Prismic document and ready to run the ABM flow on it.`,
      },
    ]);
  }, []);

  // Increment fake progress counter during page generation
  useEffect(() => {
    if (step !== "generating_pages" || !genState) return;
    if (genState.fakeProgress >= genState.total - 1) return;
    const t = setTimeout(() => {
      setGenState((prev) =>
        prev ? { ...prev, fakeProgress: Math.min(prev.fakeProgress + 1, prev.total - 1) } : prev,
      );
    }, 2200);
    return () => clearTimeout(t);
  }, [step, genState]);

  function push(msg: ChatMessage) {
    setMessages((prev) => [...prev, msg]);
  }

  function handleDemoSelected(demo: DemoShowcase) {
    setSelectedDemo(demo);
    setIsDemoMenuOpen(false);
    setStep("idle");
    setSelectedSegment(null);
    setRecords([]);
    setRecordType("contact");
    setIsModalOpen(false);
    setGenState(null);
    setMessages([
      {
        role: "ai",
        text: `Demo switched to ${demo.documentLabel}. I'm connected to this Prismic document and ready to run the ABM flow on it.`,
      },
    ]);
  }

  function handleDemoSaved(form: DemoFormState) {
    const demo = saveCustomDemo(form);
    setCustomDemo(demo);
    setIsDemoDialogOpen(false);
    handleDemoSelected(demo);
  }

  function handleActionClick() {
    push({ role: "user", text: `Personalize ${selectedDemo.documentLabel}` });
    push({
      role: "ai",
      text: "Sure! Select the HubSpot segment you'd like to personalize this page for:",
    });
    setStep("segment_selecting");
  }

  async function handleSegmentSelected(segment: HubSpotList) {
    setSelectedSegment(segment);
    push({ role: "user", text: segment.name });
    push({ role: "ai", text: `Loading accounts from "${segment.name}"…` });
    setStep("loading_contacts");

    try {
      const res = await fetch(`/api/segments/${segment.id}`);
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as RecordsResponse;
      setSelectedSegment({ ...segment, size: data.records.length });
      setRecords(data.records);
      setRecordType(data.type);
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "ai",
          text: `Found ${data.records.length} account${data.records.length !== 1 ? "s" : ""} in "${segment.name}". Select which ones you'd like to create personalized pages for:`,
        };
        return next;
      });
      setStep("accounts_modal");
      setIsModalOpen(true);
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "ai",
          text: "Sorry, I couldn't load accounts for that segment. Please try again.",
        };
        return next;
      });
      setStep("segment_selecting");
    }
  }

  async function handleConfirm(selectedRecords: (Contact | Company)[]) {
    setIsModalOpen(false);
    const count = selectedRecords.length;
    const releaseName = `${selectedDemo.releasePrefix} - ${selectedSegment!.name}`;

    push({ role: "user", text: `Generate for ${count} account${count !== 1 ? "s" : ""}` });
    setGenState({ releaseName, total: count, fakeProgress: 0 });
    setStep("generating_recommendations");

    try {
      const contacts = selectedRecords.map((r) => toGeneratePagesContact(r, recordType));

      const payload: GeneratePagesPayload = {
        version: "1.0",
        generatedAt: new Date().toISOString(),
        demoId: selectedDemo.id,
        demoRepository: selectedDemo.repository,
        target: {
          type: "prismic_document",
          documentId: selectedDemo.baselineDocumentId,
          uid: selectedDemo.documentUid,
          customType: selectedDemo.customType,
          lang: selectedDemo.lang,
        },
        source: {
          type: "hubspot_list",
          listId: selectedSegment!.id,
          listName: selectedSegment!.name,
        },
        contacts,
      };

      const recsRes = await fetch("/api/generate-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!recsRes.ok) {
        const err = (await recsRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? `Request failed (${recsRes.status})`);
      }

      const { recommendation } = (await recsRes.json()) as {
        recommendation: RecommendationResponse;
        openAIResponseId: string;
      };

      setGenState((prev) => (prev ? { ...prev, fakeProgress: 0 } : prev));
      setStep("generating_pages");

      const pagesRes = await fetch("/api/prismic/generate-abm-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          demoId: selectedDemo.id,
          demoRepository: selectedDemo.repository,
          releaseName,
          baselineDocumentID: selectedDemo.baselineDocumentId,
          recommendationItems: recommendation.recommendationItems,
        }),
      });

      if (!pagesRes.ok) {
        const err = (await pagesRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? `Request failed (${pagesRes.status})`);
      }

      const result = (await pagesRes.json()) as PrismicGenerationResult;
      const successCount = result.items.filter((i) => i.ok).length;

      push({
        role: "ai",
        text: "",
        generationResult: {
          releaseName,
          releaseUrl: result.release.url,
          successCount,
          total: result.items.length,
        },
      });
    } catch (err) {
      push({
        role: "ai",
        text: `Something went wrong: ${err instanceof Error ? err.message : "Unknown error"}. Please try again.`,
      });
    } finally {
      setStep("done");
      setGenState(null);
    }
  }

  function handleModalClose() {
    setIsModalOpen(false);
    setStep("accounts_modal");
  }

  const isGenerating =
    step === "generating_recommendations" || step === "generating_pages";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Left: AI chat panel */}
      <div className="w-[360px] shrink-0 flex flex-col border-r border-border bg-white">
        <div className="flex items-center justify-between px-4 h-11 border-b border-border shrink-0">
          <span className="text-sm font-semibold text-foreground">AI Agent</span>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "ai" ? (
                <div className="flex items-start gap-2 max-w-[280px]">
                  <AiAvatar />
                  <div className="bg-[#f4f2f8] text-foreground text-sm rounded-2xl rounded-tl-sm px-3 py-2 leading-relaxed">
                    {msg.generationResult ? (
                      <GenerationResultCard result={msg.generationResult} />
                    ) : (
                      msg.text
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-primary text-primary-foreground text-sm rounded-2xl rounded-tr-sm px-3 py-2 max-w-[240px] leading-relaxed">
                  {msg.text}
                </div>
              )}
            </div>
          ))}

          {/* Inline generation status */}
          {isGenerating && genState && (
            <div className="flex items-start gap-2 max-w-[280px]">
              <AiAvatar />
              <div className="bg-[#f4f2f8] text-foreground text-sm rounded-2xl rounded-tl-sm px-3 py-2 leading-relaxed flex flex-col gap-2">
                {step === "generating_recommendations" ? (
                  <>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Spinner />
                      Step 1 of 2
                    </div>
                    <span>
                      Analyzing {genState.total} account{genState.total !== 1 ? "s" : ""} and
                      crafting personalization instructions…
                    </span>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="text-green-600">✓</span> Instructions ready
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Spinner />
                      Step 2 of 2
                    </div>
                    <span>
                      Creating pages — {genState.fakeProgress}/{genState.total}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {step === "idle" && (
            <button
              type="button"
              onClick={handleActionClick}
              className="self-start mt-1 flex items-center gap-2 px-3 py-2 rounded-xl border border-primary/20 bg-primary/5 text-primary text-xs font-medium hover:bg-primary/10 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Personalize for a HubSpot Segment
            </button>
          )}

          {step === "segment_selecting" && (
            <div className="w-full mt-1">
              <SegmentCombobox onSegmentSelected={handleSegmentSelected} />
            </div>
          )}

          {step === "loading_contacts" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
              <Spinner />
              Loading accounts…
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="shrink-0 px-3 py-3 border-t border-border">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2">
            <input
              type="text"
              placeholder="Ask AI to improve content…"
              className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
              disabled
            />
            <button type="button" className="text-muted-foreground">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Right: page preview */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="shrink-0 flex items-center gap-3 px-4 h-11 border-b border-border bg-white">
          <span className="text-sm font-semibold text-foreground">
            {selectedDemo.documentLabel}
          </span>
          <span className="text-xs text-muted-foreground">{selectedDemo.editedLabel}</span>
          <div className="h-4 w-px bg-border mx-1" />
          <div className="flex items-center text-xs">
            <button className="px-2 py-0.5 font-medium text-primary border-b border-primary">
              Edit
            </button>
            <button className="px-2 py-0.5 text-muted-foreground hover:text-foreground">
              Comment
            </button>
          </div>
          <div className="flex items-center gap-1.5 bg-muted rounded px-2.5 py-1 text-xs text-muted-foreground max-w-xs ml-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
            <span className="truncate">
              {selectedDemo.previewUrl || selectedDemo.repository}
            </span>
          </div>
          <div className="ml-auto">
            <DemoMenu
              selectedDemo={selectedDemo}
              customDemo={customDemo}
              open={isDemoMenuOpen}
              onOpenChange={setIsDemoMenuOpen}
              onSelect={handleDemoSelected}
              onConfigure={() => {
                setIsDemoMenuOpen(false);
                setIsDemoDialogOpen(true);
              }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <DemoPreview demo={selectedDemo} />
        </div>
      </div>

      {isModalOpen && selectedSegment && (
        <AccountsModal
          segment={selectedSegment}
          records={records}
          type={recordType}
          onConfirm={handleConfirm}
          onClose={handleModalClose}
        />
      )}
      <DemoSetupDialog
        open={isDemoDialogOpen}
        initialDemo={selectedDemo}
        onOpenChange={setIsDemoDialogOpen}
        onSave={handleDemoSaved}
      />
    </div>
  );
}

function DemoMenu({
  selectedDemo,
  customDemo,
  open,
  onOpenChange,
  onSelect,
  onConfigure,
}: {
  selectedDemo: DemoShowcase;
  customDemo: DemoShowcase | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (demo: DemoShowcase) => void;
  onConfigure: () => void;
}) {
  const demos = customDemo ? [...DEMO_SHOWCASES, customDemo] : DEMO_SHOWCASES;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="flex items-center gap-1.5 bg-primary px-3 py-1.5 rounded-md font-medium text-primary-foreground text-xs hover:bg-primary/90 transition-colors"
      >
        <MonitorPlay className="w-3.5 h-3.5" />
        Demo
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="top-full right-0 z-50 absolute bg-card shadow-lg mt-1 border border-border rounded-md min-w-[260px] overflow-hidden">
          {demos.map((demo) => (
            <button
              key={demo.id}
              type="button"
              onClick={() => onSelect(demo)}
              className={`flex flex-col gap-0.5 hover:bg-muted px-3 py-2 w-full text-left transition-colors ${
                selectedDemo.id === demo.id ? "bg-accent" : ""
              }`}
            >
              <span className="font-medium text-foreground text-sm">{demo.name}</span>
              <span className="text-muted-foreground text-xs truncate">
                {demo.documentLabel}
              </span>
            </button>
          ))}
          <div className="border-border border-t p-1">
            <button
              type="button"
              onClick={onConfigure}
              className="flex items-center gap-2 hover:bg-muted px-2 py-2 rounded w-full font-medium text-primary text-sm transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Configure demo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DemoSetupDialog({
  open,
  initialDemo,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  initialDemo: DemoShowcase;
  onOpenChange: (open: boolean) => void;
  onSave: (form: DemoFormState) => void;
}) {
  const [form, setForm] = useState<DemoFormState>(() => demoToFormState(initialDemo));
  const isValid =
    form.name.trim().length > 0 &&
    form.documentLabel.trim().length > 0 &&
    form.repository.trim().length > 0 &&
    form.baselineDocumentId.trim().length > 0 &&
    form.customType.trim().length > 0 &&
    form.lang.trim().length > 0 &&
    form.releasePrefix.trim().length > 0;
  const previewIsBuilderUrl = isPrismicBuilderUrl(form.previewUrl);

  useEffect(() => {
    if (open) setForm(demoToFormState(initialDemo));
  }, [initialDemo, open]);

  function update<K extends keyof DemoFormState>(key: K, value: DemoFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!isValid) return;
    onSave(form);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Configure demo</DialogTitle>
            <DialogDescription>
              Connect the prototype to a Prismic base document and optional page preview.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <DemoField
              label="Demo name"
              value={form.name}
              onChange={(value) => update("name", value)}
              placeholder="Martech Madrid"
            />
            <DemoField
              label="Release prefix"
              value={form.releasePrefix}
              onChange={(value) => update("releasePrefix", value)}
              placeholder="Martech Madrid"
            />
            <DemoField
              label="Document label"
              value={form.documentLabel}
              onChange={(value) => update("documentLabel", value)}
              placeholder="Martech Madrid Blueprint"
            />
            <DemoField
              label="Prismic repository"
              value={form.repository}
              onChange={(value) => update("repository", value)}
              placeholder="template-landing"
            />
            <DemoField
              label="Prismic document ID"
              value={form.baselineDocumentId}
              onChange={(value) => update("baselineDocumentId", value)}
              placeholder="ae9WThYAACoALXhJ"
            />
            <DemoField
              label="Document UID"
              value={form.documentUid}
              onChange={(value) => update("documentUid", value)}
              placeholder="landing-page"
            />
            <DemoField
              label="Custom type"
              value={form.customType}
              onChange={(value) => update("customType", value)}
              placeholder="page"
            />
            <DemoField
              label="Language"
              value={form.lang}
              onChange={(value) => update("lang", value)}
              placeholder="en-us"
            />
          </div>

          <div className="mt-4">
            <DemoField
              label="Published page URL"
              value={form.previewUrl}
              onChange={(value) => update("previewUrl", value)}
              placeholder="https://your-public-site.com/demo-page"
            />
            <p className="mt-1.5 text-muted-foreground text-xs">
              Use the public page URL for the right-side preview. Prismic Builder URLs open
              the editor and cannot be embedded.
            </p>
          </div>

          <label className="mt-4 flex items-start gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.canEmbedPreview && !previewIsBuilderUrl}
              onChange={(e) => update("canEmbedPreview", e.target.checked)}
              disabled={previewIsBuilderUrl}
              className="mt-0.5 rounded accent-primary"
            />
            <span>
              Load this URL inside the preview pane. Leave unchecked when the page blocks
              iframe embedding.
            </span>
          </label>
          {previewIsBuilderUrl && (
            <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-amber-800 text-xs">
              This is a Prismic Builder URL. The prototype will open it in a new tab
              instead of embedding it.
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid}>
              Use demo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DemoField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function DemoPreview({ demo }: { demo: DemoShowcase }) {
  if (!demo.previewUrl) return <MockLandingPage demo={demo} />;

  const isBuilderUrl = isPrismicBuilderUrl(demo.previewUrl);

  if (!demo.canEmbedPreview || isBuilderUrl) {
    return (
      <div className="flex flex-col bg-white min-h-full">
        <div className="flex items-center justify-between gap-3 bg-muted/30 px-4 py-2 border-border border-b">
          <div className="flex min-w-0 flex-col">
            <span className="font-medium text-foreground text-xs">Base page preview</span>
            <span className="text-muted-foreground text-xs truncate">{demo.previewUrl}</span>
          </div>
          <a
            href={demo.previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-white hover:bg-muted px-2.5 py-1.5 border border-border rounded-md font-medium text-foreground text-xs transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open
          </a>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 px-6 py-16 text-center">
          <div className="flex items-center justify-center bg-primary/10 mb-4 rounded-lg w-11 h-11">
            <MonitorPlay className="w-5 h-5 text-primary" />
          </div>
          <h2 className="font-semibold text-foreground text-base">{demo.documentLabel}</h2>
          <p className="mt-2 max-w-md text-muted-foreground text-sm leading-6">
            This demo is connected to Prismic document {demo.baselineDocumentId}.{" "}
            {isBuilderUrl
              ? "Prismic Builder pages cannot be embedded here, but you can open the document in Prismic."
              : "The live page opens in a new tab because this URL is not configured for embedding."}
          </p>
          <a
            href={demo.previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary/90 mt-5 px-3 py-2 rounded-md font-medium text-primary-foreground text-sm transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            {isBuilderUrl ? "Open in Prismic" : "Open base page"}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white min-h-full">
      <div className="flex items-center justify-between gap-3 bg-muted/30 px-4 py-2 border-border border-b">
        <div className="flex min-w-0 flex-col">
          <span className="font-medium text-foreground text-xs">Base page preview</span>
          <span className="text-muted-foreground text-xs truncate">{demo.previewUrl}</span>
        </div>
        <a
          href={demo.previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 bg-white hover:bg-muted px-2.5 py-1.5 border border-border rounded-md font-medium text-foreground text-xs transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open
        </a>
      </div>
      <iframe
        key={demo.id}
        src={demo.previewUrl}
        title={`${demo.name} preview`}
        className="flex-1 w-full min-h-[calc(100vh-88px)] bg-white"
      />
    </div>
  );
}

function AiAvatar() {
  return (
    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        className="text-primary-foreground"
      >
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    </div>
  );
}

function Spinner() {
  return (
    <div className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
  );
}

function GenerationResultCard({ result }: { result: GenerationResult }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <span className="text-green-600 font-bold">✓</span>
        <span className="font-semibold">
          {result.successCount}/{result.total} pages created
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Personalized pages are ready for review in{" "}
        <span className="font-medium text-foreground">{result.releaseName}</span>.
      </p>
      <div className="flex items-center gap-2 flex-wrap mt-0.5">
        <a
          href={result.releaseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-primary underline underline-offset-2"
        >
          View release →
        </a>
        <span className="text-muted-foreground text-xs">·</span>
        <a
          href="#"
          className="text-xs font-medium text-primary underline underline-offset-2"
        >
          Tasks →
        </a>
      </div>
    </div>
  );
}

function MockLandingPage({ demo }: { demo: DemoShowcase }) {
  return (
    <div
      className="min-h-full bg-white"
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      <nav className="flex items-center justify-between px-10 py-4 border-b border-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.prismic.io/template-landing/aOfJSp5xUNkB1yss_Prismic-1-.png?auto=format%2Ccompress&fit=max&w=1080"
          alt="Prismic"
          className="h-7 w-auto object-contain"
        />
        <div className="flex items-center gap-7 text-sm text-gray-500">
          <a href="#" className="hover:text-gray-900 transition-colors">Products</a>
          <a href="#" className="hover:text-gray-900 transition-colors">Resources</a>
          <a href="#" className="hover:text-gray-900 transition-colors">Company</a>
          <a href="#" className="hover:text-gray-900 transition-colors">Contact</a>
        </div>
      </nav>

      <div className="flex flex-col items-center text-center px-10 pt-20 pb-16">
        <p className="text-xs font-bold tracking-widest text-[#6e56cf] uppercase mb-6">
          ABM Event Personalization
        </p>
        <h1 className="text-5xl font-bold text-gray-900 leading-tight max-w-3xl mb-6">
          {demo.documentLabel}
        </h1>
        <p className="text-lg text-gray-400 max-w-xl mb-10 leading-relaxed">
          Prismic enables marketing teams to generate, customize, and publish
          high-performing landing pages for every target account attending your
          next ABM event.
        </p>
        <div className="flex items-center gap-4">
          <button className="bg-black text-white font-medium px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors">
            Meet us at ABM Forum Madrid
          </button>
          <button className="border border-gray-200 text-gray-700 font-medium px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors">
            See how it works
          </button>
        </div>
      </div>

      <div className="px-10 pb-20 grid grid-cols-3 gap-5 max-w-5xl mx-auto">
        {[
          { title: "Visual builder", desc: "Build pages with a drag-and-drop editor — no code required." },
          { title: "Component library", desc: "Reusable slices keep your design system consistent at scale." },
          { title: "Multi-environment", desc: "Stage and preview changes before they go live." },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border border-gray-100 p-6 bg-gray-50">
            <div className="w-8 h-8 rounded-lg bg-[#6e56cf]/10 mb-4 flex items-center justify-center">
              <div className="w-4 h-4 rounded bg-[#6e56cf]/30" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm mb-2">{f.title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
