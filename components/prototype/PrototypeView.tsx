"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  ExternalLink,
  FileText,
  MonitorPlay,
  Search,
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
  createDemoShowcase,
  getDefaultDemoShowcase,
  type DemoShowcase,
} from "@/lib/demo-showcase";
import { cn } from "@/lib/utils";
import type {
  HubSpotList,
  Contact,
  Company,
  ErrorResponse,
  RecordsResponse,
  GeneratePagesContact,
  GeneratePagesPayload,
  RecommendationResponse,
  PrismicGenerationResult,
  PrismicDocumentMetadata,
} from "@/lib/types";

type Step =
  | "idle"
  | "segment_selecting"
  | "loading_contacts"
  | "accounts_modal"
  | "release_naming"
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
  id?: string;
  name: string;
  repository: string;
  masterToken: string;
  writeToken: string;
  baselineDocumentId: string;
  documentUid: string;
  customType: string;
  lang: string;
  previewUrl: string;
  canEmbedPreview: boolean;
}

const CUSTOM_DEMO_STORAGE_KEY = "abm_prototype_custom_demo_v1";
const CUSTOM_DEMOS_STORAGE_KEY = "abm_prototype_custom_demos_v1";

function getDemoStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

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
    id: demo.id,
    name: demo.name,
    repository: demo.repository,
    masterToken: demo.masterToken ?? "",
    writeToken: demo.writeToken ?? "",
    baselineDocumentId: demo.baselineDocumentId,
    documentUid: demo.documentUid ?? "",
    customType: demo.customType,
    lang: demo.lang,
    previewUrl: demo.previewUrl,
    canEmbedPreview: demo.canEmbedPreview,
  };
}

function createCustomDemoId(form: DemoFormState): string {
  return [form.repository, form.documentUid || form.baselineDocumentId || form.name]
    .join("-")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "custom-demo";
}

function normalizeSavedDemo(value: DemoShowcase): DemoShowcase {
  return createDemoShowcase({
    ...value,
    id: value.id,
    documentLabel: value.documentLabel,
    releasePrefix: value.releasePrefix,
    editedLabel: value.editedLabel,
  });
}

function readStoredDemos(raw: string | null): DemoShowcase[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as DemoShowcase[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeSavedDemo);
  } catch {
    return [];
  }
}

function loadSavedDemos(): DemoShowcase[] {
  if (typeof window === "undefined") return [];
  const storage = getDemoStorage();
  const demos = readStoredDemos(storage?.getItem(CUSTOM_DEMOS_STORAGE_KEY) ?? null);
  if (demos.length > 0) return demos;

  try {
    const legacyDemos = readStoredDemos(localStorage.getItem(CUSTOM_DEMOS_STORAGE_KEY));
    if (legacyDemos.length > 0) {
      storage?.setItem(CUSTOM_DEMOS_STORAGE_KEY, JSON.stringify(legacyDemos));
      localStorage.removeItem(CUSTOM_DEMOS_STORAGE_KEY);
      localStorage.removeItem(CUSTOM_DEMO_STORAGE_KEY);
      return legacyDemos;
    }

    const raw = localStorage.getItem(CUSTOM_DEMO_STORAGE_KEY);
    if (!raw) return [];
    const legacyDemo = createDemoShowcase(JSON.parse(raw) as DemoFormState);
    storage?.setItem(CUSTOM_DEMOS_STORAGE_KEY, JSON.stringify([legacyDemo]));
    localStorage.removeItem(CUSTOM_DEMO_STORAGE_KEY);
    localStorage.removeItem(CUSTOM_DEMOS_STORAGE_KEY);
    return [legacyDemo];
  } catch {
    return [];
  }
}

function saveCustomDemo(
  form: DemoFormState,
  currentDemos: DemoShowcase[],
): { demo: DemoShowcase; demos: DemoShowcase[] } {
  const existingSavedDemo = form.id
    ? currentDemos.some((demo) => demo.id === form.id)
    : false;
  const demo = createDemoShowcase({
    ...form,
    canEmbedPreview: true,
    documentLabel: form.name,
    releasePrefix: form.name,
    id: existingSavedDemo && form.id ? form.id : createCustomDemoId(form),
    editedLabel: "Custom demo",
  });
  const demos = [demo, ...currentDemos.filter((saved) => saved.id !== demo.id)];
  getDemoStorage()?.setItem(CUSTOM_DEMOS_STORAGE_KEY, JSON.stringify(demos));
  if (typeof window !== "undefined") {
    localStorage.removeItem(CUSTOM_DEMO_STORAGE_KEY);
    localStorage.removeItem(CUSTOM_DEMOS_STORAGE_KEY);
  }
  return { demo, demos };
}

export default function PrototypeView() {
  const [selectedDemo, setSelectedDemo] = useState<DemoShowcase>(
    getDefaultDemoShowcase(),
  );
  const [isDemoDialogOpen, setIsDemoDialogOpen] = useState(false);
  const [savedDemos, setSavedDemos] = useState<DemoShowcase[]>([]);
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
  const [pendingRecords, setPendingRecords] = useState<(Contact | Company)[]>([]);
  const [releaseNameInput, setReleaseNameInput] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [genState, setGenState] = useState<GenState | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, step, genState]);

  useEffect(() => {
    const demos = loadSavedDemos();
    if (demos.length === 0) return;
    const saved = demos[0];
    setSavedDemos(demos);
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
    setStep("idle");
    setSelectedSegment(null);
    setRecords([]);
    setPendingRecords([]);
    setReleaseNameInput("");
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
    const { demo, demos } = saveCustomDemo(form, savedDemos);
    setSavedDemos(demos);
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

  function handleConfirm(selectedRecords: (Contact | Company)[]) {
    setIsModalOpen(false);
    const count = selectedRecords.length;
    const suggestedReleaseName = `${selectedDemo.name} - ${selectedSegment!.name}`;

    push({ role: "user", text: `Generate for ${count} account${count !== 1 ? "s" : ""}` });
    push({
      role: "ai",
      text: "What should I call the Prismic release for these personalized pages?",
    });
    setPendingRecords(selectedRecords);
    setReleaseNameInput(suggestedReleaseName);
    setStep("release_naming");
  }

  async function handleReleaseNameSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    const releaseName = releaseNameInput.trim();
    if (!releaseName || pendingRecords.length === 0) return;

    push({ role: "user", text: releaseName });
    await runGeneration(pendingRecords, releaseName);
  }

  async function runGeneration(
    selectedRecords: (Contact | Company)[],
    releaseName: string,
  ) {
    const count = selectedRecords.length;
    setGenState({ releaseName, total: count, fakeProgress: 0 });
    setStep("generating_recommendations");

    try {
      const contacts = selectedRecords.map((r) => toGeneratePagesContact(r, recordType));

      const payload: GeneratePagesPayload = {
        version: "1.0",
        generatedAt: new Date().toISOString(),
        demoId: selectedDemo.id,
        demoRepository: selectedDemo.repository,
        demoMasterToken: selectedDemo.masterToken,
        demoWriteToken: selectedDemo.writeToken,
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
          demoMasterToken: selectedDemo.masterToken,
          demoWriteToken: selectedDemo.writeToken,
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
      setPendingRecords([]);
      setReleaseNameInput("");
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

          {step === "release_naming" && (
            <form
              onSubmit={handleReleaseNameSubmit}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2"
            >
              <Input
                value={releaseNameInput}
                onChange={(e) => setReleaseNameInput(e.target.value)}
                className="h-8 flex-1"
                placeholder="Release name"
                autoFocus
              />
              <Button type="submit" size="sm" disabled={!releaseNameInput.trim()}>
                Continue
              </Button>
            </form>
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
            <button
              type="button"
              onClick={() => setIsDemoDialogOpen(true)}
              className="flex items-center gap-1.5 bg-primary px-3 py-1.5 rounded-md font-medium text-primary-foreground text-xs hover:bg-primary/90 transition-colors"
            >
              <MonitorPlay className="w-3.5 h-3.5" />
              Demo
            </button>
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
        savedDemos={savedDemos}
        onOpenChange={setIsDemoDialogOpen}
        onSave={handleDemoSaved}
      />
    </div>
  );
}

function DemoSetupDialog({
  open,
  initialDemo,
  savedDemos,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  initialDemo: DemoShowcase;
  savedDemos: DemoShowcase[];
  onOpenChange: (open: boolean) => void;
  onSave: (form: DemoFormState) => void;
}) {
  const [form, setForm] = useState<DemoFormState>(() => demoToFormState(initialDemo));
  const [documents, setDocuments] = useState<PrismicDocumentMetadata[]>([]);
  const [documentQuery, setDocumentQuery] = useState("");
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const isValid =
    form.name.trim().length > 0 &&
    form.repository.trim().length > 0 &&
    form.baselineDocumentId.trim().length > 0 &&
    form.customType.trim().length > 0 &&
    form.lang.trim().length > 0;

  useEffect(() => {
    if (open) setForm(demoToFormState(initialDemo));
  }, [initialDemo, open]);

  useEffect(() => {
    if (!open || form.repository.trim().length === 0) return;

    const controller = new AbortController();
    setLoadingDocuments(true);
    setDocumentError(null);

    const timeout = window.setTimeout(() => {
      fetch("/api/prismic/documents", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repository: form.repository.trim(),
          masterToken: form.masterToken.trim() || undefined,
          type: "all",
        }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const data = (await res.json().catch(() => ({}))) as ErrorResponse;
            throw new Error(data.error ?? `Error ${res.status}`);
          }
          return res.json() as Promise<{ documents: PrismicDocumentMetadata[] }>;
        })
        .then(({ documents }) => {
          setDocuments(documents);
          setLoadingDocuments(false);
        })
        .catch((err: Error) => {
          if (err.name === "AbortError") return;
          setDocuments([]);
          setDocumentError(err.message);
          setLoadingDocuments(false);
        });
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [form.masterToken, form.repository, open]);

  function update<K extends keyof DemoFormState>(key: K, value: DemoFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function selectSavedDemo(demo: DemoShowcase) {
    setForm(demoToFormState(demo));
    setDocumentQuery("");
    setDocumentError(null);
  }

  function previewUrlFromDocument(document: PrismicDocumentMetadata): string {
    if (!document.url) return "";
    if (/^https?:\/\//.test(document.url)) return document.url;
    return "";
  }

  function selectDocument(document: PrismicDocumentMetadata) {
    const label = document.metaTitle ?? document.uid ?? document.id;
    const documentPreviewUrl = previewUrlFromDocument(document);
    setForm((current) => ({
      ...current,
      id: document.id === current.baselineDocumentId ? current.id : undefined,
      name: label,
      baselineDocumentId: document.id,
      documentUid: document.uid ?? "",
      customType: document.type,
      lang: document.lang,
      previewUrl: documentPreviewUrl || current.previewUrl,
      canEmbedPreview: true,
    }));
    setDocumentQuery("");
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

          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
            <DemoField
              label="Prismic repository"
              value={form.repository}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  id: undefined,
                  repository: value,
                  baselineDocumentId: "",
                  documentUid: "",
                }))
              }
              placeholder="template-landing"
            />
            <SavedDemoPicker
              demos={savedDemos}
              selectedDemoId={form.id}
              onSelect={selectSavedDemo}
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <DemoField
              label="Master access token"
              value={form.masterToken}
              onChange={(value) => update("masterToken", value)}
              placeholder="Uses PRISMIC_MASTER_TOKEN when empty"
              type="password"
            />
            <DemoField
              label="Write token"
              value={form.writeToken}
              onChange={(value) => update("writeToken", value)}
              placeholder="Uses PRISMIC_WRITE_TOKEN when empty"
              type="password"
            />
          </div>
          <p className="mt-2 text-muted-foreground text-xs">
            Leave tokens empty to use the server env vars. Enter them here only to override
            the defaults for this demo session.
          </p>

          <div className="mt-4">
            <DemoDocumentPicker
              documents={documents}
              query={documentQuery}
              selectedDocumentId={form.baselineDocumentId}
              loading={loadingDocuments}
              error={documentError}
              onQueryChange={setDocumentQuery}
              onSelect={selectDocument}
            />
            {form.baselineDocumentId && (
              <p className="mt-2 text-muted-foreground text-xs">
                Selected `{form.baselineDocumentId}` · {form.customType} · {form.lang}
              </p>
            )}
          </div>

          <div className="mt-4">
            <Label>Published page URL</Label>
            <Input
              value={form.previewUrl}
              onChange={(e) => update("previewUrl", e.target.value)}
              placeholder="Auto-filled when Prismic provides a public URL"
              className="mt-1.5"
            />
            <p className="mt-1.5 text-muted-foreground text-xs">
              Leave empty to keep the default Martech preview. Add a public page URL to
              load it in the right-side preview.
            </p>
          </div>

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
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "text" | "password";
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function SavedDemoPicker({
  demos,
  selectedDemoId,
  onSelect,
}: {
  demos: DemoShowcase[];
  selectedDemoId?: string;
  onSelect: (demo: DemoShowcase) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedDemo = demos.find((demo) => demo.id === selectedDemoId);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function handleSelect(demo: DemoShowcase) {
    onSelect(demo);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-1.5">
      <Label>Saved demos</Label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          disabled={demos.length === 0}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-md border bg-background px-3 text-sm transition-colors",
            open
              ? "border-ring ring-2 ring-ring ring-offset-1"
              : "border-input hover:border-ring/50",
            demos.length === 0 && "cursor-not-allowed opacity-60",
          )}
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <span className="min-w-0 truncate text-left">
            {selectedDemo
              ? selectedDemo.name
              : demos.length > 0
                ? "Select saved demo"
                : "No saved demos"}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </button>

        {open && demos.length > 0 && (
          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-border bg-card py-1 shadow-lg">
            {demos.map((demo) => (
              <button
                key={demo.id}
                type="button"
                onClick={() => handleSelect(demo)}
                className={cn(
                  "flex w-full flex-col gap-0.5 px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                  selectedDemoId === demo.id && "bg-accent",
                )}
              >
                <span className="truncate font-medium text-foreground">{demo.name}</span>
                <span className="truncate text-muted-foreground text-xs">
                  {demo.repository} · {demo.documentUid ?? demo.baselineDocumentId}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DemoDocumentPicker({
  documents,
  query,
  selectedDocumentId,
  loading,
  error,
  onQueryChange,
  onSelect,
}: {
  documents: PrismicDocumentMetadata[];
  query: string;
  selectedDocumentId: string;
  loading: boolean;
  error: string | null;
  onQueryChange: (value: string) => void;
  onSelect: (document: PrismicDocumentMetadata) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedDocument = documents.find((doc) => doc.id === selectedDocumentId);
  const q = query.trim().toLowerCase();
  const filtered = q
    ? documents.filter((doc) =>
        [
          doc.metaTitle,
          doc.uid,
          doc.id,
          doc.type,
          doc.lang,
        ].some((value) => value?.toLowerCase().includes(q)),
      )
    : documents;

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      return;
    }
    onQueryChange("");
  }, [onQueryChange, open]);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function handleSelect(document: PrismicDocumentMetadata) {
    onSelect(document);
    setOpen(false);
  }

  const displayValue = selectedDocument
    ? (selectedDocument.metaTitle ?? selectedDocument.uid ?? selectedDocument.id)
    : "";

  return (
    <div ref={containerRef} className="flex flex-col gap-1.5">
      <Label>Base page</Label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-md border bg-background px-3 text-sm transition-colors",
            open
              ? "border-ring ring-2 ring-ring ring-offset-1"
              : "border-input hover:border-ring/50",
          )}
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          {selectedDocument ? (
            <span className="flex min-w-0 items-center gap-2">
              <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="truncate font-medium text-foreground">{displayValue}</span>
              <span className="shrink-0 text-muted-foreground text-xs">
                {selectedDocument.type} · {selectedDocument.lang}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">
              {loading
                ? "Loading Prismic pages..."
                : documents.length > 0
                  ? `${documents.length} pages available...`
                  : "No pages found"}
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </button>

        <div
          className={cn(
            "absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-card shadow-lg",
            !open && "hidden",
          )}
        >
          <div className="border-border border-b px-3 py-2">
            <div className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="Search Prismic pages..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto py-1">
            {loading ? (
              <p className="px-3 py-3 text-muted-foreground text-sm">Loading pages...</p>
            ) : error ? (
              <p className="px-3 py-3 text-destructive text-sm">{error}</p>
            ) : filtered.length === 0 ? (
              <p className="px-3 py-3 text-muted-foreground text-sm">
                {query ? `No page for "${query}"` : "No pages found"}
              </p>
            ) : (
              <ul role="listbox">
                {filtered.map((doc) => (
                  <li key={doc.id} role="option" aria-selected={selectedDocumentId === doc.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(doc)}
                      className={cn(
                        "flex w-full items-start gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                        selectedDocumentId === doc.id && "bg-accent",
                      )}
                    >
                      <FileText
                        className={cn(
                          "mt-0.5 h-4 w-4 shrink-0",
                          selectedDocumentId === doc.id
                            ? "text-primary"
                            : "text-muted-foreground",
                        )}
                      />
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate font-medium text-foreground">
                          {doc.metaTitle ?? doc.uid ?? doc.id}
                        </span>
                        <span className="truncate text-muted-foreground text-xs">
                          {doc.uid ?? doc.id} · {doc.type} · {doc.lang}
                          {doc.url ? ` · ${doc.url}` : ""}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoPreview({ demo }: { demo: DemoShowcase }) {
  if (!demo.previewUrl) return <MockLandingPage demo={demo} />;

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
        key={`${demo.id}:${demo.previewUrl}`}
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
