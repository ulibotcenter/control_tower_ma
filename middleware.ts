import { NextResponse, type NextRequest } from "next/server";
import { isDealPath } from "./lib/meeting";
import { hasSessionSecret, MISSING_SECRET } from "./lib/secret";
import { decodeSessionToken, SESSION_COOKIE } from "./lib/session-token";
import { isIdleExpired, SEEN_COOKIE } from "./lib/session";

const PUBLIC = ["/login", "/api/auth/login", "/api/auth/logout", "/api/alerts/weekly", "/api/alerts/inbox"];

function dealHouseSlug(pathname: string, house: string): string | null {
  const match = pathname.match(new RegExp(`^/deals/([a-z0-9][a-z0-9-]{0,60})/${house}/?$`));
  return match?.[1] ?? null;
}

function clearSession(res: NextResponse) {
  const gone = { path: "/", maxAge: 0 };
  res.cookies.set(SESSION_COOKIE, "", gone);
  res.cookies.set("ct-mode", "", gone);
  res.cookies.set("ct-present", "", gone);
  res.cookies.set(SEEN_COOKIE, "", gone);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  // Sem chave de assinatura a torre não sobe: nada de sessão, nada de login.
  if (!hasSessionSecret()) {
    if (pathname === "/login") return NextResponse.next();
    if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/")) {
      return NextResponse.json({ error: "config", message: MISSING_SECRET }, { status: 503 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "?error=config";
    return NextResponse.redirect(url);
  }

  if (
    PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  ) {
    if (pathname === "/login" && isIdleExpired(req.cookies.get(SEEN_COOKIE)?.value)) {
      const res = NextResponse.next();
      clearSession(res);
      return res;
    }
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await decodeSessionToken(token);
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname.startsWith("/") && !pathname.startsWith("//") ? pathname : "/");
    const res = NextResponse.redirect(url);
    // Cookie presente mas inválido: assinatura quebrada ou expirada. Some com ele.
    if (token) clearSession(res);
    return res;
  }

  if (isIdleExpired(req.cookies.get(SEEN_COOKIE)?.value)) {
    if (pathname.startsWith("/api/")) {
      const res = NextResponse.json({ error: "idle" }, { status: 401 });
      clearSession(res);
      return res;
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "?idle=1";
    const res = NextResponse.redirect(url);
    clearSession(res);
    return res;
  }

  const { mode, targetDeal } = session.meeting;
  if (mode === "target") {
    if (
      pathname.startsWith("/inbox") ||
      pathname.startsWith("/decisions") ||
      pathname.startsWith("/export") ||
      pathname.startsWith("/ia")
    ) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    // Reunião travada num alvo: o outro deal não existe nesta sessão.
    if (targetDeal && pathname.startsWith("/deals/") && !isDealPath(pathname, targetDeal)) {
      return NextResponse.redirect(new URL(`/deals/${targetDeal}`, req.url));
    }
    // RH e Leitura Interna não são URL útil para o Alvo.
    const hidden = dealHouseSlug(pathname, "leitura") ?? dealHouseSlug(pathname, "rh");
    if (hidden) return NextResponse.redirect(new URL(`/deals/${hidden}`, req.url));
  }
  if (
    mode === "advisors" &&
    (pathname.startsWith("/inbox") || pathname.startsWith("/export") || pathname.startsWith("/ia"))
  ) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (mode !== "operate") {
    const leitura = dealHouseSlug(pathname, "leitura");
    if (leitura) return NextResponse.redirect(new URL(`/deals/${leitura}`, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.png$|.*\\.ico$).*)"],
};
