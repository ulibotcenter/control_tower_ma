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
