import "server-only";

export interface PrismicReadConfigInput {
  repository?: string | null;
  masterToken?: string | null;
}

export interface PrismicWriteConfigInput extends PrismicReadConfigInput {
  writeToken?: string | null;
}

export interface PrismicReadConfig {
  repository: string;
  masterToken: string;
}

export interface PrismicWriteConfig extends PrismicReadConfig {
  writeToken: string;
}

function getValue(value: string | null | undefined): string | undefined {
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

function normalizeRepository(value: string | null | undefined): string | undefined {
  const repository = getValue(value);
  if (!repository) return undefined;
  if (!/^[a-z0-9][a-z0-9-]{1,}[a-z0-9]$/.test(repository)) {
    throw new Error("Invalid Prismic repository.");
  }
  return repository;
}

export function getPrismicReadConfig(input: PrismicReadConfigInput = {}): PrismicReadConfig {
  const repository = normalizeRepository(input.repository) ?? getValue(process.env.PRISMIC_REPOSITORY);
  const masterToken = getValue(input.masterToken) ?? getValue(process.env.PRISMIC_MASTER_TOKEN);

  if (!repository) throw new Error("PRISMIC_REPOSITORY is not set");
  if (!masterToken) throw new Error("PRISMIC_MASTER_TOKEN is not set");

  return { repository, masterToken };
}

export function getPrismicWriteConfig(input: PrismicWriteConfigInput = {}): PrismicWriteConfig {
  const readConfig = getPrismicReadConfig(input);
  const writeToken = getValue(input.writeToken) ?? getValue(process.env.PRISMIC_WRITE_TOKEN);

  if (!writeToken) throw new Error("PRISMIC_WRITE_TOKEN is not set");

  return { ...readConfig, writeToken };
}
