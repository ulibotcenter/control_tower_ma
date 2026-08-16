"use client";

import { useState } from "react";
import { CORTE, PROGRAM_NAME, PROGRAM_SPONSOR } from "@/lib/constants";
import { toast } from "@/lib/toast";

/**
 * Exporta a visão atual via diálogo de impressão do navegador (Salvar como PDF).
 * O CSS de impressão tira cromo de edição e deixa um documento de reunião.
 */
export function ExportPdfButton({
  present = false,
  pageLabel,
  surface = "header",
}: {
  present?: boolean;
  pageLabel?: string;
  surface?: "header" | "page";
}) {
  const [busy, setBusy] = useState(false);

  function exportPdf() {
    setBusy(true);
    const prev = document.title;
    const bits = [PROGRAM_NAME, PROGRAM_SPONSOR, pageLabel, present ? "Apresentação" : null, `corte ${CORTE}`]
      .filter(Boolean)
      .join(" · ");
    document.title = bits;
    const restore = () => {
      document.title = prev;
      setBusy(false);
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    toast("Diálogo de impressão aberto. Salve como PDF.");
    window.print();
    // Safari / alguns engines não disparam afterprint de forma confiável.
    window.setTimeout(restore, 1500);
  }

  return (
    <button
      type="button"
      onClick={exportPdf}
      disabled={busy}
      className={surface === "page" ? "btn no-print" : "hdr-btn no-print min-h-11 sm:min-h-0"}
      aria-label="Exportar a visão atual em PDF"
    >
      {busy ? "Preparando…" : present ? "Exportar PDF" : "PDF"}
    </button>
  );
}
