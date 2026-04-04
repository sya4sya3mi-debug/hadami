"use client";

import Link from "next/link";

export default function SignUpBanner({
  currentCount,
  limit,
}: {
  currentCount: number;
  limit: number;
}) {
  const remaining = limit - currentCount;
  const isAtLimit = remaining <= 0;

  return (
    <div
      style={{
        background: isAtLimit
          ? "linear-gradient(135deg, #FFF0F5 0%, #FFE4EC 100%)"
          : "linear-gradient(135deg, #F0FDFA 0%, #E8FAF8 100%)",
        borderRadius: "16px",
        padding: "16px 20px",
        marginBottom: "16px",
        border: isAtLimit ? "1px solid #F9A8C0" : "1px solid #B2DFDB",
      }}
    >
      {isAtLimit ? (
        <>
          <p style={{ fontSize: "14px", fontWeight: "700", color: "#E57373", marginBottom: "6px" }}>
            お試し保存の上限に達しました
          </p>
          <p style={{ fontSize: "12px", color: "#9B9B9B", marginBottom: "12px" }}>
            会員登録すると最大20件まで保存でき、データはクラウドに安全に保管されます。
          </p>
        </>
      ) : (
        <>
          <p style={{ fontSize: "14px", fontWeight: "700", color: "#5BBFAD", marginBottom: "6px" }}>
            お試しモード（残り{remaining}件）
          </p>
          <p style={{ fontSize: "12px", color: "#9B9B9B", marginBottom: "12px" }}>
            会員登録すると最大20件まで保存＋クラウド同期ができます。
          </p>
        </>
      )}
      <Link
        href="/auth/login"
        style={{
          display: "inline-block",
          padding: "8px 20px",
          background: "var(--primary)",
          color: "#fff",
          borderRadius: "20px",
          fontSize: "13px",
          fontWeight: "700",
          textDecoration: "none",
        }}
      >
        無料で会員登録
      </Link>
    </div>
  );
}
