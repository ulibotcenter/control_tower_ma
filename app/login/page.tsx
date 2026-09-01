import Image from "next/image";
import { ALLOWED_EMAIL_DOMAIN, PROGRAM_NAME, PROGRAM_SPONSOR } from "@/lib/constants";
import { allowDevLogin, isSupabaseAuthEnabled } from "@/lib/config";
import { getSession } from "@/lib/auth";
import { safeInternalPath } from "@/lib/http";
import { hasSessionSecret } from "@/lib/secret";
import { redirect } from "next/navigation";
import { LoginFlash } from "@/components/shell/login-flash";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; left?: string; idle?: string }>;
}) {
  const configured = hasSessionSecret();
  const session = configured ? await getSession() : null;
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
      <div className="mx-auto flex min-h-screen w-full max-w-[26rem] flex-col justify-center px-4 py-12">
        <div className="mb-8">
          <Image
            src="/eleva-logo.png"
            alt="Eleva Projects"
            width={220}
            height={53}
            priority
            className="h-9 w-auto"
          />
          <p className="mt-6 text-[15px] leading-relaxed text-cream/75">
            {supabaseAuth
              ? `${PROGRAM_NAME} · ${PROGRAM_SPONSOR}. Acesso individual — só entra quem tem conta.`
              : `${PROGRAM_NAME} · ${PROGRAM_SPONSOR}. Acesso da Eleva.`}
          </p>
        </div>

        <div className="paper p-6 text-ink sm:p-7">
            {!configured ? (
              <>
                <p className="kicker">Configuração</p>
                <h2 className="mt-1 text-xl font-semibold text-navy">Torre fora do ar</h2>
                <p className="mt-3 text-sm leading-relaxed text-ink">
                  A variável de ambiente <code>SESSION_SECRET</code> não está definida. Sem ela a
                  torre não assina sessão e não deixa ninguém entrar — não existe chave padrão.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Defina <code>SESSION_SECRET</code> no ambiente (Vercel → Settings → Environment
                  Variables, ou <code>.env.local</code> em desenvolvimento) e recarregue esta
                  página.
                </p>
              </>
            ) : (
              <>
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
                  {params.error === "denied" || params.error === "domain"
                    ? "Acesso não autorizado."
                    : params.error === "config"
                      ? "Torre sem SESSION_SECRET. Avise quem cuida do ambiente."
                      : "E-mail ou senha incorretos."}
                </p>
              )}
              <button type="submit" className="btn btn-primary w-full">
                Entrar
              </button>
            </form>

            {dev && (
              <p className="mt-5 text-[12px] leading-relaxed text-muted">
                Ambiente local sem senha fixa: qualquer senha entra com e-mail @
                {ALLOWED_EMAIL_DOMAIN}. Em produção isso fica desligado.
              </p>
            )}
              </>
          )}
        </div>
      </div>
    </div>
  );
}
