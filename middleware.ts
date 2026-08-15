import { NextResponse, type NextRequest } from "next/server";
import { parseMode } from "./lib/mode";
import { isIdleExpired, SEEN_COOKIE } from "./lib/session";

const SESSION_COOKIE = "ct-session";

const PUBLIC = ["/login", "/api/auth/login", "/api/auth/logout", "/api/alerts/weekly", "/api/alerts/inbox"];

function clearSession(res: NextResponse) {
  const gone = { path: "/", maxAge: 0 };
  res.cookies.set(SESSION_COOKIE, "", gone);
  res.cookies.set("ct-mode", "", gone);
  res.cookies.set("ct-present", "", gone);
  res.cookies.set(SEEN_COOKIE, "", gone);
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (
    PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    if (pathname === "/login" && isIdleExpired(req.cookies.get(SEEN_COOKIE)?.value)) {
      const res = NextResponse.next();
      clearSession(res);
      return res;
    }
    return NextResponse.next();
  }

  const session = req.cookies.get(SESSION_COOKIE)?.value;
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname.startsWith("/") && !pathname.startsWith("//") ? pathname : "/");
    return NextResponse.redirect(url);
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

  const mode = parseMode(req.cookies.get("ct-mode")?.value);
  if (mode === "target" && (pathname.startsWith("/inbox") || pathname.startsWith("/decisions") || pathname.startsWith("/export"))) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (mode === "advisors" && (pathname.startsWith("/inbox") || pathname.startsWith("/export"))) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.png$|.*\\.ico$).*)"],
};
