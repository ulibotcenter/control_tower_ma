/** Persistência real: URL + service role. Sem service role a torre não escreve no Postgres. */
export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
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

export function allowDevLogin() {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.ALLOW_DEV_LOGIN !== "false";
}
