import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

const GENERIC_INVALID = "メールアドレスまたはパスワードが正しくありません。";
const GENERIC_FAILURE = "ログインに失敗しました。時間をおいて再試行してください。";

export async function POST(request: NextRequest) {
  let payload: { email?: unknown; password?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
  }

  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const password = typeof payload.password === "string" ? payload.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: GENERIC_INVALID }, { status: 400 });
  }

  const ip = getClientIp(request);

  const ipLimit = await rateLimit(ip, 60_000, 10, "auth/login", { failOpen: true });
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "試行回数が多すぎます。時間をおいて再試行してください。" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(ipLimit.retryAfterMs / 1000)) } },
    );
  }

  try {
    const { data: lockData, error: lockError } = await supabaseAdmin.rpc("check_login_lock", {
      p_email: email,
    });
    if (!lockError && Array.isArray(lockData) && lockData[0]?.locked === true) {
      const retry = Number(lockData[0]?.retry_after_seconds) || 1800;
      return NextResponse.json(
        {
          error: "5回連続でログインに失敗したため、しばらくロックされています。30分後に再度お試しください。",
          locked: true,
        },
        { status: 423, headers: { "Retry-After": String(retry) } },
      );
    }
    if (lockError) {
      console.error("[auth/login] check_login_lock error:", lockError);
    }
  } catch (err) {
    console.error("[auth/login] check_login_lock unexpected:", err);
  }

  const response = NextResponse.json({ ok: true });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  const success = !signInError && Boolean(signInData?.session);

  try {
    await supabaseAdmin.rpc("record_login_attempt", {
      p_email: email,
      p_ip: ip,
      p_success: success,
    });
  } catch (err) {
    console.error("[auth/login] record_login_attempt failed:", err);
  }

  if (!success) {
    const isInvalidCred =
      signInError && /invalid login credentials/i.test(signInError.message || "");
    const isUnconfirmed =
      signInError && /email not confirmed/i.test(signInError.message || "");
    if (signInError && !isInvalidCred && !isUnconfirmed) {
      console.error("[auth/login] signIn error:", signInError);
    }
    return NextResponse.json(
      {
        error: isUnconfirmed
          ? "確認メールの認証が完了していません。メールを確認してください。"
          : isInvalidCred
          ? GENERIC_INVALID
          : GENERIC_FAILURE,
      },
      { status: 401 },
    );
  }

  return response;
}
