"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { GeneratePagesPayload } from "@/lib/types";

interface Props {
  payload: GeneratePagesPayload | null;
  onClose: () => void;
}

type CopyState =
  | { status: "idle" }
  | { status: "copied" }
  | { status: "unavailable"; message: string };

async function copyText(text: string): Promise<boolean> {
  try {
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export default function JsonPreviewModal({ payload, onClose }: Props) {
  const [copyState, setCopyState] = useState<CopyState>({ status: "idle" });
  const [visible, setVisible] = useState(false);
  const titleId = "json-preview-title";
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const json = useMemo(
    () => (payload ? JSON.stringify(payload, null, 2) : ""),
    [payload],
  );

  useEffect(() => {
    if (!payload) {
      setVisible(false);
      setCopyState({ status: "idle" });
      return;
    }
    const id = requestAnimationFrame(() => setVisible(true));
    closeButtonRef.current?.focus();
    return () => cancelAnimationFrame(id);
  }, [payload]);

  useEffect(() => {
    if (!payload) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [payload, onClose]);

  if (!payload) return null;

  const count = payload.contacts.length;
  const noun = count > 1 ? "contacts" : "contact";

  async function onCopy() {
    const ok = await copyText(json);
    if (!ok) {
      setCopyState({
        status: "unavailable",
        message: "Copie non disponible, sélectionnez et copiez manuellement.",
      });
      return;
    }
    setCopyState({ status: "copied" });
    window.setTimeout(() => setCopyState({ status: "idle" }), 2000);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[90vh] w-full max-w-2xl flex-col gap-4 rounded-lg bg-white p-6 shadow-xl transition-transform duration-200 ${
          visible ? "scale-100" : "scale-95"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 id={titleId} className="text-base font-semibold text-gray-900">
              Payload prêt à envoyer
            </h2>
            <p className="text-sm text-gray-500">
              {count} {noun} depuis la liste «&nbsp;{payload.source.listName}&nbsp;»
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la modale"
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <span aria-hidden>✕</span>
          </button>
        </div>

        <pre className="max-h-[400px] overflow-auto rounded-md border border-gray-200 bg-gray-50 p-3 text-xs font-mono text-gray-800">
          {json}
        </pre>

        {copyState.status === "unavailable" && (
          <p role="alert" className="text-sm text-red-700">
            {copyState.message}
          </p>
        )}

        <div className="flex items-center justify-between gap-3">
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Fermer
          </button>
          <button
            type="button"
            onClick={onCopy}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            {copyState.status === "copied" ? "Copié ✓" : "Copier"}
          </button>
        </div>
      </div>
    </div>
  );
}
