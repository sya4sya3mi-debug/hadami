"use client";

import * as React from "react";
import { Screen, StatusBar } from "@/components/redesign/apothecary/Screen";
import { TabBarSoft } from "@/components/redesign/apothecary/TabBarSoft";
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

export default function ScanSoft() {
  return (
    <IPhoneFrame>
      <div className="hd-soft" style={{ height: "100%" }}>
        <Screen>
          <StatusBar />

          <div style={{ padding: "8px 24px 20px" }}>
            <div className="hd-serif" style={{ fontSize: 24, marginBottom: 18, letterSpacing: "-0.02em" }}>
              スキャン
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {STAGES.map((s, i) => (
                <React.Fragment key={s.id}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div
                      style={{
                        width: 30, height: 30, borderRadius: 999,
                        background: s.on ? "var(--hd-moss)" : "transparent",
                        border: s.on ? "none" : "1.5px solid var(--hd-line)",
                        color: s.on ? "#fff" : "var(--hd-ink-40)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "var(--hd-sans)", fontSize: 12, fontWeight: 600,
                      }}
                    >{i + 1}</div>
                    <div
                      style={{
                        fontSize: 11,
                        color: s.on ? "var(--hd-ink)" : "var(--hd-ink-40)",
                        fontFamily: "var(--hd-sans)",
                        fontWeight: s.on ? 600 : 500,
                      }}
                    >{s.jp}</div>
                  </div>
                  {i < STAGES.length - 1 && (
                    <div
                      style={{
                        flex: 1, height: 2, background: "var(--hd-hair)",
                        borderRadius: 999,
                        margin: "0 6px", marginBottom: 18,
                      }}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflow: "auto", padding: "0 20px 20px" }}>
            <div
              style={{
                background: "var(--hd-surface)",
                borderRadius: 22,
                padding: "44px 24px",
                display: "flex", flexDirection: "column",
                alignItems: "center", gap: 24,
                border: "1px solid var(--hd-hair)",
              }}
            >
              <div
                className="hd-cta"
                style={{
                  width: 110, height: 110, borderRadius: 999,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", padding: 0,
                }}
              >{Ico.camera({ width: 38, height: 38 })}</div>

              <div style={{ textAlign: "center" }}>
                <div className="hd-serif" style={{ fontSize: 20, letterSpacing: "-0.01em" }}>
                  パッケージを撮影
                </div>
                <div
                  style={{
                    fontSize: 12, color: "var(--hd-ink-60)", marginTop: 8,
                    fontFamily: "var(--hd-sans)", lineHeight: 1.5,
                  }}
                >
                  化粧品の成分表をカメラに向けて<br />
                  下のボタンを押してください
                </div>
              </div>
            </div>

            <div style={{ marginTop: 28 }}>
              <div
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: 14,
                }}
              >
                <div className="hd-serif" style={{ fontSize: 17 }}>
                  まだ出会っていない注目成分
                </div>
                <div
                  style={{
                    fontSize: 10, color: "var(--hd-moss)",
                    fontFamily: "var(--hd-sans)", fontWeight: 600,
                  }}
                >PR</div>
              </div>
              <div
                style={{
                  background: "var(--hd-surface)",
                  border: "1px solid var(--hd-hair)",
                  borderRadius: 14,
                  padding: 14,
                  display: "flex", gap: 14,
                }}
              >
                <Thumb p={PRODUCTS.dhc} size={68} radius={10} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 11, color: "var(--hd-ink-60)",
                      fontFamily: "var(--hd-sans)",
                    }}
                  >DHC 楽天市場店</div>
                  <div
                    style={{
                      fontSize: 13, lineHeight: 1.35, marginTop: 3,
                      fontFamily: "var(--hd-sans)", fontWeight: 500,
                    }}
                  >
                    薬用エイジングケア ホワイトエッセンス
                  </div>
                  <div
                    style={{
                      fontSize: 12, marginTop: 6, color: "var(--hd-moss-deep)",
                      fontFamily: "var(--hd-sans)", fontWeight: 600,
                    }}
                  >
                    ¥4,708 ・ ★ 4.3
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 24, padding: "16px 14px",
                background: "var(--hd-surface-2)",
                borderRadius: 12,
                fontSize: 11, color: "var(--hd-ink-60)",
                lineHeight: 1.7, fontFamily: "var(--hd-sans)",
              }}
            >
              ※ 本アプリは成分の特性を紹介する参考情報です。特定の効能効果を評価・保証するものではありません。
            </div>
          </div>

          <TabBarSoft active="scan" />
        </Screen>
      </div>
    </IPhoneFrame>
  );
}
