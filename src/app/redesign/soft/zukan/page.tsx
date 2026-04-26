"use client";

import * as React from "react";
import { Screen, StatusBar } from "@/components/redesign/apothecary/Screen";
import { TabBarSoft } from "@/components/redesign/apothecary/TabBarSoft";
import { Thumb } from "@/components/redesign/apothecary/Thumb";
import { Ico } from "@/components/redesign/apothecary/Icons";
import { PRODUCTS, EFFECTS } from "@/components/redesign/apothecary/tokens";
import { IPhoneFrame } from "@/components/redesign/apothecary/IPhoneFrame";

const INGREDIENTS = [
  { stars: 4, name: "アスタキサンチン", en: "Astaxanthin", desc: "カロテノイドの一種で、整肌・バリア系に分類される希少成分です。" },
  { stars: 4, name: "グルタチオン", en: "Glutathione", desc: "3つのアミノ酸からなるトリペプチドで、体内の抗酸化防御を担う希少成分です。" },
  { stars: 4, name: "？？？", en: "—", desc: "1985年に発見され、発見者はノーベル化学賞を受賞しました。", locked: true },
  { stars: 3, name: "α-アルブチン", en: "Alpha-arbutin", desc: "通常のアルブチンより安定性が高く、整肌系成分として注目されています。" },
  { stars: 3, name: "ナイアシンアミド", en: "Niacinamide", desc: "ビタミンB3誘導体。角質層の水分保持と色素沈着ケアを両立。" },
];

export default function ZukanSoft() {
  const [activeTab, setTab] = React.useState<"effect" | "concern">("effect");
  const [activeEff, setEff] = React.useState("white");

  return (
    <IPhoneFrame>
      <div className="hd-soft" style={{ height: "100%" }}>
        <Screen>
          <StatusBar />

          <div style={{ padding: "4px 24px 18px" }}>
            <div className="hd-serif" style={{ fontSize: 26, marginBottom: 14, letterSpacing: "-0.02em" }}>
              成分図鑑
            </div>

            <div
              style={{
                display: "flex", alignItems: "center", gap: 16, padding: 16,
                background: "var(--hd-mint-bg)", borderRadius: 16,
              }}
            >
              <div style={{ position: "relative", width: 64, height: 64 }}>
                <svg viewBox="0 0 68 68" width="64" height="64">
                  <circle cx="34" cy="34" r="28" fill="none" stroke="oklch(0.38 0.05 155 / 0.18)" strokeWidth="3" />
                  <circle
                    cx="34" cy="34" r="28" fill="none"
                    stroke="var(--hd-moss)" strokeWidth="3"
                    strokeDasharray={`${2 * Math.PI * 28 * 0.35} ${2 * Math.PI * 28}`}
                    transform="rotate(-90 34 34)"
                    strokeLinecap="round"
                  />
                </svg>
                <div
                  style={{
                    position: "absolute", inset: 0, display: "flex",
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  <span
                    className="hd-serif"
                    style={{ fontSize: 18, color: "var(--hd-moss-deep)" }}
                  >35%</span>
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 12, color: "var(--hd-ink-60)",
                    fontFamily: "var(--hd-sans)", fontWeight: 500,
                  }}
                >
                  コレクト状況
                </div>
                <div
                  className="hd-serif"
                  style={{ fontSize: 24, lineHeight: 1.1, marginTop: 3 }}
                >
                  35
                  <span
                    style={{
                      color: "var(--hd-ink-60)", fontSize: 14,
                      fontFamily: "var(--hd-sans)",
                    }}
                  > / 100種</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              {[
                { id: "effect",  label: "効果別" },
                { id: "concern", label: "肌悩み" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id as "effect" | "concern")}
                  className={activeTab === t.id ? "hd-chip-on" : "hd-chip-off"}
                  style={{
                    padding: "8px 16px", cursor: "pointer",
                    background: activeTab === t.id ? "var(--hd-moss)" : "transparent",
                    color: activeTab === t.id ? "#fff" : "var(--hd-ink)",
                    fontSize: 13,
                    fontFamily: "var(--hd-sans)",
                    fontWeight: activeTab === t.id ? 600 : 500,
                  }}
                >{t.label}</button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflow: "auto" }}>
            <div style={{ padding: "0 24px", overflowX: "auto" }}>
              <div style={{ display: "flex", gap: 8, paddingBottom: 6 }}>
                {EFFECTS.map((e) => {
                  const on = activeEff === e.id;
                  return (
                    <button
                      key={e.id}
                      onClick={() => setEff(e.id)}
                      className={on ? "hd-chip-on" : "hd-chip-off"}
                      style={{
                        background: on ? "var(--hd-moss)" : "transparent",
                        color: on ? "#fff" : "var(--hd-ink)",
                        padding: "9px 14px", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
                        fontFamily: "var(--hd-sans)",
                      }}
                    >
                      {Ico[e.icon]({ width: 13, height: 13 })}
                      <span style={{ fontSize: 13, fontWeight: on ? 600 : 500 }}>
                        {e.label}
                      </span>
                      <span
                        style={{
                          fontSize: 10, opacity: 0.7,
                          fontFamily: "var(--hd-sans)",
                        }}
                      >({e.count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                padding: "20px 24px 12px",
                display: "flex", justifyContent: "space-between", alignItems: "flex-end",
              }}
            >
              <div className="hd-serif" style={{ fontSize: 22 }}>美白</div>
              <div
                style={{
                  fontSize: 12, color: "var(--hd-ink-60)",
                  fontFamily: "var(--hd-sans)",
                }}
              >9 / 30 コレクト</div>
            </div>

            <div
              style={{
                margin: "0 24px",
                background: "var(--hd-surface-2)",
                padding: 18,
                borderRadius: 14,
              }}
            >
              <div
                style={{
                  fontSize: 10, color: "var(--hd-moss)", marginBottom: 8,
                  fontFamily: "var(--hd-sans)", fontWeight: 600,
                  letterSpacing: "0.08em",
                }}
              >
                おすすめ・PR
              </div>
              <div className="hd-serif" style={{ fontSize: 17, lineHeight: 1.35 }}>
                まだ出会っていない<span style={{ color: "var(--hd-moss)" }}>美白成分</span>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
                <Thumb p={PRODUCTS.dhc} size={56} radius={10} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 11, color: "var(--hd-ink-60)",
                      fontFamily: "var(--hd-sans)",
                    }}
                  >The BEAUTOPIA</div>
                  <div
                    style={{
                      fontSize: 14, lineHeight: 1.3, marginTop: 2,
                      fontFamily: "var(--hd-sans)", fontWeight: 500,
                    }}
                  >
                    reveiller The Cocktail
                  </div>
                  <div
                    style={{
                      fontSize: 12, marginTop: 6, color: "var(--hd-moss-deep)",
                      fontFamily: "var(--hd-sans)", fontWeight: 600,
                    }}
                  >
                    ¥8,800 ・ ★ 4.6
                  </div>
                </div>
              </div>
            </div>

            <div className="hd-stagger" style={{ padding: "20px 24px" }}>
              {INGREDIENTS.map((ing, i) => (
                <div
                  key={i}
                  style={{
                    padding: "14px 16px", marginBottom: 8,
                    background: "var(--hd-surface)",
                    borderRadius: 12, border: "1px solid var(--hd-hair)",
                    display: "flex", gap: 14, alignItems: "flex-start",
                    opacity: ing.locked ? 0.55 : 1,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
                      <div
                        className="hd-serif"
                        style={{ fontSize: 16, letterSpacing: "-0.01em" }}
                      >
                        {ing.name}
                      </div>
                      <div style={{ color: "var(--hd-terra)", fontSize: 12 }}>
                        {"★".repeat(ing.stars)}<span style={{ opacity: 0.25 }}>{"★".repeat(5 - ing.stars)}</span>
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 12, lineHeight: 1.55,
                        color: "var(--hd-ink-60)", fontFamily: "var(--hd-sans)",
                      }}
                    >
                      {ing.desc}
                    </div>
                  </div>
                  {Ico.chev({ width: 12, height: 12, style: { color: "var(--hd-ink-40)", marginTop: 6 } })}
                </div>
              ))}
            </div>
          </div>

          <TabBarSoft active="book" />
        </Screen>
      </div>
    </IPhoneFrame>
  );
}
