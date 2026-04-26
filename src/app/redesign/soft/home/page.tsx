"use client";

import * as React from "react";
import { Screen, StatusBar } from "@/components/redesign/apothecary/Screen";
import { TabBarSoft } from "@/components/redesign/apothecary/TabBarSoft";
import { Thumb } from "@/components/redesign/apothecary/Thumb";
import { Ico } from "@/components/redesign/apothecary/Icons";
import { PRODUCTS } from "@/components/redesign/apothecary/tokens";
import { IPhoneFrame } from "@/components/redesign/apothecary/IPhoneFrame";

const ROUTINE = [
  { key: "heartleaf", step: 1, type: "化粧水" },
  { key: "cica",      step: 2, type: "美容液" },
  { key: "madeca",    step: 3, type: "クリーム" },
  { key: "pcalm",     step: 4, type: "日焼け止め" },
];

export default function HomeSoft() {
  const [checked, setChecked] = React.useState<Record<string, boolean>>({ heartleaf: true });
  const done = Object.values(checked).filter(Boolean).length;

  return (
    <IPhoneFrame>
      <div className="hd-soft" style={{ height: "100%" }}>
        <Screen>
          <StatusBar />

          <div style={{ padding: "8px 24px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--hd-ink-60)", marginBottom: 8, fontFamily: "var(--hd-sans)" }}>
                  4月25日（火）・朝
                </div>
                <div className="hd-serif" style={{ lineHeight: 1.1, letterSpacing: "-0.02em", fontSize: 30 }}>
                  おはよう、<span style={{ color: "var(--hd-moss)" }}>みお</span>さん
                </div>
              </div>
              <div
                style={{
                  width: 44, height: 44, borderRadius: 999, background: "var(--hd-moss)",
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--hd-serif)", fontSize: 19,
                }}
              >み</div>
            </div>
          </div>

          <div style={{ flex: 1, overflow: "auto", padding: "0 0 24px" }}>
            <div style={{ padding: "0 20px" }}>
              <div
                style={{
                  background: "var(--hd-surface)",
                  borderRadius: 18,
                  padding: "20px 18px",
                  border: "1px solid var(--hd-hair)",
                }}
              >
                <div
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    marginBottom: 14,
                  }}
                >
                  <div className="hd-serif" style={{ fontSize: 19 }}>朝のルーティン</div>
                  <div
                    style={{
                      fontFamily: "var(--hd-sans)", fontSize: 13, color: "var(--hd-moss)",
                      fontWeight: 600,
                    }}
                  >
                    {done} / 4 完了
                  </div>
                </div>

                <div className="hd-stagger">
                  {ROUTINE.map((r, i) => {
                    const p = PRODUCTS[r.key];
                    const on = !!checked[r.key];
                    return (
                      <button
                        key={r.key}
                        onClick={() => setChecked((c) => ({ ...c, [r.key]: !c[r.key] }))}
                        style={{
                          width: "100%", textAlign: "left", background: "none", border: "none",
                          padding: "14px 0", display: "flex", alignItems: "center", gap: 14,
                          borderBottom: i < ROUTINE.length - 1 ? "1px solid var(--hd-hair)" : "none",
                          cursor: "pointer", opacity: on ? 0.55 : 1,
                        }}
                      >
                        <Thumb p={p} size={50} radius={10} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 11, color: "var(--hd-ink-60)", marginBottom: 3,
                              fontFamily: "var(--hd-sans)",
                            }}
                          >
                            STEP {r.step}・{r.type}
                          </div>
                          <div
                            style={{
                              fontSize: 14, lineHeight: 1.35, fontFamily: "var(--hd-sans)",
                              fontWeight: 500,
                            }}
                          >
                            {p.name}
                          </div>
                        </div>
                        <div
                          style={{
                            width: 26, height: 26, borderRadius: 999,
                            border: on ? "none" : "1.5px solid var(--hd-line)",
                            background: on ? "var(--hd-moss)" : "transparent",
                            color: "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                          }}
                        >
                          {on && (
                            <span className="hd-pop-in" style={{ display: "flex" }}>
                              {Ico.check({ width: 12, height: 12, strokeWidth: 2.5 })}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Stats trio */}
            <div
              className="hd-stagger"
              style={{
                margin: "24px 20px 0",
                padding: "20px 16px",
                background: "var(--hd-mint-bg)",
                borderRadius: 18,
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0,
              }}
            >
              {[
                { n: "111", l: "成分コレクト" },
                { n: "25",  l: "マイコスメ" },
                { n: "31",  l: "スキャン" },
              ].map((s, i) => (
                <div
                  key={s.l}
                  style={{
                    padding: "0 4px", textAlign: "center",
                    borderLeft: i > 0 ? "1px solid oklch(0.38 0.05 155 / 0.18)" : "none",
                  }}
                >
                  <div className="hd-serif" style={{ fontSize: 30, lineHeight: 1, color: "var(--hd-moss-deep)" }}>
                    {s.n}
                  </div>
                  <div
                    style={{
                      fontSize: 11, color: "var(--hd-ink-60)", marginTop: 6,
                      fontFamily: "var(--hd-sans)",
                    }}
                  >{s.l}</div>
                </div>
              ))}
            </div>

            {/* Today's ingredient */}
            <div style={{ padding: "28px 20px 16px" }}>
              <div
                style={{
                  fontSize: 11, color: "var(--hd-ink-60)", marginBottom: 8,
                  fontFamily: "var(--hd-sans)", fontWeight: 500,
                }}
              >
                今日の成分・No.03
              </div>
              <div
                className="hd-serif"
                style={{ fontSize: 20, lineHeight: 1.35, letterSpacing: "-0.01em" }}
              >
                ツボクサエキス<br />
                <span style={{ fontStyle: "italic", color: "var(--hd-moss)" }}>
                  Centella Asiatica
                </span>
              </div>
              <div
                style={{
                  marginTop: 10, fontSize: 13, lineHeight: 1.6,
                  color: "var(--hd-ink-60)", fontFamily: "var(--hd-sans)",
                }}
              >
                韓国では「鎮静の王様」と称される、★3 のレア成分。
              </div>
              <button
                style={{
                  marginTop: 14, padding: "10px 18px",
                  background: "transparent",
                  border: "1px solid var(--hd-moss)",
                  color: "var(--hd-moss)",
                  borderRadius: 999,
                  fontSize: 12, fontWeight: 600,
                  display: "inline-flex", alignItems: "center", gap: 6,
                  cursor: "pointer", fontFamily: "var(--hd-sans)",
                }}
              >
                解説を読む {Ico.chev({ width: 10, height: 10 })}
              </button>
            </div>

            {/* Recent scans */}
            <div style={{ padding: "16px 0 0 20px" }}>
              <div
                style={{
                  display: "flex", alignItems: "baseline",
                  justifyContent: "space-between", paddingRight: 20,
                }}
              >
                <div
                  style={{
                    fontSize: 13, color: "var(--hd-ink)", fontFamily: "var(--hd-sans)",
                    fontWeight: 600,
                  }}
                >最近のスキャン</div>
                <div
                  style={{
                    fontSize: 11, color: "var(--hd-moss)", fontFamily: "var(--hd-sans)",
                    fontWeight: 500,
                  }}
                >すべて見る →</div>
              </div>
              <div
                className="hd-stagger"
                style={{
                  display: "flex", gap: 12, marginTop: 12,
                  overflowX: "auto", paddingBottom: 6, paddingRight: 20,
                }}
              >
                {(["lano", "pcalm", "verveine", "toner"] as const).map((k) => {
                  const p = PRODUCTS[k];
                  return (
                    <div key={k} style={{ width: 132, flexShrink: 0 }}>
                      <div
                        style={{
                          width: 132, height: 156, background: p.color,
                          position: "relative", overflow: "hidden",
                          borderRadius: 14,
                        }}
                      >
                        <Thumb p={p} size={132} radius={0} border={false} />
                      </div>
                      <div
                        style={{
                          fontSize: 13, marginTop: 8, lineHeight: 1.35,
                          fontFamily: "var(--hd-sans)", fontWeight: 500,
                        }}
                      >
                        {p.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11, color: "var(--hd-ink-60)", marginTop: 3,
                          fontFamily: "var(--hd-sans)",
                        }}
                      >
                        {p.brand}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <TabBarSoft active="home" />
        </Screen>
      </div>
    </IPhoneFrame>
  );
}
