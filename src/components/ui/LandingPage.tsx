"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { getAccountScanLimit } from "@/lib/db";

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
    icon: "\u{1F4F8}",
    title: "\u64AE\u308B",
    desc: "\u30B3\u30B9\u30E1\u306E\u30D1\u30C3\u30B1\u30FC\u30B8\u306B\u30AB\u30E1\u30E9\u3092\u5411\u3051\u308B\u3060\u3051\u3002AI\u304C\u5546\u54C1\u3092\u7279\u5B9A\u3057\u3001\u30CD\u30C3\u30C8\u304B\u3089\u6210\u5206\u60C5\u5831\u3092\u81EA\u52D5\u3067\u53D6\u5F97\u3057\u307E\u3059\u3002",
    bgClass: "bg-[#E3F0EC]",
  },
  {
    step: "02",
    icon: "\u{1F50D}",
    title: "\u77E5\u308B",
    desc: "AI\u304C\u6210\u5206\u3092\u53C2\u8003\u60C5\u5831\u3068\u3057\u3066\u89E3\u6790\u3002\u2605\u30EC\u30A2\u30EA\u30C6\u30A3\u3067\u51FA\u73FE\u983B\u5EA6\u3082\u308F\u304B\u308A\u307E\u3059\u3002\u3059\u3079\u3066\u306E\u6210\u5206\u306E\u89E3\u6790\u3092\u4FDD\u8A3C\u3059\u308B\u3082\u306E\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3002",
    bgClass: "bg-[#FFF3DC]",
  },
  {
    step: "03",
    icon: "\u2728",
    title: "\u96C6\u3081\u308B\u30FB\u7D44\u3080",
    desc: "\u6210\u5206\u3092\u56F3\u9451\u306B\u30B3\u30EC\u30AF\u30C8\u3057\u3001\u88FD\u54C1\u3092\u30C7\u30C3\u30AD\u3068\u3057\u3066\u7BA1\u7406\u3002\u6210\u5206\u304B\u3089\u88FD\u54C1\u3092\u9006\u5F15\u304D\u3057\u305F\u308A\u3001\u30EB\u30FC\u30C6\u30A3\u30F3\u306E\u76F8\u4E57\u52B9\u679C\u3092\u78BA\u8A8D\u3067\u304D\u307E\u3059\u3002",
    bgClass: "bg-[#EDE3F0]",
  },
];

const FEATURES = [
  {
    icon: "\u{1F9EA}",
    title: "\u6210\u5206AI\u89E3\u6790",
    desc: "323\u7A2E\u306E\u6210\u5206\u306B\u5BFE\u5FDC\u3002\u30D1\u30C3\u30B1\u30FC\u30B8\u3092\u64AE\u5F71\u3059\u308B\u3060\u3051\u3067AI\u304C\u5546\u54C1\u3092\u7279\u5B9A\u3057\u3001\u6210\u5206\u306E\u7279\u5FB4\u3092\u53C2\u8003\u60C5\u5831\u3068\u3057\u3066\u304A\u4F1D\u3048\u3057\u307E\u3059",
  },
  {
    icon: "\u{1F4D6}",
    title: "\u6210\u5206\u56F3\u9451\uFF0B\u2605\u30EC\u30A2\u30EA\u30C6\u30A3",
    desc: "\u898B\u3064\u3051\u305F\u6210\u5206\u3092\u30B3\u30EC\u30AF\u30C8\u3002\u51FA\u73FE\u983B\u5EA6\u306B\u5FDC\u3058\u305F\u26051\u301C\u26055\u306E\u30EC\u30A2\u30EA\u30C6\u30A3\u4ED8\u304D\u3002\u30B3\u30F3\u30D7\u30EA\u30FC\u30C8\u3092\u76EE\u6307\u305D\u3046",
  },
  {
    icon: "\u{1F517}",
    title: "\u6210\u5206\u2192\u88FD\u54C1\u30EA\u30F3\u30AF",
    desc: "\u56F3\u9451\u3067\u6210\u5206\u3092\u30BF\u30C3\u30D7\u3059\u308B\u3068\u3001\u305D\u306E\u6210\u5206\u3092\u542B\u3080\u4FDD\u5B58\u6E08\u307F\u30B3\u30B9\u30E1\u3092\u4E00\u89A7\u3067\u78BA\u8A8D\u3067\u304D\u307E\u3059",
  },
  {
    icon: "\u{1F0CF}",
    title: "\u30B9\u30AD\u30F3\u30B1\u30A2\u30C7\u30C3\u30AD",
    desc: "\u304A\u6C17\u306B\u5165\u308A\u88FD\u54C1\u3092\u624B\u672D\u98A8\u306B\u4E26\u3079\u3066\u30EB\u30FC\u30C6\u30A3\u30F3\u3092\u7BA1\u7406\u3002\u30AB\u30C6\u30B4\u30EA\u30AB\u30D0\u30FC\u7387\u3084\u76F8\u4E57\u52B9\u679C\u3082\u5206\u6790",
  },
  {
    icon: "\u{1F4F8}",
    title: "My\u30B3\u30B9\u30E1\u5199\u771F\u7BA1\u7406",
    desc: "\u30B9\u30AD\u30E3\u30F3\u3057\u305F\u88FD\u54C1\u3092\u5199\u771F\u30B0\u30EA\u30C3\u30C9\u3067\u4E00\u89A7\u7BA1\u7406\u3002\u304A\u6C17\u306B\u5165\u308A\u30FB\u30AB\u30C6\u30B4\u30EA\u3067\u7D5E\u308A\u8FBC\u307F",
  },
  {
    icon: "\u{1F426}",
    title: "X\u3067\u30B7\u30A7\u30A2",
    desc: "\u304A\u6C17\u306B\u5165\u308A\u306E\u30B3\u30B9\u30E1\u3092\u30AD\u30E3\u30D7\u30C1\u30E3\u753B\u50CF\u4ED8\u304D\u3067\u30EF\u30F3\u30BF\u30C3\u30D7\u3067X\u306B\u6295\u7A3F",
  },
];

const BETA_ITEMS = [
  {
    icon: "\u{1F9EA}",
    title: "\u73FE\u5728\u03B2\u7248\u3068\u3057\u3066\u9650\u5B9A\u516C\u958B\u4E2D",
    desc: "\u57FA\u672C\u6A5F\u80FD\uFF08\u6210\u5206\u30B9\u30AD\u30E3\u30F3\u30FB\u56F3\u9451\u30FB\u30C7\u30C3\u30AD\u30FBMy\u30B3\u30B9\u30E1\uFF09\u306F\u5B9F\u88C5\u6E08\u307F\u300230\u540D\u307E\u3067\u767B\u9332\u53EF\u80FD\u3067\u3059\u3002",
  },
  {
    icon: "\u{1F4AC}",
    title: "\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF\u304C\u529B\u306B\u306A\u308A\u307E\u3059",
    desc: "\u300C\u3053\u306E\u6A5F\u80FD\u304C\u307B\u3057\u3044\u300D\u300C\u3053\u3053\u304C\u4F7F\u3044\u306B\u304F\u3044\u300D\u306A\u3069\u3001\u5B9F\u969B\u306B\u4F7F\u3063\u305F\u611F\u60F3\u3092\u805E\u304B\u305B\u3066\u304F\u3060\u3055\u3044\u3002",
  },
];

const SCAN_PREVIEW_INGREDIENTS = [
  { name: "\u30D1\u30F3\u30C6\u30CE\u30FC\u30EB", cat: "\u4FEE\u5FA9", rarity: 1 },
  { name: "\u30C4\u30DC\u30AF\u30B5\u30A8\u30AD\u30B9", cat: "\u93AE\u9759", rarity: 3 },
  { name: "\u30D2\u30A2\u30EB\u30ED\u30F3\u9178Na", cat: "\u4FDD\u6E7F", rarity: 1 },
];

const MOCKUP_ITEMS = [
  { ic: "\u{1F4A7}", r: 1 },
  { ic: "\u2728", r: 3 },
  { ic: "\u{1F33F}", r: 2 },
  { ic: "\u{1F52C}", r: 4 },
  { ic: "\u{1F34A}", r: 1 },
  { ic: "\u{1F512}", r: 0 },
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
    h(); // initial check
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <div className="min-h-screen bg-bo-cream font-sans text-bo-ink overflow-x-hidden">
      {/* ─── NAV ─── */}
      <nav
        ref={navRef}
        data-scrolled="false"
        className="fixed top-0 left-0 right-0 z-[100] transition-all duration-[350ms] ease-out bg-transparent border-b border-transparent data-[scrolled=true]:bg-bo-cream/90 data-[scrolled=true]:backdrop-blur-[20px] data-[scrolled=true]:backdrop-saturate-[1.6] data-[scrolled=true]:border-bo-ink-faint/20"
      >
        <div className="max-w-[960px] mx-auto px-6 py-3.5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Image src="/hadami-logo.png" alt="HADAMI" width={32} height={32} className="rounded-[10px]" />
            <span className="text-base font-black font-serif text-bo-ink tracking-[-0.02em]">
              HADAMI
            </span>
          </div>
          <Link
            href="/auth/login"
            className="px-5 py-2 rounded-[10px] bg-bo-accent text-white text-xs font-bold font-sans shadow-bo-accent transition-transform hover:scale-105"
          >
            {"\u03B2\u7248\u3092\u8A66\u3059"}
          </Link>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-[120px] pb-20 overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-[10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(58,143,122,0.08)_0%,transparent_70%)] blur-[40px] pointer-events-none" />
        <div className="absolute bottom-[5%] right-[-8%] w-[350px] h-[350px] rounded-full bg-[radial-gradient(circle,rgba(91,191,173,0.06)_0%,transparent_70%)] blur-[40px] pointer-events-none" />

        <div className="relative max-w-[600px] text-center z-[1]">
          <Reveal>
            <div className="inline-flex items-center gap-1.5 bg-bo-accent-soft rounded-[20px] px-4 py-1.5 mb-7">
              <span className="text-xs">{"\u{1F33F}"}</span>
              <span className="text-[11px] font-bold text-bo-accent font-sans tracking-[0.04em]">
                {"\u03B2\u7248\u30C6\u30B9\u30BF\u30FC\u52DF\u96C6\u4E2D"}
              </span>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="text-[clamp(32px,7vw,52px)] font-extrabold font-serif leading-[1.25] tracking-[-0.03em] text-bo-ink mb-5">
              {"\u305D\u306E\u5316\u7CA7\u54C1\u3001"}
              <br />
              <span className="bg-gradient-to-br from-bo-accent to-[#5BBFAD] bg-clip-text text-transparent">
                {"\u6210\u5206\u3092\u77E5\u3063\u3066"}
              </span>
              <br />
              {"\u9078\u3093\u3067\u3044\u307E\u3059\u304B\uFF1F"}
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p className="text-[clamp(14px,2.5vw,17px)] text-bo-ink-muted leading-[1.8] max-w-[440px] mx-auto mb-9 font-sans">
              {"\u30D1\u30C3\u30B1\u30FC\u30B8\u3092\u64AE\u5F71\u3059\u308B\u3060\u3051\u3067AI\u304C\u89E3\u6790\u3002"}
              <br />
              {"\u3075\u3060\u3093\u4F7F\u3063\u3066\u3044\u308B\u30B3\u30B9\u30E1\u306E\u6210\u5206\u3092\u77E5\u308A\u3001"}
              <br />
              {"\u30B9\u30AD\u30F3\u30B1\u30A2\u306E\u53C2\u8003\u3084\u6C17\u3065\u304D\u306B\u3064\u306A\u3052\u308B\u30A2\u30D7\u30EA\u3067\u3059\u3002"}
              <br />
              {"\u73FE\u5728\u03B2\u7248\u3068\u3057\u3066\u9650\u5B9A\u516C\u958B\u4E2D\u3002"}
            </p>
          </Reveal>

          <Reveal delay={300}>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link
                href="/auth/login"
                className="px-8 py-3.5 rounded-[14px] bg-gradient-to-br from-bo-accent to-bo-accent-dark text-white text-[15px] font-bold font-sans shadow-bo-accent transition-transform hover:scale-105"
              >
                {"\u{1F4F8} \u03B2\u7248\u3092\u8A66\u3057\u3066\u307F\u308B"}
              </Link>
              <a
                href="#how-it-works"
                className="px-7 py-3.5 rounded-[14px] bg-white text-bo-ink-soft text-[15px] font-bold font-sans border-[1.5px] border-bo-parchment transition-transform hover:scale-105"
              >
                {"\u4F7F\u3044\u65B9\u3092\u898B\u308B \u2193"}
              </a>
            </div>
          </Reveal>

          {/* Phone mockup */}
          <Reveal delay={450}>
            <div className="mt-14 flex justify-center">
              <div className="w-[220px] rounded-[28px] overflow-hidden bg-white shadow-[0_20px_60px_rgba(27,38,32,0.1)] border border-bo-parchment p-3 pb-4 animate-landing-float">
                <div className="rounded-r2 overflow-hidden bg-bo-cream p-4 px-3.5">
                  <div className="text-[10px] font-black font-serif text-bo-ink mb-2.5">
                    HADAMI
                  </div>
                  {/* Mini scan card */}
                  <div className="bg-bo-accent-soft rounded-r1 p-3 px-2.5 flex items-center gap-2 mb-2">
                    <span className="text-base">{"\u{1F4F8}"}</span>
                    <div>
                      <div className="text-[9px] font-bold text-bo-ink">
                        {"\u6210\u5206\u3092\u30B9\u30AD\u30E3\u30F3"}
                      </div>
                      <div className="text-[7px] text-bo-ink-muted">
                        {"\u64AE\u5F71 \u2192 AI\u89E3\u6790"}
                      </div>
                    </div>
                  </div>
                  {/* Mini ingredient cards */}
                  <div className="grid grid-cols-3 gap-1">
                    {MOCKUP_ITEMS.map((item, i) => (
                      <div
                        key={i}
                        className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 border border-bo-parchment ${
                          i < 5
                            ? "bg-white"
                            : "bg-bo-parchment opacity-40"
                        }`}
                      >
                        <span className="text-[10px]">{item.ic}</span>
                        {i < 5 && (
                          <span className="text-[5px] text-[#D4A853]">
                            {"\u2605".repeat(item.r)}
                            {"\u2606".repeat(5 - item.r)}
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
      <section className="py-[60px] px-6 bg-white border-t border-b border-bo-parchment">
        <div className="max-w-[700px] mx-auto grid grid-cols-3 gap-6 text-center">
          {[
            { n: 323, suffix: "\u7A2E", label: "\u5BFE\u5FDC\u6210\u5206" },
            { n: 23, suffix: "\u54C1", label: "\u89E3\u6790\u6E08\u307F\u88FD\u54C1" },
            { n: 7, suffix: "\u7A2E", label: "\u5BFE\u5FDC\u30AB\u30C6\u30B4\u30EA" },
          ].map((s, i) => (
            <Reveal key={i} delay={i * 100}>
              <div className="text-[clamp(24px,5vw,36px)] font-black font-serif text-bo-accent leading-none">
                <AnimNum to={s.n} />
                {s.suffix}
              </div>
              <div className="text-[11px] text-bo-ink-muted font-sans mt-1.5">
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
              <h2 className="text-[clamp(22px,4.5vw,32px)] font-extrabold font-serif leading-[1.3]">
                {"3\u30B9\u30C6\u30C3\u30D7\u3067\u3001"}
                <br />
                {"\u6210\u5206\u304C\u308F\u304B\u308B"}
              </h2>
            </div>
          </Reveal>

          <div className="flex flex-col gap-5">
            {STEPS.map((s, i) => (
              <Reveal key={i} delay={i * 120}>
                <div className="flex gap-[18px] py-7 px-6 bg-white rounded-[20px] border border-bo-parchment shadow-[0_2px_12px_rgba(27,38,32,0.04)] items-start">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-[26px] shrink-0 ${s.bgClass}`}
                  >
                    {s.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1.5">
                      <span className="text-[11px] font-black text-bo-accent font-serif">
                        {s.step}
                      </span>
                      <span className="text-[17px] font-bold text-bo-ink font-sans">
                        {s.title}
                      </span>
                    </div>
                    <p className="text-[13px] text-bo-ink-muted leading-[1.75] font-sans">
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
      <section className="py-20 px-6 bg-gradient-to-b from-bo-parchment to-bo-cream">
        <div className="max-w-[700px] mx-auto">
          <Reveal>
            <div className="text-center mb-12">
              <p className="text-[11px] font-bold text-bo-accent tracking-[0.15em] uppercase mb-2">
                FEATURES
              </p>
              <h2 className="text-[clamp(22px,4.5vw,32px)] font-extrabold font-serif leading-[1.3]">
                {"HADAMI\u306B\u3067\u304D\u308B\u3053\u3068"}
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map((f, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="p-6 px-5 rounded-r2 bg-white border border-bo-parchment shadow-[0_2px_12px_rgba(27,38,32,0.03)] h-full">
                  <div className="w-11 h-11 rounded-[13px] bg-bo-accent-soft flex items-center justify-center text-xl mb-3.5">
                    {f.icon}
                  </div>
                  <div className="text-sm font-bold text-bo-ink font-sans mb-1.5">
                    {f.title}
                  </div>
                  <p className="text-xs text-bo-ink-muted leading-[1.7] font-sans">
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
              <h2 className="text-[clamp(22px,4.5vw,32px)] font-extrabold font-serif leading-[1.3]">
                {"\u3053\u3093\u306A\u98A8\u306B\u898B\u3048\u307E\u3059"}
              </h2>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="bg-white rounded-3xl overflow-hidden shadow-[0_12px_48px_rgba(27,38,32,0.08)] border border-bo-parchment">
              <div className="h-[3px] bg-gradient-to-r from-bo-accent via-[#5BBFAD] to-bo-safe" />
              <div className="p-6 px-[22px]">
                {/* Product */}
                <div className="mb-5">
                  <div className="text-[11px] text-bo-ink-muted tracking-[0.08em] uppercase">
                    anua
                  </div>
                  <div className="text-[17px] font-extrabold font-serif text-bo-ink leading-[1.3] mt-1">
                    HEARTLEAF 77+ HYALURON
                    <br />
                    SOOTHING TONER
                  </div>
                  <div className="flex gap-[5px] mt-2.5">
                    {["\u5316\u7CA7\u6C34", "\u93AE\u9759", "\u4FDD\u6E7F"].map((t, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-semibold text-bo-ink-soft bg-bo-parchment px-[9px] py-[3px] rounded-md"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Ingredients */}
                <div className="flex flex-col gap-1.5">
                  {SCAN_PREVIEW_INGREDIENTS.map((ing, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 py-2.5 px-3.5 rounded-r1 bg-bo-cream border border-bo-parchment"
                    >
                      <div className="flex-1">
                        <div className="text-xs font-bold text-bo-ink">
                          {ing.name}
                        </div>
                        <div className="text-[9px] text-bo-ink-muted">
                          {ing.cat}
                        </div>
                      </div>
                      <span className="text-[10px] text-[#D4A853] tracking-wide">
                        {"\u2605".repeat(ing.rarity)}
                        {"\u2606".repeat(5 - ing.rarity)}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-bo-ink-muted mt-3 leading-[1.5]">
                  {"\u203B \u89E3\u6790\u7D50\u679C\u306F\u53C2\u8003\u60C5\u5831\u3067\u3059\u3002\u6210\u5206\u306E\u7279\u5FB4\u3084\u6C17\u3065\u304D\u3068\u3057\u3066\u3054\u6D3B\u7528\u304F\u3060\u3055\u3044\u3002"}
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── BETA TESTER ─── */}
      <section className="py-20 px-6 bg-bo-parchment">
        <div className="max-w-[600px] mx-auto">
          <Reveal>
            <div className="text-center mb-10">
              <p className="text-[11px] font-bold text-bo-accent tracking-[0.15em] uppercase mb-2">
                BETA TESTERS WANTED
              </p>
              <h2 className="text-[clamp(22px,4.5vw,32px)] font-extrabold font-serif leading-[1.3]">
                {"\u4E00\u7DD2\u306B\u80B2\u3066\u3066\u304F\u308C\u308B"}
                <br />
                {"\u30C6\u30B9\u30BF\u30FC\u3092\u52DF\u96C6\u4E2D"}
              </h2>
            </div>
          </Reveal>

          <div className="flex flex-col gap-4">
            {BETA_ITEMS.map((v, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="flex gap-4 py-[22px] px-6 rounded-r2 bg-white border border-bo-ink-faint/30 shadow-[0_2px_12px_rgba(27,38,32,0.03)] items-start">
                  <span className="text-2xl shrink-0">{v.icon}</span>
                  <div>
                    <div className="text-sm font-bold text-bo-ink font-sans mb-1">
                      {v.title}
                    </div>
                    <p className="text-xs text-bo-ink-muted leading-[1.75] font-sans">
                      {v.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-[100px] px-6 bg-gradient-to-b from-bo-cream to-bo-accent-soft text-center">
        <Reveal>
          <div className="max-w-[480px] mx-auto">
            <div className="text-[40px] mb-5">{"\u{1F33F}"}</div>
            <h2 className="text-[clamp(24px,5vw,36px)] font-extrabold font-serif leading-[1.3] mb-4 text-bo-ink">
              {"\u6210\u5206\u3092\u77E5\u308B\u3053\u3068\u304C\u3001"}
              <br />
              {"\u3044\u3061\u3070\u3093\u306E\u30B9\u30AD\u30F3\u30B1\u30A2\u3002"}
            </h2>
            <p className="text-sm text-bo-ink-muted leading-[1.8] font-sans mb-9">
              {"\u7121\u6599\u306E\u03B2\u7248\u3092\u516C\u958B\u4E2D\u3067\u3059\u3002\u307E\u305A\u306F\u624B\u5143\u306E\u5316\u7CA7\u54C1\u3092\u30B9\u30AD\u30E3\u30F3\u3057\u3066\u307F\u3066\u304F\u3060\u3055\u3044\u3002"}
            </p>
            <Link
              href="/auth/login"
              className="inline-block px-10 py-4 rounded-2xl bg-gradient-to-br from-bo-accent to-bo-accent-dark text-white text-base font-bold font-sans shadow-bo-accent transition-transform hover:scale-105"
            >
              {"\u{1F4F8} \u03B2\u7248\u3092\u8A66\u3057\u3066\u307F\u308B"}
            </Link>
            <p className="text-[11px] text-bo-ink-faint mt-3.5 font-sans">
              {"\u73FE\u5728"}
              {scanLimit}
              {"\u56DE\u307E\u3067\u30B9\u30AD\u30E3\u30F3\u7121\u6599"}
            </p>
          </div>
        </Reveal>
      </section>

      {/* ─── PRODUCED BY ─── */}
      <section className="px-6 py-10 bg-bo-cream text-center">
        <Reveal>
          <div className="flex flex-col items-center gap-1.5">
            <div className="text-[9px] text-bo-ink-muted font-sans tracking-[0.15em] uppercase">
              Produced by
            </div>
            <div className="text-base font-extrabold font-serif text-bo-ink">
              {"みおのミハダノート"}
            </div>
            <a
              href="https://blog-engine.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-bo-accent font-sans mt-1"
            >
              {"ブログを読む"}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
              </svg>
            </a>
          </div>
        </Reveal>
      </section>

      {/* ─── DISCLAIMER ─── */}
      <div className="px-6 py-6 pb-7 bg-bo-ink border-b border-bo-ink-faint/10">
        <p className="max-w-[600px] mx-auto text-[10px] text-bo-ink-muted font-sans leading-[1.8] text-center">
          {"\u203B HADAMI\u306E\u89E3\u6790\u7D50\u679C\u306FAI\u306B\u3088\u308B\u53C2\u8003\u60C5\u5831\u3067\u3042\u308A\u3001\u533B\u5B66\u7684\u306A\u5224\u65AD\u3084\u5B89\u5168\u6027\u306E\u4FDD\u8A3C\u3092\u884C\u3046\u3082\u306E\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3002\u3059\u3079\u3066\u306E\u6210\u5206\u3092\u6B63\u78BA\u306B\u89E3\u6790\u3067\u304D\u308B\u3053\u3068\u3092\u4FDD\u8A3C\u3059\u308B\u3082\u306E\u3067\u3082\u3042\u308A\u307E\u305B\u3093\u3002\u808C\u30C8\u30E9\u30D6\u30EB\u304C\u6C17\u306B\u306A\u308B\u5834\u5408\u306F\u5C02\u9580\u306E\u533B\u7642\u6A5F\u95A2\u306B\u3054\u76F8\u8AC7\u304F\u3060\u3055\u3044\u3002"}
        </p>
      </div>

      {/* ─── FOOTER ─── */}
      <footer className="py-10 px-6 bg-bo-ink text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Image src="/hadami-logo.png" alt="HADAMI" width={24} height={24} className="rounded-[7px]" />
          <span className="text-sm font-extrabold font-serif text-bo-accent-soft">
            HADAMI
          </span>
        </div>
        <div className="text-[10px] text-bo-ink-muted font-sans mb-4">
          {"Produced by \u307F\u304A\u306E\u30DF\u30CF\u30C0\u30CE\u30FC\u30C8"}
        </div>
        <div className="flex justify-center gap-6 mb-5">
          <Link
            href="/terms"
            className="text-[11px] text-bo-ink-muted font-sans"
          >
            {"\u5229\u7528\u898F\u7D04"}
          </Link>
          <Link
            href="/privacy"
            className="text-[11px] text-bo-ink-muted font-sans"
          >
            {"\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC"}
          </Link>
          <a
            href="https://blog-engine.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-bo-ink-muted font-sans"
          >
            {"\u304A\u554F\u3044\u5408\u308F\u305B"}
          </a>
        </div>
        <p className="text-[10px] text-bo-ink-faint font-sans">
          &copy; 2026 HADAMI. All rights reserved.
        </p>
      </footer>

      {/* ─── BACK TO TOP ─── */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="ページトップへ戻る"
        className={`fixed bottom-6 right-5 z-[200] w-11 h-11 rounded-full bg-bo-ink text-bo-cream flex items-center justify-center shadow-lg transition-all duration-300 ${showTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </button>
    </div>
  );
}
