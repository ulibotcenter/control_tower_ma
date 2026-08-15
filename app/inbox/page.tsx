import { AppShell } from "@/components/shell/app-shell";
import { DriveLink } from "@/components/ui/drive-link";
import { getDriveStatus } from "@/lib/drive";
import { listInbox } from "@/lib/data/store";
import { DOC_STATUS_LABEL, DOC_TYPE_LABEL, folderUrl, DRIVE_FOLDERS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import Link from "next/link";
import { InboxForm } from "@/components/inbox/inbox-form";
import { deals } from "@/lib/data/seed";

export default async function InboxPage() {
  const files = await listInbox();
  const drive = getDriveStatus();
  const open = files.filter((f) => !f.classified);
  const done = files.filter((f) => f.classified);

  return (
    <AppShell>
      <p className="kicker">Só modo Operar</p>
      <h1 className="serif text-4xl text-navy">Novos arquivos</h1>
      <p className="mt-3 max-w-2xl text-[16px] leading-relaxed">
        O Drive é a verdade dos documentos. A torre só lê. Arquivo novo cai aqui, um humano
        classifica, e só então o item pode entrar no checklist. Arquivo novo não é item concluído.
      </p>

      <div className="mt-5 paper border-wait/40 p-4 text-sm leading-relaxed">
        <p className="font-semibold text-navy">
          {drive.configured ? "Credencial do Google presente" : "API do Google não configurada"}
        </p>
        <p className="mt-1">{drive.reason}</p>
        <p className="mt-2">
          Pasta raiz ·{" "}
          <DriveLink href={drive.rootUrl} kind="folder">
            {DRIVE_FOLDERS.root.name}
          </DriveLink>
        </p>
        <p className="mt-2 text-muted">
          Material ainda em Downloads deste Mac (e-mails Suélen, 5ª ACS, projeção, balancete 05/2026)
          não está no Drive. Quando for solto em{" "}
          <DriveLink href={folderUrl(DRIVE_FOLDERS.loopert.id)} kind="folder">
            Doctos Loopert
          </DriveLink>{" "}
          ou Relatorios, registre aqui. Não inventamos que já está classificado.
        </p>
      </div>

      <InboxForm />

      <section className="mt-10">
        <h2 className="serif text-2xl text-navy">A classificar ({open.length})</h2>
        {open.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Bandeja vazia. Sem sync automático neste corte.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-line paper">
            {open.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="font-medium">{f.name}</p>
                  <p className="text-[12px] text-muted">
                    {f.source === "manual" ? "Registro manual" : "Drive"} · {formatDate(f.receivedAt.slice(0, 10))}
                  </p>
                </div>
                <Link
                  href={`/inbox/${f.id}`}
                  className="bg-navy px-3 py-1.5 text-sm text-cream"
                >
                  Classificar
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {done.length > 0 && (
        <section className="mt-10">
          <h2 className="serif text-2xl text-navy">Já classificados</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {done.map((f) => (
              <li key={f.id} className="paper px-4 py-3">
                <span className="font-medium">{f.name}</span>
                {f.classification && (
                  <span className="ml-2 text-muted">
                    {DOC_TYPE_LABEL[f.classification.type]} ·{" "}
                    {DOC_STATUS_LABEL[f.classification.status]} ·{" "}
                    {deals.find((d) => d.id === f.classification?.dealId)?.name ?? "deal"}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </AppShell>
  );
}
