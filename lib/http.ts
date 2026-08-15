/** Only same-origin relative paths. Blocks //evil.com and /\\evil. */
export function safeInternalPath(raw: string | null | undefined): string {
  if (!raw) return "/";
  let path = raw.trim();
  try {
    path = decodeURIComponent(path);
  } catch {
    return "/";
  }
  if (!path.startsWith("/")) return "/";
  if (path.startsWith("//") || path.startsWith("/\\") || path.includes("\\")) return "/";
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(path.slice(1))) return "/";
  if (path === "/login" || path.startsWith("/login?")) return "/";
  return path;
}

export function cookieSecure(req: Request) {
  const proto =
    req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || new URL(req.url).protocol.replace(":", "");
  return proto === "https";
}

/** Accept only Google Drive http(s) links. Empty is allowed. */
export function sanitizeDriveUrl(raw: string | null | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    const host = url.hostname.toLowerCase();
    if (host !== "drive.google.com" && host !== "docs.google.com") return null;
    return url.toString();
  } catch {
    return null;
  }
}
