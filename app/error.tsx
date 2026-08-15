"use client";

import Link from "next/link";
import { SystemPage } from "@/components/ui/system-page";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SystemPage
      title="Esta tela não carregou"
      hint="A sessão e os dados do programa continuam. Tente de novo. Se persistir, volte ao programa."
      digest={error.digest}
      actions={
        <>
          <button type="button" onClick={reset} className="btn">
            Tentar de novo
          </button>
          <Link href="/" className="px-4 py-2 text-sm font-medium text-navy underline underline-offset-2">
            Voltar ao programa
          </Link>
        </>
      }
    />
  );
}
