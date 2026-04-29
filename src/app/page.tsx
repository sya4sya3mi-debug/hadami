"use client";

import "@/styles/hadami-tokens.css";
import Link from "next/link";
import Image from "next/image";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useProductStore } from "@/stores/useProductStore";
import { useZukanStore } from "@/stores/useZukanStore";
import { useDeckStore } from "@/stores/useDeckStore";
import { getIngredientById } from "@/lib/ingredients";
import { getGenreByKey } from "@/lib/productGenres";
import { getMonthlyScanCount, updateLastUsedAtInDb } from "@/lib/db";
import Disclaimer from "@/components/ui/Disclaimer";
import InstallBanner from "@/components/ui/InstallBanner";
import { useUser } from "@/lib/auth";

import LandingPage from "@/components/ui/LandingPage";
import { CameraIcon } from "@/components/ui/Icons";
import { CategoryKey } from "@/types";
import { Ico } from "@/components/redesign/apothecary/Icons";

interface RoutineStep {
  name: string;
  brand: string;
  type: string;
  image?: string;
  categories: CategoryKey[];
  color?: string;
}

function getStepInitials(step: RoutineStep): string {
  const source = (step.brand || step.name || "").trim();
  if (!source) return "—";
  const ascii = source.match(/[A-Za-z0-9]+/g)?.join(" ") ?? "";
  if (ascii) {
    const tokens = ascii.split(/\s+/).filter(Boolean);
    if (tokens.length === 1) {
      return tokens[0].slice(0, 3).toUpperCase();
    }
    return tokens
      .slice(0, 2)
      .map((t) => t.charAt(0))
      .join("")
      .toUpperCase();
  }
  return source.slice(0, 2);
}

function typeLabelEn(type: string): string {
  const map: Record<string, string> = {
    toner: "TONER",
    serum: "SERUM",
    emulsion: "EMULSION",
    cream: "CREAM",
    sunscreen: "SPF 50+",
    mask_pack: "MASK",
    cleansing: "CLEANSER",
    face_wash: "WASH",
    eye_care: "EYE",
    oil: "OIL",
    mist: "MIST",
    other: "ITEM",
  };
  return map[type] ?? "ITEM";
}

const TIPS = [
  { text: "パンテノール（ビタミンB5）は保湿と修復の両方を担う万能成分。朝晩どちらでも効果的です。" },
  { text: "ツボクサエキス（CICA）は★3のレア成分。韓国では「鎮静の王様」と呼ばれています。" },
  { text: "ヒアルロン酸Naは1gで6Lの水分を保持。乾燥肌の救世主です。" },
  { text: "ナイアシンアミド（ビタミンB3）は美白・シワ・毛穴に効くマルチタスカー。2〜5%が標準濃度です。" },
  { text: "セラミドは肌のバリア機能の主役。NP/AP/EOPなど構成比のバランスが重要です。" },
  { text: "アスコルビン酸（純粋ビタミンC）は10〜20%が高効果濃度。朝使用＋日焼け止めが鉄則。" },
  { text: "レチノール（ビタミンA）はターンオーバー促進の王道。夜のみ＋低濃度から始めるのが正解。" },
  { text: "アゼライン酸は肌のトーン補正と毛穴詰まり予防の両立。敏感肌でも使いやすい有効成分。" },
  { text: "グリセリンはあらゆる肌タイプの基本保湿剤。ヒアルロン酸との併用で吸引力が増します。" },
  { text: "アラントインは創傷治癒成分。CICAやマデカッソシドと組み合わせると相乗効果あり。" },
  { text: "サリチル酸（BHA）は油溶性で毛穴の奥まで届く角質ケア。週2〜3回がベスト。" },
  { text: "乳酸（AHA）は古い角質を優しく剥がす低刺激ピーリング。乾燥肌にもおすすめ。" },
];

const ROUTINE_CHECK_KEY = "hadami-routine-checks";

function getRoutinePeriodKey(routine: string): string {
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  return `${dateStr}:${routine}`;
}

function getRoutineChecks(routine: string): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(ROUTINE_CHECK_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      const periodKey = getRoutinePeriodKey(routine);
      if (data.periodKey === periodKey) {
        return new Set(data.checked as number[]);
      }
    }
  } catch { /* ignore */ }
  return new Set();
}

function saveRoutineChecks(routine: string, checked: Set<number>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ROUTINE_CHECK_KEY, JSON.stringify({
    periodKey: getRoutinePeriodKey(routine),
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const moonIco = (p: React.SVGProps<SVGSVGElement> = {}) => (
  <svg viewBox="0 0 20 20" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.6} {...p}>
    <path d="M16 11.5a6.5 6.5 0 1 1-8-8 5 5 0 0 0 8 8z" strokeLinejoin="round" />
  </svg>
);

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
  const eyebrow = `${typeLabelEn(step.type || "other")}${step.brand ? ` — ${step.brand.toUpperCase()}` : ""}`;
  const initials = getStepInitials(step);
  const tileColor = step.color || `${genre?.color ?? "#cdc4b3"}33`;

  return (
    <button
      onClick={() => onToggle(index)}
      aria-label={step.name + (done ? "（完了）" : "")}
      style={{
        width: "100%",
        background: "transparent",
        border: "none",
        padding: "16px 0",
        display: "flex",
        alignItems: "center",
        gap: 14,
        cursor: "pointer",
        textAlign: "left",
        opacity: done ? 0.55 : 1,
        borderBottom: "1px solid var(--hd-hair)",
      }}
    >
      <div
        className="hd-mono"
        style={{
          width: 22,
          fontSize: 11,
          color: "var(--hd-ink-40)",
          letterSpacing: "0.05em",
          flexShrink: 0,
          textDecoration: done ? "line-through" : "none",
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </div>

      <div
        style={{
          width: 72,
          height: 72,
          flexShrink: 0,
          overflow: "hidden",
          position: "relative",
          background: tileColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--hd-ink-60)",
          border: "1px solid var(--hd-hair)",
        }}
      >
        {step.image ? (
          <Image
            src={step.image}
            alt={step.name}
            fill
            style={{ objectFit: "cover" }}
            sizes="72px"
            loading="lazy"
          />
        ) : (
          <span
            className="hd-mono"
            style={{
              fontSize: initials.length > 2 ? 15 : 18,
              letterSpacing: "0.04em",
            }}
          >
            {initials}
          </span>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          className="hd-mono hd-caps"
          style={{
            color: "var(--hd-ink-40)",
            marginBottom: 4,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {eyebrow}
        </div>
        <div
          className="hd-serif"
          style={{
            fontSize: 16,
            lineHeight: 1.25,
            letterSpacing: "-0.01em",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {step.name}
        </div>
      </div>

      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: 999,
          background: done ? "var(--hd-ink)" : "transparent",
          border: done ? "none" : "1px solid var(--hd-ink-40)",
          color: "var(--hd-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {done && (
          <span className="hd-pop-in" style={{ display: "flex" }}>
            {Ico.check({ width: 11, height: 11, strokeWidth: 2 })}
          </span>
        )}
      </div>
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

  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const hashParams = new URLSearchParams(url.hash.slice(1));
    const hasRecoveryParams =
      hashParams.get("type") === "recovery" ||
      Boolean(hashParams.get("access_token")) ||
      url.searchParams.get("type") === "recovery" ||
      url.searchParams.get("flow") === "recovery" ||
      Boolean(url.searchParams.get("token_hash")) ||
      Boolean(url.searchParams.get("code"));

    if (!hasRecoveryParams) return;

    const nextUrl = new URL(`${window.location.origin}/auth/reset-password`);
    nextUrl.searchParams.set("mode", "update");

    ["code", "token_hash", "type", "flow", "recovery_error"].forEach((key) => {
      const value = url.searchParams.get(key);
      if (value) nextUrl.searchParams.set(key, value);
    });

    const nextHash = hashParams.toString();
    if (nextHash) {
      nextUrl.hash = nextHash;
    }

    window.location.replace(nextUrl.toString());
  }, []);

  const currentHour = new Date().getHours();
  const autoRoutine = currentHour < 15 ? "morning" : "night";

  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(() => getRoutineChecks(autoRoutine));

  useEffect(() => {
    if (!loading && user && profile !== undefined && (profile === null || !profile.display_name)) {
      router.replace("/auth/profile");
    }
  }, [loading, user, profile, router]);

  const fetchScanCount = useCallback(async () => {
    if (!user) return;
    const count = await getMonthlyScanCount(supabase, user.id);
    setScanCount(count);
  }, [user, supabase]);

  useEffect(() => {
    fetchScanCount();
  }, [fetchScanCount]);

  const routineDeckItems = useMemo(() =>
    deckItems
      .filter((i) => i.routine === autoRoutine)
      .sort((a, b) => {
        const pa = products.find((p) => p.id === a.productId);
        const pb = products.find((p) => p.id === b.productId);
        const orderA = getGenreByKey(pa?.productType ?? "other")?.order ?? 99;
        const orderB = getGenreByKey(pb?.productType ?? "other")?.order ?? 99;
        return orderA - orderB;
      }),
    [deckItems, autoRoutine, products]
  );

  const routineDeckEntries = useMemo(() =>
    routineDeckItems.flatMap((deckItem) => {
      const product = products.find((p) => p.id === deckItem.productId);
      return product ? [{ deckItem, product }] : [];
    }),
    [routineDeckItems, products]
  );

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

  // TODAY'S INGREDIENT: ランダム初期 + 7秒ごと自動ローテーション、フェード遷移
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * TIPS.length));
  const [tipFading, setTipFading] = useState(false);
  useEffect(() => {
    const cycle = setInterval(() => {
      setTipFading(true);
      window.setTimeout(() => {
        setTipIndex((i) => {
          if (TIPS.length <= 1) return 0;
          let next = Math.floor(Math.random() * TIPS.length);
          if (next === i) next = (i + 1) % TIPS.length;
          return next;
        });
        setTipFading(false);
      }, 320);
    }, 7000);
    return () => clearInterval(cycle);
  }, []);

  if (loading) return null;
  if (!user) return <LandingPage />;

  const normalizedCheckedSteps = new Set(
    Array.from(checkedSteps).filter((index) => index < routineDeckEntries.length)
  );
  const checkedCount = normalizedCheckedSteps.size;
  const recentProducts = products.slice(0, 3);

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

  const todayTip = TIPS[tipIndex];
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const dateStr = (() => {
    const d = new Date();
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const wds = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} · ${wds[d.getDay()]} · ${autoRoutine === "morning" ? "朝" : "夜"}`;
  })();

  const routineLabel = autoRoutine === "morning" ? "朝のルーティン" : "夜のルーティン";
  const routineCaps = autoRoutine === "morning" ? "Morning Ritual" : "Night Ritual";
  const allComplete = checkedCount === routineSteps.length && routineSteps.length > 0;

  return (
    <div className="hd-root hd-softa" data-density="compact" data-card="default">
      <div
        className="hd hd-page"
        style={{ minHeight: "100vh", background: "var(--hd-bg)" }}
      >
        <div style={{ padding: "0 20px 96px" }}>
          {/* Header — sticky band */}
          <div
            style={{
              position: "sticky",
              top: "env(safe-area-inset-top, 0px)",
              zIndex: 30,
              background: "var(--hd-bg)",
              margin: "0 -20px 24px",
              padding: "16px 20px 14px",
              borderBottom: "1px solid var(--hd-hair)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div className="hd-mono hd-caps" style={{ color: "var(--hd-ink-40)", marginBottom: 8 }}>
                {dateStr}
              </div>
              <div className="hd-serif" style={{ lineHeight: 1.0, letterSpacing: "-0.02em", fontSize: 26 }}>
                {greeting},<br />
                <span style={{ fontStyle: "italic" }}>{profile?.display_name || "HADAMI"}.</span>
              </div>
            </div>
            <div
              onClick={() => router.push("/settings")}
              style={{
                width: 40, height: 40, borderRadius: 999,
                background: "var(--hd-moss)", color: "var(--hd-bg)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--hd-serif)", fontSize: 17, cursor: "pointer",
                flexShrink: 0,
              }}
            >
              {profile?.display_name?.charAt(0) || "？"}
            </div>
          </div>

          {user && <InstallBanner />}

          {/* Routine Checklist */}
          {routineSteps.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  paddingBottom: 12,
                  borderBottom: "1px solid var(--hd-ink)",
                }}
              >
                <div>
                  <div
                    className="hd-mono hd-caps"
                    style={{ color: "var(--hd-ink-40)" }}
                  >
                    {routineCaps}
                  </div>
                  <div
                    className="hd-serif"
                    style={{
                      fontSize: 20,
                      marginTop: 4,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {routineLabel}
                  </div>
                </div>
                <div
                  className="hd-mono"
                  style={{
                    fontSize: 12,
                    color: "var(--hd-ink-60)",
                    letterSpacing: "0.05em",
                  }}
                >
                  {String(checkedCount).padStart(2, "0")} /{" "}
                  {String(routineSteps.length).padStart(2, "0")}
                </div>
              </div>

              <div className="hd-stagger">
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

              {allComplete && (
                <div
                  className="hd-mono hd-caps"
                  style={{
                    color: "var(--hd-moss)",
                    marginTop: 14,
                    textAlign: "center",
                  }}
                >
                  ✓ Complete · 完了
                </div>
              )}
            </div>
          )}

          {/* Stats trio — A pure (hairline rule, no bg) */}
          <div
            className="hd-stagger"
            style={{
              margin: "32px 0 0", padding: "24px 0",
              borderTop: "1px solid var(--hd-hair)",
              borderBottom: "1px solid var(--hd-hair)",
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0,
              marginBottom: 24,
            }}
          >
            {[
              { n: discoveredCount, label: "成分コレクト", href: "/zukan" },
              { n: products.length, label: "マイコスメ",   href: "/history" },
              { n: scanCount ?? 0,  label: "スキャン回数", href: "/scan" },
            ].map((s, i) => (
              <Link
                key={s.label}
                href={s.href}
                style={{
                  padding: "0 8px", textAlign: "center",
                  borderLeft: i > 0 ? "1px solid var(--hd-hair)" : "none",
                  textDecoration: "none", color: "inherit",
                }}
              >
                <div className="hd-serif" style={{ fontSize: 34, lineHeight: 1, letterSpacing: "-0.02em" }}>
                  <Counter to={s.n} />
                </div>
                <div
                  className="hd-mono hd-caps"
                  style={{ color: "var(--hd-ink-40)", marginTop: 8, fontSize: 9 }}
                >{s.label}</div>
              </Link>
            ))}
          </div>

          {/* Today's Ingredient — auto-rotating editorial tip */}
          <div style={{ padding: "32px 0 24px", marginBottom: 24 }}>
            <div
              className="hd-mono hd-caps"
              style={{
                color: "var(--hd-ink-40)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span>Today&apos;s Ingredient · No. {String(tipIndex + 1).padStart(2, "0")}</span>
              {/* progress dots */}
              <span
                aria-hidden
                style={{
                  display: "inline-flex",
                  gap: 4,
                  marginLeft: 4,
                }}
              >
                {TIPS.slice(0, Math.min(TIPS.length, 8)).map((_, i) => (
                  <span
                    key={i}
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 999,
                      background:
                        i === tipIndex % Math.min(TIPS.length, 8)
                          ? "var(--hd-ink)"
                          : "var(--hd-ink-20)",
                      transition: "background 200ms ease",
                    }}
                  />
                ))}
              </span>
            </div>
            <div
              className="hd-serif"
              style={{
                fontSize: 22,
                lineHeight: 1.25,
                marginTop: 14,
                letterSpacing: "-0.01em",
                minHeight: 110,
                opacity: tipFading ? 0 : 1,
                transform: tipFading ? "translateY(4px)" : "translateY(0)",
                transition: "opacity 280ms ease, transform 280ms ease",
              }}
            >
              {todayTip.text}
            </div>
            <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10 }}>
              <span
                className="hd-mono"
                style={{
                  fontSize: 10, letterSpacing: "0.2em",
                  borderBottom: "1px solid var(--hd-ink)", paddingBottom: 2,
                }}
              >READ ESSAY</span>
            </div>
          </div>

          {/* Recent Scans */}
          {recentProducts.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
                <div className="hd-mono hd-caps" style={{ color: "var(--hd-ink-40)" }}>
                  Recent Scans · 最近
                </div>
                <Link
                  href="/history"
                  className="hd-mono"
                  style={{
                    fontSize: 10, color: "var(--hd-ink-60)", textDecoration: "none",
                    letterSpacing: "0.15em",
                  }}
                >VIEW ALL →</Link>
              </div>
              <div
                className="hd-stagger"
                style={{
                  display: "flex", gap: 12, overflowX: "auto",
                  margin: "0 -20px", padding: "0 20px 6px",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {recentProducts.map((item) => {
                  const genre = getGenreByKey(item.productType || "other");
                  return (
                    <Link
                      key={item.id}
                      href={`/product/${item.id}`}
                      style={{
                        minWidth: 160, maxWidth: 160, flexShrink: 0,
                        background: "var(--hd-surface)",
                        overflow: "hidden",
                        border: "1px solid var(--hd-hair)",
                        textDecoration: "none", color: "inherit",
                      }}
                    >
                      {item.packageImage ? (
                        <div style={{ width: "100%", height: 160, position: "relative" }}>
                          <Image
                            src={item.packageImageThumb ?? item.packageImage}
                            alt={item.name}
                            fill
                            style={{ objectFit: "cover" }}
                            sizes="160px"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div
                          style={{
                            width: "100%", height: 160,
                            background: genre ? `${genre.color}15` : "var(--hd-surface-2)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "var(--hd-ink-40)",
                            fontFamily: "var(--hd-mono)",
                            fontSize: 10,
                            letterSpacing: "0.18em",
                          }}
                        >
                          NO IMG
                        </div>
                      )}
                      <div style={{ padding: 12 }}>
                        {genre && (
                          <div
                            className="hd-mono hd-caps"
                            style={{
                              color: "var(--hd-ink-40)",
                              marginBottom: 4,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {typeLabelEn(genre.key)} — {item.brand || genre.label}
                          </div>
                        )}
                        <div
                          className="hd-serif"
                          style={{
                            fontSize: 13,
                            marginBottom: 0,
                            lineHeight: 1.3,
                            letterSpacing: "-0.01em",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {item.name}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {recentProducts.length === 0 && routineSteps.length === 0 && (
            <div
              style={{
                textAlign: "center", padding: "44px 24px",
                background: "var(--hd-surface)", borderRadius: 18,
                border: "1px solid var(--hd-hair)",
              }}
            >
              <div
                style={{
                  width: 80, height: 80, borderRadius: 999,
                  background: "var(--hd-mint-bg)", color: "var(--hd-moss)",
                  margin: "0 auto 18px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >{Ico.camera({ width: 32, height: 32 })}</div>
              <div
                className="hd-serif"
                style={{ fontSize: 18, marginBottom: 6 }}
              >まだコスメをスキャンしていません</div>
              <p
                style={{
                  fontSize: 13, color: "var(--hd-ink-60)",
                  marginTop: 0, marginBottom: 22,
                  fontFamily: "var(--hd-sans)",
                }}
              >
                化粧品をスキャンしてスキンケアの旅を始めましょう
              </p>
              <Link
                href="/scan"
                className="hd-cta"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  textDecoration: "none", fontSize: 14,
                }}
              >
                <CameraIcon size={16} color="white" /> スキャンする
              </Link>
            </div>
          )}

          <Disclaimer />
        </div>
      </div>
    </div>
  );
}
