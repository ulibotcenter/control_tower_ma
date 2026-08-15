import { getSession } from "@/lib/auth";
import { getMode } from "@/lib/mode";
import { unclassifiedCount } from "@/lib/data/store";
import { canSeeInbox } from "@/lib/visibility";
import { redirect } from "next/navigation";
import { Header } from "./header";
import { ModeBanner } from "./mode-banner";
import { SemaphoreLegend } from "../ui/legend";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/login");
  const mode = await getMode();
  const inboxCount = canSeeInbox(mode) ? await unclassifiedCount() : 0;

  return (
    <div className="min-h-screen bg-cream text-ink">
      <Header user={user} mode={mode} inboxCount={inboxCount} />
      <ModeBanner mode={mode} />
      <div className="border-b border-line bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-2">
          <SemaphoreLegend compact />
        </div>
      </div>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
