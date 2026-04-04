"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProductStore } from "@/stores/useProductStore";
import { useZukanStore } from "@/stores/useZukanStore";
import { useDeckStore } from "@/stores/useDeckStore";
import { MASTER_INGREDIENTS } from "@/lib/ingredients";
import { getScanCountByEmail, getAccountScanLimit } from "@/lib/db";
import Disclaimer from "@/components/ui/Disclaimer";
import InstallBanner from "@/components/ui/InstallBanner";
import { useUser } from "@/lib/auth";
import PageLoading from "@/components/ui/PageLoading";
import LandingPage from "@/components/ui/LandingPage";

export default function HomePage() {
  const { user, profile, supabase, loading } = useUser();
  const products = useProductStore((s) => s.products);
  const discoveredCount = useZukanStore((s) => s.discoveredIds.length);
  const deckItems = useDeckStore((s) => s.items);
  const router = useRouter();
  const [scanCount, setScanCount] = useState<number | null>(null);
  const scanLimit = getAccountScanLimit();

  // プロフィール未設定のユーザーをプロフィール設定画面へ
  // profile === undefined は読み込み中、null はプロフィール行なし
  useEffect(() => {
    if (!loading && user && profile !== undefined && (profile === null || !profile.display_name)) {
      router.replace("/auth/profile");
    }
  }, [loading, user, profile, router]);

  // スキャン累計を取得
  const fetchScanCount = useCallback(async () => {
    if (!user?.email) return;
    const count = await getScanCountByEmail(supabase, user.email);
    setScanCount(count);
  }, [user, supabase]);

  useEffect(() => {
    fetchScanCount();
  }, [fetchScanCount]);

  if (loading) {
    return <PageLoading />;
  }

  if (!user) {
    return <LandingPage />;
  }

  const total = MASTER_INGREDIENTS.length;

  const recentProducts = products.slice(0, 3);
  const morningCount = deckItems.filter((i) => i.routine === "morning").length;
  const nightCount = deckItems.filter((i) => i.routine === "night").length;
  const pct = total > 0 ? Math.round((discoveredCount / total) * 100) : 0;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #F0FDFA 0%, #FFF0F5 100%)" }}>
      <div className="px-5 pt-10 pb-6">

        <div className="flex items-center justify-end gap-2 mb-2">
          {profile?.display_name && (
            <span style={{ fontSize: "12px", color: "var(--foreground)", fontWeight: "600" }}>
              {profile.display_name} さん
            </span>
          )}
          <Link
            href="/settings"
            style={{
              fontSize: "12px",
              color: "var(--sub)",
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: "20px",
              padding: "5px 12px",
              textDecoration: "none",
            }}
          >
            設定
          </Link>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-1">
            <span className="text-3xl">✨</span>
            <h1 className="text-3xl font-bold tracking-wide" style={{ color: "#5BBFAD", letterSpacing: "0.08em" }}>
              HADAMI
            </h1>
            <span className="text-3xl">✨</span>
          </div>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span
              className="px-3 py-0.5 rounded-full text-xs font-bold tracking-widest"
              style={{ background: "#F9A8C0", color: "#fff" }}
            >
              BETA
            </span>
          </div>
          <p className="text-sm mt-2" style={{ color: "#9B9B9B" }}>
            成分を知って、肌をもっと好きになる。
          </p>
        </div>

        {/* ホーム画面追加バナー（ログイン後のみ） */}
        {user && <InstallBanner />}

        {/* CTA */}
        <Link
          href="/scan"
          className="block w-full py-4 text-white text-center rounded-2xl text-base font-bold mb-6 shadow-md"
          style={{
            background: "linear-gradient(135deg, #5BBFAD 0%, #7DD3C8 100%)",
            boxShadow: "0 4px 16px rgba(91,191,173,0.35)",
          }}
        >
          📷 化粧品をスキャンする
        </Link>

        {/* スキャン残回数 */}
        {scanCount !== null && (() => {
          const remaining = Math.max(scanLimit - scanCount, 0);
          return (
          <div
            className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 mb-4 shadow-sm"
            style={{ border: "1px solid #F5E6EF" }}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">📷</span>
              <span className="text-xs font-medium" style={{ color: "#9B9B9B" }}>
                無料スキャン
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold" style={{ color: remaining <= 0 ? "#E57373" : "#5BBFAD" }}>
                残り {remaining}/{scanLimit}回
              </span>
              <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "#F2F2F2" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min((remaining / scanLimit) * 100, 100)}%`,
                    background: remaining <= 0
                      ? "#E57373"
                      : "linear-gradient(90deg, #5BBFAD, #7DD3C8)",
                  }}
                />
              </div>
            </div>
          </div>
          );
        })()}

        {/* 累計撮影数カード */}
        {scanCount !== null && scanCount > 0 && (
          <div
            className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 mb-4 shadow-sm"
            style={{ border: "1px solid #F5E6EF" }}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">📸</span>
              <span className="text-xs font-medium" style={{ color: "#9B9B9B" }}>
                累計撮影数
              </span>
            </div>
            <span className="text-sm font-bold" style={{ color: "#5BBFAD" }}>
              {scanCount} 回
            </span>
          </div>
        )}

        {/* Mini Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Zukan card */}
          <Link href="/zukan" className="bg-white rounded-2xl p-4 shadow-sm border border-pink-50">
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-lg">📖</span>
              <span className="text-sm font-bold" style={{ color: "#2D2D2D" }}>成分図鑑</span>
            </div>
            <div className="text-3xl font-bold mb-1" style={{ color: "#5BBFAD" }}>
              {discoveredCount}
              <span className="text-sm font-normal" style={{ color: "#9B9B9B" }}>/{total}</span>
            </div>
            <div className="text-xs mb-2" style={{ color: "#9B9B9B" }}>{pct}% コンプリート</div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#F2F2F2" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: "linear-gradient(90deg, #F9A8C0, #5BBFAD)",
                }}
              />
            </div>
          </Link>

          {/* Deck card */}
          <Link href="/deck" className="bg-white rounded-2xl p-4 shadow-sm border border-pink-50">
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-lg">🃏</span>
              <span className="text-sm font-bold" style={{ color: "#2D2D2D" }}>スキンケアデッキ</span>
            </div>
            <div className="flex justify-center gap-4 mt-1">
              <div className="text-center">
                <div className="text-xs mb-1" style={{ color: "#9B9B9B" }}>☀️ 朝</div>
                <div className="text-2xl font-bold" style={{ color: "#F9A8C0" }}>{morningCount}</div>
                <div className="text-xs" style={{ color: "#9B9B9B" }}>アイテム</div>
              </div>
              <div className="w-px" style={{ background: "#F2F2F2" }} />
              <div className="text-center">
                <div className="text-xs mb-1" style={{ color: "#9B9B9B" }}>🌙 夜</div>
                <div className="text-2xl font-bold" style={{ color: "#B39DDB" }}>{nightCount}</div>
                <div className="text-xs" style={{ color: "#9B9B9B" }}>アイテム</div>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Products */}
        {recentProducts.length > 0 && (
          <div className="mb-6">
            <h2 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: "#2D2D2D" }}>
              <span className="w-1 h-4 rounded-full inline-block" style={{ background: "#F9A8C0" }} />
              最近チェックした製品
            </h2>
            <div className="space-y-2">
              {recentProducts.map((p) => (
                <Link
                  key={p.id}
                  href={`/product/${p.id}`}
                  className="flex items-center gap-3 bg-white rounded-2xl p-3.5 shadow-sm border border-pink-50"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ background: "#F0FDFA" }}
                  >
                    📦
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate" style={{ color: "#2D2D2D" }}>{p.name}</div>
                    <div className="text-xs" style={{ color: "#9B9B9B" }}>{p.brand}</div>
                  </div>
                  <span className="text-base" style={{ color: "#5BBFAD" }}>›</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {recentProducts.length === 0 && (
          <div
            className="text-center py-10 rounded-3xl"
            style={{ background: "rgba(255,255,255,0.7)" }}
          >
            <div className="text-5xl mb-3">🌸</div>
            <p className="font-medium text-sm" style={{ color: "#2D2D2D" }}>まだ製品をスキャンしていません</p>
            <p className="text-xs mt-1.5" style={{ color: "#9B9B9B" }}>上のボタンから始めてみましょう！</p>
          </div>
        )}

        {/* みおのミハダノート リンク */}
        <a
          href="https://blog-engine.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-3 rounded-2xl text-center text-sm font-medium mb-4"
          style={{ background: "#FFF0F5", color: "#F9A8C0", border: "1px solid rgba(249,168,192,0.2)", textDecoration: "none" }}
        >
          みおのミハダノート（ブログ）を読む →
        </a>

        <Disclaimer />
      </div>
    </div>
  );
}
