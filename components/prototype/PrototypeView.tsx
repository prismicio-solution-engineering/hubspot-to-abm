"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { Trash2, Send } from "lucide-react";

import SegmentCombobox from "@/components/SegmentCombobox";
import AccountsModal from "./AccountsModal";
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

const BASELINE_DOCUMENT_ID = "ae9WThYAACoALXhJ";

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

interface PrototypeViewProps {
  preview?: ReactNode;
  previewTitle?: string;
  previewUrl?: string;
  segmentSourceIcon?: ReactNode;
  segmentPromptText?: string;
  generatePagesEndpoint?: string;
  generateAbmPagesEndpoint?: string;
  baselineDocumentId?: string;
}

export default function PrototypeView({
  preview,
  previewTitle,
  previewUrl,
  segmentSourceIcon,
  segmentPromptText,
  generatePagesEndpoint = "/api/generate-pages",
  generateAbmPagesEndpoint = "/api/prismic/generate-abm-pages",
  baselineDocumentId = BASELINE_DOCUMENT_ID,
}: PrototypeViewProps) {
  const [step, setStep] = useState<Step>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "ai",
      text: "Hi! I can help you create personalized variations of this page for your ABM campaigns. What would you like to do?",
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

  function handleActionClick() {
    push({ role: "user", text: "Personalize for a HubSpot Segment" });
    push({
      role: "ai",
      text: segmentPromptText ?? "Sure! Select the HubSpot segment you'd like to personalize this page for:",
    });
    setStep("segment_selecting");
  }

  async function handleSegmentSelected(segment: HubSpotList) {
    setSelectedSegment(segment);
    push({ role: "user", text: `${segment.name} · ${segment.size} records` });
    push({ role: "ai", text: `Loading accounts from "${segment.name}"…` });
    setStep("loading_contacts");

    try {
      const res = await fetch(`/api/segments/${segment.id}`);
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as RecordsResponse;
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
    const releaseName = selectedSegment!.name;

    push({ role: "user", text: `Generate for ${count} account${count !== 1 ? "s" : ""}` });
    setGenState({ releaseName, total: count, fakeProgress: 0 });
    setStep("generating_recommendations");

    try {
      const contacts = selectedRecords.map((r) => toGeneratePagesContact(r, recordType));

      const payload: GeneratePagesPayload = {
        version: "1.0",
        generatedAt: new Date().toISOString(),
        target: {
          type: "prismic_document",
          documentId: baselineDocumentId,
          uid: null,
          customType: "page",
          lang: "en-us",
        },
        source: {
          type: "hubspot_list",
          listId: selectedSegment!.id,
          listName: selectedSegment!.name,
        },
        contacts,
      };

      const recsRes = await fetch(generatePagesEndpoint, {
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

      const pagesRes = await fetch(generateAbmPagesEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          releaseName,
          baselineDocumentID: baselineDocumentId,
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M10 4.5C10 3.12 11.12 2 12.5 2C13.42 2 14.22 2.5 14.67 3.25C15.08 3.1 15.53 3 16 3C18.21 3 20 4.79 20 7C20 7.14 19.99 7.28 19.97 7.41C21.17 7.9 22 9.08 22 10.5C22 12.43 20.43 14 18.5 14H6C4.07 14 2.5 12.43 2.5 10.5C2.5 8.96 3.5 7.65 4.9 7.18C4.65 6.68 4.5 6.11 4.5 5.5C4.5 3.57 6.07 2 8 2C8.86 2 9.64 2.32 10.23 2.85C10.08 3.39 10 3.94 10 4.5Z" fill="#009EDB"/>
              </svg>
              Personalize page for a Salesforce segment
            </button>
          )}

          {step === "segment_selecting" && (
            <div className="w-full mt-1">
              <SegmentCombobox
                onSegmentSelected={handleSegmentSelected}
                sourceIcon={segmentSourceIcon}
              />
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
          <span className="text-sm font-semibold text-foreground">{previewTitle ?? "Martech Madrid Blueprint"}</span>
          <span className="text-xs text-muted-foreground">Edited 2 min. ago</span>
          <div className="h-4 w-px bg-border mx-1" />
          <div className="flex items-center text-xs">
            <button className="px-2 py-0.5 font-medium text-primary border-b border-primary">
              Edit
            </button>
            <button className="px-2 py-0.5 text-muted-foreground hover:text-foreground">
              Comment
            </button>
          </div>
          {previewUrl ? (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-muted rounded px-2.5 py-1 text-xs text-muted-foreground max-w-xs ml-2 hover:text-foreground transition-colors truncate"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
              {previewUrl}
            </a>
          ) : (
            <div className="flex items-center gap-1.5 bg-muted rounded px-2.5 py-1 text-xs text-muted-foreground max-w-xs ml-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
              https://example.prismic.io/home
            </div>
          )}
          <div className="ml-auto">
            <button className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-md">
              Publish
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {preview ?? <MockLandingPage />}
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

function MockLandingPage() {
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
          Meet us at Martech Madrid
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
