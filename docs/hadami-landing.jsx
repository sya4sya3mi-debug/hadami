import { useState, useEffect, useRef } from "react";

// ─── Fonts ───
const fontLink = document.createElement("link");
fontLink.href =
  "https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700;900&family=Shippori+Mincho:wght@400;600;800&display=swap";
fontLink.rel = "stylesheet";
if (!document.querySelector(`link[href="${fontLink.href}"]`)) {
  document.head.appendChild(fontLink);
}

// ─── Tokens (matching app green theme) ───
const T = {
  ink: "#1B2620",
  inkSoft: "#3D4F45",
  inkMuted: "#7E9389",
  inkFaint: "#B5C7BE",
  cream: "#F4F9F6",
  parchment: "#E8F0EC",
  cardSolid: "#FFFFFF",
  accent: "#3A8F7A",
  accentDark: "#2B7464",
  accentSoft: "#D6EDE6",
  accentGlow: "rgba(58,143,122,0.14)",
  safe: "#4A9B7F",
  caution: "#C49032",
  danger: "#C05050",
  serif: "'Shippori Mincho', serif",
  sans: "'Zen Kaku Gothic New', sans-serif",
};

// ─── Animated Number ───
function AnimNum({ to, dur = 1200 }) {
  const [v, setV] = useState(0);
  const ref = useRef();
  const elRef = useRef();
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setStarted(true); obs.disconnect(); }
    }, { threshold: 0.3 });
    if (elRef.current) obs.observe(elRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let s;
    const step = (t) => {
      if (!s) s = t;
      const p = Math.min((t - s) / dur, 1);
      setV(Math.round(p * p * to));
      if (p < 1) ref.current = requestAnimationFrame(step);
    };
    ref.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(ref.current);
  }, [started, to, dur]);

  return <span ref={elRef}>{v.toLocaleString()}</span>;
}

// ─── Scroll-reveal wrapper ───
function Reveal({ children, delay = 0, style }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(28px)",
      transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════
export default function HADAMILanding() {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const h = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <div style={{ background: T.cream, fontFamily: T.sans, color: T.ink, overflowX: "hidden" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        html { scroll-behavior: smooth; }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        button { cursor: pointer; border: none; font-family: inherit; }
        a { text-decoration: none; color: inherit; }
      `}</style>

      {/* ─── NAV ─── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrollY > 40 ? "rgba(244,249,246,0.9)" : "transparent",
        backdropFilter: scrollY > 40 ? "blur(20px) saturate(1.6)" : "none",
        WebkitBackdropFilter: scrollY > 40 ? "blur(20px) saturate(1.6)" : "none",
        borderBottom: scrollY > 40 ? `1px solid rgba(181,199,190,0.2)` : "1px solid transparent",
        transition: "all 0.35s ease",
      }}>
        <div style={{
          maxWidth: 960, margin: "0 auto", padding: "14px 24px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: `linear-gradient(135deg, ${T.accent}, ${T.accentDark})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 13, fontWeight: 900, fontFamily: T.sans,
            }}>H</div>
            <span style={{ fontSize: 16, fontWeight: 900, fontFamily: T.serif, color: T.ink, letterSpacing: "-0.02em" }}>HADAMI</span>
          </div>
          <button style={{
            padding: "8px 20px", borderRadius: 10,
            background: T.accent, color: "#fff",
            fontSize: 12, fontWeight: 700, fontFamily: T.sans,
            boxShadow: `0 4px 16px ${T.accentGlow}`,
            transition: "transform 0.2s",
          }}>
            β版を試す
          </button>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section style={{
        position: "relative", minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "120px 24px 80px", overflow: "hidden",
      }}>
        {/* Background orbs */}
        <div style={{
          position: "absolute", top: "10%", left: "-5%", width: 400, height: 400,
          borderRadius: "50%", background: "radial-gradient(circle, rgba(58,143,122,0.08) 0%, transparent 70%)",
          filter: "blur(40px)", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "5%", right: "-8%", width: 350, height: 350,
          borderRadius: "50%", background: "radial-gradient(circle, rgba(91,191,173,0.06) 0%, transparent 70%)",
          filter: "blur(40px)", pointerEvents: "none",
        }} />

        <div style={{ position: "relative", maxWidth: 600, textAlign: "center", zIndex: 1 }}>
          <Reveal>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: T.accentSoft, borderRadius: 20, padding: "6px 16px",
              marginBottom: 28,
            }}>
              <span style={{ fontSize: 12 }}>🌿</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.accent, fontFamily: T.sans, letterSpacing: "0.04em" }}>
                β版テスター募集中
              </span>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <h1 style={{
              fontSize: "clamp(32px, 7vw, 52px)", fontWeight: 800, fontFamily: T.serif,
              lineHeight: 1.25, letterSpacing: "-0.03em", color: T.ink,
              marginBottom: 20,
            }}>
              その化粧品、<br/>
              <span style={{
                background: `linear-gradient(135deg, ${T.accent}, #5BBFAD)`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                成分を知って
              </span>
              <br/>選んでいますか？
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p style={{
              fontSize: "clamp(14px, 2.5vw, 17px)", color: T.inkMuted, lineHeight: 1.8,
              maxWidth: 440, margin: "0 auto 36px", fontFamily: T.sans,
            }}>
              パッケージを撮影するだけでAIが解析。<br/>
              ふだん使っているコスメの成分を知り、<br/>
              スキンケアの参考や気づきにつなげるアプリです。<br/>
              現在β版として限定公開中。
            </p>
          </Reveal>

          <Reveal delay={300}>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button style={{
                padding: "14px 32px", borderRadius: 14,
                background: `linear-gradient(135deg, ${T.accent}, ${T.accentDark})`,
                color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: T.sans,
                boxShadow: `0 8px 32px ${T.accentGlow}`,
                transition: "transform 0.2s, box-shadow 0.2s",
              }}>
                📸 β版を試してみる
              </button>
              <button style={{
                padding: "14px 28px", borderRadius: 14,
                background: T.cardSolid, color: T.inkSoft,
                fontSize: 15, fontWeight: 700, fontFamily: T.sans,
                border: `1.5px solid ${T.parchment}`,
                transition: "transform 0.2s",
              }}>
                使い方を見る ↓
              </button>
            </div>
          </Reveal>

          {/* Phone mockup hint */}
          <Reveal delay={450}>
            <div style={{
              marginTop: 56, display: "flex", justifyContent: "center",
            }}>
              <div style={{
                width: 220, borderRadius: 28, overflow: "hidden",
                background: T.cardSolid, boxShadow: `0 20px 60px rgba(27,38,32,0.1)`,
                border: `1px solid ${T.parchment}`,
                padding: "12px 12px 16px", animation: "float 4s ease-in-out infinite",
              }}>
                {/* Mini app preview */}
                <div style={{ borderRadius: 18, overflow: "hidden", background: T.cream, padding: "16px 14px" }}>
                  <div style={{ fontSize: 10, fontWeight: 900, fontFamily: T.serif, color: T.ink, marginBottom: 10 }}>HADAMI</div>
                  {/* Mini scan card */}
                  <div style={{
                    background: T.accentSoft, borderRadius: 12, padding: "12px 10px",
                    display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
                  }}>
                    <span style={{ fontSize: 16 }}>📸</span>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: T.ink }}>成分をスキャン</div>
                      <div style={{ fontSize: 7, color: T.inkMuted }}>撮影 → AI解析</div>
                    </div>
                  </div>
                  {/* Mini ingredient cards with rarity */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
                    {[{ic:"💧",r:1},{ic:"✨",r:3},{ic:"🌿",r:2},{ic:"🔬",r:4},{ic:"🍊",r:1},{ic:"🔒",r:0}].map((item, i) => (
                      <div key={i} style={{
                        aspectRatio: "1", borderRadius: 8,
                        background: i < 5 ? T.cardSolid : T.parchment,
                        border: `1px solid ${T.parchment}`,
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        gap: 1, opacity: i === 5 ? 0.4 : 1,
                      }}>
                        <span style={{ fontSize: 10 }}>{item.ic}</span>
                        {i < 5 && <span style={{ fontSize: 5, color: "#D4A853" }}>{"★".repeat(item.r)}{"☆".repeat(5-item.r)}</span>}
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
      <section style={{
        padding: "60px 24px", background: T.cardSolid,
        borderTop: `1px solid ${T.parchment}`, borderBottom: `1px solid ${T.parchment}`,
      }}>
        <div style={{
          maxWidth: 700, margin: "0 auto",
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, textAlign: "center",
        }}>
          {[
            { n: 323, suffix: "種", label: "対応成分" },
            { n: 23, suffix: "品", label: "解析済み製品" },
            { n: 7, suffix: "種", label: "対応カテゴリ" },
          ].map((s, i) => (
            <Reveal key={i} delay={i * 100}>
              <div style={{ fontSize: "clamp(24px, 5vw, 36px)", fontWeight: 900, fontFamily: T.serif, color: T.accent, lineHeight: 1 }}>
                <AnimNum to={s.n} />{s.suffix}
              </div>
              <div style={{ fontSize: 11, color: T.inkMuted, fontFamily: T.sans, marginTop: 6 }}>{s.label}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: T.accent, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>HOW IT WORKS</p>
              <h2 style={{ fontSize: "clamp(22px, 4.5vw, 32px)", fontWeight: 800, fontFamily: T.serif, lineHeight: 1.3 }}>
                3ステップで、<br/>成分がわかる
              </h2>
            </div>
          </Reveal>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {[
              { step: "01", icon: "📸", title: "撮る", desc: "コスメのパッケージにカメラを向けるだけ。AIが商品を特定し、ネットから成分情報を自動で取得します。", color: "#E3F0EC" },
              { step: "02", icon: "🔍", title: "知る", desc: "AIが成分を参考情報として解析。★レアリティで出現頻度もわかります。すべての成分の解析を保証するものではありません。", color: "#FFF3DC" },
              { step: "03", icon: "✨", title: "集める・組む", desc: "成分を図鑑にコレクトし、製品をデッキとして管理。成分から製品を逆引きしたり、ルーティンの相乗効果を確認できます。", color: "#EDE3F0" },
            ].map((s, i) => (
              <Reveal key={i} delay={i * 120}>
                <div style={{
                  display: "flex", gap: 18, padding: "28px 24px",
                  background: T.cardSolid, borderRadius: 20,
                  border: `1px solid ${T.parchment}`,
                  boxShadow: "0 2px 12px rgba(27,38,32,0.04)",
                  alignItems: "flex-start",
                }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: s.color, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 26, flexShrink: 0,
                  }}>{s.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 900, color: T.accent, fontFamily: T.serif }}>{s.step}</span>
                      <span style={{ fontSize: 17, fontWeight: 700, color: T.ink, fontFamily: T.sans }}>{s.title}</span>
                    </div>
                    <p style={{ fontSize: 13, color: T.inkMuted, lineHeight: 1.75, fontFamily: T.sans }}>{s.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section style={{
        padding: "80px 24px",
        background: `linear-gradient(180deg, ${T.parchment} 0%, ${T.cream} 100%)`,
      }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: T.accent, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>FEATURES</p>
              <h2 style={{ fontSize: "clamp(22px, 4.5vw, 32px)", fontWeight: 800, fontFamily: T.serif, lineHeight: 1.3 }}>
                HADAMIにできること
              </h2>
            </div>
          </Reveal>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            {[
              { icon: "🧪", title: "成分AI解析", desc: "323種の成分に対応。パッケージを撮影するだけでAIが商品を特定し、成分の特徴を参考情報としてお伝えします" },
              { icon: "📖", title: "成分図鑑＋★レアリティ", desc: "見つけた成分をコレクト。出現頻度に応じた★1〜★5のレアリティ付き。コンプリートを目指そう" },
              { icon: "🔗", title: "成分→製品リンク", desc: "図鑑で成分をタップすると、その成分を含む保存済みコスメを一覧で確認できます" },
              { icon: "🃏", title: "スキンケアデッキ", desc: "お気に入り製品を手札風に並べてルーティンを管理。カテゴリカバー率や相乗効果も分析" },
              { icon: "📸", title: "Myコスメ写真管理", desc: "スキャンした製品を写真グリッドで一覧管理。お気に入り・カテゴリで絞り込み" },
              { icon: "🐦", title: "Xでシェア", desc: "お気に入りのコスメをキャプチャ画像付きでワンタップでXに投稿" },
            ].map((f, i) => (
              <Reveal key={i} delay={i * 80}>
                <div style={{
                  padding: "24px 20px", borderRadius: 18,
                  background: T.cardSolid, border: `1px solid ${T.parchment}`,
                  boxShadow: "0 2px 12px rgba(27,38,32,0.03)",
                  height: "100%",
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 13,
                    background: T.accentSoft, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20, marginBottom: 14,
                  }}>{f.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, fontFamily: T.sans, marginBottom: 6 }}>{f.title}</div>
                  <p style={{ fontSize: 12, color: T.inkMuted, lineHeight: 1.7, fontFamily: T.sans }}>{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DEMO: Scan Result Preview ─── */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: T.accent, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>SCAN PREVIEW</p>
              <h2 style={{ fontSize: "clamp(22px, 4.5vw, 32px)", fontWeight: 800, fontFamily: T.serif, lineHeight: 1.3 }}>
                こんな風に見えます
              </h2>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div style={{
              background: T.cardSolid, borderRadius: 24, overflow: "hidden",
              boxShadow: "0 12px 48px rgba(27,38,32,0.08)",
              border: `1px solid ${T.parchment}`,
            }}>
              <div style={{ height: 3, background: `linear-gradient(90deg, ${T.accent}, #5BBFAD, ${T.safe})` }} />
              <div style={{ padding: "24px 22px" }}>
                {/* Product */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: T.inkMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>anua</div>
                  <div style={{ fontSize: 17, fontWeight: 800, fontFamily: T.serif, color: T.ink, lineHeight: 1.3, marginTop: 4 }}>HEARTLEAF 77+ HYALURON<br/>SOOTHING TONER</div>
                  <div style={{ display: "flex", gap: 5, marginTop: 10 }}>
                    {["化粧水","鎮静","保湿"].map((t,i) => (
                      <span key={i} style={{ fontSize: 10, fontWeight: 600, color: T.inkSoft, background: T.parchment, padding: "3px 9px", borderRadius: 6 }}>{t}</span>
                    ))}
                  </div>
                </div>

                {/* Ingredients preview with rarity */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    { name: "パンテノール", cat: "修復", rarity: 1 },
                    { name: "ツボクサエキス", cat: "鎮静", rarity: 3 },
                    { name: "ヒアルロン酸Na", cat: "保湿", rarity: 1 },
                  ].map((ing, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                      borderRadius: 12, background: T.cream,
                      border: `1px solid ${T.parchment}`,
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.ink }}>{ing.name}</div>
                        <div style={{ fontSize: 9, color: T.inkMuted }}>{ing.cat}</div>
                      </div>
                      <span style={{ fontSize: 10, color: "#D4A853", letterSpacing: 0.5 }}>{"★".repeat(ing.rarity)}{"☆".repeat(5-ing.rarity)}</span>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 9, color: T.inkMuted, marginTop: 12, lineHeight: 1.5 }}>※ 解析結果は参考情報です。成分の特徴や気づきとしてご活用ください。</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── BETA TESTER RECRUIT ─── */}
      <section style={{ padding: "80px 24px", background: T.parchment }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: T.accent, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>BETA TESTERS WANTED</p>
              <h2 style={{ fontSize: "clamp(22px, 4.5vw, 32px)", fontWeight: 800, fontFamily: T.serif, lineHeight: 1.3 }}>
                一緒に育ててくれる<br/>テスターを募集中
              </h2>
            </div>
          </Reveal>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { icon: "🧪", title: "現在β版として限定公開中", desc: "基本機能（成分スキャン・図鑑・デッキ・Myコスメ）は実装済み。現在15名まで登録可能です。" },
              { icon: "💬", title: "フィードバックが力になります", desc: "「この機能がほしい」「ここが使いにくい」など、実際に使った感想を聞かせてください。" },
              { icon: "🎁", title: "テスターだけの特典も検討中", desc: "正式リリース時にβテスターへの特典を予定しています。一緒にアプリを育てましょう。" },
            ].map((v, i) => (
              <Reveal key={i} delay={i * 100}>
                <div style={{
                  display: "flex", gap: 16, padding: "22px 24px", borderRadius: 18,
                  background: T.cardSolid, border: `1px solid rgba(181,199,190,0.3)`,
                  boxShadow: "0 2px 12px rgba(27,38,32,0.03)",
                  alignItems: "flex-start",
                }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{v.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, fontFamily: T.sans, marginBottom: 4 }}>{v.title}</div>
                    <p style={{ fontSize: 12, color: T.inkMuted, lineHeight: 1.75, fontFamily: T.sans, margin: 0 }}>{v.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section style={{
        padding: "100px 24px",
        background: `linear-gradient(180deg, ${T.cream} 0%, ${T.accentSoft} 100%)`,
        textAlign: "center",
      }}>
        <Reveal>
          <div style={{
            maxWidth: 480, margin: "0 auto",
          }}>
            <div style={{ fontSize: 40, marginBottom: 20 }}>🌿</div>
            <h2 style={{
              fontSize: "clamp(24px, 5vw, 36px)", fontWeight: 800, fontFamily: T.serif,
              lineHeight: 1.3, marginBottom: 16, color: T.ink,
            }}>
              成分を知ることが、<br/>
              いちばんのスキンケア。
            </h2>
            <p style={{
              fontSize: 14, color: T.inkMuted, lineHeight: 1.8, fontFamily: T.sans,
              marginBottom: 36,
            }}>
              無料のβ版を公開中です。まずは手元の化粧品をスキャンしてみてください。
            </p>
            <button style={{
              padding: "16px 40px", borderRadius: 16,
              background: `linear-gradient(135deg, ${T.accent}, ${T.accentDark})`,
              color: "#fff", fontSize: 16, fontWeight: 700, fontFamily: T.sans,
              boxShadow: `0 8px 32px ${T.accentGlow}`,
              transition: "transform 0.2s",
            }}>
              📸 β版を試してみる
            </button>
            <p style={{ fontSize: 11, color: T.inkFaint, marginTop: 14, fontFamily: T.sans }}>
              現在15名まで登録可能・無料
            </p>
          </div>
        </Reveal>
      </section>

      {/* ─── PRODUCED BY ─── */}
      <section style={{ padding: "0 24px 60px", background: T.cream, textAlign: "center" }}>
        <Reveal>
          <div style={{
            maxWidth: 400, margin: "0 auto", padding: "28px 24px",
            borderRadius: 20, background: T.cardSolid,
            border: "1px solid " + T.parchment, boxShadow: T.s1,
            display: "flex", flexDirection: "column", alignItems: "center",
          }}>
            <div style={{ fontSize: 9, color: T.inkMuted, fontFamily: T.sans, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10 }}>Produced by</div>
            <div style={{ fontSize: 18, fontWeight: 800, fontFamily: T.serif, color: T.ink, marginBottom: 6 }}>みおのミハダノート</div>
            <p style={{ fontSize: 11, color: T.inkMuted, fontFamily: T.sans, lineHeight: 1.8, margin: "0 0 14px", textAlign: "center" }}>
              30代からの美容を「成分」で選ぶ。<br />スキンケア・美容医療・コスメの情報を発信中。
            </p>
            <a href="https://blog-engine.com" target="_blank" rel="noopener noreferrer" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 12, fontWeight: 700, color: T.accent, fontFamily: T.sans,
              textDecoration: "none",
            }}>
              ブログを読む
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" /></svg>
            </a>
          </div>
        </Reveal>
      </section>

      {/* ─── DISCLAIMER ─── */}
      <div style={{
        padding: "24px 24px 28px", background: T.ink,
        borderBottom: "1px solid rgba(181,199,190,0.1)",
      }}>
        <p style={{
          maxWidth: 600, margin: "0 auto", fontSize: 10, color: T.inkMuted,
          fontFamily: T.sans, lineHeight: 1.8, textAlign: "center",
        }}>
          ※ HADAMIの解析結果はAIによる参考情報であり、医学的な判断や安全性の保証を行うものではありません。すべての成分を正確に解析できることを保証するものでもありません。肌トラブルが気になる場合は専門の医療機関にご相談ください。
        </p>
      </div>

      {/* ─── FOOTER ─── */}
      <footer style={{
        padding: "40px 24px", background: T.ink,
        textAlign: "center",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16,
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: 7,
            background: T.accent, display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 10, fontWeight: 900,
          }}>H</div>
          <span style={{ fontSize: 14, fontWeight: 800, fontFamily: T.serif, color: T.accentSoft }}>HADAMI</span>
        </div>
        <div style={{ fontSize: 10, color: T.inkMuted, fontFamily: T.sans, marginBottom: 16 }}>
          Produced by みおのミハダノート
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 20 }}>
          {["利用規約","プライバシー","お問い合わせ"].map((l,i) => (
            <span key={i} style={{ fontSize: 11, color: T.inkMuted, fontFamily: T.sans, cursor: "pointer" }}>{l}</span>
          ))}
        </div>
        <p style={{ fontSize: 10, color: T.inkFaint, fontFamily: T.sans }}>
          © 2026 HADAMI. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
