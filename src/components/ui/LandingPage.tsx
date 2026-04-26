"use client";

import "@/styles/hadami-tokens.css";
import { useState, useEffect, useRef, ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { getAccountScanLimit } from "@/lib/db";
import { Ico } from "@/components/redesign/apothecary/Icons";

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
}: {
  children: ReactNode;
  delay?: number;
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
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        filter: visible ? "blur(0)" : "blur(2px)",
        transition: `opacity 700ms cubic-bezier(0.22,0.61,0.36,1) ${delay}ms, transform 700ms cubic-bezier(0.22,0.61,0.36,1) ${delay}ms, filter 700ms ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

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
    desc: "AIが成分の特徴と★レアリティを表示。組み合わせの相性も読み解けます。",
  },
  {
    no: "03",
    en: "COMPOSE",
    title: "集める・組む",
    desc: "成分を図鑑にコレクトし、製品を朝・夜のルーティンとして管理。毎日のチェックも。",
  },
];

const FEATURES = [
  { en: "AI INGREDIENT SCAN",      title: "AI成分検索",            desc: "400種超の美容成分に対応。パッケージを撮影するだけでAIが商品を特定し、成分の特徴をお伝えします" },
  { en: "COMPENDIUM · ★RARITY",     title: "成分図鑑＋★レアリティ", desc: "見つけた成分をコレクト。出現頻度に応じた★1〜★4のレアリティ付き。コンプリートを目指そう" },
  { en: "ROUTINE COMPOSE",          title: "スキンケアルーティン",  desc: "お気に入り製品をルーティンに並べ朝・夜のルーティンを管理。カバー率や相乗効果の分析、シェアも" },
  { en: "AM / PM RITUAL",           title: "朝夜ルーティンチェック", desc: "ルーティンに登録した製品が毎日のチェックリストに。進捗リングで達成度をひと目で確認" },
  { en: "DISCOVERY",                title: "おすすめ商品レコメンド", desc: "スキャン履歴から成分傾向を分析し、まだ出会っていない成分を含む商品をおすすめ" },
  { en: "PERSONAL COLLECTION",      title: "マイコスメ写真管理",     desc: "スキャンした製品を写真グリッドで一覧管理。お気に入り・カテゴリで絞り込み。ダークモード対応" },
];

const SCAN_PREVIEW_INGREDIENTS = [
  { name: "パンテノール",       en: "Panthenol",        cat: "ビタミン",    rarity: 1 },
  { name: "ツボクサエキス",     en: "Centella Asiatica",cat: "ボタニカル",  rarity: 2 },
  { name: "ヒアルロン酸Na",     en: "Sodium Hyaluronate", cat: "うるおい",  rarity: 1 },
];

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
    <div
      className="hd-root hd-softa"
      data-density="compact"
      style={{ overflowX: "hidden" }}
    >
      <div
        className="hd"
        style={{
          minHeight: "100vh",
          background: "var(--hd-bg)",
          color: "var(--hd-ink)",
        }}
      >
        {/* ── NAV ── */}
        <nav
          ref={navRef}
          data-scrolled="false"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            transition: "background 350ms ease, border-color 350ms ease, backdrop-filter 350ms ease",
          }}
          className="hd-nav"
        >
          <div
            style={{
              maxWidth: 960,
              margin: "0 auto",
              padding: "14px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Image src="/hadami-logo.png" alt="HADAMI" width={28} height={28} style={{ borderRadius: 6 }} />
              <span
                className="hd-serif"
                style={{ fontSize: 18, letterSpacing: "0.06em", fontStyle: "italic" }}
              >
                HADAMI
              </span>
            </div>
            <Link
              href="/auth/invite"
              style={{
                padding: "8px 16px",
                background: "var(--hd-ink)",
                color: "var(--hd-bg)",
                fontFamily: "var(--hd-mono)",
                fontSize: 10,
                letterSpacing: "0.2em",
                textDecoration: "none",
              }}
            >
              START — 無料
            </Link>
          </div>
        </nav>

        <style>{`
          .hd-nav[data-scrolled="true"] {
            background: oklch(0.97 0.008 85 / 0.92);
            backdrop-filter: blur(20px) saturate(1.4);
            border-bottom: 1px solid var(--hd-hair);
          }
        `}</style>

        {/* ── HERO ── */}
        <section
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "140px 24px 80px",
            position: "relative",
          }}
        >
          <div style={{ position: "relative", maxWidth: 640, textAlign: "center", zIndex: 1 }}>
            <Reveal>
              <div
                className="hd-mono hd-caps"
                style={{
                  color: "var(--hd-ink-40)",
                  marginBottom: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 14,
                }}
              >
                <span>CLOSED BETA</span>
                <span style={{ width: 24, height: 1, background: "var(--hd-ink-40)" }} />
                <span>美容成分の図鑑</span>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <h1
                className="hd-serif"
                style={{
                  fontSize: "clamp(36px, 8vw, 60px)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.025em",
                  marginBottom: 24,
                }}
              >
                成分から、<br />
                <span style={{ fontStyle: "italic", color: "var(--hd-moss)" }}>
                  美しさを選ぶ。
                </span>
              </h1>
            </Reveal>

            <Reveal delay={220}>
              <p
                style={{
                  fontFamily: "var(--hd-sans)",
                  fontSize: "clamp(14px, 2.4vw, 16px)",
                  lineHeight: 1.85,
                  color: "var(--hd-ink-60)",
                  maxWidth: 460,
                  margin: "0 auto 36px",
                }}
              >
                パッケージを撮影するだけでAIが成分を検索。
                <br />
                図鑑に集めて、ルーティンに組んで、
                <br />
                毎日のスキンケアを成分から見直せるアプリ。
              </p>
            </Reveal>

            <Reveal delay={320}>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  justifyContent: "center",
                  flexWrap: "wrap",
                  marginBottom: 18,
                }}
              >
                <Link
                  href="/auth/invite"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "14px 28px",
                    background: "var(--hd-ink)",
                    color: "var(--hd-bg)",
                    textDecoration: "none",
                    fontFamily: "var(--hd-sans)",
                    fontSize: 14,
                  }}
                >
                  {Ico.camera({ width: 16, height: 16 })}
                  <span>無料で始める</span>
                  <span
                    className="hd-mono"
                    style={{ fontSize: 9, letterSpacing: "0.2em", opacity: 0.7 }}
                  >
                    START →
                  </span>
                </Link>
                <a
                  href="#how-it-works"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "14px 24px",
                    background: "transparent",
                    color: "var(--hd-ink)",
                    border: "1px solid var(--hd-ink)",
                    textDecoration: "none",
                    fontFamily: "var(--hd-sans)",
                    fontSize: 14,
                  }}
                >
                  <span>使い方を見る</span>
                  <span style={{ fontSize: 11 }}>↓</span>
                </a>
              </div>
              <p
                style={{
                  fontFamily: "var(--hd-sans)",
                  fontSize: 12,
                  color: "var(--hd-ink-60)",
                  marginTop: 14,
                }}
              >
                招待コードは{" "}
                <a
                  href="https://x.com/miomio_beauty"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--hd-moss)", textDecoration: "underline", textUnderlineOffset: 3 }}
                >
                  X（@miomio_beauty）
                </a>
                {" "}にDMで気軽にどうぞ
              </p>
            </Reveal>
          </div>
        </section>

        {/* ── SOCIAL PROOF (stats trio) ── */}
        <section
          style={{
            padding: "48px 24px",
            borderTop: "1px solid var(--hd-hair)",
            borderBottom: "1px solid var(--hd-hair)",
          }}
        >
          <div
            style={{
              maxWidth: 720,
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
            }}
          >
            {[
              { n: 400, suffix: "種+", en: "INGREDIENTS",   label: "美容成分" },
              { n: 12,  suffix: "種",  en: "CATEGORIES",    label: "コスメカテゴリ" },
              { n: 6,   suffix: "軸",  en: "EFFECT TARGETS",label: "効果カテゴリ" },
            ].map((s, i) => (
              <Reveal key={i} delay={i * 100}>
                <div
                  style={{
                    padding: "0 12px",
                    textAlign: "center",
                    borderLeft: i > 0 ? "1px solid var(--hd-hair)" : "none",
                  }}
                >
                  <div
                    className="hd-serif"
                    style={{ fontSize: "clamp(28px, 5.5vw, 40px)", lineHeight: 1, letterSpacing: "-0.02em" }}
                  >
                    <AnimNum to={s.n} />
                    <span style={{ fontSize: "0.5em", marginLeft: 2 }}>{s.suffix}</span>
                  </div>
                  <div
                    className="hd-mono hd-caps"
                    style={{ color: "var(--hd-ink-40)", marginTop: 10 }}
                  >
                    {s.en}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--hd-sans)",
                      fontSize: 11,
                      color: "var(--hd-ink-60)",
                      marginTop: 4,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" style={{ padding: "96px 24px 64px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <Reveal>
              <div style={{ textAlign: "center", marginBottom: 56 }}>
                <div
                  className="hd-mono hd-caps"
                  style={{ color: "var(--hd-ink-40)", marginBottom: 12 }}
                >
                  HOW IT WORKS · 使い方
                </div>
                <h2
                  className="hd-serif"
                  style={{ fontSize: "clamp(24px, 5vw, 36px)", lineHeight: 1.2, letterSpacing: "-0.02em" }}
                >
                  3ステップで、<br />
                  <span style={{ fontStyle: "italic" }}>成分がわかる。</span>
                </h2>
              </div>
            </Reveal>

            <div>
              {STEPS.map((s, i) => (
                <Reveal key={i} delay={i * 120}>
                  <div
                    style={{
                      display: "flex",
                      gap: 20,
                      padding: "28px 4px",
                      borderTop: i === 0 ? "1px solid var(--hd-ink)" : "1px solid var(--hd-hair)",
                      borderBottom: i === STEPS.length - 1 ? "1px solid var(--hd-ink)" : "none",
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      className="hd-mono"
                      style={{
                        width: 40,
                        flexShrink: 0,
                        fontSize: 11,
                        color: "var(--hd-ink-40)",
                        letterSpacing: "0.15em",
                      }}
                    >
                      {s.no}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        className="hd-mono hd-caps"
                        style={{ color: "var(--hd-ink-40)", marginBottom: 6 }}
                      >
                        {s.en}
                      </div>
                      <div
                        className="hd-serif"
                        style={{ fontSize: 22, letterSpacing: "-0.01em", marginBottom: 10 }}
                      >
                        {s.title}
                      </div>
                      <p
                        style={{
                          fontFamily: "var(--hd-sans)",
                          fontSize: 13,
                          lineHeight: 1.8,
                          color: "var(--hd-ink-60)",
                          margin: 0,
                        }}
                      >
                        {s.desc}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section
          style={{
            padding: "80px 24px",
            background: "var(--hd-surface)",
            borderTop: "1px solid var(--hd-hair)",
            borderBottom: "1px solid var(--hd-hair)",
          }}
        >
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <Reveal>
              <div style={{ textAlign: "center", marginBottom: 48 }}>
                <div
                  className="hd-mono hd-caps"
                  style={{ color: "var(--hd-ink-40)", marginBottom: 12 }}
                >
                  FEATURES · 機能
                </div>
                <h2
                  className="hd-serif"
                  style={{ fontSize: "clamp(24px, 5vw, 36px)", lineHeight: 1.2, letterSpacing: "-0.02em" }}
                >
                  HADAMIにできること。
                </h2>
              </div>
            </Reveal>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 0,
                border: "1px solid var(--hd-hair)",
                background: "var(--hd-bg)",
              }}
            >
              {FEATURES.map((f, i) => (
                <Reveal key={i} delay={(i % 3) * 80}>
                  <div
                    style={{
                      padding: "24px 22px",
                      borderRight: "1px solid var(--hd-hair)",
                      borderBottom: "1px solid var(--hd-hair)",
                      height: "100%",
                    }}
                  >
                    <div
                      className="hd-mono hd-caps"
                      style={{ color: "var(--hd-ink-40)", marginBottom: 8 }}
                    >
                      No. {String(i + 1).padStart(2, "0")} · {f.en}
                    </div>
                    <div
                      className="hd-serif"
                      style={{ fontSize: 17, lineHeight: 1.3, marginBottom: 8 }}
                    >
                      {f.title}
                    </div>
                    <p
                      style={{
                        fontFamily: "var(--hd-sans)",
                        fontSize: 12,
                        lineHeight: 1.7,
                        color: "var(--hd-ink-60)",
                        margin: 0,
                      }}
                    >
                      {f.desc}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── SCAN PREVIEW ── */}
        <section style={{ padding: "80px 24px" }}>
          <div style={{ maxWidth: 540, margin: "0 auto" }}>
            <Reveal>
              <div style={{ textAlign: "center", marginBottom: 40 }}>
                <div
                  className="hd-mono hd-caps"
                  style={{ color: "var(--hd-ink-40)", marginBottom: 12 }}
                >
                  SCAN PREVIEW · プレビュー
                </div>
                <h2
                  className="hd-serif"
                  style={{ fontSize: "clamp(22px, 4.5vw, 32px)", lineHeight: 1.2, letterSpacing: "-0.02em" }}
                >
                  こんな風に見えます。
                </h2>
              </div>
            </Reveal>

            <Reveal delay={150}>
              <div
                style={{
                  background: "var(--hd-surface)",
                  border: "1px solid var(--hd-ink)",
                  padding: 24,
                }}
              >
                <div style={{ marginBottom: 22 }}>
                  <div
                    className="hd-mono hd-caps"
                    style={{ color: "var(--hd-ink-40)" }}
                  >
                    BRAND · anua
                  </div>
                  <div
                    className="hd-serif"
                    style={{
                      fontSize: 19,
                      lineHeight: 1.3,
                      letterSpacing: "-0.01em",
                      marginTop: 6,
                    }}
                  >
                    HEARTLEAF 77+ HYALURON<br />
                    SOOTHING TONER
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                    {["化粧水", "鎮静", "保湿"].map((t) => (
                      <span
                        key={t}
                        style={{
                          fontFamily: "var(--hd-sans)",
                          fontSize: 10,
                          padding: "3px 10px",
                          border: "1px solid var(--hd-line)",
                          color: "var(--hd-ink-60)",
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    borderTop: "1px solid var(--hd-hair)",
                    paddingTop: 16,
                  }}
                >
                  <div
                    className="hd-mono hd-caps"
                    style={{ color: "var(--hd-ink-40)", marginBottom: 10 }}
                  >
                    Detected · 検出された成分
                  </div>
                  {SCAN_PREVIEW_INGREDIENTS.map((ing, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "14px 0",
                        borderBottom:
                          i < SCAN_PREVIEW_INGREDIENTS.length - 1
                            ? "1px solid var(--hd-hair)"
                            : "none",
                      }}
                    >
                      <div className="hd-mono" style={{ width: 22, fontSize: 9, color: "var(--hd-ink-40)" }}>
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="hd-serif" style={{ fontSize: 14, letterSpacing: "-0.01em" }}>
                          {ing.name}
                        </div>
                        <div className="hd-mono hd-caps" style={{ color: "var(--hd-ink-40)", marginTop: 2 }}>
                          {ing.en} · {ing.cat}
                        </div>
                      </div>
                      <span
                        style={{
                          fontFamily: "var(--hd-mono)",
                          fontSize: 11,
                          color: "var(--hd-ink-60)",
                          letterSpacing: "0.1em",
                        }}
                      >
                        {"★".repeat(ing.rarity)}
                        <span style={{ opacity: 0.3 }}>{"★".repeat(4 - ing.rarity)}</span>
                      </span>
                    </div>
                  ))}
                </div>
                <p
                  style={{
                    fontFamily: "var(--hd-sans)",
                    fontSize: 10,
                    color: "var(--hd-ink-40)",
                    marginTop: 16,
                    lineHeight: 1.6,
                    marginBottom: 0,
                  }}
                >
                  ※ 検索結果はAIによる参考情報です。成分の特徴や気づきとしてご活用ください。
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section
          style={{
            padding: "112px 24px",
            textAlign: "center",
            background: "var(--hd-surface-2)",
            borderTop: "1px solid var(--hd-hair)",
          }}
        >
          <Reveal>
            <div style={{ maxWidth: 520, margin: "0 auto" }}>
              <div
                className="hd-mono hd-caps"
                style={{ color: "var(--hd-ink-40)", marginBottom: 18 }}
              >
                Begin · 始める
              </div>
              <h2
                className="hd-serif"
                style={{
                  fontSize: "clamp(26px, 5.5vw, 40px)",
                  lineHeight: 1.25,
                  letterSpacing: "-0.02em",
                  marginBottom: 18,
                }}
              >
                成分を知ることが、<br />
                <span style={{ fontStyle: "italic", color: "var(--hd-moss)" }}>
                  いちばんのスキンケア。
                </span>
              </h2>
              <p
                style={{
                  fontFamily: "var(--hd-sans)",
                  fontSize: 14,
                  lineHeight: 1.85,
                  color: "var(--hd-ink-60)",
                  marginBottom: 36,
                }}
              >
                無料で使えます。まずは手元の化粧品をスキャンしてみてください。
              </p>
              <Link
                href="/auth/invite"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "16px 36px",
                  background: "var(--hd-ink)",
                  color: "var(--hd-bg)",
                  textDecoration: "none",
                  fontFamily: "var(--hd-sans)",
                  fontSize: 15,
                }}
              >
                {Ico.camera({ width: 18, height: 18 })}
                <span>無料で始める</span>
                <span className="hd-mono" style={{ fontSize: 9, letterSpacing: "0.22em", opacity: 0.7 }}>
                  START →
                </span>
              </Link>
              <p
                style={{
                  fontFamily: "var(--hd-mono)",
                  fontSize: 10,
                  letterSpacing: "0.16em",
                  color: "var(--hd-ink-40)",
                  marginTop: 16,
                }}
              >
                月 {scanLimit} 回までスキャン無料
              </p>
              <p
                style={{
                  fontFamily: "var(--hd-sans)",
                  fontSize: 12,
                  color: "var(--hd-ink-60)",
                  marginTop: 10,
                }}
              >
                招待コードのご希望は{" "}
                <a
                  href="https://x.com/miomio_beauty"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--hd-moss)", textDecoration: "underline", textUnderlineOffset: 3 }}
                >
                  X（@miomio_beauty）
                </a>
                {" "}にDMください
              </p>
            </div>
          </Reveal>
        </section>

        {/* ── DISCLAIMER ── */}
        <div
          style={{
            padding: "28px 24px",
            background: "var(--hd-bg)",
            borderTop: "1px solid var(--hd-hair)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              maxWidth: 600,
              margin: "0 auto",
              fontSize: 10,
              fontFamily: "var(--hd-sans)",
              lineHeight: 1.85,
              color: "var(--hd-ink-40)",
            }}
          >
            ※ HADAMIの検索結果はAIによる参考情報であり、医学的な判断や安全性の保証を行うものではありません。すべての成分を正確に検索できることを保証するものでもありません。肌トラブルが気になる場合は専門の医療機関にご相談ください。
          </p>
        </div>

        {/* ── FOOTER ── */}
        <footer
          style={{
            padding: "48px 24px 56px",
            background: "var(--hd-ink)",
            color: "var(--hd-bg)",
            textAlign: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16 }}>
            <Image src="/hadami-logo.png" alt="HADAMI" width={22} height={22} style={{ borderRadius: 5 }} />
            <span
              className="hd-serif"
              style={{ fontSize: 16, letterSpacing: "0.06em", fontStyle: "italic" }}
            >
              HADAMI
            </span>
          </div>
          <div
            className="hd-mono hd-caps"
            style={{ opacity: 0.55, marginBottom: 14 }}
          >
            Produced by
          </div>
          <a
            href="https://blog-engine.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hd-serif"
            style={{
              fontSize: 14,
              fontStyle: "italic",
              color: "var(--hd-bg)",
              textDecoration: "underline",
              textUnderlineOffset: 4,
            }}
          >
            みおのミハダノート
          </a>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 28,
              marginTop: 28,
              marginBottom: 20,
            }}
          >
            <Link
              href="/terms"
              className="hd-mono hd-caps"
              style={{ color: "var(--hd-bg)", opacity: 0.65, textDecoration: "none" }}
            >
              Terms · 利用規約
            </Link>
            <Link
              href="/privacy"
              className="hd-mono hd-caps"
              style={{ color: "var(--hd-bg)", opacity: 0.65, textDecoration: "none" }}
            >
              Privacy · プライバシー
            </Link>
            <a
              href="mailto:miomio30beauty@gmail.com"
              className="hd-mono hd-caps"
              style={{ color: "var(--hd-bg)", opacity: 0.65, textDecoration: "none" }}
            >
              Contact
            </a>
          </div>
          <p
            className="hd-mono"
            style={{ fontSize: 9, opacity: 0.45, letterSpacing: "0.15em" }}
          >
            &copy; 2026 HADAMI. All rights reserved.
          </p>
        </footer>

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
            background: "var(--hd-ink)",
            color: "var(--hd-bg)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 6px 20px oklch(0.3 0.03 90 / 0.25)",
            opacity: showTop ? 1 : 0,
            transform: showTop ? "translateY(0)" : "translateY(16px)",
            pointerEvents: showTop ? "auto" : "none",
            transition: "opacity 300ms ease, transform 300ms ease",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
