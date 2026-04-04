"use client";

export default function PageLoading({
  message = "データを読み込んでいます...",
}: {
  message?: string;
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 text-center"
      style={{ background: "linear-gradient(160deg, #F0FDFA 0%, #FFF0F5 100%)" }}
    >
      <div
        className="w-full max-w-xs rounded-3xl px-6 py-8 shadow-sm"
        style={{ background: "rgba(255,255,255,0.78)", border: "1px solid #F5E6EF" }}
      >
        <div
          className="w-10 h-10 mx-auto mb-4 rounded-full animate-pulse"
          style={{ background: "linear-gradient(135deg, #5BBFAD, #F9A8C0)" }}
        />
        <p className="text-sm font-medium" style={{ color: "#6B6B6B" }}>
          {message}
        </p>
      </div>
    </div>
  );
}
