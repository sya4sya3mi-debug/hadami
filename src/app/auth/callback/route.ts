import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { hasPendingInviteClaim } from "@/lib/inviteClaims";
import { INVITE_PROOF_COOKIE_NAME } from "@/lib/inviteProof";
import { getRegistrationAvailability } from "@/lib/registration";

const INVITE_ENFORCEMENT_START_AT =
  process.env.INVITE_ENFORCEMENT_START_AT || "2026-04-22T00:00:00.000Z";

function parseTimestamp(value?: string | null): number | null {
  if (!value) return null;
  const ts = Date.parse(value);
  return Number.isFinite(ts) ? ts : null;
}

function clearInviteCookies(response: NextResponse) {
  response.cookies.set(INVITE_PROOF_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set("hadami-invite-verified", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const flow = searchParams.get("flow");
  const isRecoveryFlow = type === "recovery" || flow === "recovery";

  if (!code && !tokenHash) {
    if (isRecoveryFlow) {
      return NextResponse.redirect(`${origin}/auth/reset-password?mode=update`);
    }
    return NextResponse.redirect(`${origin}/`);
  }

  const response = NextResponse.redirect(`${origin}/`);

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
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let sessionUser: {
    id: string;
    created_at?: string;
    user_metadata?: Record<string, unknown> | null;
  } | null = null;
  let exchangeError: { message?: string } | null = null;

  if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "email" | "recovery" | "invite" | "email_change",
    });
    sessionUser = data?.user ?? null;
    exchangeError = error;
  } else if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    sessionUser = data?.user ?? null;
    exchangeError = error;
  }

  if (exchangeError || !sessionUser) {
    console.error("auth callback exchange failed:", exchangeError);
    clearInviteCookies(response);
    if (isRecoveryFlow) {
      response.headers.set(
        "Location",
        `${origin}/auth/reset-password?mode=update&recovery_error=invalid`
      );
      return response;
    }
    response.headers.set("Location", `${origin}/auth/login`);
    return response;
  }

  if (isRecoveryFlow) {
    response.headers.set("Location", `${origin}/auth/reset-password?mode=update`);
    return response;
  }

  // OAuth callback does not redeem invite proof anymore.
  // Invite access is granted only by server-side pending claims.
  clearInviteCookies(response);

  let hasInviteAccess = false;
  try {
    hasInviteAccess = await hasPendingInviteClaim(sessionUser.id);
  } catch (pendingErr) {
    console.error("hasPendingInviteClaim error:", pendingErr);
    hasInviteAccess = false;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name, invite_activated_at")
    .eq("id", sessionUser.id)
    .maybeSingle();

  if (profileError) {
    console.error("Failed to load profile during auth callback:", profileError);
  }

  const enforcementStartTs = parseTimestamp(INVITE_ENFORCEMENT_START_AT);
  const userCreatedAtTs = parseTimestamp(sessionUser.created_at);
  const requiresInviteForThisUser =
    enforcementStartTs !== null &&
    userCreatedAtTs !== null &&
    userCreatedAtTs >= enforcementStartTs;

  const inviteActivated = Boolean(profile?.invite_activated_at);

  if (profile?.display_name && (!requiresInviteForThisUser || inviteActivated)) {
    return response;
  }

  if (!hasInviteAccess) {
    response.headers.set("Location", `${origin}/auth/invite`);
    return response;
  }

  let allowed = true;
  try {
    const result = await getRegistrationAvailability();
    allowed = result.allowed;
  } catch {
    allowed = true;
  }

  if (!allowed) {
    await supabase.auth.signOut().catch(() => {});
    response.headers.set(
      "Location",
      `${origin}/auth/login?error=registration_limit_reached`
    );
    return response;
  }

  response.headers.set("Location", `${origin}/auth/profile`);
  return response;
}
