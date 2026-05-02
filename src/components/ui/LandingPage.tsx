"use client";

import "@/styles/hadami-tokens.css";
import { useState, useEffect, useRef, ReactNode, CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import { getAccountScanLimit } from "@/lib/db";
import { Ico } from "@/components/redesign/apothecary/Icons";
import {
  MotionReveal,
  SplitText,
  Typewriter,
  GradientSweep,
  Magnetic,
} from "@/components/ui/landing/animations";

/* ─── Design tokens (mapped to hadami-tokens.css OKLCH equivalents) ─── */
const INK = "#1a1a16";
const BG = "#e8e4db";
// アバター（var(--hd-moss-deep)）と揃えた深いアポセカリーグリーン
const ACCENT = "#3a5544";
const DARK_TEXT = "#f0ece3";

// Typewriter 用：参照を固定するためモジュール定数化（親の毎秒再レンダリングで配列リテラルが
// 新参照になるとエフェクトが startDelay 中にキャンセルされ続け、文字が打たれない）
const HERO_TYPEWRITER_LINES = [
  "Niacinamide  ——  ナイアシンアミド。",
  "肌が、自分のことばで話しはじめる。",
  "Camellia japonica  ✓  found in 12 items.",
];

/* ─── Animated Number Counter ─── */
function AnimNum({ to, dur = 1200 }: { to: number; dur?: number }) {
  const [v, setV] = useState(0);
  const rafRef = useRef<number>(0);
  const elRef = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setStarted(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let s: number | undefined;
    const step = (t: number) => {
      if (s === undefined) s = t;
      const p = Math.min((t - s) / dur, 1);
      setV(Math.round(p * p * to));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [started, to, dur]);

  return <span ref={elRef}>{v.toLocaleString()}</span>;
}

/* ─── Scroll-reveal wrapper (delegates to MotionReveal for reduced-motion support) ─── */
const Reveal = MotionReveal;

/* ─── Responsive hook ─── */
function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768);
    fn();
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}

/* ─── Atoms ─── */
const Mono = ({ children, style = {} }: { children: ReactNode; style?: CSSProperties }) => (
  <span
    style={{
      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      letterSpacing: "0.14em",
      fontSize: 10,
      ...style,
    }}
  >
    {children}
  </span>
);

const Label = ({ children, style = {} }: { children: ReactNode; style?: CSSProperties }) => (
  <div
    style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9.5,
      letterSpacing: "0.22em",
      opacity: 0.5,
      textTransform: "uppercase",
      ...style,
    }}
  >
    {children}
  </div>
);

const HR = ({ ink = INK, style = {} }: { ink?: string; style?: CSSProperties }) => (
  <motion.div
    style={{
      height: "0.5px",
      background: ink,
      opacity: 0.13,
      transformOrigin: "center",
      ...style,
    }}
    initial={{ scaleX: 0 }}
    whileInView={{ scaleX: 1 }}
    viewport={{ once: true, margin: "-10%" }}
    transition={{ duration: 2.8, ease: [0.22, 0.61, 0.36, 1] }}
  />
);

/* ─── Data (faithful to current site copy) ─── */
const STEPS = [
  {
    no: "01",
    en: "CAPTURE",
    title: "撮る",
    desc: "コスメのパッケージにカメラを向けるだけ。AIが商品を特定し、ネット上の成分情報を自動で取得します。",
  },
  {
    no: "02",
    en: "DECODE",
    title: "知る",
    desc: "AIが成分の特徴をわかりやすく表示。組み合わせの相性も読み解けます。",
  },
  {
    no: "03",
    en: "COMPOSE",
    title: "集める・組む",
    desc: "成分を図鑑にコレクトし、製品を朝・夜のルーティンとして管理。毎日のチェックも。",
  },
  {
    no: "04",
    en: "RESULT",
    title: "毎日に活かす",
    desc: "ルーティンの相乗効果と達成度を分析。ハダミがあなたのスキンケアをそっと支えます。",
  },
];

const FEATURES = [
  { en: "AI INGREDIENT SCAN",   tag: "SCAN",     title: "AI成分検索",            desc: "400種超の美容成分に対応。パッケージを撮影するだけでAIが商品を特定し、成分の特徴をお伝えします" },
  { en: "COMPENDIUM",            tag: "INDEX",    title: "成分図鑑",              desc: "AIが成分の特徴をわかりやすく表示。組み合わせの相性も読み解けます。" },
  { en: "ROUTINE COMPOSE",       tag: "ROUTINE",  title: "スキンケアルーティン",  desc: "お気に入り製品をルーティンに並べ朝・夜のルーティンを管理。カバー率や相乗効果の分析、シェアも" },
  { en: "AM / PM RITUAL",        tag: "RITUAL",   title: "朝夜ルーティンチェック", desc: "ルーティンに登録した製品が毎日のチェックリストに。進捗リングで達成度をひと目で確認" },
  { en: "DISCOVERY",             tag: "RECOMMEND",title: "おすすめ商品レコメンド", desc: "スキャン履歴から成分傾向を分析し、まだ出会っていない成分を含む商品をおすすめ" },
  { en: "PERSONAL COLLECTION",   tag: "SHELF",    title: "マイコスメ写真管理",     desc: "スキャンした製品を写真グリッドで一覧管理。お気に入り・カテゴリで絞り込み。ダークモード対応" },
];

const SCAN_PREVIEW_INGREDIENTS = [
  { name: "パンテノール",       en: "Panthenol",         cat: "ビタミン" },
  { name: "ツボクサエキス",     en: "Centella Asiatica", cat: "ボタニカル" },
  { name: "ヒアルロン酸Na",     en: "Sodium Hyaluronate", cat: "うるおい" },
];

const SAMPLE_ROUTINES = {
  am: [
    { num: "01", type: "化粧水",     name: "HEARTLEAF 77 TONER",       brand: "ANUA",         hue: 130 },
    { num: "02", type: "美容液",     name: "A-CICA 365 BLEMISH SERUM", brand: "AXIS-Y",       hue: 50 },
    { num: "03", type: "クリーム",   name: "MADECA CREAM",             brand: "CENTELLIAN 24",hue: 90 },
    { num: "04", type: "日焼け止め", name: "Water Barrier Sun Cream",  brand: "ROUND LAB",    hue: 200 },
  ],
  pm: [
    { num: "01", type: "化粧水",   name: "GREEN DERMA MILD CICA TONER", brand: "NATURE REPUBLIC", hue: 150 },
    { num: "02", type: "美容液",   name: "WHITE TRUFFLE AMPOULE",       brand: "D'ALBA",          hue: 70 },
    { num: "03", type: "クリーム", name: "CENTELLIAN 24 MADECA CREAM",  brand: "CENTELLIAN 24",   hue: 110 },
    { num: "04", type: "マスク",   name: "100+ PDRN + HYALURON MASK",   brand: "ANUA",            hue: 250 },
  ],
};

const SHARE_SWATCHES = [
  { type: "化粧水",     abbr: "AN",  name: "HEARTLEAF 77",       hue: 130 },
  { type: "美容液",     abbr: "AE",  name: "A-CICA 365",         hue: 20  },
  { type: "クリーム",   abbr: "C24", name: "MADECA CREAM",       hue: 35  },
  { type: "日焼け止め", abbr: "PC",  name: "Water Barrier Sun",  hue: 210 },
  { type: "美容オイル", abbr: "tc",  name: "Lano-oil",           hue: 230 },
];

/* ─── Phone Mock parallax wrapper — gentle mouse follow on desktop ─── */
function PhoneMockParallax({ mobile }: { mobile: boolean }) {
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 50, damping: 18 });
  const sy = useSpring(y, { stiffness: 50, damping: 18 });
  const srx = useSpring(rx, { stiffness: 50, damping: 18 });
  const sry = useSpring(ry, { stiffness: 50, damping: 18 });

  // モバイル / reduced-motion 時は perspective ラッパーを完全に外す。
  // iOS Safari は perspective + 子の overflow:hidden + border-radius の組み合わせで
  // ベゼルクリップが崩れる既知不具合があるため、可能な限りラッパーを通さない。
  if (mobile || reduced) {
    return (
      <div style={{ position: "relative" }}>
        <PhoneMock maxWidth={mobile ? 220 : 300} />
      </div>
    );
  }

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const nx = (e.clientX - cx) / r.width;
    const ny = (e.clientY - cy) / r.height;
    x.set(nx * 6);
    y.set(ny * 6);
    ry.set(nx * 4);
    rx.set(-ny * 3);
  };
  const onLeave = () => {
    x.set(0); y.set(0); rx.set(0); ry.set(0);
  };

  return (
    <div
      style={{ position: "relative", perspective: 1200 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <motion.div
        style={{
          x: sx,
          y: sy,
          rotateX: srx,
          rotateY: sry,
          transformStyle: "preserve-3d",
          // GPU 合成レイヤを固定して、parallax の spring 出力による
          // サブピクセル単位のアンチエイリアスのちらつきを抑える
          willChange: "transform",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }}
      >
        <PhoneMock maxWidth={300} />
      </motion.div>
    </div>
  );
}

/* ─── Phone Mock — Hero right column ─── */
function PhoneMock({ maxWidth = 300 }: { maxWidth?: number } = {}) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const i = setInterval(() => setPhase((p) => (p + 1) % 3), 3500);
    return () => clearInterval(i);
  }, []);

  const screens: ReactNode[] = [
    /* Screen 0 — Home */
    <div key="home" style={{ padding: "16px 18px", height: "100%", overflow: "hidden" }}>
      <Mono style={{ fontSize: 8.5, opacity: 0.4 }}>27 APR · MON · 夜</Mono>
      <div
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: "italic",
          fontSize: 28,
          lineHeight: 1.1,
          marginTop: 8,
          color: INK,
        }}
      >
        Good evening,
        <br />
        <span style={{ fontFamily: "'Shippori Mincho', serif" }}>みお.</span>
      </div>
      <div style={{ marginTop: 20, borderTop: "0.5px solid rgba(26,26,22,0.12)", paddingTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Mono style={{ fontSize: 7.5, color: ACCENT }}>NIGHT RITUAL</Mono>
          <Mono style={{ fontSize: 7.5, opacity: 0.4 }}>00 / 03</Mono>
        </div>
        <div style={{ marginTop: 8, fontFamily: "'Shippori Mincho', serif", fontSize: 13 }}>夜のルーティン</div>
      </div>
      <div style={{ marginTop: 12 }}>
        {[
          ["01", "TONER", "GREEN DERMA MILD CICA TONER", 150],
          ["02", "SERUM", "WHITE TRUFFLE AMPOULE", 70],
          ["03", "CREAM", "CENTELLIAN 24 MADECA CREAM", 110],
        ].map(([n, t, name, hue]) => (
          <div
            key={n as string}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 0",
              borderBottom: "0.5px solid rgba(26,26,22,0.08)",
            }}
          >
            <Mono style={{ fontSize: 7.5, opacity: 0.35 }}>{n}</Mono>
            <div
              style={{
                width: 32,
                height: 32,
                background: `oklch(0.82 0.03 ${hue})`,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, overflow: "hidden" }}>
              <Mono style={{ fontSize: 7, color: ACCENT }}>{t}</Mono>
              <div
                style={{
                  fontFamily: "'Shippori Mincho', serif",
                  fontSize: 9.5,
                  marginTop: 2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {name}
              </div>
            </div>
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                border: "0.8px solid rgba(26,26,22,0.2)",
                flexShrink: 0,
              }}
            />
          </div>
        ))}
      </div>
    </div>,

    /* Screen 1 — Scan */
    <div
      key="scan"
      style={{ padding: "16px 18px", height: "100%", display: "flex", flexDirection: "column" }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 4, marginBottom: 18 }}>
        {[
          ["撮影", true],
          ["特定", false],
          ["分類", false],
          ["結果", false],
        ].map(([s, active]) => (
          <div
            key={s as string}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
          >
            <div
              style={{
                width: "100%",
                height: 2,
                background: active ? ACCENT : "rgba(26,26,22,0.1)",
                borderRadius: 2,
              }}
            />
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: active ? ACCENT : "rgba(26,26,22,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 10, color: active ? "#fff" : "rgba(26,26,22,0.3)" }}>●</span>
            </div>
            <Mono style={{ fontSize: 7, opacity: active ? 0.9 : 0.3 }}>{s}</Mono>
          </div>
        ))}
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: INK,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 22, color: "#fff" }}>⊙</span>
        </div>
        <Mono style={{ fontSize: 8, color: ACCENT, letterSpacing: "0.16em" }}>TAP TO SCAN</Mono>
        <div style={{ fontFamily: "'Shippori Mincho', serif", fontSize: 14, textAlign: "center" }}>
          パッケージを撮影してスキャン
        </div>
      </div>
    </div>,

    /* Screen 2 — Routine management */
    <div key="routine" style={{ padding: "16px 18px", height: "100%", overflow: "hidden" }}>
      <div style={{ marginBottom: 14 }}>
        <Mono style={{ fontSize: 7.5, opacity: 0.4 }}>REGIMEN · 01</Mono>
        <div style={{ fontFamily: "'Shippori Mincho', serif", fontSize: 15, marginTop: 3 }}>
          スキンケア 管理.
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          border: "0.5px solid rgba(26,26,22,0.12)",
          marginBottom: 12,
        }}
      >
        <div style={{ padding: "8px 0", textAlign: "center" }}>
          <Mono style={{ fontSize: 8 }}>☀ 朝 AM</Mono>
        </div>
        <div style={{ padding: "8px 0", textAlign: "center", background: INK }}>
          <Mono style={{ fontSize: 8, color: BG }}>☽ 夜 PM</Mono>
        </div>
      </div>
      {SAMPLE_ROUTINES.pm.slice(0, 3).map((it) => (
        <div
          key={it.num}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "9px 0",
            borderBottom: "0.5px solid rgba(26,26,22,0.08)",
          }}
        >
          <Mono style={{ fontSize: 7.5, opacity: 0.3 }}>{it.num}</Mono>
          <div
            style={{
              width: 36,
              height: 36,
              background: `oklch(0.8 0.03 ${it.hue})`,
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Shippori Mincho', serif", fontSize: 9.5, lineHeight: 1.4 }}>
              {it.name}
            </div>
          </div>
        </div>
      ))}
    </div>,
  ];

  return (
    <div
      style={{
        width: "100%",
        maxWidth,
        aspectRatio: "9/19.5",
        margin: "0 auto",
        borderRadius: 40,
        // padding は使わず、inner を position:absolute + inset:10 で配置する。
        // iOS Safari は aspectRatio + padding + height:100% の組み合わせで
        // 子要素の高さが border-box ぶん解決され下ベゼル 10px を食いつぶす
        // 不具合があるため、絶対座標で四辺 10px を明示固定する。
        background: "linear-gradient(180deg, #1e1c19, #0c0a08)",
        boxShadow:
          "0 48px 90px -20px rgba(0,0,0,0.25), inset 0 0 0 0.5px rgba(255,255,255,0.07)",
        position: "relative",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          bottom: 10,
          left: 10,
          borderRadius: 32,
          overflow: "hidden",
          background: BG,
          // 内部は flex column で status bar / 画面 / 下部 nav を縦に並べる。
          isolation: "isolate",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 10,
            left: "50%",
            transform: "translateX(-50%)",
            width: 84,
            height: 24,
            background: "#0c0a08",
            borderRadius: 14,
            zIndex: 10,
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "14px 22px 0",
            fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 600,
            color: INK,
            flexShrink: 0,
          }}
        >
          <span>9:41</span>
          <span style={{ opacity: 0 }}>·</span>
          <span style={{ fontSize: 9 }}>●●●</span>
        </div>
        {/* 画面領域は flex:1 で残りを取り、min-height:0 で flex 子の縮小を許容 */}
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>{screens[phase]}</div>
        <div
          style={{
            flexShrink: 0,
            height: 64,
            background: BG,
            borderTop: "0.5px solid rgba(26,26,22,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            paddingBottom: 6,
          }}
        >
          {(() => {
            // phase 0 → Home, phase 1 → Scan (center), phase 2 → Routine (CARE)
            const activeIndex = phase === 0 ? 0 : phase === 1 ? 2 : 3;
            return [
              ["⌂", "HOME"],
              ["≡", "INDEX"],
              [null, "SCAN"],
              ["▭", "CARE"],
              ["○", "MINE"],
            ].map(([icon, label], i) =>
              i === 2 ? (
                <div
                  key={label as string}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: INK,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ color: BG, fontSize: 16 }}>⊙</span>
                </div>
              ) : (
                <div
                  key={label as string}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 3,
                    opacity: activeIndex === i ? 1 : 0.4,
                  }}
                >
                  <span style={{ fontSize: 14 }}>{icon as string}</span>
                  <Mono style={{ fontSize: 7, letterSpacing: "0.14em", opacity: 0.6 }}>
                    {label as string}
                  </Mono>
                </div>
              ),
            );
          })()}
        </div>
      </div>
    </div>
  );
}

/* ─── Main LandingPage ─── */
export default function LandingPage() {
  const scanLimit = getAccountScanLimit();
  const mobile = useIsMobile();
  const navRef = useRef<HTMLElement>(null);
  const [showTop, setShowTop] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [routineTab, setRoutineTab] = useState<"am" | "pm">("am");
  const [now, setNow] = useState<Date | null>(null);

  // Time ticker (start client-side only to avoid hydration mismatch)
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Widen the app shell while the landing page is mounted (desktop only)
  useEffect(() => {
    document.body.classList.add("lp-active");
    return () => document.body.classList.remove("lp-active");
  }, []);

  // Auto-advance scan demo step
  useEffect(() => {
    const i = setInterval(() => setScanStep((s) => (s + 1) % 4), 3200);
    return () => clearInterval(i);
  }, []);

  // Nav scroll state + back-to-top visibility
  useEffect(() => {
    let ticking = false;
    const h = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrolled = window.scrollY > 40;
        if (navRef.current) navRef.current.dataset.scrolled = scrolled ? "true" : "false";
        setShowTop(window.scrollY > 300);
        ticking = false;
      });
    };
    window.addEventListener("scroll", h, { passive: true });
    h();
    return () => window.removeEventListener("scroll", h);
  }, []);

  const px = mobile ? "20px" : "48px";
  const timeStr = now ? now.toTimeString().slice(0, 5) : "--:--";

  const routineItems = SAMPLE_ROUTINES[routineTab];

  return (
    <div className="hd-root hd-softa" data-density="compact" style={{ overflowX: "hidden" }}>
      <div
        className="hd"
        style={{
          minHeight: "100vh",
          background: BG,
          color: INK,
          fontFamily: "'Shippori Mincho', 'Noto Serif JP', serif",
        }}
      >
        <style>{`
          @keyframes scanLine {
            0%, 100% { top: 14px; opacity: 0; }
            10% { opacity: 1; }
            50% { top: calc(100% - 16px); opacity: 1; }
            60% { opacity: 1; }
            90% { opacity: 0; }
          }
          .hd-lp-nav[data-scrolled="true"] {
            background: rgba(232, 228, 219, 0.92);
            backdrop-filter: blur(18px) saturate(1.4);
            -webkit-backdrop-filter: blur(18px) saturate(1.4);
            border-bottom: 0.5px solid rgba(26,26,22,0.12);
          }
          .hd-lp-link { transition: opacity 200ms ease; }
          .hd-lp-link:hover { opacity: 1 !important; }
        `}</style>

        {/* ── NAV ── */}
        <nav
          ref={navRef}
          data-scrolled="false"
          className="hd-lp-nav"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            height: 56,
            padding: `0 ${px}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            transition: "background 350ms ease, border-color 350ms ease, backdrop-filter 350ms ease",
          }}
        >
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 10,
              textDecoration: "none",
              color: INK,
            }}
          >
            <Image
              src="/hadami-app-icon.png"
              alt="HADAMI"
              width={24}
              height={24}
              style={{ borderRadius: 6, alignSelf: "center" }}
            />
            <span
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 500,
                fontSize: 16,
                letterSpacing: "0.16em",
              }}
            >
              HADAMI
            </span>
            <Mono style={{ fontSize: 9, opacity: 0.35 }}>ハダミ</Mono>
          </Link>

          {!mobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
              {[
                { href: "#features", label: "機能" },
                { href: "#scan", label: "使い方" },
                { href: "#routine", label: "ルーティン" },
              ].map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="hd-lp-link"
                  style={{
                    fontFamily: "'Shippori Mincho', serif",
                    fontSize: 13,
                    color: INK,
                    opacity: 0.65,
                    textDecoration: "none",
                  }}
                >
                  {l.label}
                </a>
              ))}
              <Link
                href="/auth/invite"
                style={{
                  padding: "9px 22px",
                  background: INK,
                  color: BG,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  letterSpacing: "0.2em",
                  textDecoration: "none",
                }}
              >
                START — 無料
              </Link>
            </div>
          )}

          {mobile && (
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="メニュー"
              style={{
                background: "transparent",
                border: "none",
                color: INK,
                fontSize: 22,
                cursor: "pointer",
                padding: 4,
              }}
            >
              {menuOpen ? "×" : "≡"}
            </button>
          )}
        </nav>

        {mobile && menuOpen && (
          <div
            style={{
              position: "fixed",
              top: 56,
              left: 0,
              right: 0,
              zIndex: 99,
              background: BG,
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: 18,
              borderBottom: "0.5px solid rgba(26,26,22,0.12)",
            }}
          >
            {[
              { href: "#features", label: "機能" },
              { href: "#scan", label: "使い方" },
              { href: "#routine", label: "ルーティン" },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  fontFamily: "'Shippori Mincho', serif",
                  fontSize: 16,
                  color: INK,
                  opacity: 0.8,
                  textDecoration: "none",
                }}
              >
                {l.label}
              </a>
            ))}
            <Link
              href="/auth/invite"
              onClick={() => setMenuOpen(false)}
              style={{
                marginTop: 6,
                padding: "10px 18px",
                background: INK,
                color: BG,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                letterSpacing: "0.2em",
                textDecoration: "none",
                textAlign: "center",
              }}
            >
              START — 無料
            </Link>
          </div>
        )}

        {/* ── HERO ── */}
        <section
          id="home"
          style={{
            minHeight: "100vh",
            paddingTop: 56,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* ticker */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: `28px ${px} 18px`,
              borderBottom: "0.5px solid rgba(26,26,22,0.13)",
            }}
          >
            <Mono style={{ fontSize: 9, opacity: 0.4 }}>
              {mobile ? "HADAMI · 成分図鑑" : "HADAMI · ハダミ成分図鑑 — A FIELD GUIDE TO YOUR SKIN"}
            </Mono>
            <Mono style={{ fontSize: 9, opacity: 0.4 }}>TOKYO · {timeStr}</Mono>
          </div>

          {/* main */}
          <div
            style={{
              flex: 1,
              display: "grid",
              gridTemplateColumns: mobile ? "1fr" : "1.15fr 1fr",
              gap: mobile ? 48 : 80,
              alignItems: "center",
              padding: mobile ? `48px ${px} 48px` : `80px ${px} 80px`,
            }}
          >
            {/* left */}
            <div>
              <Reveal>
                <div style={{ display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
                  <span
                    style={{
                      padding: "5px 14px",
                      border: `0.5px solid ${ACCENT}`,
                      color: ACCENT,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9.5,
                      letterSpacing: "0.14em",
                    }}
                  >
                    ● CLOSED BETA
                  </span>
                  <span
                    style={{
                      padding: "5px 14px",
                      border: "0.5px solid rgba(26,26,22,0.2)",
                      color: "rgba(26,26,22,0.7)",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9.5,
                      letterSpacing: "0.12em",
                    }}
                  >
                    成分図鑑 · INGREDIENT APP
                  </span>
                </div>
              </Reveal>

              <Reveal delay={120}>
                <h1
                  style={{
                    fontFamily: "'Shippori Mincho', 'Noto Serif JP', serif",
                    fontSize: mobile ? "clamp(44px, 12vw, 68px)" : "clamp(52px, 6.5vw, 108px)",
                    lineHeight: 1.35,
                    fontWeight: 400,
                    margin: 0,
                    color: INK,
                    letterSpacing: "-0.02em",
                  }}
                >
                  <div>
                    <SplitText text="成分から、" />
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 4 }}>
                    <GradientSweep
                      baseColor={ACCENT}
                      glintColor="oklch(0.78 0.10 150)"
                      duration={1.4}
                      intervalSec={6}
                      style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontStyle: "italic",
                        fontSize: "1.05em",
                      }}
                    >
                      美しさ
                    </GradientSweep>
                    <GradientSweep
                      baseColor={ACCENT}
                      glintColor="oklch(0.78 0.10 150)"
                      duration={0.9}
                      intervalSec={6}
                      delay={1.4}
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "0.18em",
                        letterSpacing: "0.14em",
                        opacity: 0.9,
                      }}
                    >
                      /utsu·ku·shi·sa/
                    </GradientSweep>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <SplitText text="を選ぶ。" delay={0.4} />
                  </div>
                </h1>
              </Reveal>

              <Reveal delay={220}>
                <p
                  style={{
                    marginTop: 36,
                    maxWidth: 460,
                    fontFamily: "'Shippori Mincho', serif",
                    fontSize: mobile ? 14 : 15,
                    lineHeight: 2.0,
                    color: "rgba(26,26,22,0.7)",
                    minHeight: mobile ? 84 : 90,
                  }}
                >
                  <Typewriter
                    lines={HERO_TYPEWRITER_LINES}
                    speed={42}
                    startDelay={1400}
                    cursorColor={ACCENT}
                  />
                </p>
              </Reveal>

              <Reveal delay={320}>
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    marginTop: 32,
                    flexWrap: "wrap",
                  }}
                >
                  <Magnetic strength={0.18} max={6} disabled={mobile}>
                    <Link
                      href="/auth/invite"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "14px 26px",
                        background: INK,
                        color: BG,
                        textDecoration: "none",
                        fontFamily: "'Shippori Mincho', serif",
                        fontSize: 14,
                      }}
                    >
                      {Ico.camera({ width: 16, height: 16 })}
                      <span>無料で始める</span>
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 9,
                          letterSpacing: "0.2em",
                          opacity: 0.7,
                        }}
                      >
                        START →
                      </span>
                    </Link>
                  </Magnetic>
                  <a
                    href="#scan"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "14px 22px",
                      background: "transparent",
                      color: INK,
                      border: `0.5px solid ${INK}`,
                      textDecoration: "none",
                      fontFamily: "'Shippori Mincho', serif",
                      fontSize: 14,
                    }}
                  >
                    <span>使い方を見る</span>
                    <span style={{ fontSize: 11 }}>↓</span>
                  </a>
                </div>
                <p
                  style={{
                    fontFamily: "'Shippori Mincho', serif",
                    fontSize: 12,
                    color: "rgba(26,26,22,0.6)",
                    marginTop: 16,
                  }}
                >
                  招待コードは{" "}
                  <a
                    href="https://x.com/miomio_beauty"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: ACCENT, textDecoration: "underline", textUnderlineOffset: 3 }}
                  >
                    X（@miomio_beauty）
                  </a>
                  {" "}にDMで気軽にどうぞ
                </p>
              </Reveal>

              {/* Stats trio */}
              <Reveal delay={420}>
                <div
                  style={{
                    display: "flex",
                    gap: 0,
                    marginTop: 56,
                    paddingTop: 24,
                    borderTop: "0.5px solid rgba(26,26,22,0.13)",
                  }}
                >
                  {[
                    { n: 400, suffix: "種+", en: "INGREDIENTS",   label: "美容成分" },
                    { n: 12,  suffix: "種",  en: "CATEGORIES",    label: "コスメカテゴリ" },
                    { n: 6,   suffix: "軸",  en: "EFFECT TARGETS",label: "効果カテゴリ" },
                  ].map((s, i) => (
                    <div
                      key={s.en}
                      style={{
                        flex: 1,
                        paddingRight: mobile ? 14 : 28,
                        borderRight: i < 2 ? "0.5px solid rgba(26,26,22,0.13)" : "none",
                        marginRight: i < 2 ? (mobile ? 14 : 28) : 0,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "'Cormorant Garamond', serif",
                          fontSize: mobile ? 28 : 38,
                          lineHeight: 1,
                          color: INK,
                        }}
                      >
                        <AnimNum to={s.n} />
                        <span style={{ fontSize: "0.5em", marginLeft: 2 }}>{s.suffix}</span>
                      </div>
                      <Mono
                        style={{
                          fontSize: 9,
                          letterSpacing: "0.18em",
                          opacity: 0.5,
                          marginTop: 8,
                          display: "block",
                        }}
                      >
                        {s.en}
                      </Mono>
                      <div
                        style={{
                          fontFamily: "'Shippori Mincho', serif",
                          fontSize: 10,
                          opacity: 0.55,
                          marginTop: 4,
                        }}
                      >
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            {/* right — phone mock (mobile では小さめに表示) */}
            {/* perspective + 3D 変形を使うため blur フィルタを切る */}
            <Reveal delay={300} noBlur>
              <PhoneMockParallax mobile={mobile} />
            </Reveal>
          </div>

          <div
            style={{
              padding: `0 ${px} 28px`,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <HR style={{ flex: 1 }} />
            <Mono style={{ fontSize: 9, opacity: 0.35 }}>SCROLL ↓</Mono>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section id="features" style={{ padding: mobile ? `72px ${px}` : `120px ${px}` }}>
          <Reveal>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginBottom: mobile ? 40 : 64,
              }}
            >
              <div>
                <Label style={{ marginBottom: 16 }}>— FEATURES / 06</Label>
                <h2
                  style={{
                    fontFamily: "'Shippori Mincho', serif",
                    fontSize: mobile ? "clamp(32px,8vw,48px)" : "clamp(38px, 5vw, 72px)",
                    lineHeight: 1.35,
                    fontWeight: 400,
                    margin: 0,
                    color: INK,
                  }}
                >
                  HADAMIに
                  <span
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontStyle: "italic",
                    }}
                  >
                    {" "}できる
                  </span>
                  こと。
                </h2>
              </div>
              {!mobile && (
                <Mono style={{ fontSize: 11, opacity: 0.3, letterSpacing: "0.15em" }}>
                  p.012 — p.024
                </Mono>
              )}
            </div>
          </Reveal>

          <HR />
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr" }}>
            {FEATURES.map((it, i) => (
              <Reveal key={it.en} delay={(i % 2) * 80}>
                <div
                  style={{
                    paddingTop: mobile ? 32 : 44,
                    paddingBottom: mobile ? 32 : 44,
                    paddingRight: !mobile && i % 2 === 0 ? 56 : 0,
                    paddingLeft: !mobile && i % 2 === 1 ? 56 : 0,
                    borderBottom: "0.5px solid rgba(26,26,22,0.13)",
                    borderRight:
                      !mobile && i % 2 === 0 ? "0.5px solid rgba(26,26,22,0.13)" : "none",
                    display: "flex",
                    gap: 20,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: mobile ? 36 : 44,
                      lineHeight: 1,
                      color: ACCENT,
                      fontStyle: "italic",
                      flexShrink: 0,
                      width: mobile ? 44 : 52,
                      paddingTop: 2,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        marginBottom: 12,
                        gap: 12,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontFamily: "'Shippori Mincho', serif",
                            fontSize: mobile ? 19 : 22,
                            color: INK,
                            lineHeight: 1.3,
                          }}
                        >
                          {it.title}
                        </div>
                        <Mono
                          style={{
                            fontSize: 9,
                            opacity: 0.35,
                            letterSpacing: "0.18em",
                            marginTop: 4,
                            display: "block",
                          }}
                        >
                          {it.en}
                        </Mono>
                      </div>
                      {!mobile && (
                        <Mono
                          style={{
                            fontSize: 9,
                            opacity: 0.3,
                            border: "0.5px solid rgba(26,26,22,0.25)",
                            padding: "3px 10px",
                            letterSpacing: "0.12em",
                            flexShrink: 0,
                          }}
                        >
                          {it.tag}
                        </Mono>
                      )}
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontFamily: "'Shippori Mincho', serif",
                        fontSize: 13.5,
                        lineHeight: 1.95,
                        color: "rgba(26,26,22,0.6)",
                      }}
                    >
                      {it.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── SCAN DEMO (How it works) ── */}
        <section
          id="scan"
          style={{
            background: INK,
            color: DARK_TEXT,
            padding: mobile ? `72px ${px}` : `120px ${px}`,
          }}
        >
          <Reveal>
            <div style={{ marginBottom: mobile ? 48 : 80 }}>
              <Label style={{ color: DARK_TEXT, marginBottom: 16 }}>— HOW IT WORKS · 使い方</Label>
              <h2
                style={{
                  fontFamily: "'Shippori Mincho', serif",
                  fontSize: mobile ? "clamp(36px,9vw,56px)" : "clamp(40px, 5.5vw, 80px)",
                  lineHeight: 1.35,
                  fontWeight: 400,
                  margin: 0,
                  color: DARK_TEXT,
                }}
              >
                4ステップで、
                <br />
                <span
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontStyle: "italic",
                  }}
                >
                  成分がわかる。
                </span>
              </h2>
            </div>
          </Reveal>

          {/* Step progress bar */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              marginBottom: 48,
              borderBottom: "0.5px solid rgba(240,236,227,0.1)",
              paddingBottom: 28,
            }}
          >
            {STEPS.map((s, i) => (
              <button
                key={s.en}
                onClick={() => setScanStep(i)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: DARK_TEXT,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: mobile ? 6 : 10,
                  padding: mobile ? "0 4px" : "0 12px",
                  opacity: i === scanStep ? 1 : 0.35,
                  transition: "opacity 0.3s",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: 2,
                    background: i <= scanStep ? ACCENT : "rgba(240,236,227,0.15)",
                    borderRadius: 2,
                    transition: "background 0.4s",
                  }}
                />
                <div
                  style={{
                    width: mobile ? 32 : 44,
                    height: mobile ? 32 : 44,
                    borderRadius: "50%",
                    background: i === scanStep ? ACCENT : "rgba(240,236,227,0.07)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 0.3s",
                  }}
                >
                  <span
                    style={{
                      color: i === scanStep ? "#fff" : "rgba(240,236,227,0.4)",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: mobile ? 10 : 13,
                    }}
                  >
                    {s.no}
                  </span>
                </div>
                {!mobile && (
                  <Mono style={{ fontSize: 9.5, letterSpacing: "0.18em", color: "inherit" }}>
                    {s.en}
                  </Mono>
                )}
                <div style={{ fontFamily: "'Shippori Mincho', serif", fontSize: mobile ? 11 : 13 }}>
                  {s.title}
                </div>
              </button>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: mobile ? "1fr" : "1fr 1fr",
              gap: mobile ? 40 : 80,
              alignItems: "center",
            }}
          >
            {/* steps list */}
            <div>
              {STEPS.map((s, i) => (
                <button
                  key={s.en}
                  onClick={() => setScanStep(i)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    gap: 20,
                    alignItems: "center",
                    width: "100%",
                    textAlign: "left",
                    padding: "22px 0",
                    background: "transparent",
                    color: DARK_TEXT,
                    cursor: "pointer",
                    borderTop: "0.5px solid rgba(240,236,227,0.1)",
                    borderLeft: "none",
                    borderRight: "none",
                    borderBottom:
                      i === STEPS.length - 1 ? "0.5px solid rgba(240,236,227,0.1)" : "none",
                    opacity: scanStep === i ? 1 : 0.4,
                    transition: "opacity 0.3s",
                  }}
                >
                  <Mono style={{ fontSize: 10, opacity: 0.5, width: 28 }}>{s.no}</Mono>
                  <div>
                    <div
                      style={{
                        fontFamily: "'Shippori Mincho', serif",
                        fontSize: mobile ? 22 : 28,
                      }}
                    >
                      {s.title}
                    </div>
                    <Mono
                      style={{
                        fontSize: 9,
                        opacity: 0.5,
                        letterSpacing: "0.18em",
                        marginTop: 3,
                        display: "block",
                      }}
                    >
                      {s.en}
                    </Mono>
                    {scanStep === i && (
                      <p
                        style={{
                          margin: "10px 0 0",
                          fontFamily: "'Shippori Mincho', serif",
                          fontSize: 13.5,
                          lineHeight: 1.9,
                          color: "rgba(240,236,227,0.7)",
                        }}
                      >
                        {s.desc}
                      </p>
                    )}
                  </div>
                  <div
                    style={{
                      width: 32,
                      height: 0.5,
                      background: scanStep === i ? ACCENT : "rgba(240,236,227,0.2)",
                      transition: "background 0.3s",
                    }}
                  />
                </button>
              ))}
            </div>

            {/* demo box (desktop only) */}
            {!mobile && (
              <div
                style={{
                  aspectRatio: "4/3",
                  border: "0.5px solid rgba(240,236,227,0.1)",
                  padding: 28,
                  position: "relative",
                  overflow: "hidden",
                  background: "rgba(240,236,227,0.03)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 24,
                  }}
                >
                  <Mono style={{ fontSize: 10, color: ACCENT }}>● LIVE</Mono>
                  <Mono style={{ fontSize: 10, opacity: 0.4 }}>
                    STEP {scanStep + 1} / 4 · {STEPS[scanStep].en}
                  </Mono>
                </div>
                <motion.div
                  key={scanStep}
                  style={{
                    height: "calc(100% - 80px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, ease: [0.22, 0.61, 0.36, 1] }}
                >
                  {scanStep === 0 && (
                    <div style={{ position: "relative", width: 140, height: 180 }}>
                      {[
                        [0, 0],
                        [0, 1],
                        [1, 0],
                        [1, 1],
                      ].map(([b, r], i) => (
                        <div
                          key={i}
                          style={{
                            position: "absolute",
                            width: 24,
                            height: 24,
                            borderColor: ACCENT,
                            borderStyle: "solid",
                            borderWidth: 0,
                            ...(b === 0
                              ? { top: 0, borderTopWidth: 1.5 }
                              : { bottom: 0, borderBottomWidth: 1.5 }),
                            ...(r === 0
                              ? { left: 0, borderLeftWidth: 1.5 }
                              : { right: 0, borderRightWidth: 1.5 }),
                          }}
                        />
                      ))}
                      <div
                        style={{
                          width: 72,
                          height: 120,
                          margin: "30px auto 0",
                          background: "rgba(240,236,227,0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Mono style={{ fontSize: 8, opacity: 0.4 }}>TONER</Mono>
                      </div>
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          height: 1,
                          background: ACCENT,
                          opacity: 0.7,
                          boxShadow: `0 0 12px ${ACCENT}`,
                          animation: "scanLine 2.4s ease-in-out infinite",
                        }}
                      />
                    </div>
                  )}
                  {scanStep === 1 && (
                    <div style={{ width: "90%" }}>
                      {[
                        "グリセリン · Glycerin",
                        "ナイアシンアミド · Niacinamide",
                        "ヒアルロン酸Na · Sodium Hyaluronate",
                        "エタノール · Ethanol",
                      ].map((n, i) => (
                        <div
                          key={n}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "10px 14px",
                            marginBottom: 6,
                            background: "rgba(240,236,227,0.04)",
                            borderLeft: `1.5px solid ${i === 3 ? "#c97a5a" : ACCENT}`,
                          }}
                        >
                          <Mono style={{ fontSize: 9, opacity: 0.4, width: 20 }}>
                            {String(i + 1).padStart(2, "0")}
                          </Mono>
                          <span
                            style={{ fontFamily: "'Shippori Mincho', serif", fontSize: 13 }}
                          >
                            {n}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {scanStep === 2 && (
                    <div style={{ width: "90%" }}>
                      {(
                        [
                          ["グリセリン", "保湿", ACCENT],
                          ["ナイアシンアミド", "整肌・毛穴", ACCENT],
                          ["ヒアルロン酸Na", "水分保持", ACCENT],
                          ["エタノール", "要注意", "#c97a5a"],
                        ] as const
                      ).map(([n, fn, c]) => (
                        <div
                          key={n}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr auto",
                            padding: "12px 0",
                            borderBottom: "0.5px solid rgba(240,236,227,0.08)",
                          }}
                        >
                          <div>
                            <div
                              style={{ fontFamily: "'Shippori Mincho', serif", fontSize: 14 }}
                            >
                              {n}
                            </div>
                            <Mono style={{ fontSize: 9, opacity: 0.45 }}>{fn}</Mono>
                          </div>
                          <div
                            style={{
                              border: `0.5px solid ${c}`,
                              padding: "3px 10px",
                              color: c,
                              fontFamily: "'Shippori Mincho', serif",
                              fontSize: 11,
                              alignSelf: "center",
                            }}
                          >
                            {fn.split("・")[0]}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {scanStep === 3 && (
                    /* Use the existing site's SCAN_PREVIEW_INGREDIENTS */
                    <div style={{ width: "92%" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                          marginBottom: 14,
                        }}
                      >
                        <div
                          style={{
                            fontFamily: "'Shippori Mincho', serif",
                            fontSize: 16,
                            color: DARK_TEXT,
                          }}
                        >
                          BRAND · anua
                        </div>
                        <Mono style={{ fontSize: 9, opacity: 0.4 }}>3 INGREDIENTS</Mono>
                      </div>
                      <div
                        style={{
                          fontFamily: "'Shippori Mincho', serif",
                          fontSize: 13,
                          lineHeight: 1.4,
                          marginBottom: 14,
                          opacity: 0.85,
                        }}
                      >
                        HEARTLEAF 77+ HYALURON
                        <br />
                        SOOTHING TONER
                      </div>
                      {SCAN_PREVIEW_INGREDIENTS.map((ing, i) => (
                        <div
                          key={ing.en}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr auto",
                            padding: "10px 0",
                            borderBottom:
                              i < SCAN_PREVIEW_INGREDIENTS.length - 1
                                ? "0.5px solid rgba(240,236,227,0.08)"
                                : "none",
                            gap: 12,
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontFamily: "'Shippori Mincho', serif",
                                fontSize: 13,
                                color: DARK_TEXT,
                              }}
                            >
                              {ing.name}
                            </div>
                            <Mono style={{ fontSize: 8.5, opacity: 0.4 }}>
                              {ing.en} · {ing.cat}
                            </Mono>
                          </div>
                        </div>
                      ))}
                      <Mono
                        style={{
                          fontSize: 9,
                          opacity: 0.35,
                          marginTop: 14,
                          display: "block",
                          letterSpacing: "0.14em",
                        }}
                      >
                        RESULT · HADAMI INDEX
                      </Mono>
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </div>
        </section>

        {/* ── ROUTINE SHOWCASE ── */}
        <section
          id="routine"
          style={{
            padding: mobile ? `72px ${px}` : `120px ${px}`,
            borderTop: "0.5px solid rgba(26,26,22,0.12)",
          }}
        >
          <Reveal>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: mobile ? "flex-start" : "flex-end",
                flexDirection: mobile ? "column" : "row",
                gap: mobile ? 20 : 0,
                marginBottom: 48,
              }}
            >
              <div>
                <Label style={{ marginBottom: 16 }}>— REGIMEN · 01</Label>
                <h2
                  style={{
                    fontFamily: "'Shippori Mincho', serif",
                    fontSize: mobile ? "clamp(32px,8vw,48px)" : "clamp(36px, 4.5vw, 64px)",
                    lineHeight: 1.35,
                    fontWeight: 400,
                    margin: 0,
                    color: INK,
                  }}
                >
                  スキンケア 管理.
                </h2>
              </div>
              <div
                style={{
                  display: "flex",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  letterSpacing: "0.12em",
                }}
              >
                <button
                  onClick={() => setRoutineTab("am")}
                  style={{
                    padding: "9px 20px",
                    border: "0.5px solid rgba(26,26,22,0.2)",
                    cursor: "pointer",
                    background: routineTab === "am" ? INK : "transparent",
                    color: routineTab === "am" ? BG : INK,
                    transition: "all 0.2s",
                  }}
                >
                  ☀ 朝 AM
                </button>
                <button
                  onClick={() => setRoutineTab("pm")}
                  style={{
                    padding: "9px 20px",
                    border: "0.5px solid rgba(26,26,22,0.2)",
                    borderLeft: "none",
                    cursor: "pointer",
                    background: routineTab === "pm" ? INK : "transparent",
                    color: routineTab === "pm" ? BG : INK,
                    transition: "all 0.2s",
                  }}
                >
                  ☽ 夜 PM
                </button>
              </div>
            </div>
          </Reveal>

          <HR />
          {routineItems.map((it) => (
            <div key={it.num}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: mobile ? "32px 48px 1fr auto" : "36px 56px 1fr auto",
                  alignItems: "center",
                  padding: "18px 0",
                  gap: mobile ? 12 : 20,
                }}
              >
                <Mono style={{ fontSize: 10, opacity: 0.35 }}>{it.num}</Mono>
                <div
                  style={{
                    width: mobile ? 48 : 56,
                    height: mobile ? 48 : 56,
                    background: `linear-gradient(145deg, oklch(0.82 0.03 ${it.hue}), oklch(0.72 0.045 ${it.hue}))`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontStyle: "italic",
                      fontSize: 16,
                      opacity: 0.5,
                      color: INK,
                    }}
                  >
                    {it.name
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <Mono
                    style={{
                      fontSize: 9,
                      color: ACCENT,
                      marginBottom: 4,
                      display: "block",
                    }}
                  >
                    {it.type} — {it.brand}
                  </Mono>
                  <div
                    style={{
                      fontFamily: "'Shippori Mincho', serif",
                      fontSize: mobile ? 13 : 16,
                      color: INK,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {it.name}
                  </div>
                </div>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    border: "0.8px solid rgba(26,26,22,0.25)",
                  }}
                />
              </div>
              <HR />
            </div>
          ))}

          <Link
            href="/auth/invite"
            style={{
              marginTop: 20,
              padding: "16px 20px",
              border: "0.5px solid rgba(26,26,22,0.2)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 12,
              textDecoration: "none",
              color: INK,
            }}
          >
            <span style={{ fontFamily: "'Shippori Mincho', serif", fontSize: 14 }}>
              ルーティンを試してみる
            </span>
            <Mono style={{ fontSize: 9.5, color: ACCENT, letterSpacing: "0.16em" }}>
              ANALYZE →
            </Mono>
          </Link>
        </section>

        {/* ── SHARE CARD SHOWCASE ── */}
        <section
          style={{
            padding: mobile ? `72px ${px}` : `120px ${px}`,
            background: "rgba(26,26,22,0.04)",
            borderTop: "0.5px solid rgba(26,26,22,0.1)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: mobile ? "1fr" : "1fr 1fr",
              gap: mobile ? 48 : 80,
              alignItems: "center",
            }}
          >
            <Reveal>
              <div>
                <Label style={{ marginBottom: 16 }}>— SHARE CARD</Label>
                <h2
                  style={{
                    fontFamily: "'Shippori Mincho', serif",
                    fontSize: mobile ? "clamp(32px,8vw,48px)" : "clamp(36px, 4.5vw, 64px)",
                    lineHeight: 1.35,
                    fontWeight: 400,
                    margin: "0 0 24px",
                    color: INK,
                  }}
                >
                  ルーティンを、
                  <br />
                  <span
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontStyle: "italic",
                    }}
                  >
                    シェア
                  </span>
                  できる。
                </h2>
                <p
                  style={{
                    fontFamily: "'Shippori Mincho', serif",
                    fontSize: mobile ? 13.5 : 15,
                    lineHeight: 2.0,
                    color: "rgba(26,26,22,0.6)",
                    margin: "0 0 32px",
                  }}
                >
                  朝・夜のルーティンをひとつのカードにまとめて、
                  <br />
                  SNSにシェアできます。使っているアイテムと
                  <br />
                  スキンプロフィールを一目で伝えられます。
                </p>
                <Mono style={{ fontSize: 9.5, opacity: 0.45, letterSpacing: "0.18em" }}>
                  🌿 シェアカードを作成
                </Mono>
              </div>
            </Reveal>

            <Reveal delay={150}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1.3fr",
                  boxShadow: "0 24px 60px -16px rgba(26,26,22,0.18)",
                  maxWidth: mobile ? "100%" : 520,
                  margin: mobile ? "0 auto" : "0",
                }}
              >
                <div
                  style={{
                    background: "#ebe8e0",
                    padding: mobile ? "20px 16px" : "28px 22px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: mobile ? 260 : 320,
                  }}
                >
                  <div>
                    <Mono
                      style={{
                        fontSize: 7.5,
                        opacity: 0.4,
                        letterSpacing: "0.2em",
                        display: "block",
                        marginBottom: 12,
                      }}
                    >
                      HADAMI · MORNING
                    </Mono>
                    <div
                      style={{
                        fontFamily: "'Shippori Mincho', serif",
                        fontSize: mobile ? 24 : 32,
                        lineHeight: 1.15,
                        color: INK,
                      }}
                    >
                      私の
                      <br />
                      朝の
                      <br />
                      <span
                        style={{
                          fontFamily: "'Cormorant Garamond', serif",
                          fontStyle: "italic",
                          fontSize: mobile ? 28 : 36,
                        }}
                      >
                        ルーティン
                      </span>
                      。
                    </div>
                    <div
                      style={{
                        width: 22,
                        height: 1.5,
                        background: ACCENT,
                        marginTop: 14,
                      }}
                    />
                  </div>
                  <div>
                    <Mono
                      style={{
                        fontSize: 7,
                        opacity: 0.4,
                        letterSpacing: "0.2em",
                        marginBottom: 6,
                        display: "block",
                      }}
                    >
                      SKIN PROFILE
                    </Mono>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
                      {["乾燥肌", "シミ", "くすみ"].map((t) => (
                        <span
                          key={t}
                          style={{
                            border: "0.5px solid rgba(26,26,22,0.4)",
                            padding: "2px 6px",
                            fontFamily: "'Shippori Mincho', serif",
                            fontSize: 9,
                            color: INK,
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <Mono style={{ fontSize: 7, opacity: 0.3, display: "block" }}>
                      @miomio_beauty · 2026.04.28
                    </Mono>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gridTemplateRows: "1fr 1.4fr",
                  }}
                >
                  {SHARE_SWATCHES.map((s, i) => {
                    const isLarge = i >= 3;
                    const span = i === 3 ? "1 / 2" : i === 4 ? "2 / 3" : "auto";
                    return (
                      <div
                        key={s.abbr}
                        style={{
                          gridColumn: isLarge ? span : "auto",
                          background: `linear-gradient(145deg, oklch(${0.84 - i * 0.04} 0.04 ${s.hue}), oklch(${0.68 - i * 0.04} 0.06 ${s.hue}))`,
                          position: "relative",
                          overflow: "hidden",
                          minHeight: 80,
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%,-50%)",
                            fontFamily: "'Cormorant Garamond', serif",
                            fontStyle: "italic",
                            fontSize: isLarge ? 32 : 20,
                            opacity: 0.28,
                            color: INK,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {s.abbr}
                        </div>
                        <div
                          style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: "rgba(0,0,0,0.28)",
                            padding: "5px 7px",
                          }}
                        >
                          <div
                            style={{
                              fontFamily: "'Shippori Mincho', serif",
                              fontSize: 7.5,
                              color: DARK_TEXT,
                              opacity: 0.7,
                            }}
                          >
                            {s.type}
                          </div>
                          <div
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 7,
                              color: DARK_TEXT,
                              fontWeight: 600,
                              marginTop: 1,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {s.name}
                          </div>
                        </div>
                        <div
                          style={{
                            position: "absolute",
                            top: 5,
                            left: 5,
                            width: 15,
                            height: 15,
                            borderRadius: "50%",
                            background: ACCENT,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <span
                            style={{
                              color: "#fff",
                              fontSize: 7.5,
                              fontFamily: "'JetBrains Mono', monospace",
                              fontWeight: 700,
                            }}
                          >
                            {i + 1}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── DISCLAIMER ── */}
        <div
          style={{
            padding: "32px 24px",
            background: BG,
            borderTop: "0.5px solid rgba(26,26,22,0.12)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              maxWidth: 640,
              margin: "0 auto",
              fontSize: 11,
              fontFamily: "'Shippori Mincho', serif",
              lineHeight: 1.85,
              color: "rgba(26,26,22,0.5)",
            }}
          >
            ※
            HADAMIの検索結果はAIによる参考情報であり、医学的な判断や安全性の保証を行うものではありません。すべての成分を正確に検索できることを保証するものでもありません。肌トラブルが気になる場合は専門の医療機関にご相談ください。
          </p>
        </div>

        {/* ── CTA + FOOTER (dark) ── */}
        <section
          style={{
            padding: mobile ? `72px ${px} 48px` : `140px ${px} 64px`,
            background: INK,
            color: DARK_TEXT,
          }}
        >
          <Reveal>
            <div style={{ marginBottom: mobile ? 60 : 100 }}>
              <Label style={{ color: DARK_TEXT, marginBottom: 18 }}>— BEGIN · 始める</Label>
              <h2
                style={{
                  fontFamily: "'Shippori Mincho', serif",
                  fontSize: mobile ? "clamp(40px,11vw,68px)" : "clamp(52px, 7.5vw, 116px)",
                  lineHeight: 1.35,
                  fontWeight: 400,
                  margin: 0,
                  color: DARK_TEXT,
                  letterSpacing: "-0.02em",
                }}
              >
                成分を知ることが、
                <br />
                <span
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontStyle: "italic",
                    color: ACCENT,
                  }}
                >
                  いちばんの
                </span>
                <br />
                スキンケア。
              </h2>

              <div
                style={{
                  marginTop: mobile ? 36 : 56,
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  flexWrap: "wrap",
                }}
              >
                <Link
                  href="/auth/invite"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "16px 36px",
                    background: BG,
                    color: INK,
                    textDecoration: "none",
                    fontFamily: "'Shippori Mincho', serif",
                    fontSize: 15,
                  }}
                >
                  {Ico.camera({ width: 18, height: 18 })}
                  <span>無料で始める</span>
                  <Mono style={{ fontSize: 9, letterSpacing: "0.22em", opacity: 0.7 }}>
                    START →
                  </Mono>
                </Link>
                <Mono
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.16em",
                    opacity: 0.55,
                  }}
                >
                  月 {scanLimit} 回までスキャン無料
                </Mono>
              </div>

              <p
                style={{
                  fontFamily: "'Shippori Mincho', serif",
                  fontSize: 12,
                  color: "rgba(240,236,227,0.55)",
                  marginTop: 18,
                  maxWidth: 560,
                }}
              >
                招待コードは{" "}
                <a
                  href="https://x.com/miomio_beauty"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: ACCENT,
                    textDecoration: "underline",
                    textUnderlineOffset: 3,
                  }}
                >
                  X（@miomio_beauty）
                </a>
                {" "}にDMで気軽にどうぞ
              </p>
            </div>
          </Reveal>

          <HR ink={DARK_TEXT} style={{ opacity: 0.12 }} />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: mobile ? "1fr 1fr" : "2fr 1fr 1fr 1fr",
              gap: mobile ? 24 : 40,
              paddingTop: 36,
            }}
          >
            <div style={{ gridColumn: mobile ? "1 / -1" : "auto" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <Image
                  src="/hadami-app-icon.png"
                  alt="HADAMI"
                  width={22}
                  height={22}
                  style={{ borderRadius: 5 }}
                />
                <span
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 20,
                    letterSpacing: "0.12em",
                    color: DARK_TEXT,
                  }}
                >
                  HADAMI
                </span>
              </div>
              <Mono
                style={{
                  fontSize: 9,
                  opacity: 0.35,
                  letterSpacing: "0.1em",
                  marginTop: 10,
                  display: "block",
                }}
              >
                © 2026 HADAMI. All rights reserved.
              </Mono>
              <Mono
                style={{
                  fontSize: 8.5,
                  opacity: 0.25,
                  letterSpacing: "0.1em",
                  marginTop: 4,
                  display: "block",
                }}
              >
                PRODUCED BY{" "}
                <a
                  href="https://blog-engine.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: DARK_TEXT,
                    opacity: 0.8,
                    textDecoration: "underline",
                    textUnderlineOffset: 3,
                  }}
                >
                  みおのミハダノート
                </a>
              </Mono>
            </div>

            <div>
              <Label style={{ color: DARK_TEXT, marginBottom: 14 }}>PRODUCT</Label>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { href: "#features", label: "機能" },
                  { href: "#scan", label: "使い方" },
                  { href: "#routine", label: "ルーティン" },
                ].map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    style={{
                      color: DARK_TEXT,
                      textDecoration: "none",
                      fontFamily: "'Shippori Mincho', serif",
                      fontSize: 13,
                      opacity: 0.6,
                    }}
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <Label style={{ color: DARK_TEXT, marginBottom: 14 }}>COMPANY</Label>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <a
                  href="https://blog-engine.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: DARK_TEXT,
                    textDecoration: "none",
                    fontFamily: "'Shippori Mincho', serif",
                    fontSize: 13,
                    opacity: 0.6,
                  }}
                >
                  みおのミハダノート
                </a>
                <a
                  href="https://x.com/miomio_beauty"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: DARK_TEXT,
                    textDecoration: "none",
                    fontFamily: "'Shippori Mincho', serif",
                    fontSize: 13,
                    opacity: 0.6,
                  }}
                >
                  X (@miomio_beauty)
                </a>
              </div>
            </div>

            <div>
              <Label style={{ color: DARK_TEXT, marginBottom: 14 }}>SUPPORT</Label>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Link
                  href="/terms"
                  style={{
                    color: DARK_TEXT,
                    textDecoration: "none",
                    fontFamily: "'Shippori Mincho', serif",
                    fontSize: 13,
                    opacity: 0.6,
                  }}
                >
                  利用規約
                </Link>
                <Link
                  href="/privacy"
                  style={{
                    color: DARK_TEXT,
                    textDecoration: "none",
                    fontFamily: "'Shippori Mincho', serif",
                    fontSize: 13,
                    opacity: 0.6,
                  }}
                >
                  プライバシー
                </Link>
                <a
                  href="https://blog-engine.com/contact/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: DARK_TEXT,
                    textDecoration: "none",
                    fontFamily: "'Shippori Mincho', serif",
                    fontSize: 13,
                    opacity: 0.6,
                  }}
                >
                  お問い合わせ
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── BACK TO TOP ── */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="ページトップへ戻る"
          style={{
            position: "fixed",
            bottom: 24,
            right: 20,
            zIndex: 200,
            width: 44,
            height: 44,
            borderRadius: 999,
            background: INK,
            color: BG,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 6px 20px rgba(26,26,22,0.25)",
            opacity: showTop ? 1 : 0,
            transform: showTop ? "translateY(0)" : "translateY(16px)",
            pointerEvents: showTop ? "auto" : "none",
            transition: "opacity 300ms ease, transform 300ms ease",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
