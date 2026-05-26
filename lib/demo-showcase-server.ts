import "server-only";

import {
  getDemoEnvPrefix,
  getDemoShowcase,
  type DemoShowcase,
} from "./demo-showcase";

export interface DemoPrismicReadConfig {
  repository: string;
  masterToken: string;
  demo: DemoShowcase | null;
}

export interface DemoPrismicWriteConfig extends DemoPrismicReadConfig {
  writeToken: string;
}

function getEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

function getEnvValue(value: string | null | undefined): string | undefined {
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

function normalizeRepository(value: string | null | undefined): string | null {
  const repository = value?.trim();
  if (!repository) return null;
  if (!/^[a-z0-9][a-z0-9-]{1,}[a-z0-9]$/.test(repository)) {
    throw new Error("Invalid Prismic repository.");
  }
  return repository;
}

export function getPrismicReadConfigForDemo(
  demoId: string | null | undefined,
  repositoryOverride?: string | null,
  masterTokenOverride?: string | null,
): DemoPrismicReadConfig {
  const demo = demoId ? getDemoShowcase(demoId) : null;
  const customRepository = normalizeRepository(repositoryOverride);
  if (demoId && !demo && !customRepository) throw new Error("Unknown demo.");

  const prefix = demo ? getDemoEnvPrefix(demo.id) : null;
  const repository =
    (prefix ? getEnv(`PRISMIC_${prefix}_REPOSITORY`) : undefined) ??
    demo?.repository ??
    customRepository ??
    getEnv("PRISMIC_REPOSITORY");
  const masterToken =
    getEnvValue(masterTokenOverride) ??
    (prefix ? getEnv(`PRISMIC_${prefix}_MASTER_TOKEN`) : undefined) ??
    getEnv("PRISMIC_MASTER_TOKEN");

  if (!repository) throw new Error("PRISMIC_REPOSITORY is not set");
  if (!masterToken) throw new Error("PRISMIC_MASTER_TOKEN is not set");

  return { repository, masterToken, demo };
}

export function getPrismicWriteConfigForDemo(
  demoId: string | null | undefined,
  repositoryOverride?: string | null,
  masterTokenOverride?: string | null,
  writeTokenOverride?: string | null,
): DemoPrismicWriteConfig {
  const readConfig = getPrismicReadConfigForDemo(
    demoId,
    repositoryOverride,
    masterTokenOverride,
  );
  const prefix = readConfig.demo ? getDemoEnvPrefix(readConfig.demo.id) : null;
  const writeToken =
    getEnvValue(writeTokenOverride) ??
    (prefix ? getEnv(`PRISMIC_${prefix}_WRITE_TOKEN`) : undefined) ??
    getEnv("PRISMIC_WRITE_TOKEN");

  if (!writeToken) throw new Error("PRISMIC_WRITE_TOKEN is not set");

  return { ...readConfig, writeToken };
}
