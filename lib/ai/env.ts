/**
 * Chave e modelo do OpenRouter. Só o servidor importa este arquivo.
 * A chave não vai para o browser: o cliente recebe só um booleano.
 */
export const AI_UNCONFIGURED = "IA não configurada";

/** Modelo estável quando OPENROUTER_MODEL não está definido. */
export const DEFAULT_OPENROUTER_MODEL = "anthropic/claude-sonnet-4.5";

export function openRouterKey() {
  return process.env.OPENROUTER_API_KEY?.trim() || "";
}

export function isOpenRouterConfigured() {
  return Boolean(openRouterKey());
}

export function openRouterModel() {
  return process.env.OPENROUTER_MODEL?.trim() || DEFAULT_OPENROUTER_MODEL;
}
