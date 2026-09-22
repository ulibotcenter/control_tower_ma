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

/** Minúsculas, aspas fora, espaços dobrados. */
export function normalizeSeen(value: string) {
  return value
    .toLowerCase()
    .replace(/[“”„«»"'`´]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export type SeenProposal = {
  kind: string;
  status: string;
  text: string;
  title: string;
};

function bits(text: string, title: string) {
  return [normalizeSeen(text), normalizeSeen(title)].filter(Boolean);
}

function nearly(a: string, b: string) {
  if (!a || !b) return false;
  if (a === b) return true;
  const short = a.length <= b.length ? a : b;
  const long = a.length <= b.length ? b : a;
  return short.length >= 16 && long.includes(short);
}

const KEY_TOKENS = [
  "targa",
  "cnd",
  "municipal",
  "nda",
  "tese",
  "envelope",
  "jardel",
  "hunter",
  "relatorios",
  "70% carteira",
  "george",
] as const;

/** Minúsculas, sem acento, sem pontuação. O corpo entra só nos 120 primeiros. */
export function fingerprintText(title: string, text: string) {
  return `${title} ${text.slice(0, 120)}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenHay(title: string, text: string) {
  return `${title} ${text}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9%]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function keyTokensOf(title: string, text: string) {
  const hay = ` ${tokenHay(title, text)} `;
  const found: string[] = [];
  for (const token of KEY_TOKENS) {
    if (token.includes("%")) {
      if (hay.includes(` ${token} `) || hay.includes(" 70 carteira ")) found.push(token);
      continue;
    }
    const re = new RegExp(`(?:^|\\s)${token}(?:\\s|$)`);
    if (re.test(hay.trim())) found.push(token);
  }
  return found;
}

export type SeenIndex = {
  prints: Set<string>;
  tokens: Set<string>;
};

function printKey(kind: string, title: string, text: string) {
  return `${kind}|${fingerprintText(title, text)}`;
}

export function seenIndex(rows: { kind: string; text: string; title?: string }[]): SeenIndex {
  const index: SeenIndex = { prints: new Set(), tokens: new Set() };
  for (const row of rows) rememberSeen(index, row);
  return index;
}

export function rememberSeen(index: SeenIndex, row: { kind: string; text: string; title?: string }) {
  const title = row.title || "";
  index.prints.add(printKey(row.kind, title, row.text));
  for (const token of keyTokensOf(title, row.text)) index.tokens.add(`${row.kind}|${token}`);
}

/** Fingerprint igual, ou o mesmo kind já guardou um token-chave. */
export function blockedBySeen(draft: { kind: string; text: string; title?: string }, index: SeenIndex) {
  const title = draft.title || "";
  if (index.prints.has(printKey(draft.kind, title, draft.text))) return true;
  return keyTokensOf(title, draft.text).some((token) => index.tokens.has(`${draft.kind}|${token}`));
}

const SETTLED = new Set(["aceita", "descartada", "editada"]);

/** Já existe neste deal: mesmo kind e texto/título parecido, ou título já aceito, descartado ou editado. */
export function repeatsSeen(
  draft: { kind: string; text: string; title?: string },
  prior: SeenProposal[],
) {
  const mine = bits(draft.text, draft.title || "");
  const title = normalizeSeen(draft.title || "");
  for (const row of prior) {
    const theirs = bits(row.text, row.title);
    if (draft.kind === row.kind && mine.some((left) => theirs.some((right) => nearly(left, right)))) return true;
    if (!SETTLED.has(row.status) || !title) continue;
    if (theirs.some((right) => right === title)) return true;
  }
  return false;
}
