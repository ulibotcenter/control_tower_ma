import { NextResponse, type NextRequest } from "next/server";
import { parseMode } from "./lib/mode";

const SESSION_COOKIE = "ct-session";

const PUBLIC = ["/login", "/api/auth/login", "/api/alerts/weekly", "/api/alerts/inbox"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (
    PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const session = req.cookies.get(SESSION_COOKIE)?.value;
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname.startsWith("/") && !pathname.startsWith("//") ? pathname : "/");
    return NextResponse.redirect(url);
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
