import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/apiAuth";

export async function GET() {
  const auth = await authenticateRequest();
  if (!auth.authenticated) return auth.response;

  const { data } = await auth.supabase
    .from("x_auth_tokens")
    .select("x_screen_name")
    .eq("user_id", auth.user.id)
    .single();

  return NextResponse.json({
    linked: !!data,
    screenName: data?.x_screen_name || null,
  });
}
