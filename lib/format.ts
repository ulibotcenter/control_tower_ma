export function dueSortKey(due: string) {
  if (!due || due === "a confirmar") return Number.MAX_SAFE_INTEGER;
  const day = due.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!day) return Number.MAX_SAFE_INTEGER - 1;
  return Date.parse(`${day[1]}-${day[2]}-${day[3]}`);
}

export function formatDate(iso: string) {
  if (!iso || iso === "a confirmar") return "a confirmar";
  const day = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (day) return `${day[3]}/${day[2]}/${day[1]}`;
  return iso;
}

/** Rótulo da última varredura ok do Drive (America/Sao_Paulo). */
export function formatDriveSyncStamp(iso: string | null | undefined): string {
  if (!iso) return "Drive · ainda não sincronizado";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Drive · ainda não sincronizado";
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  const hh = get("hour");
  const mm = get("minute");
  const dd = get("day");
  const mo = get("month");
  if (!hh || !mm || !dd || !mo) return "Drive · ainda não sincronizado";
  return `Drive · atualizado às ${hh}:${mm} de ${dd}/${mo}`;
}

export function initials(email: string) {
  const local = email.split("@")[0] || "E";
  return local.slice(0, 2).toUpperCase();
}

export function displayName(email: string) {
  const lower = email.toLowerCase();
  if (lower.startsWith("erica")) return "Erica Oliveira";
  if (lower.startsWith("uli")) return "Uli";
  if (lower.startsWith("camila")) return "Camila Kovacevick";
  if (lower.startsWith("matheus")) return "Matheus Vasconcelos";
  const local = email.split("@")[0] || "Eleva";
  return local
    .split(/[._-]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}
