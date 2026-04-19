"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { getAccountScanLimit } from "@/lib/db";
import { CameraIcon, BookIcon, SparkleIcon, SunIcon, LeafIcon, ScanIcon, PackageIcon } from "@/components/ui/Icons";
import { ActiveCategoryIcon } from "@/components/ui/CosmeticIcons";

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

/* ─── Scroll-reveal wrapper ─── */
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ─── Data ─── */
const STEPS = [
  {
    step: "01",
    Icon: CameraIcon,
    iconColor: "#3A8F7A",
    title: "撮る",
    desc: "コスメのパッケージにカメラを向けるだけ。AIが商品を特定し、ネットから成分情報を自動で取得します。",
    bgClass: "bg-[#E3F0EC]",
  },
  {
    step: "02",
    Icon: ScanIcon,
    iconColor: "#D4A853",
    title: "知る",
    desc: "AIが成分を検索し、特徴や★レアリティを表示。成分の組み合わせ相性もわかります。",
    bgClass: "bg-[#FFF3DC]",
  },
  {
    step: "03",
    Icon: SparkleIcon,
    iconColor: "#9C27B0",
    title: "集める・組む",
    desc: "成分を図鑑にコレクトし、製品をルーティンとして管理。朝・夜のルーティンを組んで毎日チェックできます。",
    bgClass: "bg-[#EDE3F0]",
  },
];

const FEATURES = [
  {
    Icon: ScanIcon,
    iconColor: "#3A8F7A",
    title: "AI成分検索",
    desc: "400種超の美容成分に対応。パッケージを撮影するだけでAIが商品を特定し、成分の特徴をお伝えします",
  },
  {
    Icon: BookIcon,
    iconColor: "#D4A853",
    title: "成分図鑑＋★レアリティ",
    desc: "見つけた成分をコレクト。出現頻度に応じた★1〜★4のレアリティ付き。コンプリートを目指そう",
  },
  {
    Icon: SparkleIcon,
    iconColor: "#9C27B0",
    title: "スキンケアルーティン",
    desc: "お気に入り製品をルーティンに並べて朝・夜のルーティンを管理。カテゴリカバー率や相乗効果の分析、ルーティンカードのシェアも",
  },
  {
    Icon: SunIcon,
    iconColor: "#E89A00",
    title: "朝夜ルーティンチェック",
    desc: "ルーティンに登録した製品が毎日のチェックリストに。進捗リングで達成度をひと目で確認できます",
  },
  {
    Icon: LeafIcon,
    iconColor: "#4CAF50",
    title: "おすすめ商品レコメンド",
    desc: "スキャン履歴からあなたの成分傾向を分析し、まだ出会っていない成分を含む商品をおすすめ",
  },
  {
    Icon: PackageIcon,
    iconColor: "#6B4A8A",
    title: "マイコスメ写真管理",
    desc: "スキャンした製品を写真グリッドで一覧管理。お気に入り・カテゴリで絞り込み。ダークモードにも対応",
  },
];

const SCAN_PREVIEW_INGREDIENTS = [
  { name: "パンテノール", cat: "ビタミン", rarity: 1 },
  { name: "ツボクサエキス", cat: "ボタニカル", rarity: 2 },
  { name: "ヒアルロン酸Na", cat: "うるおい", rarity: 1 },
];

const MOCKUP_ITEMS = [
  { cat: "moisturizing" as const, color: "#4FC3F7", r: 1 },
  { cat: "brightening" as const, color: "#CE93D8", r: 3 },
  { cat: "soothing" as const, color: "#4CAF50", r: 2 },
  { cat: "turnover" as const, color: "#FFB74D", r: 4 },
  { cat: "barrier" as const, color: "#F9A8C0", r: 1 },
  { cat: null, color: "#BDBDBD", r: 0 },
];

/* ═══════════════════════════════════════════ */
export default function LandingPage() {
  const scanLimit = getAccountScanLimit();
  const navRef = useRef<HTMLElement>(null);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    let ticking = false;
    const h = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrolled = window.scrollY > 40;
        if (navRef.current) {
          navRef.current.dataset.scrolled = scrolled ? "true" : "false";
        }
        setShowTop(window.scrollY > 300);
        ticking = false;
      });
    };
    window.addEventListener("scroll", h, { passive: true });
    h();
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <div className="min-h-screen bg-bo-cream dark:bg-[#121212] font-sans text-bo-ink overflow-x-hidden">
      {/* ─── NAV ─── */}
      <nav
        ref={navRef}
        data-scrolled="false"
        className="fixed top-0 left-0 right-0 z-[100] transition-all duration-[350ms] ease-out bg-transparent border-b border-transparent data-[scrolled=true]:bg-bo-cream/90 dark:data-[scrolled=true]:bg-[#121212]/90 data-[scrolled=true]:backdrop-blur-[20px] data-[scrolled=true]:backdrop-saturate-[1.6] data-[scrolled=true]:border-bo-ink-faint/20"
      >
        <div className="max-w-[960px] mx-auto px-6 py-3.5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Image src="/hadami-logo.png" alt="HADAMI" width={32} height={32} className="rounded-[10px]" />
            <span className="text-base font-black font-serif text-bo-ink dark:text-white tracking-[-0.02em]">
              HADAMI
            </span>
          </div>
          <Link
            href="/auth/invite"
            className="px-5 py-2 rounded-[10px] bg-bo-accent text-white text-xs font-bold font-sans shadow-bo-accent transition-transform hover:scale-105"
          >
            無料で始める
          </Link>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-[120px] pb-20 overflow-hidden">
        <div className="absolute top-[10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(58,143,122,0.08)_0%,transparent_70%)] blur-[40px] pointer-events-none" />
        <div className="absolute bottom-[5%] right-[-8%] w-[350px] h-[350px] rounded-full bg-[radial-gradient(circle,rgba(91,191,173,0.06)_0%,transparent_70%)] blur-[40px] pointer-events-none" />

        <div className="relative max-w-[600px] text-center z-[1]">
          <Reveal>
            <div className="flex items-center justify-center gap-2 flex-wrap mb-7">
              <div className="inline-flex items-center gap-1.5 bg-bo-accent-soft rounded-[20px] px-4 py-1.5">
                <LeafIcon size={13} color="#3A8F7A" />
                <span className="text-[11px] font-bold text-bo-accent font-sans tracking-[0.04em]">
                  無料で使えるコスメ成分アプリ
                </span>
              </div>
              <div className="inline-flex items-center gap-1 bg-[#FFF3DC] dark:bg-[#3a2e10] rounded-[20px] px-3 py-1.5">
                <span className="text-[10px] font-black text-[#D4A853] font-sans tracking-[0.05em]">β</span>
                <span className="text-[11px] font-bold text-[#D4A853] font-sans">クローズドベータ版</span>
              </div>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="text-[clamp(32px,7vw,52px)] font-extrabold font-serif leading-[1.25] tracking-[-0.03em] text-bo-ink mb-5">
              成分から、
              <br />
              <span className="bg-gradient-to-br from-bo-accent to-[#3A8F7A] bg-clip-text text-transparent">
                美しさを選ぶ。
              </span>
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p className="text-[clamp(14px,2.5vw,17px)] text-bo-ink-muted dark:text-gray-400 leading-[1.8] max-w-[440px] mx-auto mb-9 font-sans">
              パッケージを撮影するだけでAIが成分を検索。
              <br />
              図鑑に集めて、ルーティンに組んで、
              <br />
              毎日のスキンケアを成分から見直せるアプリです。
            </p>
          </Reveal>

          <Reveal delay={300}>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link
                href="/auth/invite"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-[14px] bg-gradient-to-br from-bo-accent to-bo-accent-dark text-white text-[15px] font-bold font-sans shadow-bo-accent transition-transform hover:scale-105"
              >
                <CameraIcon size={16} color="white" /> 無料で始める
              </Link>
              <a
                href="#how-it-works"
                className="px-7 py-3.5 rounded-[14px] bg-white dark:bg-[#1E1E1E] text-bo-ink-soft dark:text-gray-300 text-[15px] font-bold font-sans border-[1.5px] border-bo-parchment dark:border-[#444] transition-transform hover:scale-105"
              >
                使い方を見る ↓
              </a>
            </div>
            <p className="text-[12px] text-bo-ink-muted dark:text-gray-400 font-sans mt-4">
              招待コードは{" "}
              <a
                href="https://x.com/miomio_beauty"
                target="_blank"
                rel="noopener noreferrer"
                className="text-bo-accent font-bold hover:underline"
              >
                X（@miomio_beauty）
              </a>
              {" "}にDMでお気軽にどうぞ 🌿
            </p>
          </Reveal>

          {/* Phone mockup */}
          <Reveal delay={450}>
            <div className="mt-14 flex justify-center">
              <div className="w-[220px] rounded-[28px] overflow-hidden bg-white dark:bg-[#1E1E1E] shadow-[0_20px_60px_rgba(27,38,32,0.1)] border border-bo-parchment dark:border-[#333] p-3 pb-4 animate-landing-float">
                <div className="rounded-r2 overflow-hidden bg-bo-cream p-4 px-3.5">
                  <div className="text-[10px] font-black font-serif text-bo-ink mb-2.5">
                    HADAMI
                  </div>
                  <div className="bg-bo-accent-soft rounded-r1 p-3 px-2.5 flex items-center gap-2 mb-2">
                    <span className="text-base">📸</span>
                    <div>
                      <div className="text-[9px] font-bold text-bo-ink">
                        成分をスキャン
                      </div>
                      <div className="text-[7px] text-bo-ink-muted">
                        撮影 → AI検索
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {MOCKUP_ITEMS.map((item, i) => (
                      <div
                        key={i}
                        className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 border border-bo-parchment dark:border-[#444] ${
                          i < 5 ? "bg-white dark:bg-[#2A2A2A]" : "bg-bo-parchment opacity-40"
                        }`}
                      >
                        <span style={{ color: item.color }}>
                          <ActiveCategoryIcon category={item.cat} size={14} />
                        </span>
                        {i < 5 && (
                          <span className="text-[5px] text-[#D4A853]">
                            {"★".repeat(item.r)}
                            {"☆".repeat(5 - item.r)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── SOCIAL PROOF ─── */}
      <section className="py-[60px] px-6 bg-white dark:bg-[#1A1A1A] border-t border-b border-bo-parchment dark:border-[#333]">
        <div className="max-w-[700px] mx-auto grid grid-cols-3 gap-6 text-center">
          {[
            { n: 400, suffix: "種+", label: "美容成分" },
            { n: 12, suffix: "種", label: "コスメカテゴリ" },
            { n: 6, suffix: "軸", label: "効果カテゴリ" },
          ].map((s, i) => (
            <Reveal key={i} delay={i * 100}>
              <div className="text-[clamp(24px,5vw,36px)] font-black font-serif text-bo-accent leading-none">
                <AnimNum to={s.n} />
                {s.suffix}
              </div>
              <div className="text-[11px] text-bo-ink-muted dark:text-gray-400 font-sans mt-1.5">
                {s.label}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-[700px] mx-auto">
          <Reveal>
            <div className="text-center mb-14">
              <p className="text-[11px] font-bold text-bo-accent tracking-[0.15em] uppercase mb-2">
                HOW IT WORKS
              </p>
              <h2 className="text-[clamp(22px,4.5vw,32px)] font-extrabold font-serif leading-[1.3] dark:text-white">
                3ステップで、
                <br />
                成分がわかる
              </h2>
            </div>
          </Reveal>

          <div className="flex flex-col gap-5">
            {STEPS.map((s, i) => (
              <Reveal key={i} delay={i * 120}>
                <div className="flex gap-[18px] py-7 px-6 bg-white dark:bg-[#1E1E1E] rounded-[20px] border border-bo-parchment dark:border-[#333] shadow-[0_2px_12px_rgba(27,38,32,0.04)] items-start">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${s.bgClass}`}
                  >
                    <s.Icon size={28} color={s.iconColor} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1.5">
                      <span className="text-[11px] font-black text-bo-accent font-serif">
                        {s.step}
                      </span>
                      <span className="text-[17px] font-bold text-bo-ink dark:text-white font-sans">
                        {s.title}
                      </span>
                    </div>
                    <p className="text-[13px] text-bo-ink-muted dark:text-gray-400 leading-[1.75] font-sans">
                      {s.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="py-20 px-6 bg-gradient-to-b from-bo-parchment to-bo-cream dark:from-[#1A1A1A] dark:to-[#121212]">
        <div className="max-w-[700px] mx-auto">
          <Reveal>
            <div className="text-center mb-12">
              <p className="text-[11px] font-bold text-bo-accent tracking-[0.15em] uppercase mb-2">
                FEATURES
              </p>
              <h2 className="text-[clamp(22px,4.5vw,32px)] font-extrabold font-serif leading-[1.3] dark:text-white">
                HADAMIにできること
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map((f, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="p-6 px-5 rounded-r2 bg-white dark:bg-[#1E1E1E] border border-bo-parchment dark:border-[#333] shadow-[0_2px_12px_rgba(27,38,32,0.03)] h-full">
                  <div className="w-11 h-11 rounded-[13px] flex items-center justify-center mb-3.5"
                       style={{ background: f.iconColor + "18" }}>
                    <f.Icon size={22} color={f.iconColor} />
                  </div>
                  <div className="text-sm font-bold text-bo-ink dark:text-white font-sans mb-1.5">
                    {f.title}
                  </div>
                  <p className="text-xs text-bo-ink-muted dark:text-gray-400 leading-[1.7] font-sans">
                    {f.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SCAN PREVIEW ─── */}
      <section className="py-20 px-6">
        <div className="max-w-[500px] mx-auto">
          <Reveal>
            <div className="text-center mb-9">
              <p className="text-[11px] font-bold text-bo-accent tracking-[0.15em] uppercase mb-2">
                SCAN PREVIEW
              </p>
              <h2 className="text-[clamp(22px,4.5vw,32px)] font-extrabold font-serif leading-[1.3] dark:text-white">
                こんな風に見えます
              </h2>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl overflow-hidden shadow-[0_12px_48px_rgba(27,38,32,0.08)] border border-bo-parchment dark:border-[#333]">
              <div className="h-[3px] bg-gradient-to-r from-bo-accent via-[#3A8F7A] to-bo-safe" />
              <div className="p-6 px-[22px]">
                <div className="mb-5">
                  <div className="text-[11px] text-bo-ink-muted tracking-[0.08em] uppercase">
                    anua
                  </div>
                  <div className="text-[17px] font-extrabold font-serif text-bo-ink dark:text-white leading-[1.3] mt-1">
                    HEARTLEAF 77+ HYALURON
                    <br />
                    SOOTHING TONER
                  </div>
                  <div className="flex gap-[5px] mt-2.5">
                    {["化粧水", "鎮静", "保湿"].map((t, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-semibold text-bo-ink-soft dark:text-gray-300 bg-bo-parchment dark:bg-[#2A2A2A] px-[9px] py-[3px] rounded-md"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  {SCAN_PREVIEW_INGREDIENTS.map((ing, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 py-2.5 px-3.5 rounded-r1 bg-bo-cream dark:bg-[#252525] border border-bo-parchment dark:border-[#444]"
                    >
                      <div className="flex-1">
                        <div className="text-xs font-bold text-bo-ink dark:text-white">
                          {ing.name}
                        </div>
                        <div className="text-[9px] text-bo-ink-muted dark:text-gray-500">
                          {ing.cat}
                        </div>
                      </div>
                      <span className="text-[10px] text-[#D4A853] tracking-wide">
                        {"★".repeat(ing.rarity)}
                        {"☆".repeat(5 - ing.rarity)}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-bo-ink-muted mt-3 leading-[1.5]">
                  ※ 検索結果は参考情報です。成分の特徴や気づきとしてご活用ください。
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-[100px] px-6 bg-gradient-to-b from-bo-cream to-bo-accent-soft dark:from-[#121212] dark:to-[#1a3a2a] text-center">
        <Reveal>
          <div className="max-w-[480px] mx-auto">
            <div className="flex justify-center mb-5">
              <div className="w-14 h-14 rounded-[18px] bg-bo-accent-soft flex items-center justify-center">
                <LeafIcon size={32} color="#3A8F7A" />
              </div>
            </div>
            <h2 className="text-[clamp(24px,5vw,36px)] font-extrabold font-serif leading-[1.3] mb-4 text-bo-ink dark:text-white">
              成分を知ることが、
              <br />
              いちばんのスキンケア。
            </h2>
            <p className="text-sm text-bo-ink-muted dark:text-gray-400 leading-[1.8] font-sans mb-9">
              無料で使えます。まずは手元の化粧品をスキャンしてみてください。
            </p>
            <Link
              href="/auth/invite"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-gradient-to-br from-bo-accent to-bo-accent-dark text-white text-base font-bold font-sans shadow-bo-accent transition-transform hover:scale-105"
            >
              <CameraIcon size={18} color="white" /> 無料で始める
            </Link>
            <p className="text-[11px] text-bo-ink-faint dark:text-gray-500 mt-3.5 font-sans">
              月{scanLimit}回までスキャン無料
            </p>
            <p className="text-[12px] text-bo-ink-muted dark:text-gray-400 font-sans mt-2">
              招待コードのご希望は{" "}
              <a
                href="https://x.com/miomio_beauty"
                target="_blank"
                rel="noopener noreferrer"
                className="text-bo-accent font-bold hover:underline"
              >
                X（@miomio_beauty）
              </a>
              {" "}にDMください
            </p>
          </div>
        </Reveal>
      </section>

      {/* (produced by section removed — single instance in footer) */}

      {/* ─── DISCLAIMER ─── */}
      <div className="px-6 py-6 pb-7 bg-bo-ink dark:bg-[#0A0A0A] border-b border-bo-ink-faint/10">
        <p className="max-w-[600px] mx-auto text-[10px] text-bo-ink-muted dark:text-gray-500 font-sans leading-[1.8] text-center">
          ※ HADAMIの検索結果はAIによる参考情報であり、医学的な判断や安全性の保証を行うものではありません。すべての成分を正確に検索できることを保証するものでもありません。肌トラブルが気になる場合は専門の医療機関にご相談ください。
        </p>
      </div>

      {/* ─── FOOTER ─── */}
      <footer className="py-10 px-6 bg-bo-ink dark:bg-[#0A0A0A] text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Image src="/hadami-logo.png" alt="HADAMI" width={24} height={24} className="rounded-[7px]" />
          <span className="text-sm font-extrabold font-serif text-bo-accent-soft">
            HADAMI
          </span>
        </div>
        <div className="text-[10px] text-bo-ink-muted font-sans mb-4">
          Produced by{" "}
          <a
            href="https://blog-engine.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-bo-accent-soft underline"
          >
            みおのミハダノート
          </a>
        </div>
        <div className="flex justify-center gap-6 mb-5">
          <Link href="/terms" className="text-[11px] text-bo-ink-muted font-sans">
            利用規約
          </Link>
          <Link href="/privacy" className="text-[11px] text-bo-ink-muted font-sans">
            プライバシー
          </Link>
          <a
            href="mailto:miomio30beauty@gmail.com"
            className="text-[11px] text-bo-ink-muted font-sans"
          >
            お問い合わせ
          </a>
        </div>
        <p className="text-[10px] text-bo-ink-faint dark:text-gray-600 font-sans">
          &copy; 2026 HADAMI. All rights reserved.
        </p>
      </footer>

      {/* ─── BACK TO TOP ─── */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="ページトップへ戻る"
        className={`fixed bottom-6 right-5 z-[200] w-11 h-11 rounded-full bg-bo-ink dark:bg-white text-bo-cream dark:text-[#121212] flex items-center justify-center shadow-lg transition-all duration-300 ${showTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </button>
    </div>
  );
}
