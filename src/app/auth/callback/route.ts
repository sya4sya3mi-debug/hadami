import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { claimInviteProofForUser, hasPendingInviteClaim } from "@/lib/inviteClaims";
import {
  INVITE_PROOF_COOKIE_NAME,
  INVITE_TOKEN_QUERY_PARAM,
  verifyInviteProofToken,
} from "@/lib/inviteProof";
import { getRegistrationAvailability } from "@/lib/registration";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const NEW_USER_GRACE_PERIOD_MS = 15 * 60 * 1000;

type CallbackUser = {
  id: string;
  created_at?: string;
  last_sign_in_at?: string | null;
};

function parseTimestamp(value?: string | null): number | null {
  if (!value) return null;

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function wasJustCreated(user: CallbackUser): boolean {
  const createdAt = parseTimestamp(user.created_at);
  const lastSignInAt = parseTimestamp(user.last_sign_in_at);

  if (createdAt === null || lastSignInAt === null) {
    return false;
  }

  return (
    Date.now() - createdAt <= NEW_USER_GRACE_PERIOD_MS &&
    Math.abs(lastSignInAt - createdAt) <= NEW_USER_GRACE_PERIOD_MS
  );
}

async function cleanupUnauthorizedUser(userId: string) {
  const { error: profileDeleteError } = await supabaseAdmin
    .from("profiles")
    .delete()
    .eq("id", userId);

  if (profileDeleteError) {
    console.error("Failed to delete unauthorized profile:", profileDeleteError);
  }

  const { error: claimDeleteError } = await supabaseAdmin
    .from("pending_invite_claims")
    .delete()
    .eq("user_id", userId);

  if (claimDeleteError) {
    console.error(
      "Failed to delete unauthorized pending invite claim:",
      claimDeleteError
    );
  }

  const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(
    userId
  );

  if (authDeleteError) {
    console.error("Failed to delete unauthorized auth user:", authDeleteError);
  }
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

  if (!code) {
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

  const { data: sessionData, error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !sessionData?.user) {
    console.error("auth callback exchange failed:", exchangeError);
    clearInviteCookies(response);
    const loginUrl = new URL(`${origin}/auth/login`);
    const inviteTokenParam = searchParams.get("invite_token");
    if (inviteTokenParam) {
      loginUrl.searchParams.set("invite", "1");
      loginUrl.searchParams.set("invite_token", inviteTokenParam);
    }
    response.headers.set("Location", loginUrl.toString());
    return response;
  }

  const inviteProof =
    request.cookies.get(INVITE_PROOF_COOKIE_NAME)?.value ??
    searchParams.get(INVITE_TOKEN_QUERY_PARAM);

  // --- Invite verification (DB障害に強化: throwを局所化) ---
  let claimed = false;
  let cookieCleared = false;

  if (inviteProof) {
    let claimResult: Awaited<ReturnType<typeof claimInviteProofForUser>> | null = null;
    try {
      claimResult = await claimInviteProofForUser(sessionData.user.id, inviteProof);
    } catch (claimErr) {
      console.error("invite claim DB error (non-fatal):", claimErr);
      // DB障害時: トークン署名でフォールバック検証
      const tokenValid = verifyInviteProofToken(inviteProof) !== null;
      if (!tokenValid) {
        clearInviteCookies(response);
        await supabase.auth.signOut().catch(() => {});
        response.headers.set("Location", `${origin}/auth/invite`);
        return response;
      }
      // 署名が有効 → cookieを残してprofileステップで再クレーム
      claimed = false;
    }

    if (claimResult !== null) {
      if (!claimResult.ok) {
        clearInviteCookies(response);
        cookieCleared = true;
        await supabase.auth.signOut().catch(() => {});
        response.headers.set("Location", `${origin}/auth/invite`);
        return response;
      }
      claimed = claimResult.claimed;
      if (claimed) {
        clearInviteCookies(response);
        cookieCleared = true;
      }
    }
  } else {
    clearInviteCookies(response);
    cookieCleared = true;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", sessionData.user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Failed to load profile during auth callback:", profileError);
  }

  let hasInviteAccess = claimed;
  if (!hasInviteAccess) {
    // 署名ベースのフォールバック
    if (inviteProof && verifyInviteProofToken(inviteProof) !== null) {
      hasInviteAccess = true;
    } else {
      try {
        hasInviteAccess = await hasPendingInviteClaim(sessionData.user.id);
      } catch (pendingErr) {
        console.error("hasPendingInviteClaim error (non-fatal):", pendingErr);
        hasInviteAccess = false;
      }
    }
  }

  if (!hasInviteAccess && wasJustCreated(sessionData.user)) {
    if (!cookieCleared) clearInviteCookies(response);
    await supabase.auth.signOut().catch(() => {});
    await cleanupUnauthorizedUser(sessionData.user.id);
    response.headers.set("Location", `${origin}/auth/invite`);
    return response;
  }

  if (!profile?.display_name) {
    if (!hasInviteAccess) {
      if (!cookieCleared) clearInviteCookies(response);
      await supabase.auth.signOut().catch(() => {});
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

  return response;
}
