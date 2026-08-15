import Link from "next/link";
import { SystemPage } from "@/components/ui/system-page";

export default function NotFound() {
  return (
    <SystemPage
      title="Página não encontrada"
      hint="O endereço não existe, ou esta tela fica oculta no modo atual — no modo Alvo, bandeja e registro de decisão não aparecem."
      actions={
        <Link href="/" className="btn">
          Voltar ao programa
        </Link>
      }
    />
  );
}
