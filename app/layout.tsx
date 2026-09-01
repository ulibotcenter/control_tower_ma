import type { Metadata } from "next";
import { IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { ToastHost } from "@/components/ui/toast";
import { getDealOptions } from "@/lib/data/provider";
import { getMeeting } from "@/lib/mode";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const ibm = IBM_Plex_Mono({
  variable: "--font-ibm",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const dynamic = "force-dynamic";

function metadataBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (raw) {
    try {
      return new URL(raw.includes("://") ? raw : `https://${raw}`);
    } catch {
      /* ignora valor inválido */
    }
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    try {
      return new URL(`https://${vercel}`);
    } catch {
      /* ignora */
    }
  }
  return new URL("https://tower.elevaprojects.com");
}

/**
 * A aba do navegador é pixel visível numa tela projetada. No modo Alvo ela não
 * pode anunciar o nome do produto nem o do programa — vira só a operação.
 */
export async function generateMetadata(): Promise<Metadata> {
  const base = {
    metadataBase: metadataBaseUrl(),
    robots: { index: false, follow: false },
  } satisfies Metadata;

  const meeting = await getMeeting().catch(() => null);
  if (meeting?.mode === "target") {
    const deal = meeting.targetDeal
      ? (getDealOptions({ onlyDeal: meeting.targetDeal })[0]?.name ?? null)
      : null;
    return {
      ...base,
      title: { default: deal ?? "Situação formal", template: "%s" },
      description: "Situação formal da operação.",
    };
  }

  return {
    ...base,
    title: {
      default: "Control Tower · Go Live · AD+R",
      template: "%s · Eleva Projects",
    },
    description:
      "Torre de controle do programa de M&A Go Live. Eleva Projects. Duas operações buy-side da AD+R.",
    applicationName: "Control Tower",
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${jakarta.variable} ${ibm.variable} antialiased`}>
        {children}
        <ToastHost />
      </body>
    </html>
  );
}
