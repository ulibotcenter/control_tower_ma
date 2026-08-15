import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listNewDriveFiles, getDriveStatus } from "@/lib/drive";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const status = getDriveStatus();
  const listed = await listNewDriveFiles();

  return NextResponse.json({
    ...status,
    listed,
    warning:
      "A torre não está lendo o Drive neste corte. Não há arquivos novos detectados automaticamente. Use a bandeja manual.",
  });
}
