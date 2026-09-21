import { ArrowUpRight } from "lucide-react";
import { driveResourceId } from "@/lib/http";

export const UNCONFIGURED_FOLDER = "Pasta não configurada";

function kindFromUrl(href: string, fallback: "file" | "folder"): "file" | "folder" {
  if (href.includes("/folders/")) return "folder";
  if (href.includes("/file/")) return "file";
  return fallback;
}

export function DriveLink({
  href,
  children,
  kind = "file",
}: {
  href: string;
  children?: React.ReactNode;
  kind?: "file" | "folder";
}) {
  if (!driveResourceId(href)) {
    return <span className="ops-missing">{UNCONFIGURED_FOLDER}</span>;
  }
  const resolved = kindFromUrl(href, kind);
  const label = resolved === "folder" ? "Abrir pasta" : children;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-navy underline decoration-line-2 underline-offset-4 hover:decoration-brand"
    >
      {label}
      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
      <span className="sr-only">
        {resolved === "folder" ? "Abrir pasta no Google Drive" : "Abrir no Google Drive"}
      </span>
    </a>
  );
}
