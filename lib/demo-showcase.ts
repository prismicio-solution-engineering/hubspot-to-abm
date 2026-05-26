export interface DemoShowcase {
  id: string;
  name: string;
  documentLabel: string;
  repository: string;
  baselineDocumentId: string;
  documentUid: string | null;
  customType: string;
  lang: string;
  previewUrl: string;
  canEmbedPreview: boolean;
  releasePrefix: string;
  editedLabel: string;
  masterToken?: string;
  writeToken?: string;
}

export type DemoShowcaseFormInput = Omit<
  DemoShowcase,
  "id" | "editedLabel" | "documentLabel" | "releasePrefix"
> & {
  id?: string;
  editedLabel?: string;
  documentLabel?: string;
  releasePrefix?: string;
};

export const DEMO_SHOWCASES: DemoShowcase[] = [
  {
    id: "martech-madrid",
    name: "Martech Madrid",
    documentLabel: "Martech Madrid Blueprint",
    repository: "template-landing",
    baselineDocumentId: "ae9WThYAACoALXhJ",
    documentUid: null,
    customType: "page",
    lang: "en-us",
    previewUrl: "",
    canEmbedPreview: false,
    releasePrefix: "Martech Madrid",
    editedLabel: "Demo base page",
  },
];

export const DEFAULT_DEMO_SHOWCASE_ID = DEMO_SHOWCASES[0]?.id ?? "";

export function getDemoShowcase(id: string | null | undefined): DemoShowcase | null {
  if (!id) return null;
  return DEMO_SHOWCASES.find((demo) => demo.id === id) ?? null;
}

export function getDefaultDemoShowcase(): DemoShowcase {
  const demo = getDemoShowcase(DEFAULT_DEMO_SHOWCASE_ID);
  if (!demo) throw new Error("No demo showcase is configured.");
  return demo;
}

export function getDemoEnvPrefix(id: string): string {
  return id.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
}

export function createDemoShowcase(input: DemoShowcaseFormInput): DemoShowcase {
  const id = (input.id ?? input.name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return {
    id: id || "custom-demo",
    name: input.name.trim(),
    documentLabel: (input.documentLabel ?? input.name).trim(),
    repository: input.repository.trim(),
    baselineDocumentId: input.baselineDocumentId.trim(),
    documentUid: input.documentUid?.trim() || null,
    customType: input.customType.trim(),
    lang: input.lang.trim(),
    previewUrl: input.previewUrl.trim(),
    canEmbedPreview: input.canEmbedPreview,
    releasePrefix: (input.releasePrefix ?? input.name).trim(),
    editedLabel: input.editedLabel?.trim() || "Custom demo",
    masterToken: input.masterToken?.trim() || undefined,
    writeToken: input.writeToken?.trim() || undefined,
  };
}
