import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/apiAuth";

export async function POST() {
  const auth = await authenticateRequest();
  if (!auth.authenticated) return auth.response;

  // SECURITY DEFINER 関数なので認証ユーザーでも実行可能
  const { error } = await auth.supabase.rpc("refresh_user_ingredient_profile");

  if (error) {
    console.error("Failed to refresh MV:", error);
    return NextResponse.json(
      { error: "Failed to refresh profile" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
