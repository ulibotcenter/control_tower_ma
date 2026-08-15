import type { Metadata } from "next";
import { IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { ToastHost } from "@/components/ui/toast";
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

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tower.elevaprojects.com";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Control Tower · Go Live · AD+R",
    template: "%s · Eleva Projects",
  },
  description:
    "Torre de controle do programa de M&A Go Live. Eleva Projects. Duas operações buy-side da AD+R.",
  applicationName: "Control Tower",
  robots: { index: false, follow: false },
};

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
