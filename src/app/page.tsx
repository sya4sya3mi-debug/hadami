"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useProductStore } from "@/stores/useProductStore";
import { useZukanStore } from "@/stores/useZukanStore";
import { useDeckStore } from "@/stores/useDeckStore";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { MASTER_INGREDIENTS } from "@/lib/ingredients";
import { getScanCountByEmail } from "@/lib/db";
import Disclaimer from "@/components/ui/Disclaimer";
import InstallBanner from "@/components/ui/InstallBanner";
import { useUser } from "@/lib/auth";
import PageLoading from "@/components/ui/PageLoading";
import LandingPage from "@/components/ui/LandingPage";
import Glass from "@/components/ui/Glass";

interface Particle {
  id: number;
  icon: string;
  name: string;
  x: number;
  y: number;
  delay: number;
}

interface RoutineStep {
  name: string;
  brand: string;
  type: string;
  ingredients: { name: string; icon: string; cat: string }[];
}

const ALL_CATS = ["保湿", "鎮静", "修復", "美白", "UV防御", "エイジング"] as const;
const CAT_ICONS: Record<string, string> = {
  "保湿": "💧", "鎮静": "🌿", "修復": "🩹", "美白": "✨", "UV防御": "🛡️", "エイジング": "🔬",
};

const TIPS = [
  { icon: "💡", text: "パンテノール（ビタミンB5）は保湿と修復の両方を担う万能成分。朝晩どちらでも効果的です。" },
  { icon: "🌿", text: "ツボクサエキス（CICA）は★3のレア成分。韓国では「鎮静の王様」と呼ばれています。" },
  { icon: "🔬", text: "ヒアルロン酸Naは1gで6Lの水分を保持。乾燥肌の救世主です。" },
];

function Counter({ to, dur = 900 }: { to: number; dur?: number }) {
  const [v, setV] = useState(0);
  const ref = useRef<number>(0);
  useEffect(() => {
    let s: number | undefined;
    const step = (t: number) => {
      if (s === undefined) s = t;
      const p = Math.min((t - s) / dur, 1);
      setV(Math.round(p * p * to));
      if (p < 1) ref.current = requestAnimationFrame(step);
    };
    ref.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(ref.current);
  }, [to, dur]);
  return <>{v}</>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ScoreBar({ score, h = 4 }: { score: number; h?: number }) {
  const color = score >= 75 ? "#4A9B7F" : score >= 45 ? "#C49032" : "#C05050";
  return (
    <div className="w-full rounded-full overflow-hidden bg-bo-parchment" style={{ height: h }}>
      <div
        className="h-full rounded-full transition-[width] duration-700"
        style={{ width: `${score}%`, background: color }}
      />
    </div>
  );
}

export default function HomePage() {
  const { user, profile, supabase, loading } = useUser();
  const products = useProductStore((s) => s.products);
  const discoveredCount = useZukanStore((s) => s.discoveredIds.length);
  const deckItems = useDeckStore((s) => s.items);
  const router = useRouter();
  const [scanCount, setScanCount] = useState<number | null>(null);


  // Routine checklist state
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());
  const [particles, setParticles] = useState<Particle[]>([]);
  const [absorbedCats, setAbsorbedCats] = useState<Record<string, number>>(
    Object.fromEntries(ALL_CATS.map((c) => [c, 0]))
  );

  useEffect(() => {
    if (!loading && user && profile !== undefined && (profile === null || !profile.display_name)) {
      router.replace("/auth/profile");
    }
  }, [loading, user, profile, router]);

  const fetchScanCount = useCallback(async () => {
    if (!user?.email) return;
    const count = await getScanCountByEmail(supabase, user.email);
    setScanCount(count);
  }, [user, supabase]);

  useEffect(() => {
    fetchScanCount();
  }, [fetchScanCount]);

  if (loading) return <PageLoading />;
  if (!user) return <LandingPage />;

  const morningDeckItems = deckItems.filter((i) => i.routine === "morning");
  const recentProducts = products.slice(0, 3);

  // Build morning steps from deck items + products
  const morningSteps: RoutineStep[] = morningDeckItems.map((di) => {
    const prod = products.find((p) => p.id === di.productId);
    return {
      name: prod?.name || "不明な製品",
      brand: prod?.brand || "",
      type: prod?.productType || "",
      ingredients: (prod?.ingredients || []).slice(0, 3).map((ing) => ({
        name: ing.ingredientId || "",
        icon: "💧",
        cat: "保湿",
      })),
    };
  });

  const toggleStep = (i: number) => {
    const wasChecked = checkedSteps.has(i);
    setCheckedSteps((prev) => {
      const n = new Set(prev);
      if (n.has(i)) { n.delete(i); } else { n.add(i); }
      return n;
    });

    if (!wasChecked && morningSteps[i]) {
      const step = morningSteps[i];
      const baseY = 330 + i * 56;
      const newParticles: Particle[] = step.ingredients.map((ing, j) => ({
        id: Date.now() + j + Math.random() * 1000,
        icon: ing.icon,
        name: ing.name,
        x: 40 + Math.random() * 120,
        y: baseY,
        delay: j * 200,
      }));
      setParticles((prev) => [...prev, ...newParticles]);

      setAbsorbedCats((prev) => {
        const next = { ...prev };
        step.ingredients.forEach((ing) => {
          next[ing.cat] = Math.min(100, (next[ing.cat] || 0) + 33);
        });
        return next;
      });

      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
      }, 1500);
    } else if (wasChecked && morningSteps[i]) {
      const step = morningSteps[i];
      setAbsorbedCats((prev) => {
        const next = { ...prev };
        step.ingredients.forEach((ing) => {
          next[ing.cat] = Math.max(0, (next[ing.cat] || 0) - 33);
        });
        return next;
      });
    }
  };

  const todayTip = TIPS[new Date().getDate() % TIPS.length];
  const totalGauge = ALL_CATS.reduce((sum, c) => sum + (absorbedCats[c] || 0), 0) / (ALL_CATS.length * 100) * 100;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="min-h-screen bg-bo-cream">
      <div className="px-5 pt-4 pb-6 relative overflow-hidden">

        {/* Particle layer */}
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute z-50 flex flex-col items-center gap-0.5 pointer-events-none opacity-0 animate-particle-fly"
            style={{ left: p.x, top: p.y, animationDelay: p.delay + "ms" }}
          >
            <span className="text-xl drop-shadow-[0_0_6px_rgba(58,143,122,0.5)]">{p.icon}</span>
            <span className="text-[8px] font-bold text-bo-accent font-sans bg-white/95 rounded px-1.5 py-px whitespace-nowrap shadow-sm">
              {p.name}
            </span>
          </div>
        ))}

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-xs text-bo-ink-muted font-sans mb-1 tracking-[0.12em] uppercase">{greeting}</p>
            <h1 className="text-[28px] font-extrabold font-serif text-bo-ink m-0 leading-tight tracking-tight">
              成分から、<br />美しさを選ぶ。
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              className="w-9 h-9 rounded-[10px] bg-bo-parchment border-none flex items-center justify-center cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7E9389" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
            </Link>
            <div
              className={`w-11 h-11 rounded-[14px] bg-gradient-to-br from-bo-accent to-bo-accent-dark flex items-center justify-center text-white text-[15px] font-bold font-sans relative transition-shadow duration-400 ${particles.length > 0 ? "animate-avatar-absorb shadow-[0_0_24px_rgba(58,143,122,0.5),0_0_48px_rgba(58,143,122,0.2)]" : "shadow-[0_6px_20px_rgba(58,143,122,0.14)]"}`}
            >
              {profile?.display_name?.charAt(0) || "？"}
              {particles.length > 0 && (
                <div className="absolute -inset-1 rounded-[18px] border-2 border-bo-accent/40 animate-avatar-absorb pointer-events-none" />
              )}
            </div>
          </div>
        </div>

        {user && <InstallBanner />}

        {/* Category absorption gauge */}
        <div
          className={`mb-5 p-3.5 px-4 rounded-r2 bg-white border border-bo-parchment shadow-bo1 ${totalGauge > 0 ? "animate-gauge-glow" : ""}`}
        >
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-xs font-bold text-bo-ink font-sans">今日の成分シールド</span>
            <span className={`text-[11px] font-black font-serif ${totalGauge >= 80 ? "text-bo-safe" : "text-bo-accent"}`}>
              {Math.round(totalGauge)}%
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {ALL_CATS.map((cat) => {
              const val = absorbedCats[cat] || 0;
              return (
                <div key={cat} className="text-center">
                  <div className="text-xs mb-0.5">{CAT_ICONS[cat]}</div>
                  <div className="h-[3px] rounded-full bg-bo-parchment overflow-hidden mb-0.5">
                    <div
                      className="h-full rounded-full bg-bo-accent transition-[width] duration-500"
                      style={{ width: val + "%" }}
                    />
                  </div>
                  <div className={`text-[8px] font-sans ${val > 0 ? "text-bo-accent font-bold" : "text-bo-ink-faint font-normal"}`}>
                    {cat}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Morning Routine Checklist */}
        {morningSteps.length > 0 && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-[15px] font-bold font-sans text-bo-ink m-0">☀️ 朝ルーティン</h2>
              <span className={`text-xs font-black font-serif ${checkedSteps.size === morningSteps.length ? "text-bo-safe" : "text-bo-accent"}`}>
                {checkedSteps.size}/{morningSteps.length}
              </span>
            </div>
            <div className="h-1 rounded-sm bg-bo-parchment mb-3.5 overflow-hidden">
              <div
                className="h-full rounded-sm transition-[width] duration-500"
                style={{
                  width: (checkedSteps.size / morningSteps.length * 100) + "%",
                  background: checkedSteps.size === morningSteps.length
                    ? "linear-gradient(90deg, #4A9B7F, #6BC4A0)"
                    : "linear-gradient(90deg, #3A8F7A, #7DD3C8)",
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              {morningSteps.map((step, i) => {
                const done = checkedSteps.has(i);
                return (
                  <button
                    key={i}
                    onClick={() => toggleStep(i)}
                    aria-label={step.name + (done ? "（完了）" : "")}
                    className={`flex items-center gap-2.5 py-2.5 px-3 rounded-r1 shadow-bo1 cursor-pointer text-left relative overflow-hidden transition-all duration-200 border ${
                      done
                        ? "bg-bo-accent-soft border-bo-accent scale-[0.98]"
                        : "bg-white border-bo-parchment scale-100"
                    }`}
                  >
                    <div
                      className={`w-[22px] h-[22px] rounded-md shrink-0 flex items-center justify-center transition-all duration-300 ${
                        done
                          ? "bg-bo-accent border-none scale-110"
                          : "bg-white border-[1.5px] border-bo-ink-faint scale-100"
                      }`}
                    >
                      {done && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      )}
                    </div>
                    <div className="w-[18px] h-[18px] rounded-[5px] flex items-center justify-center text-[9px] font-black font-serif shrink-0"
                      style={{
                        background: done ? "rgba(255,255,255,0.6)" : "#E8F0EC",
                        color: done ? "#fff" : "#7E9389",
                      }}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-[11px] font-sans overflow-hidden text-ellipsis whitespace-nowrap ${done ? "font-semibold text-bo-ink-muted line-through" : "font-bold text-bo-ink"}`}>
                        {step.name}
                      </div>
                      <div className="text-[9px] text-bo-ink-muted font-sans mt-px">
                        {step.brand} · {step.type}
                      </div>
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      {step.ingredients.map((ing, j) => (
                        <span key={j} className={`text-[10px] transition-opacity duration-300 ${done ? "opacity-40" : "opacity-70"}`}>
                          {ing.icon}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
            {checkedSteps.size === morningSteps.length && morningSteps.length > 0 && (
              <div className="mt-3 py-3.5 px-4 rounded-r1 bg-gradient-to-br from-bo-accent-soft to-[#E0F5EE] text-center animate-fade-up">
                <div className="text-base mb-1">🎉🛡️</div>
                <span className="text-xs font-bold text-bo-accent font-sans">今日の成分シールド完成！お疲れさまです</span>
              </div>
            )}
          </div>
        )}

        {/* Scan CTA */}
        <Link
          href="/scan"
          className="block relative rounded-r3 overflow-hidden mb-6 cursor-pointer bg-gradient-to-br from-bo-accent-soft via-[#EAF5F0] to-bo-parchment border border-bo-accent/15 shadow-[0_8px_32px_rgba(58,143,122,0.08)] no-underline"
        >
          <div className="absolute -top-[30px] -right-[10px] w-[120px] h-[120px] rounded-full bg-[radial-gradient(circle,rgba(58,143,122,0.1)_0%,transparent_70%)]" />
          <div className="relative py-5 px-5 z-[1]">
            <div className="flex items-center gap-3.5">
              <div className="w-[46px] h-[46px] rounded-[14px] bg-white/70 backdrop-blur-xl border border-white/50 flex items-center justify-center text-[22px] shadow-bo1">
                📸
              </div>
              <div className="flex-1">
                <div className="text-[15px] font-bold text-bo-ink font-sans mb-0.5">成分をスキャン</div>
                <div className="text-[11px] text-bo-ink-muted font-sans">パッケージを撮影 → AI が成分を検索</div>
              </div>
              <div className="w-[34px] h-[34px] rounded-[11px] bg-bo-accent flex items-center justify-center shadow-bo-accent">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </Link>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2.5 mb-6">
          {[
            { n: discoveredCount, label: "成分コレクト", icon: "📖" },
            { n: products.length, label: "Myコスメ", icon: "📦" },
            { n: scanCount ?? 0, label: "スキャン回数", icon: "📸" },
          ].map((s, i) => (
            <Glass key={i} className="py-3.5 px-2.5 text-center">
              <div className="text-[13px] mb-0.5">{s.icon}</div>
              <div className="text-xl font-black font-serif text-bo-accent leading-none">
                <Counter to={s.n} />
              </div>
              <div className="text-[9px] text-bo-ink-muted font-sans mt-0.5">{s.label}</div>
            </Glass>
          ))}
        </div>

        {/* Today's Ingredient Tip */}
        <div className="p-4 px-4.5 rounded-r2 bg-white border border-bo-parchment shadow-bo1 mb-6">
          <div className="flex gap-3">
            <span className="text-xl shrink-0">{todayTip.icon}</span>
            <div>
              <div className="text-[11px] font-bold text-bo-accent font-sans mb-1">今日の成分メモ</div>
              <p className="text-[11px] text-bo-ink-soft font-sans leading-relaxed m-0">{todayTip.text}</p>
            </div>
          </div>
        </div>

        {/* Recent Scans */}
        {recentProducts.length > 0 && (
          <div className="mb-6">
            <div className="flex justify-between items-baseline mb-3">
              <h2 className="text-[15px] font-bold font-sans text-bo-ink m-0">最近のスキャン</h2>
              <Link href="/history" className="text-[11px] text-bo-ink-muted font-sans no-underline">すべて →</Link>
            </div>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar -mx-5 px-5 pb-1 snap-x snap-mandatory">
              {recentProducts.map((item) => (
                <Link
                  key={item.id}
                  href={`/product/${item.id}`}
                  className="min-w-[180px] snap-start bg-white rounded-r2 p-4 px-3.5 shadow-bo1 border border-bo-parchment cursor-pointer shrink-0 no-underline transition-transform duration-200"
                >
                  <div className="text-[10px] font-bold font-sans text-bo-accent bg-bo-accent-soft py-0.5 px-2 rounded-md inline-block mb-2">
                    {item.productType || "コスメ"}
                  </div>
                  <div className="text-xs font-bold text-bo-ink font-sans mb-0.5 leading-snug line-clamp-2">
                    {item.name}
                  </div>
                  <div className="text-[10px] text-bo-ink-muted font-sans">{item.brand}</div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {recentProducts.length === 0 && morningSteps.length === 0 && (
          <div className="text-center py-10 rounded-r3 bg-white/70">
            <div className="text-5xl mb-3">🌿</div>
            <p className="font-bold text-sm text-bo-ink">まだコスメをスキャンしていません</p>
            <p className="text-xs text-bo-ink-muted mt-1.5">上のボタンから始めてみましょう！</p>
          </div>
        )}

        <Disclaimer />
      </div>
    </div>
  );
}
