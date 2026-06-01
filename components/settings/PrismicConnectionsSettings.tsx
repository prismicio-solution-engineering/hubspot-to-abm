"use client";

import { useEffect, useState } from "react";
import { Database, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deletePrismicConnection,
  getPrismicConnections,
  savePrismicConnection,
  type PrismicConnection,
} from "@/lib/prismic-connections";

interface FormState {
  id?: string;
  label: string;
  repository: string;
  masterToken: string;
  writeToken: string;
}

const EMPTY_FORM: FormState = {
  label: "",
  repository: "",
  masterToken: "",
  writeToken: "",
};

export default function PrismicConnectionsSettings() {
  const [connections, setConnections] = useState<PrismicConnection[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  useEffect(() => {
    setConnections(getPrismicConnections());
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function save(e: { preventDefault(): void }) {
    e.preventDefault();
    if (
      !form.repository.trim() ||
      !form.masterToken.trim() ||
      !form.writeToken.trim()
    ) {
      return;
    }

    savePrismicConnection({
      ...form,
      label: form.label.trim() || form.repository.trim(),
    });
    setConnections(getPrismicConnections());
    setForm(EMPTY_FORM);
  }

  function edit(connection: PrismicConnection) {
    setForm({
      id: connection.id,
      label: connection.label,
      repository: connection.repository,
      masterToken: connection.masterToken,
      writeToken: connection.writeToken,
    });
  }

  function remove(id: string) {
    deletePrismicConnection(id);
    setConnections(getPrismicConnections());
    if (form.id === id) setForm(EMPTY_FORM);
  }

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-foreground text-base">Prismic repositories</h2>
          <p className="mt-1 max-w-2xl text-muted-foreground text-sm">
            Save the Prismic repositories this session can use for ABM campaigns. Tokens
            are kept in browser session storage for now.
          </p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Database className="h-4 w-4" />
        </div>
      </div>

      <form onSubmit={save} className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="prismic-label">Label</Label>
          <Input
            id="prismic-label"
            value={form.label}
            onChange={(e) => update("label", e.target.value)}
            placeholder="e.g. Product site"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="prismic-repository">Repository</Label>
          <Input
            id="prismic-repository"
            value={form.repository}
            onChange={(e) => update("repository", e.target.value)}
            placeholder="template-landing"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="prismic-master-token">Master access token</Label>
          <Input
            id="prismic-master-token"
            type="password"
            value={form.masterToken}
            onChange={(e) => update("masterToken", e.target.value)}
            placeholder="MC5..."
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="prismic-write-token">Write token</Label>
          <Input
            id="prismic-write-token"
            type="password"
            value={form.writeToken}
            onChange={(e) => update("writeToken", e.target.value)}
            placeholder="Write API token"
          />
        </div>
        <div className="flex justify-end gap-2 md:col-span-2">
          {form.id && (
            <Button type="button" variant="outline" onClick={() => setForm(EMPTY_FORM)}>
              New repository
            </Button>
          )}
          <Button
            type="submit"
            disabled={
              !form.repository.trim() ||
              !form.masterToken.trim() ||
              !form.writeToken.trim()
            }
          >
            {form.id ? "Save repository" : "Add repository"}
          </Button>
        </div>
      </form>

      <div className="mt-5 flex flex-col gap-2">
        {connections.length === 0 ? (
          <p className="rounded-md border border-border border-dashed px-4 py-5 text-center text-muted-foreground text-sm">
            No Prismic repositories saved for this browser session.
          </p>
        ) : (
          connections.map((connection) => (
            <div
              key={connection.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2"
            >
              <button
                type="button"
                onClick={() => edit(connection)}
                className="min-w-0 flex-1 text-left"
              >
                <span className="block truncate font-medium text-foreground text-sm">
                  {connection.label}
                </span>
                <span className="block truncate text-muted-foreground text-xs">
                  {connection.repository}
                </span>
              </button>
              <button
                type="button"
                onClick={() => remove(connection.id)}
                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={`Delete ${connection.label}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
