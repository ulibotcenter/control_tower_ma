import { NextResponse } from "next/server";
import { SESSION_COOKIE, authenticate, encodeSession, isElevaEmail } from "@/lib/auth";
import { cookieSecure, safeInternalPath } from "@/lib/http";

export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get("email") || "");
  const password = String(form.get("password") || "");
  const next = safeInternalPath(String(form.get("next") || "/"));

  const origin = new URL(req.url).origin;
  if (!isElevaEmail(email)) {
    return NextResponse.redirect(`${origin}/login?error=domain&next=${encodeURIComponent(next)}`, {
      status: 303,
    });
  }

  const user = authenticate(email, password);
  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=auth&next=${encodeURIComponent(next)}`, {
      status: 303,
    });
  }

  const res = NextResponse.redirect(new URL(next, origin), { status: 303 });
  res.cookies.set(SESSION_COOKIE, encodeSession(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(req),
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
