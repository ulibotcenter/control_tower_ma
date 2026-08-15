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
  if (email.toLowerCase().startsWith("erica")) return "Erica Oliveira";
  const local = email.split("@")[0] || "Eleva";
  return local
    .split(/[._-]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}
