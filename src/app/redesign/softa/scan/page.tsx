"use client";

import * as React from "react";
import { Screen, StatusBar } from "@/components/redesign/apothecary/Screen";
import { TabBarSoftA } from "@/components/redesign/apothecary/TabBarSoftA";
import { Thumb } from "@/components/redesign/apothecary/Thumb";
import { Ico } from "@/components/redesign/apothecary/Icons";
import { PRODUCTS } from "@/components/redesign/apothecary/tokens";
import { IPhoneFrame } from "@/components/redesign/apothecary/IPhoneFrame";

const STAGES = [
  { id: "capture", jp: "撮影", on: true },
  { id: "detect",  jp: "特定", on: false },
  { id: "analyze", jp: "分析", on: false },
  { id: "result",  jp: "結果", on: false },
];

export default function ScanSoftA() {
  return (
    <IPhoneFrame>
      <div className="hd-softa" style={{ height: "100%" }}>
        <Screen bg="var(--hd-bg)">
          <StatusBar />

          <div style={{ padding: "8px 24px 20px" }}>
            <div
              className="hd-mono hd-caps"
              style={{ color: "var(--hd-ink-40)", marginBottom: 16 }}
            >
              Procedure · 1 of 4
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {STAGES.map((s, i) => (
                <React.Fragment key={s.id}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 28, height: 28, border: "1px solid var(--hd-ink)",
                        background: s.on ? "var(--hd-ink)" : "transparent",
                        color: s.on ? "var(--hd-bg)" : "var(--hd-ink)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "var(--hd-mono)", fontSize: 11,
                      }}
                    >{String(i + 1).padStart(2, "0")}</div>
                    <div
                      className="hd-serif"
                      style={{ fontSize: 12, color: s.on ? "var(--hd-ink)" : "var(--hd-ink-40)" }}
                    >{s.jp}</div>
                  </div>
                  {i < STAGES.length - 1 && (
                    <div
                      style={{
                        flex: 1, height: 1, background: "var(--hd-line)",
                        margin: "0 6px", marginBottom: 22,
                      }}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflow: "auto", padding: "0 20px 20px" }}>
            {/* Camera well — A's framed dashed inner, but outer wrapper rounded (B influence) */}
            <div
              className="hd-softa-card-lg"
              style={{ border: "1px solid var(--hd-ink)", padding: 2 }}
            >
              <div
                style={{
                  border: "1px dashed var(--hd-line)",
                  borderRadius: 18,
                  padding: "56px 24px",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 28,
                  background: "var(--hd-surface)",
                }}
              >
                <div
                  style={{
                    position: "relative", width: "100%",
                    display: "flex", justifyContent: "center",
                  }}
                >
                  {([[0, 0], [0, 1], [1, 0], [1, 1]] as const).map(([x, y], i) => (
                    <svg
                      key={i}
                      width="16" height="16" viewBox="0 0 16 16"
                      style={{
                        position: "absolute",
                        top: y ? "auto" : -30, bottom: y ? -30 : "auto",
                        left: x ? "auto" : 0, right: x ? 0 : "auto",
                        color: "var(--hd-ink-40)",
                      }}
                    >
                      <path
                        d={
                          x && y ? "M0 16V8h8" :
                          x && !y ? "M0 0v8h8" :
                          !x && y ? "M16 16V8H8" :
                                    "M16 0v8H8"
                        }
                        stroke="currentColor" strokeWidth="1" fill="none"
                      />
                    </svg>
                  ))}
                  <div
                    style={{
                      width: 96, height: 96, borderRadius: 999, background: "var(--hd-ink)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "var(--hd-bg)",
                      boxShadow: "0 16px 40px oklch(0.3 0.03 90 / 0.25)",
                    }}
                  >{Ico.camera({ width: 34, height: 34 })}</div>
                </div>

                <div style={{ textAlign: "center" }}>
                  <div className="hd-serif" style={{ fontSize: 22, letterSpacing: "-0.01em" }}>
                    パッケージを撮影してスキャン
                  </div>
                  <div
                    className="hd-mono hd-caps"
                    style={{ color: "var(--hd-ink-40)", marginTop: 10 }}
                  >Tap the shutter below · 化粧品のパッケージを</div>
                </div>

                <div style={{ color: "var(--hd-ink-40)" }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                    <path d="M10 3v14M4 11l6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Unmet — A pure (hairline rule) */}
            <div style={{ marginTop: 28 }}>
              <div
                style={{
                  display: "flex", alignItems: "baseline",
                  justifyContent: "space-between",
                  paddingBottom: 10, borderBottom: "1px solid var(--hd-ink)",
                }}
              >
                <div>
                  <div className="hd-mono hd-caps" style={{ color: "var(--hd-ink-40)" }}>
                    Unmet · 未会
                  </div>
                  <div className="hd-serif" style={{ fontSize: 16, marginTop: 3 }}>
                    まだ出会っていない注目成分
                  </div>
                </div>
                <div
                  className="hd-mono"
                  style={{ fontSize: 9, color: "var(--hd-ink-40)", letterSpacing: "0.15em" }}
                >PR · 1/6</div>
              </div>
              {/* Rounded card for the product (B influence) */}
              <div
                className="hd-softa-card"
                style={{
                  display: "flex", gap: 14, padding: 14, marginTop: 14,
                  background: "var(--hd-surface)",
                  border: "1px solid var(--hd-hair)",
                }}
              >
                <Thumb p={PRODUCTS.dhc} size={70} radius={14} apo />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="hd-mono hd-caps" style={{ color: "var(--hd-ink-40)" }}>
                    DHC 楽天市場店
                  </div>
                  <div className="hd-serif" style={{ fontSize: 14, lineHeight: 1.3, marginTop: 3 }}>
                    薬用エイジングケア ホワイトエッセンス
                  </div>
                  <div className="hd-mono" style={{ fontSize: 11, marginTop: 6 }}>
                    ¥4,708 &nbsp;·&nbsp; ★ 4.3
                  </div>
                </div>
              </div>
            </div>

            {/* Fine print */}
            <div style={{ marginTop: 24, padding: "18px 0 0", borderTop: "1px solid var(--hd-hair)" }}>
              <div
                style={{
                  fontSize: 10, color: "var(--hd-ink-40)",
                  lineHeight: 1.7, textWrap: "pretty" as const,
                }}
              >
                ※ 本アプリは成分の特性を紹介する参考情報です。<br />
                　 特定の効能効果を評価・保証するものではありません。
              </div>
              <div style={{ textAlign: "center", marginTop: 28 }}>
                <div className="hd-mono hd-caps" style={{ color: "var(--hd-ink-40)", marginBottom: 6 }}>
                  Produced by
                </div>
                <div className="hd-serif" style={{ fontSize: 15, fontStyle: "italic" }}>
                  みおのミハダノート
                </div>
              </div>
            </div>
          </div>

          <TabBarSoftA active="scan" />
        </Screen>
      </div>
    </IPhoneFrame>
  );
}
