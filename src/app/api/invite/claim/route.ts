import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/apiAuth";
import { claimInviteProofForUser } from "@/lib/inviteClaims";
import { INVITE_PROOF_COOKIE_NAME } from "@/lib/inviteProof";

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

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest();
  if (!auth.authenticated) {
    return auth.response;
  }

  const response = NextResponse.json({ claimed: false });
  const inviteProof = request.cookies.get(INVITE_PROOF_COOKIE_NAME)?.value;

  if (!inviteProof) {
    return response;
  }

  try {
    const result = await claimInviteProofForUser(auth.user.id, inviteProof);

    if (!result.ok) {
      const errorResponse = NextResponse.json(
        { error: result.reason },
        {
          status: result.reason === "invite_proof_invalid" ? 400 : 403,
        }
      );
      clearInviteCookies(errorResponse);
      return errorResponse;
    }

    const successResponse = NextResponse.json(
      { claimed: result.claimed, ok: true },
    );
    clearInviteCookies(successResponse);
    return successResponse;
  } catch (error) {
    console.error("Failed to claim invite proof:", error);
    const errorResponse = NextResponse.json(
      { error: "invite_claim_failed" },
      {
        status: 500,
      }
    );
    clearInviteCookies(errorResponse);
    return errorResponse;
  }
}
