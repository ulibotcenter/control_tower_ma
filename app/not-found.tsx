import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream px-6 py-24 text-ink">
      <p className="kicker">Control Tower</p>
      <h1 className="serif mt-2 text-4xl text-navy">Página não encontrada</h1>
      <p className="mt-3 max-w-md text-sm text-muted">
        Se você está em modo Alvo, bandeja e registro de decisão ficam ocultos de propósito.
      </p>
      <Link href="/" className="btn mt-6">
        Voltar ao programa
      </Link>
    </div>
  );
}
