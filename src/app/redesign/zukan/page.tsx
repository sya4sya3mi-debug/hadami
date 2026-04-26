"use client";

import * as React from "react";
import { Screen, StatusBar } from "@/components/redesign/apothecary/Screen";
import { TabBarA } from "@/components/redesign/apothecary/TabBarA";
import { Thumb } from "@/components/redesign/apothecary/Thumb";
import { Ico } from "@/components/redesign/apothecary/Icons";
import { PRODUCTS, EFFECTS } from "@/components/redesign/apothecary/tokens";
import { IPhoneFrame } from "@/components/redesign/apothecary/IPhoneFrame";

const apo = { border: "1px solid var(--hd-hair)" };

const INGREDIENTS = [
  { stars: 4, name: "アスタキサンチン", en: "Astaxanthin", desc: "カロテノイドの一種で、整肌・バリア系に分類される希少成分です。" },
  { stars: 4, name: "グルタチオン", en: "Glutathione", desc: "3つのアミノ酸からなるトリペプチドで、体内の抗酸化防御を担う希少成分です。" },
  { stars: 4, name: "？？？", en: "—", desc: "1985年に発見され、発見者はノーベル化学賞を受賞しました。", locked: true },
  { stars: 3, name: "α-アルブチン", en: "Alpha-arbutin", desc: "通常のアルブチンより安定性が高く、整肌系成分として注目されています。" },
  { stars: 3, name: "ナイアシンアミド", en: "Niacinamide", desc: "ビタミンB3誘導体。角質層の水分保持と色素沈着ケアを両立。" },
];

export default function ZukanPage() {
  const [activeTab, setTab] = React.useState<"effect" | "concern">("effect");
  const [activeEff, setEff] = React.useState("white");

  return (
    <IPhoneFrame>
      <Screen>
        <StatusBar />

        <div style={{ padding: "4px 24px 18px" }}>
          <div className="hd-mono hd-caps" style={{ color: "var(--hd-ink-40)", marginBottom: 10 }}>
            COMPENDIUM · 成分図鑑
          </div>

          {/* Progress */}
          <div
            style={{
              display: "flex", alignItems: "center", gap: 20, paddingBottom: 20,
              borderBottom: "1px solid var(--hd-ink)",
            }}
          >
            <div style={{ position: "relative", width: 68, height: 68 }}>
              <svg viewBox="0 0 68 68" width="68" height="68">
                <circle cx="34" cy="34" r="30" fill="none" stroke="var(--hd-hair)" strokeWidth="1.5" />
                <circle
                  cx="34" cy="34" r="30" fill="none"
                  stroke="var(--hd-moss)" strokeWidth="1.5"
                  strokeDasharray={`${2 * Math.PI * 30 * 0.35} ${2 * Math.PI * 30}`}
                  transform="rotate(-90 34 34)"
                  strokeLinecap="butt"
                />
              </svg>
              <div
                style={{
                  position: "absolute", inset: 0, display: "flex",
                  alignItems: "center", justifyContent: "center",
                }}
              >
                <span className="hd-serif" style={{ fontSize: 20 }}>35%</span>
              </div>
            </div>
            <div>
              <div className="hd-mono hd-caps" style={{ color: "var(--hd-ink-40)" }}>Complete</div>
              <div className="hd-serif" style={{ fontSize: 26, lineHeight: 1.1, marginTop: 3 }}>
                035<span style={{ color: "var(--hd-ink-40)", fontSize: 16 }}> / 100種</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 28, marginTop: 18 }}>
            {[
              { id: "effect", en: "BY EFFECT", jp: "効果別" },
              { id: "concern", en: "BY CONCERN", jp: "肌悩み" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as "effect" | "concern")}
                style={{
                  background: "none", border: "none", padding: "0 0 10px", cursor: "pointer",
                  borderBottom:
                    activeTab === t.id ? "1.5px solid var(--hd-ink)" : "1.5px solid transparent",
                  color: activeTab === t.id ? "var(--hd-ink)" : "var(--hd-ink-40)",
                  textAlign: "left",
                }}
              >
                <div className="hd-mono" style={{ fontSize: 9, letterSpacing: "0.2em" }}>{t.en}</div>
                <div className="hd-serif" style={{ fontSize: 15, marginTop: 2 }}>{t.jp}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto" }}>
          {/* Effect chips */}
          <div style={{ padding: "0 24px", overflowX: "auto" }}>
            <div style={{ display: "flex", gap: 10, paddingBottom: 6 }}>
              {EFFECTS.map((e) => {
                const on = activeEff === e.id;
                return (
                  <button
                    key={e.id}
                    onClick={() => setEff(e.id)}
                    style={{
                      background: on ? "var(--hd-ink)" : "transparent",
                      color: on ? "var(--hd-bg)" : "var(--hd-ink)",
                      border: on ? "none" : "1px solid var(--hd-line)",
                      padding: "10px 14px", borderRadius: 0, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
                    }}
                  >
                    {Ico[e.icon]({ width: 13, height: 13 })}
                    <div style={{ textAlign: "left" }}>
                      <div className="hd-serif" style={{ fontSize: 13, lineHeight: 1 }}>{e.label}</div>
                      <div
                        className="hd-mono"
                        style={{ fontSize: 9, opacity: 0.7, marginTop: 3, letterSpacing: "0.1em" }}
                      >{e.count}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub-header */}
          <div
            style={{
              padding: "24px 24px 14px",
              display: "flex", justifyContent: "space-between", alignItems: "flex-end",
            }}
          >
            <div>
              <div className="hd-mono hd-caps" style={{ color: "var(--hd-ink-40)" }}>Brightening</div>
              <div className="hd-serif" style={{ fontSize: 28, marginTop: 4, letterSpacing: "-0.01em" }}>美白</div>
            </div>
            <div className="hd-mono" style={{ fontSize: 11, color: "var(--hd-ink-60)" }}>9 / 30</div>
          </div>

          {/* PR card */}
          <div
            style={{
              margin: "0 24px", border: apo.border, background: "var(--hd-surface-2)",
              padding: 18,
            }}
          >
            <div
              style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: 10,
              }}
            >
              <div className="hd-mono hd-caps" style={{ fontSize: 9, color: "var(--hd-ink-40)" }}>
                Sponsored · PR
              </div>
              <div className="hd-mono" style={{ fontSize: 9, color: "var(--hd-ink-40)" }}>1 / 6</div>
            </div>
            <div className="hd-serif" style={{ fontSize: 18, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
              まだ出会っていない<br />
              <span style={{ fontStyle: "italic", color: "var(--hd-moss)" }}>美白成分</span>を含む逸品。
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
              <Thumb p={PRODUCTS.dhc} size={56} apo />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="hd-mono hd-caps" style={{ color: "var(--hd-ink-40)" }}>The BEAUTOPIA</div>
                <div className="hd-serif" style={{ fontSize: 14, lineHeight: 1.25, marginTop: 2 }}>
                  reveiller The Cocktail — 150mL
                </div>
                <div className="hd-mono" style={{ fontSize: 11, marginTop: 6, color: "var(--hd-ink)" }}>
                  ¥8,800 &nbsp;·&nbsp; ★ 4.6
                </div>
              </div>
            </div>
          </div>

          {/* Ingredient list */}
          <div className="hd-stagger" style={{ padding: "24px" }}>
            {INGREDIENTS.map((ing, i) => (
              <div
                key={i}
                style={{
                  padding: "16px 0",
                  borderBottom:
                    i < INGREDIENTS.length - 1 ? "1px solid var(--hd-hair)" : "none",
                  display: "flex", gap: 14, alignItems: "flex-start",
                }}
              >
                <div className="hd-mono" style={{ fontSize: 9, color: "var(--hd-ink-40)", width: 22 }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div style={{ flex: 1, minWidth: 0, opacity: ing.locked ? 0.45 : 1 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
                    <div className="hd-serif" style={{ fontSize: 16, letterSpacing: "-0.01em" }}>
                      {ing.name}
                    </div>
                    <div style={{ color: "var(--hd-ink-40)" }}>
                      {"★".repeat(ing.stars)}
                      <span style={{ opacity: 0.3 }}>{"★".repeat(5 - ing.stars)}</span>
                    </div>
                  </div>
                  <div className="hd-mono hd-caps" style={{ color: "var(--hd-ink-40)", marginBottom: 6 }}>
                    {ing.en}
                  </div>
                  <div
                    style={{
                      fontSize: 12, lineHeight: 1.55,
                      color: "var(--hd-ink-60)", textWrap: "pretty" as const,
                    }}
                  >{ing.desc}</div>
                </div>
                {Ico.chev({ width: 10, height: 10, style: { color: "var(--hd-ink-40)", marginTop: 4 } })}
              </div>
            ))}
          </div>
        </div>

        <TabBarA active="book" />
      </Screen>
    </IPhoneFrame>
  );
}
