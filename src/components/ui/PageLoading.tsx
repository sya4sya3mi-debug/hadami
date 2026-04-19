"use client";

import Image from "next/image";

export default function PageLoading({
  message = "データを読み込んでいます...",
}: {
  message?: string;
}) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center px-6 text-center z-50"
      style={{ background: "linear-gradient(160deg, #F0FDFA 0%, #FFF0F5 100%)" }}
    >
      <div
        className="w-full max-w-xs rounded-3xl px-6 py-8 shadow-sm"
        style={{ background: "rgba(255,255,255,0.78)", border: "1px solid #F5E6EF" }}
      >
        <div className="w-20 h-20 mx-auto mb-4 animate-pulse">
          <Image
            src="/hadami-logo.png"
            alt="HADAMI"
            width={80}
            height={80}
            className="w-full h-full object-contain"
            priority
          />
        </div>
        <p className="text-sm font-medium" style={{ color: "#6B6B6B" }}>
          {message}
        </p>
      </div>
    </div>
  );
}
