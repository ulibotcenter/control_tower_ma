import Link from "next/link";
import { SystemPage } from "@/components/ui/system-page";

export default function NotFound() {
  return (
    <SystemPage
      title="Página não encontrada"
      // Sem explicar o que some e para quem: esta página viaja no payload de
      // todas as outras, inclusive na que está sendo projetada em reunião.
      hint="O endereço não existe ou não está disponível nesta sessão."
      actions={
        <Link href="/" className="btn">
          Voltar ao programa
        </Link>
      }
    />
  );
}
