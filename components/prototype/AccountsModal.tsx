"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { HubSpotList, Contact, Company } from "@/lib/types";

function getRecordName(record: Contact | Company, type: "contact" | "company"): string {
  if (type === "contact") {
    const c = record as Contact;
    const name = [c.firstname, c.lastname].filter(Boolean).join(" ");
    return name || c.email || `Contact ${c.id}`;
  }
  const co = record as Company;
  return co.name || co.domain || `Company ${co.id}`;
}

function getRecordSub(record: Contact | Company, type: "contact" | "company"): string {
  if (type === "contact") {
    const c = record as Contact;
    return c.associatedCompany?.name || c.company || c.jobtitle || "";
  }
  const co = record as Company;
  return co.industry || co.domain || "";
}

interface Props {
  segment: HubSpotList;
  records: (Contact | Company)[];
  type: "contact" | "company";
  onConfirm: (records: (Contact | Company)[]) => void;
  onClose: () => void;
}

export default function AccountsModal({ segment, records, type, onConfirm, onClose }: Props) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(records.map((r) => r.id)),
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(
      selected.size === records.length
        ? new Set()
        : new Set(records.map((r) => r.id)),
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[520px] max-h-[80vh] flex flex-col">
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">Select accounts</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              From segment{" "}
              <span className="font-medium text-foreground">{segment.name}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-border flex items-center gap-2">
          <input
            type="checkbox"
            id="select-all"
            checked={selected.size === records.length && records.length > 0}
            onChange={toggleAll}
            className="rounded accent-primary cursor-pointer"
          />
          <label htmlFor="select-all" className="text-sm text-muted-foreground cursor-pointer">
            {selected.size === records.length ? "Deselect all" : "Select all"}{" "}
            ({records.length})
          </label>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-3 flex flex-col gap-0.5">
          {records.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No accounts found in this segment.
            </p>
          ) : (
            records.map((record) => (
              <label
                key={record.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selected.has(record.id)}
                  onChange={() => toggle(record.id)}
                  className="rounded accent-primary shrink-0"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-foreground truncate">
                    {getRecordName(record, type)}
                  </span>
                  {getRecordSub(record, type) && (
                    <span className="text-xs text-muted-foreground truncate">
                      {getRecordSub(record, type)}
                    </span>
                  )}
                </div>
              </label>
            ))
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {selected.size} of {records.length} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirm(records.filter((r) => selected.has(r.id)))}
              disabled={selected.size === 0}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate for {selected.size} account{selected.size !== 1 ? "s" : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
