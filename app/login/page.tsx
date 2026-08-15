import { ALLOWED_EMAIL_DOMAIN, PROGRAM_NAME, PROGRAM_SPONSOR } from "@/lib/constants";
import { allowDevLogin } from "@/lib/config";
import { getSession } from "@/lib/auth";
import { safeInternalPath } from "@/lib/http";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const session = await getSession();
  const params = await searchParams;
  const next = safeInternalPath(params.next);
  if (session) redirect(next);

  const dev = allowDevLogin() && !process.env.ELEVA_DEV_PASSWORD;

  return (
    <div className="min-h-screen bg-navy text-cream flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <p className="kicker">Eleva Projects · só quem opera</p>
        <h1 className="serif mt-2 text-4xl">
          Control Tower
          <span className="block text-gold text-2xl mt-1">
            {PROGRAM_NAME} · {PROGRAM_SPONSOR}
          </span>
        </h1>
        <p className="mt-4 text-sm text-cream/70 leading-relaxed">
          Sem conta para AD+R, Pacta, M12C, Loopert ou Radio Health. A tela é compartilhada em
          reunião — o login é só da Eleva.
        </p>

        <form action="/api/auth/login" method="post" className="mt-8 space-y-4">
          <input type="hidden" name="next" value={next} />
          <div>
            <label htmlFor="email" className="text-cream/70">
              E-mail Eleva
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              placeholder={`nome@${ALLOWED_EMAIL_DOMAIN}`}
              className="text-ink"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-cream/70">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="text-ink"
            />
          </div>
          {params.error && (
            <p className="text-sm text-gold-2">
              {params.error === "domain"
                ? `Só e-mail @${ALLOWED_EMAIL_DOMAIN}.`
                : "Não foi possível entrar. Confira e-mail e senha."}
            </p>
          )}
          <button
            type="submit"
            className="w-full bg-gold py-2.5 font-semibold text-navy hover:bg-gold-2"
          >
            Entrar
          </button>
        </form>

        {dev && (
          <p className="mt-6 text-[12px] leading-relaxed text-cream/50">
            Ambiente local sem ELEVA_DEV_PASSWORD: qualquer senha entra, desde que o e-mail seja @
            {ALLOWED_EMAIL_DOMAIN}. Em produção isso fica desligado.
          </p>
        )}
      </div>
    </div>
  );
}
