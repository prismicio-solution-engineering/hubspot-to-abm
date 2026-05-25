export const SESSION_COOKIE_NAME = "hubspot_session";
export const LEGACY_SESSION_COOKIE_NAME = "session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

const SESSION_TOKEN_VERSION = "v2";
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export interface HubSpotSession {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
  sessionExpiresAt: number;
  portalId: string | null;
  hubDomain: string | null;
  scopes: string[];
}

export function sessionCookieOptions(maxAge = SESSION_DURATION_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET is not set or too short (min 16 chars).");
  }
  return secret;
}

async function importEncryptionKey(): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(getSecret()));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

function isHubSpotSession(value: unknown): value is HubSpotSession {
  const session = value as Partial<HubSpotSession> | null;
  return (
    !!session &&
    typeof session.accessToken === "string" &&
    typeof session.refreshToken === "string" &&
    typeof session.accessTokenExpiresAt === "number" &&
    typeof session.sessionExpiresAt === "number" &&
    (typeof session.portalId === "string" || session.portalId === null) &&
    (typeof session.hubDomain === "string" || session.hubDomain === null) &&
    Array.isArray(session.scopes) &&
    session.scopes.every((scope) => typeof scope === "string")
  );
}

export async function createSessionToken(session: HubSpotSession): Promise<string> {
  const key = await importEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    key,
    encoder.encode(JSON.stringify(session)),
  );

  return [
    SESSION_TOKEN_VERSION,
    toBase64Url(iv),
    toBase64Url(new Uint8Array(ciphertext)),
  ].join(".");
}

export async function getHubSpotSessionFromToken(
  token: string | undefined,
): Promise<HubSpotSession | null> {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== SESSION_TOKEN_VERSION) return null;

  try {
    const key = await importEncryptionKey();
    const iv = fromBase64Url(parts[1]);
    const ciphertext = fromBase64Url(parts[2]);
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: toArrayBuffer(iv) },
      key,
      toArrayBuffer(ciphertext),
    );
    const value = JSON.parse(decoder.decode(plaintext)) as unknown;

    if (!isHubSpotSession(value)) return null;
    if (value.sessionExpiresAt < Date.now()) return null;

    return value;
  } catch {
    return null;
  }
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  return (await getHubSpotSessionFromToken(token)) !== null;
}
