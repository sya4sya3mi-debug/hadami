"use client";

import Link from "next/link";
import Image from "next/image";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useProductStore } from "@/stores/useProductStore";
import { useZukanStore } from "@/stores/useZukanStore";
import { useDeckStore } from "@/stores/useDeckStore";
import { getIngredientById } from "@/lib/ingredients";
import { getGenreByKey } from "@/lib/productGenres";
import { getScanCountByEmail, updateLastUsedAtInDb } from "@/lib/db";
import Disclaimer from "@/components/ui/Disclaimer";
import InstallBanner from "@/components/ui/InstallBanner";
import { useUser } from "@/lib/auth";

import LandingPage from "@/components/ui/LandingPage";
import { ProductGenreIcon, ActiveCategoryIcon } from "@/components/ui/CosmeticIcons";
import { BookIcon, PackageIcon, ScanIcon, CameraIcon, LeafIcon, LightbulbIcon, SunIcon, MoonIcon } from "@/components/ui/Icons";
import { ACTIVE_CATEGORIES } from "@/lib/ingredients";
import { CategoryKey } from "@/types";

interface RoutineStep {
  name: string;
  brand: string;
  type: string;
  image?: string;
  categories: CategoryKey[];
}


const TIPS = [
  { icon: "💡", text: "パンテノール（ビタミンB5）は保湿と修復の両方を担う万能成分。朝晩どちらでも効果的です。" },
  { icon: "🌿", text: "ツボクサエキス（CICA）は★3のレア成分。韓国では「鎮静の王様」と呼ばれています。" },
  { icon: "🔬", text: "ヒアルロン酸Naは1gで6Lの水分を保持。乾燥肌の救世主です。" },
];

const ROUTINE_CHECK_KEY = "hadami-routine-checks";

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

const RoutineStepButton = memo(function RoutineStepButton({
  step,
  index,
  done,
  onToggle,
}: {
  step: RoutineStep;
  index: number;
  done: boolean;
  onToggle: (i: number) => void;
}) {
  const genre = getGenreByKey(step.type || "other");
  return (
    <button
      onClick={() => onToggle(index)}
      aria-label={step.name + (done ? "（完了）" : "")}
      className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-r2 cursor-pointer text-left relative overflow-hidden
                  transition-all duration-200 border-none pressable ${
        done
          ? "bg-bo-accent-soft/40 shadow-none scale-[0.985]"
          : "bg-white shadow-bo1 scale-100"
      }`}
      style={done ? { borderLeft: "3px solid #3A8F7A" } : { borderLeft: "3px solid transparent" }}
    >
      {/* Checkbox */}
      <div
        className={`w-6 h-6 rounded-[8px] shrink-0 flex items-center justify-center transition-all duration-300 ${
          done
            ? "bg-bo-accent shadow-bo-accent scale-110"
            : "bg-white border-2 border-bo-ink-faint/40 scale-100"
        }`}
      >
        {done && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        )}
      </div>

      {/* Product image or genre icon */}
      {step.image ? (
        <div className="w-8 h-8 rounded-[8px] overflow-hidden shrink-0 shadow-bo1 relative">
          <Image src={step.image} alt={step.name} fill className="object-cover" sizes="32px" loading="lazy" />
        </div>
      ) : genre ? (
        <div
          className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0"
          style={{ background: `${genre.color}15` }}
        >
          <ProductGenreIcon genre={genre.key} size={15} />
        </div>
      ) : null}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-sans overflow-hidden text-ellipsis whitespace-nowrap transition-colors duration-200 ${
          done ? "font-semibold text-bo-ink-muted" : "font-bold text-bo-ink"
        }`}>
          {step.name}
        </div>
        <div className={`text-[10px] font-sans mt-0.5 transition-colors duration-200 ${done ? "text-bo-accent font-semibold" : "text-bo-ink-muted"}`}>
          {done ? "✓ 完了" : `${step.brand} · ${genre?.label || step.type}`}
        </div>
      </div>

      {/* Category icons */}
      {step.categories.length > 0 && (
        <div className={`flex gap-1 shrink-0 transition-opacity duration-300 ${done ? "opacity-30" : "opacity-100"}`}>
          {step.categories.slice(0, 3).map((catKey) => {
            const info = ACTIVE_CATEGORIES.find((c) => c.key === catKey);
            return info ? (
              <span
                key={catKey}
                className="w-5 h-5 rounded-full inline-flex items-center justify-center"
                style={{ background: info.color + "20", color: info.color }}
                title={info.label}
              >
                <ActiveCategoryIcon category={info.key} size={11} />
              </span>
            ) : null;
          })}
        </div>
      )}
    </button>
  );
});

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

  if (loading) return null;
  if (!user) return <LandingPage />;

  const routineDeckItems = deckItems
    .filter((i) => i.routine === autoRoutine)
    .sort((a, b) => {
      const pa = products.find((p) => p.id === a.productId);
      const pb = products.find((p) => p.id === b.productId);
      const orderA = getGenreByKey(pa?.productType ?? "other")?.order ?? 99;
      const orderB = getGenreByKey(pb?.productType ?? "other")?.order ?? 99;
      return orderA - orderB;
    });
  const routineDeckEntries = routineDeckItems.flatMap((deckItem) => {
    const product = products.find((p) => p.id === deckItem.productId);
    return product ? [{ deckItem, product }] : [];
  });
  const normalizedCheckedSteps = new Set(
    Array.from(checkedSteps).filter((index) => index < routineDeckEntries.length)
  );
  const checkedCount = normalizedCheckedSteps.size;
  const recentProducts = products.slice(0, 3);

  // Memoize routine steps (skip recalc on checkbox toggle)
  const routineSteps = useMemo(() => {
    return routineDeckEntries.map(({ product }): RoutineStep => {
      const cats = new Set<CategoryKey>();
      product.ingredients.forEach((pi) => {
        const ing = getIngredientById(pi.ingredientId);
        if (ing?.activeIngredient) {
          ing.categories.forEach((cat) => cats.add(cat));
        }
      });
      return {
        name: product.name,
        brand: product.brand,
        type: product.productType,
        image: product.packageImageThumb ?? product.packageImage,
        categories: Array.from(cats),
      };
    });
  }, [routineDeckEntries]);

  const toggleStep = (i: number) => {
    const wasChecked = normalizedCheckedSteps.has(i);
    const next = new Set(normalizedCheckedSteps);
    if (next.has(i)) { next.delete(i); } else { next.add(i); }
    setCheckedSteps(next);
    saveRoutineChecks(autoRoutine, next);

    if (!wasChecked && routineDeckEntries[i]) {
      const productId = routineDeckEntries[i].product.id;
      const now = new Date().toISOString();
      updateLastUsedAt(productId, now);
      if (user) {
        updateLastUsedAtInDb(supabase, user.id, productId).catch(() => {});
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

  const RoutineIcon = autoRoutine === "morning" ? SunIcon : MoonIcon;
  const routineLabel = autoRoutine === "morning" ? "朝ルーティン" : "夜ルーティン";
  const allComplete = checkedCount === routineSteps.length && routineSteps.length > 0;
  const routineProgress = routineSteps.length > 0 ? checkedCount / routineSteps.length : 0;

  return (
    <div className="min-h-screen bg-bo-cream">
      <div className="px-5 pt-5 pb-6 relative overflow-hidden">

          {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-[10px] text-bo-ink-muted font-sans mb-1 tracking-[0.15em] uppercase font-semibold">
              {greeting}
            </p>
            <h1 className="text-2xl font-extrabold font-serif text-bo-ink m-0 leading-tight tracking-tight">
              {profile?.display_name || "HADAMI"}
            </h1>
          </div>
          <div
            onClick={() => router.push("/settings")}
            className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-bo-accent to-bo-accent-dark flex items-center justify-center text-white text-base font-bold font-sans cursor-pointer pressable shadow-bo-accent"
          >
            {profile?.display_name?.charAt(0) || "？"}
          </div>
        </div>

        {user && <InstallBanner />}

        {/* Routine Checklist — auto morning/night */}
        {routineSteps.length > 0 && (
          <div className="mb-5">
            {/* Routine header with ring progress */}
            <div className="flex justify-between items-center mb-2.5">
              <div className="flex items-center gap-2.5">
                <RoutineIcon size={20} color="#3A8F7A" />
                <div>
                  <h2 className="text-base font-bold font-sans text-bo-ink m-0">{routineLabel}</h2>
                  <p className="text-[10px] text-bo-ink-muted font-sans mt-0.5">
                    {checkedCount}/{routineSteps.length} ステップ完了
                  </p>
                </div>
              </div>
              {/* Mini ring progress */}
              <div className="relative w-9 h-9">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#E8F5EE" strokeWidth="3.5" />
                  <circle
                    cx="18" cy="18" r="15" fill="none"
                    stroke={allComplete ? "#3A8F7A" : "#3A8F7A"}
                    strokeWidth="3.5" strokeLinecap="round"
                    strokeDasharray={`${routineProgress * 94.2} 999`}
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-[11px] font-black font-sans ${allComplete ? "text-bo-accent" : "text-bo-ink"}`}>
                    {Math.round(routineProgress * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Step list */}
            <div className="flex flex-col gap-1.5">
              {routineSteps.map((step, i) => (
                <RoutineStepButton
                  key={i}
                  step={step}
                  index={i}
                  done={normalizedCheckedSteps.has(i)}
                  onToggle={toggleStep}
                />
              ))}
            </div>

          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2.5 mb-6">
          {[
            { n: discoveredCount, label: "成分コレクト", Icon: BookIcon, href: "/zukan" },
            { n: products.length, label: "マイコスメ", Icon: PackageIcon, href: "/history" },
            { n: scanCount ?? 0, label: "スキャン回数", Icon: ScanIcon, href: "/scan" },
          ].map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className="py-4 px-3 text-center rounded-r2 bg-white shadow-bo1 no-underline pressable
                         active:scale-[0.97] transition-transform"
            >
              <div className="flex justify-center mb-1.5">
                <s.Icon size={20} color="#3A8F7A" />
              </div>
              <div className="text-xl font-black font-serif text-bo-accent leading-none">
                <Counter to={s.n} />
              </div>
              <div className="text-[10px] text-bo-ink-muted font-sans mt-1">{s.label}</div>
            </Link>
          ))}
        </div>

        {/* Today's Ingredient Tip */}
        <div className="rounded-r2 bg-white shadow-bo1 mb-6 overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-bo-accent/40 via-bo-accent to-bo-accent/40" />
          <div className="p-4 flex gap-3.5">
            <div className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0
                            bg-gradient-to-br from-bo-accent-soft to-[#D4F5EF]">
              <LightbulbIcon size={20} color="#3A8F7A" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-extrabold text-bo-accent font-sans mb-1.5 tracking-wider uppercase">
                今日の成分メモ
              </div>
              <p className="text-xs text-bo-ink-soft font-sans leading-relaxed m-0">{todayTip.text}</p>
            </div>
          </div>
        </div>

        {/* Recent Scans */}
        {recentProducts.length > 0 && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-bold font-sans text-bo-ink m-0">最近のスキャン</h2>
              <Link href="/history" className="text-xs text-bo-accent font-semibold font-sans no-underline pressable">
                すべて見る →
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar -mx-5 px-5 pb-1 snap-x snap-mandatory"
                 style={{ WebkitOverflowScrolling: "touch" }}>
              {recentProducts.map((item) => {
                const genre = getGenreByKey(item.productType || "other");
                return (
                  <Link
                    key={item.id}
                    href={`/product/${item.id}`}
                    className="min-w-[170px] max-w-[170px] snap-start bg-white rounded-r2 overflow-hidden shadow-bo1
                               cursor-pointer shrink-0 no-underline pressable"
                  >
                    {/* Product image or gradient placeholder */}
                    {item.packageImage ? (
                      <div className="w-full h-24 relative">
                        <Image
                          src={item.packageImageThumb ?? item.packageImage}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="170px"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      </div>
                    ) : (
                      <div
                        className="w-full h-24 flex items-center justify-center text-3xl"
                        style={{ background: genre ? `${genre.color}10` : "#f5f5f5" }}
                      >
                        {genre ? <ProductGenreIcon genre={genre.key} size={32} /> : "📦"}
                      </div>
                    )}
                    <div className="p-3">
                      {genre && (
                        <div className="text-[9px] font-bold font-sans px-2 py-0.5 rounded-md inline-block mb-1.5"
                             style={{ background: `${genre.color}15`, color: genre.color }}>
                          {genre.label}
                        </div>
                      )}
                      <div className="text-xs font-bold text-bo-ink font-sans mb-0.5 leading-snug line-clamp-2">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-bo-ink-muted font-sans truncate">{item.brand}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {recentProducts.length === 0 && routineSteps.length === 0 && (
          <div className="text-center py-12 rounded-r2 bg-white shadow-bo1">
            <div className="w-20 h-20 rounded-[24px] mx-auto mb-4 flex items-center justify-center
                            bg-gradient-to-br from-bo-accent-soft to-[#D4F5EF]
                            shadow-[0_8px_24px_rgba(58,143,122,0.12)]">
              <LeafIcon size={36} color="#3A8F7A" />
            </div>
            <p className="font-bold text-sm text-bo-ink font-sans">まだコスメをスキャンしていません</p>
            <p className="text-xs text-bo-ink-muted mt-1.5 mb-5 font-sans">
              化粧品をスキャンしてスキンケアの旅を始めましょう
            </p>
            <Link
              href="/scan"
              className="inline-flex items-center gap-2 py-3 px-6 rounded-r2 bg-bo-accent text-white
                         text-sm font-bold no-underline shadow-bo-accent pressable font-sans"
            >
              <CameraIcon size={16} color="white" /> スキャンする
            </Link>
          </div>
        )}

        <Disclaimer />
      </div>
    </div>
  );
}
