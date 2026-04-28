"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUser } from "@/lib/auth";
import { ADMIN_NAV_ITEMS, isAdminClient } from "@/lib/adminConfig";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || !isAdminClient(user.id))) {
      router.replace("/");
    }
  }, [loading, user, router]);

  if (loading || !user || !isAdminClient(user.id)) return null;

  return (
    <div className="min-h-screen bg-bo-cream">
      {/* アンバー上部ライン — 管理画面モードインジケーター */}
      <div className="h-1 w-full bg-[#F5A623]" aria-hidden="true" />

      {/* スティッキーヘッダー */}
      <div className="sticky top-0 z-50 bg-bo-cream border-b border-bo-parchment">
        <div className="max-w-[600px] mx-auto px-5 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-extrabold font-serif text-bo-ink tracking-tight">
              hadami
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFF3DC] text-[#A07020] text-[10px] font-bold font-sans border border-[#F0DBA8]">
              ⚙ ADMIN
            </span>
          </div>
          {/* admintosite ボタン */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-r1 bg-white text-bo-ink-muted text-[11px] font-bold font-sans shadow-bo1 hover:bg-bo-parchment transition-colors border border-bo-parchment no-underline"
          >
            サイトへ →
          </Link>
        </div>

        {/* ナビピル */}
        <div className="max-w-[600px] mx-auto px-5 pb-3 flex gap-2 flex-wrap">
          {ADMIN_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold font-sans transition-colors no-underline ${
                pathname === item.href
                  ? "bg-bo-accent text-white shadow-bo-accent"
                  : "bg-white text-bo-ink-muted hover:bg-bo-parchment shadow-bo1"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ページコンテンツ */}
      <div className="max-w-[600px] mx-auto px-5 pt-6 pb-32">
        {children}
      </div>
    </div>
  );
}
