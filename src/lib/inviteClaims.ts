import "server-only";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyInviteProofToken } from "@/lib/inviteProof";

const PENDING_INVITE_CLAIM_TTL_MS = 24 * 60 * 60 * 1000;

export type InviteClaimFailureReason =
  | "invite_proof_invalid"
  | "invite_invalid"
  | "invite_exhausted";

export type InviteClaimResult =
  | { ok: true; claimed: boolean }
  | { ok: false; reason: InviteClaimFailureReason };

export async function claimInviteProofForUser(
  userId: string,
  token: string | null | undefined
): Promise<InviteClaimResult> {
  if (!token) {
    return { ok: true, claimed: false };
  }

  const invitationCodeId = verifyInviteProofToken(token);
  if (!invitationCodeId) {
    return { ok: false, reason: "invite_proof_invalid" };
  }

  const { data, error } = await supabaseAdmin
    .from("invitation_codes")
    .select("id, max_uses, used_count, is_active, expires_at")
    .eq("id", invitationCodeId)
    .single();

  if (
    error ||
    !data ||
    !data.is_active ||
    (data.expires_at && new Date(data.expires_at) < new Date())
  ) {
    return { ok: false, reason: "invite_invalid" };
  }

  if (data.max_uses > 0 && data.used_count >= data.max_uses) {
    return { ok: false, reason: "invite_exhausted" };
  }

  const { error: upsertError } = await supabaseAdmin
    .from("pending_invite_claims")
    .upsert(
      {
        user_id: userId,
        invitation_code_id: invitationCodeId,
        expires_at: new Date(Date.now() + PENDING_INVITE_CLAIM_TTL_MS).toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (upsertError) {
    throw upsertError;
  }

  return { ok: true, claimed: true };
}

export async function hasPendingInviteClaim(userId: string): Promise<boolean> {
  const nowIso = new Date().toISOString();

  await supabaseAdmin
    .from("pending_invite_claims")
    .delete()
    .eq("user_id", userId)
    .lt("expires_at", nowIso);

  const { data, error } = await supabaseAdmin
    .from("pending_invite_claims")
    .select("user_id")
    .eq("user_id", userId)
    .gt("expires_at", nowIso)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}
