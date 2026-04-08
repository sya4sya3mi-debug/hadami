"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useProductStore } from "@/stores/useProductStore";
import { useZukanStore } from "@/stores/useZukanStore";
import { useDeckStore } from "@/stores/useDeckStore";
import { getIngredientById, getGenreInfo } from "@/lib/ingredients";
import { getScanCountByEmail, updateLastUsedAtInDb } from "@/lib/db";
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


const TIPS = [
  { icon: "💡", text: "パンテノール（ビタミンB5）は保湿と修復の両方を担う万能成分。朝晩どちらでも効果的です。" },
  { icon: "🌿", text: "ツボクサエキス（CICA）は★3のレア成分。韓国では「鎮静の王様」と呼ばれています。" },
  { icon: "🔬", text: "ヒアルロン酸Naは1gで6Lの水分を保持。乾燥肌の救世主です。" },
];

const STREAK_KEY = "hadami-routine-streak";
const ROUTINE_CHECK_KEY = "hadami-routine-checks";

function getStreakData(): { lastDate: string; count: number } {
  if (typeof window === "undefined") return { lastDate: "", count: 0 };
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { lastDate: "", count: 0 };
}

function saveStreakData(data: { lastDate: string; count: number }) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STREAK_KEY, JSON.stringify(data));
}

function getRoutineChecks(routine: string): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(ROUTINE_CHECK_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data.routine === routine) {
        return new Set(data.checked as number[]);
      }
    }
  } catch { /* ignore */ }
  return new Set();
}

function saveRoutineChecks(routine: string, checked: Set<number>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ROUTINE_CHECK_KEY, JSON.stringify({
    routine,
    checked: Array.from(checked),
  }));
}

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

export default function HomePage() {
  const { user, profile, supabase, loading } = useUser();
  const products = useProductStore((s) => s.products);
  const updateLastUsedAt = useProductStore((s) => s.updateLastUsedAt);
  const discoveredCount = useZukanStore((s) => s.discoveredIds.length);
  const deckItems = useDeckStore((s) => s.items);
  const router = useRouter();
  const [scanCount, setScanCount] = useState<number | null>(null);

  // Auto-detect routine based on time
  const currentHour = new Date().getHours();
  const autoRoutine = currentHour < 15 ? "morning" : "night";

  // Routine checklist state
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(() => getRoutineChecks(autoRoutine));
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [streak, setStreak] = useState(0);
  const [streakJustUpdated, setStreakJustUpdated] = useState(false);

  // Load streak on mount
  useEffect(() => {
    const data = getStreakData();
    setStreak(data.count);
  }, []);

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

  const routineDeckItems = deckItems.filter((i) => i.routine === autoRoutine);
  const recentProducts = products.slice(0, 3);

  // Build steps from deck items + products
  const routineSteps: RoutineStep[] = routineDeckItems.map((di) => {
    const prod = products.find((p) => p.id === di.productId);
    return {
      name: prod?.name || "不明な製品",
      brand: prod?.brand || "",
      type: prod?.productType || "",
      ingredients: (prod?.ingredients || []).slice(0, 3).map((pi) => {
        const ing = getIngredientById(pi.ingredientId);
        const genreInfo = ing ? getGenreInfo(ing.genre) : null;
        return {
          name: ing?.nameJa || pi.ingredientId || "",
          icon: genreInfo?.icon || "💧",
          cat: genreInfo?.label || "うるおい",
        };
      }),
    };
  });

  const toggleStep = (i: number) => {
    const wasChecked = checkedSteps.has(i);
    const next = new Set(checkedSteps);
    if (next.has(i)) { next.delete(i); } else { next.add(i); }
    setCheckedSteps(next);
    saveRoutineChecks(autoRoutine, next);

    // チェックを入れた時に最終使用日を更新
    if (!wasChecked && routineDeckItems[i]) {
      const productId = routineDeckItems[i].productId;
      const now = new Date().toISOString();
      updateLastUsedAt(productId, now);
      if (user) {
        updateLastUsedAtInDb(supabase, user.id, productId, now).catch(() => {});
      }
    }

    if (!wasChecked && routineSteps[i]) {
      const step = routineSteps[i];
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
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
      }, 1500);
    }

    // Check if all completed after this toggle
    if (!wasChecked && next.size === routineSteps.length && routineSteps.length > 0) {
      setShowCelebration(true);
      // Update streak
      const today = new Date().toISOString().slice(0, 10);
      const data = getStreakData();
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      let newCount: number;
      if (data.lastDate === today) {
        newCount = data.count; // already counted today
      } else if (data.lastDate === yesterday) {
        newCount = data.count + 1;
      } else {
        newCount = 1;
      }
      saveStreakData({ lastDate: today, count: newCount });
      if (newCount !== streak) {
        setStreak(newCount);
        setStreakJustUpdated(true);
        setTimeout(() => setStreakJustUpdated(false), 3000);
      }
    }
  };

  const todayTip = TIPS[new Date().getDate() % TIPS.length];
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const routineIcon = autoRoutine === "morning" ? "☀️" : "🌙";
  const routineLabel = autoRoutine === "morning" ? "朝ルーティン" : "夜ルーティン";
  const allComplete = checkedSteps.size === routineSteps.length && routineSteps.length > 0;

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
          <div
            onClick={() => router.push("/settings")}
            className={`w-11 h-11 rounded-[14px] bg-gradient-to-br from-bo-accent to-bo-accent-dark flex items-center justify-center text-white text-[15px] font-bold font-sans relative transition-shadow duration-400 cursor-pointer ${particles.length > 0 ? "animate-avatar-absorb shadow-[0_0_24px_rgba(58,143,122,0.5),0_0_48px_rgba(58,143,122,0.2)]" : "shadow-[0_6px_20px_rgba(58,143,122,0.14)]"}`}
          >
            {profile?.display_name?.charAt(0) || "？"}
            {particles.length > 0 && (
              <div className="absolute -inset-1 rounded-[18px] border-2 border-bo-accent/40 animate-avatar-absorb pointer-events-none" />
            )}
          </div>
        </div>

        {user && <InstallBanner />}

        {/* Streak badge */}
        {streak > 0 && (
          <div className={`mb-4 flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 ${streakJustUpdated ? "animate-fade-up" : ""}`}>
            <span className="text-base">🔥</span>
            <span className="text-xs font-bold text-amber-700 font-sans">
              連続 {streak} 日達成中！
            </span>
          </div>
        )}

        {/* Routine Checklist — auto morning/night */}
        {routineSteps.length > 0 && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-[15px] font-bold font-sans text-bo-ink m-0">{routineIcon} {routineLabel}</h2>
              <span className={`text-xs font-black font-serif ${allComplete ? "text-bo-safe" : "text-bo-accent"}`}>
                {checkedSteps.size}/{routineSteps.length}
              </span>
            </div>
            <div className="h-1 rounded-sm bg-bo-parchment mb-3.5 overflow-hidden">
              <div
                className="h-full rounded-sm transition-[width] duration-500"
                style={{
                  width: (checkedSteps.size / routineSteps.length * 100) + "%",
                  background: allComplete
                    ? "linear-gradient(90deg, #4A9B7F, #6BC4A0)"
                    : "linear-gradient(90deg, #3A8F7A, #7DD3C8)",
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              {routineSteps.map((step, i) => {
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

            {/* Celebration */}
            {showCelebration && allComplete && (
              <div className="mt-4 py-5 px-4 rounded-r2 bg-gradient-to-br from-bo-accent-soft via-[#E0F5EE] to-[#D6EDE6] text-center animate-fade-up border border-bo-accent/20 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1 left-4 text-lg animate-bounce" style={{ animationDelay: "0ms" }}>✨</div>
                  <div className="absolute top-2 right-6 text-lg animate-bounce" style={{ animationDelay: "200ms" }}>🌟</div>
                  <div className="absolute bottom-2 left-8 text-sm animate-bounce" style={{ animationDelay: "400ms" }}>💫</div>
                  <div className="absolute bottom-1 right-4 text-sm animate-bounce" style={{ animationDelay: "300ms" }}>✨</div>
                </div>
                <div className="text-3xl mb-2">🎉🛡️🎉</div>
                <div className="text-sm font-extrabold text-bo-accent font-sans mb-1">
                  {routineLabel}コンプリート！
                </div>
                <div className="text-xs text-bo-ink-muted font-sans mb-2">
                  お疲れさまでした！今日も肌を大切にできました
                </div>
                {streak > 0 && (
                  <div className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-full bg-white/80 border border-amber-200">
                    <span className="text-base">🔥</span>
                    <span className="text-xs font-bold text-amber-700 font-sans">
                      連続 {streak} 日目！
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2.5 mb-6">
          {[
            { n: discoveredCount, label: "成分コレクト", icon: "📖" },
            { n: products.length, label: "マイコスメ", icon: "📦" },
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
        {recentProducts.length === 0 && routineSteps.length === 0 && (
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
