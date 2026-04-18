import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { claimInviteProofForUser, hasPendingInviteClaim } from "@/lib/inviteClaims";
import { INVITE_PROOF_COOKIE_NAME } from "@/lib/inviteProof";
import { getRegistrationAvailability } from "@/lib/registration";

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
    response.headers.set("Location", `${origin}/auth/login`);
    return response;
  }

  const inviteProof = request.cookies.get(INVITE_PROOF_COOKIE_NAME)?.value;

  try {
    const claimResult = await claimInviteProofForUser(
      sessionData.user.id,
      inviteProof
    );
    clearInviteCookies(response);

    if (!claimResult.ok) {
      await supabase.auth.signOut();
      response.headers.set("Location", `${origin}/auth/invite`);
      return response;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", sessionData.user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Failed to load profile during auth callback:", profileError);
    }

    if (!profile?.display_name) {
      const hasInviteAccess =
        claimResult.claimed || (await hasPendingInviteClaim(sessionData.user.id));

      if (!hasInviteAccess) {
        await supabase.auth.signOut();
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
        await supabase.auth.signOut();
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
  } catch (error) {
    console.error("auth callback failed:", error);
    clearInviteCookies(response);
    await supabase.auth.signOut();
    response.headers.set("Location", `${origin}/auth/invite`);
    return response;
  }
}
