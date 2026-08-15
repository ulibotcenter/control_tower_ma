import { AppShell } from "@/components/shell/app-shell";
import { GlossaryExplorer } from "@/components/glossary/glossary-explorer";
import { getMode } from "@/lib/mode";

export default async function GlossaryPage() {
  const mode = await getMode();
  return (
    <AppShell>
      <p className="kicker">Linguagem da torre</p>
      <h1 className="serif text-4xl text-navy">Glossário</h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed">
        Os mesmos termos que aparecem com um «?» na tela. Feito para quem conhece rádio e ainda
        está aprendendo o vocabulário de M&amp;A.
      </p>
      <div className="mt-8">
        <GlossaryExplorer mode={mode} />
      </div>
    </AppShell>
  );
}
