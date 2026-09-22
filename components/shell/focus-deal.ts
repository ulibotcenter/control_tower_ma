import { parseDealSlug } from "@/lib/meeting";

/**
 * Rotas em que o deal em foco não está no caminho.
 * A URL carrega `?deal=loopert`. Sem a query, a sidebar volta à navegação de produto.
 */
export const FOCUS_ROUTES = ["/decisions", "/inbox", "/export/pack", "/glossary", "/ia"] as const;

/** Casas do deal que ficam no caminho, depois do slug. Trocar de operação mantém a casa. */
const DEAL_HOUSES = ["timeline", "opl", "documentos", "indicadores", "rh", "leitura"] as const;

export function dealHouseHref(path: string, slug: string): string | null {
  const match = path.match(/^\/deals\/[^/]+\/([^/]+)$/);
  if (!match || !(DEAL_HOUSES as readonly string[]).includes(match[1])) return null;
  return `/deals/${slug}/${match[1]}`;
}

export function isFocusRoute(path: string) {
  return FOCUS_ROUTES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function focusSlugFromQuery(value: string | string[] | undefined | null): string | null {
  return parseDealSlug(Array.isArray(value) ? value[0] : value);
}

/** Mesma tela, outro deal. Não troca de rota. */
export function hrefWithDeal(path: string, slug: string, current?: string) {
  const q = new URLSearchParams(current ?? "");
  q.set("deal", slug);
  return `${path}?${q.toString()}`;
}
