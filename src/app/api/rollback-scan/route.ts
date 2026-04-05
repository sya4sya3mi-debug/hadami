import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/apiAuth";
import { rollbackScan } from "@/lib/db";

export async function POST() {
  const auth = await authenticateRequest();
  if (!auth.authenticated) return auth.response;

  await rollbackScan(auth.supabase, auth.user.id, auth.user.email!);
  return NextResponse.json({ ok: true });
}
