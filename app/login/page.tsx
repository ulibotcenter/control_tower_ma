import Image from "next/image";
import { ALLOWED_EMAIL_DOMAIN, PROGRAM_NAME, PROGRAM_SPONSOR } from "@/lib/constants";
import { allowDevLogin, isSupabaseAuthEnabled } from "@/lib/config";
import { getSession } from "@/lib/auth";
import { safeInternalPath } from "@/lib/http";
import { redirect } from "next/navigation";
import { LoginFlash } from "@/components/shell/login-flash";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; left?: string; idle?: string }>;
}) {
  const session = await getSession();
  const params = await searchParams;
  const next = safeInternalPath(params.next);
  const signedOut = params.left === "1" || params.idle === "1";
  if (session && !signedOut) redirect(next);

  const supabaseAuth = isSupabaseAuthEnabled();
  const dev = allowDevLogin() && !process.env.ELEVA_DEV_PASSWORD && !supabaseAuth;

  const flash = params.idle === "1" ? "idle" : params.left === "1" ? "left" : null;

  return (
    <div className="min-h-screen bg-navy text-cream">
      <LoginFlash kind={flash} />
      <div className="brand-bar" aria-hidden />
      <div className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-12">
        <div className="grid w-full items-center gap-10 lg:grid-cols-2">
          <div>
            <Image
              src="/eleva-logo.png"
              alt="Eleva Projects"
              width={220}
              height={53}
              priority
              className="h-10 w-auto"
            />
            <p className="kicker mt-8 !text-cyan">tower.elevaprojects.com</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Control Tower
              <span className="mt-1 block text-xl text-gold">
                {PROGRAM_NAME} · {PROGRAM_SPONSOR}
              </span>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-cream/80">
              {supabaseAuth
                ? "Acesso individual. Só quem tem conta entra. Sem cadastro nesta tela."
                : "Torre de controle do programa de M&A. Login só da Eleva. A tela é compartilhada em reunião — AD+R, Pacta, M12C e os alvos não têm conta."}
            </p>
          </div>

          <div className="paper p-6 text-ink sm:p-8">
            <p className="kicker">Entrar</p>
            <h2 className="mt-1 text-xl font-semibold text-navy">
              {supabaseAuth ? "Sessão individual" : "Sessão da Eleva"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {supabaseAuth
                ? "Use o e-mail e a senha da sua conta. A sessão vale 12 horas."
                : `E-mail @${ALLOWED_EMAIL_DOMAIN}. A sessão vale 12 horas.`}
            </p>

            <form action="/api/auth/login" method="post" className="mt-6 space-y-4">
              <input type="hidden" name="next" value={next} />
              <div>
                <label htmlFor="email">{supabaseAuth ? "E-mail" : "E-mail Eleva"}</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="username"
                  autoFocus
                  placeholder={supabaseAuth ? "e-mail" : `nome@${ALLOWED_EMAIL_DOMAIN}`}
                />
              </div>
              <div>
                <label htmlFor="password">Senha</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </div>
              {params.left === "1" && (
                <p className="text-sm text-go" role="status">
                  Sessão encerrada.
                </p>
              )}
              {params.idle === "1" && (
                <p className="text-sm text-go" role="status">
                  Sessão encerrada por inatividade.
                </p>
              )}
              {params.error && (
                <p className="text-sm font-medium text-alert" role="alert">
                  {params.error === "denied"
                    ? "Acesso não autorizado."
                    : params.error === "domain"
                      ? "Acesso não autorizado."
                      : "E-mail ou senha incorretos."}
                </p>
              )}
              <button type="submit" className="btn btn-gold w-full">
                Entrar
              </button>
            </form>

            {dev && (
              <p className="mt-5 text-[12px] leading-relaxed text-muted">
                Ambiente local sem senha fixa: qualquer senha entra com e-mail @
                {ALLOWED_EMAIL_DOMAIN}. Em produção isso fica desligado.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
