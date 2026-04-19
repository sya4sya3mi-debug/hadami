"use client";

import { useState } from "react";
import { useUser } from "@/lib/auth";
import { BETA_USER_LIMIT } from "@/lib/limits";

type ProfileSetupResult = {
  allowed?: boolean;
  reason?: string;
};

function getProfileErrorMessage(reason?: string) {
  switch (reason) {
    case "invite_proof_invalid":
      return "\u62db\u5f85\u30b3\u30fc\u30c9\u306e\u78ba\u8a8d\u671f\u9650\u304c\u5207\u308c\u307e\u3057\u305f\u3002\u3082\u3046\u4e00\u5ea6\u3084\u308a\u76f4\u3057\u3066\u304f\u3060\u3055\u3044\u3002";
    case "invite_invalid":
      return "\u3053\u306e\u62db\u5f85\u30b3\u30fc\u30c9\u306f\u7121\u52b9\u3067\u3059\u3002";
    case "invite_exhausted":
      return "\u3053\u306e\u62db\u5f85\u30b3\u30fc\u30c9\u306f\u5229\u7528\u4e0a\u9650\u306b\u9054\u3057\u3066\u3044\u307e\u3059\u3002";
    case "invite_required":
      return "\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u4f5c\u6210\u306b\u306f\u62db\u5f85\u30b3\u30fc\u30c9\u306e\u78ba\u8a8d\u304c\u5fc5\u8981\u3067\u3059\u3002";
    case "limit_reached":
      return "\u73fe\u5728\u30d9\u30fc\u30bf\u7248\u306e\u65b0\u898f\u767b\u9332\u306f\u4e0a\u9650\u306b\u9054\u3057\u3066\u3044\u307e\u3059\u3002";
    default:
      return "\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u306e\u4f5c\u6210\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002\u3057\u3070\u3089\u304f\u3057\u3066\u304b\u3089\u304a\u8a66\u3057\u304f\u3060\u3055\u3044\u3002";
  }
}

export default function ProfileSetupPage() {
  const { user, supabase } = useUser();
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nickname.trim()) {
      setError("\u30cb\u30c3\u30af\u30cd\u30fc\u30e0\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002");
      return;
    }

    if (nickname.trim().length > 20) {
      setError("\u30cb\u30c3\u30af\u30cd\u30fc\u30e0\u306f20\u6587\u5b57\u4ee5\u5185\u3067\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002");
      return;
    }

    if (!user) return;

    setLoading(true);
    setError("");

    try {
      const claimResponse = await fetch("/api/invite/claim", {
        method: "POST",
      });

      if (!claimResponse.ok) {
        const claimData = (await claimResponse.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(getProfileErrorMessage(claimData?.error));
        setLoading(false);
        return;
      }

      const { data, error: dbError } = await supabase.rpc(
        "complete_profile_with_invite",
        {
          p_display_name: nickname.trim(),
          p_limit: BETA_USER_LIMIT,
        }
      );

      if (dbError) {
        console.error("profile save error:", dbError);
        setError("\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u306e\u4f5c\u6210\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002\u3057\u3070\u3089\u304f\u3057\u3066\u304b\u3089\u304a\u8a66\u3057\u304f\u3060\u3055\u3044\u3002");
        setLoading(false);
        return;
      }

      const result = data as ProfileSetupResult | null;
      if (!result?.allowed) {
        setError(getProfileErrorMessage(result?.reason));
        setLoading(false);
        return;
      }

      window.location.href = "/";
    } catch (submitError) {
      console.error("profile setup failed:", submitError);
      setError("\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u306e\u4f5c\u6210\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002\u3057\u3070\u3089\u304f\u3057\u3066\u304b\u3089\u304a\u8a66\u3057\u304f\u3060\u3055\u3044\u3002");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-bo-cream">
      <div className="mb-8 text-center">
        <div className="text-4xl mb-2">H</div>
        <h1 className="text-[28px] font-black font-serif text-bo-accent m-0">
          HADAMI
        </h1>
        <p className="text-[13px] text-bo-ink-muted mt-1">
          {"\u3088\u3046\u3053\u305d\u3002\u3042\u306a\u305f\u306e\u3053\u3068\u3092\u6559\u3048\u3066\u304f\u3060\u3055\u3044"}
        </p>
      </div>

      <div className="w-full max-w-[360px] bg-white rounded-r2 py-7 px-6 shadow-bo2">
        <h2 className="text-[18px] font-bold mb-5 text-center text-bo-ink">
          {"\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u8a2d\u5b9a"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-2">
            <label className="text-[13px] font-semibold text-bo-ink mb-1.5 block">
              {"\u30cb\u30c3\u30af\u30cd\u30fc\u30e0"}
            </label>
            <input
              type="text"
              placeholder=""
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              className="w-full p-3 border-[1.5px] border-bo-parchment rounded-r1 text-[15px] bg-white outline-none focus:border-bo-accent focus:ring-1 focus:ring-bo-accent/30 transition-colors"
            />
          </div>

          <p className="text-[11px] text-bo-ink-muted mb-4">
            {"\u0032\u0030\u6587\u5b57\u4ee5\u5185\u3067\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002\u3042\u3068\u304b\u3089\u5909\u66f4\u3067\u304d\u307e\u3059\u3002"}
          </p>

          {error && (
            <p className="text-[13px] text-bo-caution mb-3 text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-bo-accent text-white border-none rounded-r1 text-[15px] font-bold cursor-pointer shadow-bo-accent disabled:opacity-70 hover:bg-bo-accent-dark transition-colors"
          >
            {loading
              ? "\u4fdd\u5b58\u4e2d..."
              : "\u306f\u3058\u3081\u308b"}
          </button>
        </form>
      </div>
    </div>
  );
}
