"use client";

import { useEffect, useState, useMemo } from "react";
import { Search, X, Plus } from "lucide-react";
import type { HubSpotProperty } from "@/lib/hubspot";

type Filter = "all" | "custom" | "standard";

interface SelectedProperty {
  property: HubSpotProperty;
  instruction: string;
}

export default function HsPropertiesConfigPage() {
  const [properties, setProperties] = useState<HubSpotProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const [selected, setSelected] = useState<SelectedProperty[]>([]);
  const [sampleValues, setSampleValues] = useState<Record<string, string>>({});
  const [sampleCompanyName, setSampleCompanyName] = useState<string | null>(null);
  const [sampleLoading, setSampleLoading] = useState(false);

  useEffect(() => {
    fetch("/api/hs-properties/company")
      .then((r) => r.json())
      .then(async (data: { error?: string; properties?: HubSpotProperty[] }) => {
        if (data.error) throw new Error(data.error);
        const props = data.properties ?? [];
        setProperties(props);

        const visibleNames = props.filter((p) => !p.hidden).map((p) => p.name);
        setSampleLoading(true);
        const sampleRes = await fetch("/api/hs-properties/company/sample", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ properties: visibleNames }),
        });
        const sample = (await sampleRes.json()) as {
          name: string | null;
          values: Record<string, string>;
        };
        setSampleValues(sample.values ?? {});
        setSampleCompanyName(sample.name);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load properties"),
      )
      .finally(() => {
        setLoading(false);
        setSampleLoading(false);
      });
  }, []);

  const visible = useMemo(
    () => properties.filter((p) => !p.hidden),
    [properties],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return visible.filter((p) => {
      if (filter === "custom" && p.hubspotDefined) return false;
      if (filter === "standard" && !p.hubspotDefined) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.label.toLowerCase().includes(q) ||
        p.groupName.toLowerCase().includes(q)
      );
    });
  }, [visible, search, filter]);

  const selectedNames = useMemo(
    () => new Set(selected.map((s) => s.property.name)),
    [selected],
  );

  function addProperty(property: HubSpotProperty) {
    if (selectedNames.has(property.name)) return;
    setSelected((prev) => [...prev, { property, instruction: "" }]);
  }

  function removeProperty(name: string) {
    setSelected((prev) => prev.filter((s) => s.property.name !== name));
  }

  function updateInstruction(name: string, instruction: string) {
    setSelected((prev) =>
      prev.map((s) => (s.property.name === name ? { ...s, instruction } : s)),
    );
  }

  const customCount = visible.filter((p) => !p.hubspotDefined).length;
  const standardCount = visible.filter((p) => p.hubspotDefined).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="px-8 py-8 border-b border-border bg-white">
        <h1 className="text-xl font-semibold text-foreground">
          ABM Context Designer
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Select which HubSpot Company properties the Prismic ABM Agent will have
          access to when generating personalized pages. For each property you
          include, describe how the agent should use it — this becomes part of the
          personalization instructions sent at generation time.
        </p>
      </div>

      <div className="flex h-[calc(100vh-113px)]">
        {/* Left panel — property browser */}
        <div className="flex flex-col flex-1 min-w-0 border-r border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-white flex items-center gap-3 shrink-0">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                Loading properties…
              </div>
            ) : error ? null : (
              <>
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by name, label or group…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-md border border-border bg-white text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="flex rounded-md border border-border overflow-hidden text-xs">
                  {(["all", "custom", "standard"] as Filter[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFilter(f)}
                      className={`px-3 py-2 capitalize transition-colors ${
                        filter === f
                          ? "bg-primary text-primary-foreground font-medium"
                          : "bg-white text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 text-xs ml-auto">
                  <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                    {visible.length} total
                  </span>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary font-medium">
                    {customCount} custom
                  </span>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                    {standardCount} standard
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {error ? (
              <div className="m-6 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/60 backdrop-blur-sm z-10">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-8" />
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Label
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Internal name
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Group
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Source
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-muted-foreground"
                      >
                        No properties match your search.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p) => {
                      const isSelected = selectedNames.has(p.name);
                      return (
                        <tr
                          key={p.name}
                          className={`border-b border-border last:border-0 transition-colors ${
                            isSelected
                              ? "bg-primary/5"
                              : "hover:bg-muted/20"
                          }`}
                        >
                          <td className="px-4 py-2.5">
                            <button
                              type="button"
                              onClick={() =>
                                isSelected ? removeProperty(p.name) : addProperty(p)
                              }
                              title={isSelected ? "Remove" : "Use this property"}
                              className={`flex items-center justify-center w-6 h-6 rounded transition-colors ${
                                isSelected
                                  ? "bg-primary/20 text-primary hover:bg-primary/30"
                                  : "border border-border text-muted-foreground hover:border-primary hover:text-primary"
                              }`}
                            >
                              {isSelected ? (
                                <X className="w-3 h-3" />
                              ) : (
                                <Plus className="w-3 h-3" />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-2.5 font-medium text-foreground">
                            {p.label}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                            {p.name}
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground text-xs">
                            {p.groupName}
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground text-xs">
                            {p.type}
                          </td>
                          <td className="px-4 py-2.5">
                            {p.hubspotDefined ? (
                              <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                standard
                              </span>
                            ) : (
                              <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary font-medium">
                                custom
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>

          {!loading && !error && (
            <div className="px-6 py-2 border-t border-border bg-white shrink-0">
              <p className="text-xs text-muted-foreground">
                {filtered.length} of {visible.length} properties shown
              </p>
            </div>
          )}
        </div>

        {/* Right panel — selected properties */}
        <div className="w-[420px] shrink-0 flex flex-col overflow-hidden bg-white">
          <div className="px-5 py-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Agent context
              </h2>
              {selected.length > 0 && (
                <span className="rounded-full bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5">
                  {selected.length}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Properties the ABM agent will receive per company, with instructions
              on how to use them.
            </p>
            {sampleCompanyName && (
              <p className="text-xs text-muted-foreground mt-2">
                Example values from:{" "}
                <span className="font-medium text-foreground">
                  {sampleCompanyName}
                </span>
              </p>
            )}
            {sampleLoading && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full border border-primary border-t-transparent animate-spin inline-block" />
                Loading example values…
              </p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
            {selected.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-center pb-8">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Plus className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  No properties selected
                </p>
                <p className="text-xs text-muted-foreground max-w-[240px]">
                  Click the{" "}
                  <span className="inline-flex items-center gap-0.5 font-medium">
                    <Plus className="w-3 h-3" /> Use
                  </span>{" "}
                  button on a property in the table to add it to the agent context.
                </p>
              </div>
            ) : (
              selected.map(({ property: p, instruction }) => {
                const exampleValue = sampleValues[p.name];
                return (
                  <div
                    key={p.name}
                    className="rounded-lg border border-border bg-white p-4 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-sm font-medium text-foreground">
                          {p.label}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground">
                          {p.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeProperty(p.name)}
                        className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="rounded-md bg-muted/40 px-3 py-2">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        Example value
                      </p>
                      <p
                        className={`text-sm ${
                          exampleValue
                            ? "text-foreground"
                            : "text-muted-foreground italic"
                        }`}
                      >
                        {exampleValue ?? "Not populated"}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-foreground">
                        How should the agent use this?
                      </label>
                      <textarea
                        rows={3}
                        placeholder={`e.g. "Use the company's industry to tailor the hero headline and pain points section to challenges specific to that sector."`}
                        value={instruction}
                        onChange={(e) =>
                          updateInstruction(p.name, e.target.value)
                        }
                        className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring resize-none"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
