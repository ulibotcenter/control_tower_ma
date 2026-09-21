import { NextResponse } from "next/server";
import { getSession } from "./auth";
import { getMode } from "./mode";
import { getPresent } from "./present";

/** Só Operar, e nunca em Apresentar, grava ponto, tarefa ou nota. */
export async function denyUnlessOperate(): Promise<NextResponse | null> {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if ((await getMode()) !== "operate" || (await getPresent())) {
    return NextResponse.json({ error: "hidden" }, { status: 403 });
  }
  return null;
}
