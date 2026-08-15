"use client";

import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-cream px-6 py-24 text-ink">
      <p className="kicker">Control Tower</p>
      <h1 className="serif mt-2 text-4xl text-navy">Algo falhou nesta tela</h1>
      <p className="mt-3 max-w-lg text-sm text-muted">
        A sessão e os dados do programa continuam. Tente de novo. Se persistir, volte ao programa.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-[12px] text-muted">ref {error.digest}</p>
      )}
      <div className="mt-6 flex gap-3">
        <button type="button" onClick={reset} className="btn">
          Tentar de novo
        </button>
        <Link href="/" className="px-4 py-2 text-sm text-navy underline">
          Voltar ao programa
        </Link>
      </div>
    </div>
  );
}
