/**
 * Chave de assinatura da torre.
 *
 * SESSION_SECRET é obrigatória e não tem fallback. Sem ela a torre não
 * assina, não verifica e não autentica: falha alto em vez de degradar para
 * uma chave conhecida. String vazia ou só espaços conta como ausente.
 *
 * O HMAC usa Web Crypto (e não node:crypto) porque o middleware roda no
 * runtime Edge e precisa verificar o mesmo cookie que o servidor emitiu.
 */

export const MISSING_SECRET =
  "SESSION_SECRET ausente. Defina a variável de ambiente antes de subir a torre — não existe chave padrão.";

export function hasSessionSecret() {
  return Boolean(process.env.SESSION_SECRET?.trim());
}

export function sessionSecret(): string {
  const value = process.env.SESSION_SECRET?.trim();
  if (!value) throw new Error(MISSING_SECRET);
  return value;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

let cachedKey: { secret: string; key: Promise<CryptoKey> } | null = null;

function hmacKey() {
  const secret = sessionSecret();
  if (!cachedKey || cachedKey.secret !== secret) {
    cachedKey = {
      secret,
      key: crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      ),
    };
  }
  return cachedKey.key;
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function encodeBase64Url(text: string) {
  return bytesToBase64Url(encoder.encode(text));
}

export function decodeBase64Url(value: string) {
  return decoder.decode(base64UrlToBytes(value));
}

export async function signPayload(payload: string): Promise<string> {
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(), encoder.encode(payload));
  return bytesToBase64Url(new Uint8Array(signature));
}

/** Comparação de tempo constante — o Edge não tem timingSafeEqual. */
function equalsInConstantTime(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyPayload(payload: string, signature: string): Promise<boolean> {
  return equalsInConstantTime(signature, await signPayload(payload));
}
