import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { getInboxFile } from "@/lib/data/store";
import { ClassifyForm } from "@/components/inbox/classify-form";
import { deals, workstreams } from "@/lib/data/seed";
import { DriveLink } from "@/components/ui/drive-link";

export default async function ClassifyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const file = await getInboxFile(id);
  if (!file) notFound();

  return (
    <AppShell>
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
