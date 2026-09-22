import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { getInboxFile } from "@/lib/data/store";
import { ClassifyForm } from "@/components/inbox/classify-form";
import { deals, workstreams } from "@/lib/data/seed";
import { DriveLink } from "@/components/ui/drive-link";
import { focusSlugFromQuery } from "@/components/shell/focus-deal";

export default async function ClassifyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ deal?: string; proposta?: string; tipo?: string; frente?: string; situacao?: string }>;
}) {
  const { id } = await params;
  const { deal, proposta, tipo, frente, situacao } = await searchParams;
  const file = await getInboxFile(id);
  if (!file) notFound();

  return (
    <AppShell focusSlug={focusSlugFromQuery(deal)}>
      <p className="kicker">Classificação humana</p>
      <h1 className="serif text-3xl text-navy">{file.name}</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Só depois desta tela o arquivo entra no checklist — e mesmo assim como documento, não como
        item concluído. Um PDF chamado &quot;assinado&quot; pode ser minuta.
      </p>
      {file.driveUrl && (
        <p className="mt-3">
          <DriveLink href={file.driveUrl}>Abrir no Drive</DriveLink>
        </p>
      )}
      <ClassifyForm
        id={file.id}
        already={file.classified}
        propostaId={proposta || null}
        initial={{
          dealId: deals.find((item) => item.slug === deal)?.id,
          type: tipo,
          workstreamSlug: frente,
          status: situacao,
        }}
        deals={deals.map((d) => ({ id: d.id, name: d.name, slug: d.slug }))}
        workstreams={workstreams.map((w) => ({
          dealId: w.dealId,
          slug: w.slug,
          name: w.name,
        }))}
      />
    </AppShell>
  );
}
