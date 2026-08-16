function env(name: string) {
  return process.env[name]?.trim() || "";
}

export function supabaseUrl() {
  return env("NEXT_PUBLIC_SUPABASE_URL") || env("SUPABASE_URL");
}

export function supabaseServiceKey() {
  return env("SUPABASE_SERVICE_ROLE_KEY");
}

/** Persistência real: URL + service role no servidor. */
export function isSupabaseConfigured() {
  return Boolean(supabaseUrl() && supabaseServiceKey());
}

/** Vercel / produção: nunca gravar em .data (efêmero). */
export function forbidLocalStore() {
  return process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
}

export function hasSupabaseAnon() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function isDriveConfigured() {
  const folder = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const service = process.env.GOOGLE_SERVICE_ACCOUNT;
  const oauth =
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
    process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
    process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  return Boolean(folder && (service || oauth));
}

export function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export function alertEmail() {
  return process.env.ALERT_EMAIL || "erica@elevaprojects.com";
}

export function driveRootId() {
  return process.env.GOOGLE_DRIVE_FOLDER_ID || "1VlZu-j9unQWpcjf9oqEkLIyIzjUiJAuS";
}

export function appUrl() {
  return env("NEXT_PUBLIC_APP_URL") || "https://tower.elevaprojects.com";
}

export function allowDevLogin() {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.ALLOW_DEV_LOGIN !== "false";
}

export function wantsSupabaseAuth() {
  const v = env("SUPABASE_AUTH").toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/**
 * Login via Supabase Auth (signInWithPassword).
 * Ligar: SUPABASE_AUTH=1 (ou true) + URL + ANON_KEY.
 * Service role não entra neste caminho.
 */
export function isSupabaseAuthEnabled() {
  return wantsSupabaseAuth() && hasSupabaseAnon();
}
