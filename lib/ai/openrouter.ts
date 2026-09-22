import { appUrl } from "../config";
import { AI_SYSTEM } from "./context";
import { DEFAULT_OPENROUTER_MODEL, openRouterKey, openRouterModel } from "./env";

type Completion =
  | { ok: true; content: string }
  | { ok: false; status: number; message: string };

function safeMessage(message: string) {
  return message.replace(/sk-or-[a-z0-9-]+/gi, "[redacted]").slice(0, 240);
}

async function complete(model: string, brief: string, jsonMode: boolean): Promise<Completion> {
  const key = openRouterKey();
  const body: Record<string, unknown> = {
    model,
    temperature: 0.2,
    max_tokens: 1200,
    messages: [
      { role: "system", content: AI_SYSTEM },
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

/** Chamada só no servidor. Se o modelo padrão não existir, usa o Sonnet estável da lista. */
export async function askOpenRouter(brief: string): Promise<Completion> {
  const preferred = openRouterModel();
  let result = await complete(preferred, brief, true);
  if (!result.ok && result.status === 400) result = await complete(preferred, brief, false);
  const missing = !result.ok && (result.status === 404 || /model/i.test(result.message));
  if (missing && preferred === DEFAULT_OPENROUTER_MODEL) {
    const fallback = await listedSonnet();
    if (fallback && fallback !== preferred) {
      result = await complete(fallback, brief, true);
      if (!result.ok && result.status === 400) result = await complete(fallback, brief, false);
    }
  }
  return result;
}
