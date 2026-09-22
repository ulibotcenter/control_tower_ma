/** Texto dobrado para não repetir proposta já pendente. */
export function foldProposalText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokens(folded: string) {
  return folded.split(" ").filter((word) => word.length >= 4);
}

/** Igualdade, contenção longa, ou quase os mesmos tokens. "verificar X" diferente não cola. */
export function proposalsNear(a: string, b: string) {
  const fa = foldProposalText(a);
  const fb = foldProposalText(b);
  if (!fa || !fb) return false;
  if (fa === fb) return true;
  const short = fa.length <= fb.length ? fa : fb;
  const long = fa.length <= fb.length ? fb : fa;
  if (short.length >= 24 && long.includes(short)) return true;
  const ta = tokens(fa);
  const tb = tokens(fb);
  if (ta.length < 5 || tb.length < 5) return false;
  const right = new Set(tb);
  const seen = new Set<string>();
  let inter = 0;
  for (const token of ta) {
    if (seen.has(token)) continue;
    seen.add(token);
    if (right.has(token)) inter += 1;
  }
  const union = new Set([...ta, ...tb]).size;
  return union > 0 && inter / union >= 0.85;
}

export function isNearAny(text: string, prior: string[]) {
  return prior.some((item) => proposalsNear(item, text));
}
