import { appUrl } from "../config";
import { AI_SYSTEM } from "./context";
import { DEFAULT_OPENROUTER_MODEL, openRouterKey, openRouterModel } from "./env";

type Completion =
  | { ok: true; content: string }
  | { ok: false; status: number; message: string };

function safeMessage(message: string) {
  return message.replace(/sk-or-[a-z0-9-]+/gi, "[redacted]").slice(0, 240);
}

async function complete(
  model: string,
  brief: string,
  jsonMode: boolean,
  system: string,
  maxTokens: number,
): Promise<Completion> {
  const key = openRouterKey();
  const body: Record<string, unknown> = {
    model,
    temperature: 0.2,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: system },
      { role: "user", content: brief },
    ],
  };
  if (jsonMode) body.response_format = { type: "json_object" };

  let res: Response;
  try {
    res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": appUrl(),
        "X-Title": "Control Tower",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(45_000),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha de rede";
    return { ok: false, status: 504, message: safeMessage(message) };
  }

  let data: {
    error?: { message?: string };
    choices?: { message?: { content?: string | null } }[];
  } = {};
  try {
    data = (await res.json()) as typeof data;
  } catch {
    data = {};
  }
  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      message: safeMessage(data.error?.message || `OpenRouter ${res.status}`),
    };
  }
  const content = data.choices?.[0]?.message?.content?.trim() || "";
  if (!content) return { ok: false, status: 502, message: "A IA não devolveu texto." };
  return { ok: true, content };
}

function pickSonnet(ids: string[]) {
  const sonnets = ids.filter((id) => /^anthropic\/claude[-.].*sonnet/i.test(id));
  return (
    sonnets.find((id) => id === DEFAULT_OPENROUTER_MODEL) ??
    sonnets.find((id) => /sonnet-4\.5|sonnet-4-5|claude-sonnet-4\.5/i.test(id)) ??
    sonnets.find((id) => !/preview|exp|alpha|beta/i.test(id)) ??
    sonnets[0] ??
    null
  );
}

async function listedSonnet() {
  const key = openRouterKey();
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { data?: { id?: string }[] };
    const ids = (data.data ?? []).map((row) => row.id).filter((id): id is string => Boolean(id));
    return pickSonnet(ids);
  } catch {
    return null;
  }
}

function emptyJsonBody(result: Completion) {
  return (
    !result.ok &&
    result.status === 502 &&
    (result.message === "A IA não devolveu texto." || result.message === "OpenRouter 502")
  );
}

/** json_object falhou (400) ou voltou vazio (502): tenta de novo sem o formato. */
function dropJsonMode(result: Completion) {
  return !result.ok && (result.status === 400 || emptyJsonBody(result));
}

async function askModel(model: string, brief: string, system: string, maxTokens: number) {
  let result = await complete(model, brief, true, system, maxTokens);
  if (dropJsonMode(result)) result = await complete(model, brief, false, system, maxTokens);
  return result;
}

export type OpenRouterAsk = {
  system?: string;
  maxTokens?: number;
};

/** Chamada só no servidor. Cada onda pede JSON com max_tokens 4000. */
export async function askOpenRouter(brief: string, ask: OpenRouterAsk = {}): Promise<Completion> {
  const preferred = openRouterModel();
  const system = ask.system?.trim() || AI_SYSTEM;
  const maxTokens = ask.maxTokens ?? 4000;
  let result = await askModel(preferred, brief, system, maxTokens);
  const missing = !result.ok && (result.status === 404 || /model/i.test(result.message));
  if (missing && preferred === DEFAULT_OPENROUTER_MODEL) {
    const fallback = await listedSonnet();
    if (fallback && fallback !== preferred) result = await askModel(fallback, brief, system, maxTokens);
  }
  return result;
}
