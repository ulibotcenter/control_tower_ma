/**
 * Troca de modo de reunião.
 *
 * O modo é reemitido dentro do cookie de sessão (httpOnly + HMAC), então
 * trocar de modo exige uma sessão válida e não pode ser feito pelo devtools.
 *
 * Duas travas, ambas verificadas aqui e não só na tela:
 *   entrar em Alvo  → precisa dizer qual operação está na sala;
 *   sair de Alvo    → precisa digitar TARGET_EXIT_PHRASE.
 */
import { NextResponse } from "next/server";
import { SESSION_COOKIE, encodeSessionToken, getSessionPayload } from "@/lib/auth";
import { cookieSecure } from "@/lib/http";
import { getDealSlugs } from "@/lib/data/provider";
import {
  matchesExitPhrase,
  parseDealSlug,
  parseMode,
  TARGET_EXIT_PHRASE,
  type MeetingState,
} from "@/lib/meeting";
import { LEGACY_MODE_COOKIE } from "@/lib/mode";
import { remainingMaxAge } from "@/lib/session-token";

export async function POST(req: Request) {
  const session = await getSessionPayload();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as { mode?: string; targetDeal?: string; confirm?: string };
  const mode = parseMode(body.mode);
  const current = session.meeting;

  if (current.mode === "target" && mode !== "target" && !matchesExitPhrase(body.confirm)) {
    return NextResponse.json(
      { error: "confirm_required", phrase: TARGET_EXIT_PHRASE },
      { status: 403 },
    );
  }

  let targetDeal: string | null = null;
  if (mode === "target") {
    targetDeal = parseDealSlug(body.targetDeal) ?? current.targetDeal;
    if (!targetDeal) {
      return NextResponse.json({ error: "target_deal_required" }, { status: 400 });
    }
    if (!getDealSlugs().includes(targetDeal)) {
      return NextResponse.json({ error: "unknown_deal" }, { status: 400 });
    }
  }

  const meeting: MeetingState = { mode, targetDeal };
  const res = NextResponse.json({ ok: true, ...meeting });
  res.cookies.set(
    SESSION_COOKIE,
    // Mantém o `exp` original: trocar de modo não renova a sessão de 12h.
    await encodeSessionToken(session.user, meeting, session.expiresAt),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: cookieSecure(req),
      path: "/",
      maxAge: remainingMaxAge(session.expiresAt),
    },
  );
  res.cookies.set(LEGACY_MODE_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
