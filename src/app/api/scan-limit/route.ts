import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/apiAuth";
import { getMonthlyScanCount, getUserMonthlyScanLimit } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await authenticateRequest();
  if (!auth.authenticated) {
    return auth.response;
  }

  try {
    const [count, limit] = await Promise.all([
      getMonthlyScanCount(auth.supabase, auth.user.id),
      getUserMonthlyScanLimit(supabaseAdmin, auth.user.id),
    ]);

    return NextResponse.json({ count, limit });
  } catch (error) {
    console.error("scan-limit error:", error);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
