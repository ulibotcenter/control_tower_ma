import { ArrowUpRight } from "lucide-react";

export function DriveLink({
  href,
  children,
  kind = "file",
}: {
  href: string;
  children: React.ReactNode;
  kind?: "file" | "folder";
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-navy underline decoration-cyan/70 underline-offset-4 hover:decoration-gold"
    >
      {children}
      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
      <span className="sr-only">
        {kind === "folder" ? "Abrir pasta no Google Drive" : "Abrir no Google Drive"}
      </span>
    </a>
  );
}
