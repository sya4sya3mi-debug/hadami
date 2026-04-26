"use client";

import * as React from "react";
import { Screen, StatusBar } from "@/components/redesign/apothecary/Screen";
import { TabBarSoft } from "@/components/redesign/apothecary/TabBarSoft";
import { Thumb } from "@/components/redesign/apothecary/Thumb";
import { EffPill } from "@/components/redesign/apothecary/EffPill";
import { Ico } from "@/components/redesign/apothecary/Icons";
import { PRODUCTS, EFFECTS } from "@/components/redesign/apothecary/tokens";
import { IPhoneFrame } from "@/components/redesign/apothecary/IPhoneFrame";

const STEPS = [
  { no: 1, section: "ベースケア",   key: "heartleaf" },
  { no: 2, section: "集中ケア",     key: "cica"      },
  { no: 3, section: "保護ケア",     key: "emulsion", empty: true,  emptyLabel: "乳液" },
  { no: 4, section: "保護ケア",     key: "madeca"    },
  { no: 5, section: "保護ケア",     key: "pcalm"     },
  { no: 6, section: "スペシャル",   key: "mask",     empty: true,  emptyLabel: "パック・マスク" },
];

const moonIco = (p: React.SVGProps<SVGSVGElement> = {}) => (
  <svg viewBox="0 0 20 20" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.6} {...p}>
    <path d="M16 11.5a6.5 6.5 0 1 1-8-8 5 5 0 0 0 8 8z" strokeLinejoin="round" />
  </svg>
);

export default function CareSoft() {
  const [tab, setTab] = React.useState<"morning" | "night">("morning");

  return (
    <IPhoneFrame>
      <div className="hd-soft" style={{ height: "100%" }}>
        <Screen>
          <StatusBar />

          <div style={{ padding: "4px 24px 18px" }}>
            <div
              style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "flex-start", marginBottom: 18,
              }}
            >
              <div className="hd-serif" style={{ fontSize: 26, letterSpacing: "-0.02em" }}>
                スキンケア管理
              </div>
              <button
                style={{
                  background: "transparent",
                  border: "1px solid var(--hd-moss)",
                  color: "var(--hd-moss)",
                  padding: "8px 14px", borderRadius: 999,
                  display: "flex", alignItems: "center",
                  gap: 6, cursor: "pointer", fontFamily: "var(--hd-sans)",
                  fontSize: 11, fontWeight: 600,
                }}
              >
                {Ico.sparkleSm({ width: 12, height: 12 })}
                おすすめ
              </button>
            </div>

            <div
              style={{
                display: "grid", gridTemplateColumns: "1fr 1fr",
                background: "var(--hd-surface-2)",
                borderRadius: 999,
                padding: 4,
              }}
            >
              {[
                { id: "morning" as const, jp: "朝", count: 4, ico: Ico.sun },
                { id: "night"   as const, jp: "夜", count: 4, ico: moonIco },
              ].map((t) => {
                const on = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    style={{
                      padding: "10px 0", cursor: "pointer",
                      background: on ? "var(--hd-moss)" : "transparent",
                      color: on ? "#fff" : "var(--hd-ink-60)",
                      border: "none", borderRadius: 999,
                      display: "flex", alignItems: "center",
                      justifyContent: "center", gap: 8,
                      fontFamily: "var(--hd-sans)",
                      fontWeight: on ? 600 : 500,
                    }}
                  >
                    {t.ico({ width: 15, height: 15 })}
                    <span style={{ fontSize: 14 }}>{t.jp}</span>
                    <span style={{ fontSize: 11, opacity: 0.85 }}>
                      {t.count}件
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="hd-stagger" style={{ flex: 1, overflow: "auto", padding: "0 20px 24px" }}>
            {STEPS.map((s, i) => {
              const p = !s.empty ? PRODUCTS[s.key] : null;
              const prevSection = i > 0 ? STEPS[i - 1].section : null;
              const showHeader = s.section !== prevSection;
              return (
                <React.Fragment key={i}>
                  {showHeader && (
                    <div
                      style={{
                        marginTop: i === 0 ? 6 : 18,
                        marginBottom: 8,
                        fontSize: 12, color: "var(--hd-ink-60)",
                        fontFamily: "var(--hd-sans)", fontWeight: 600,
                      }}
                    >
                      {s.section}
                    </div>
                  )}
                  <div
                    style={{
                      background: "var(--hd-surface)",
                      borderRadius: 14, border: "1px solid var(--hd-hair)",
                      padding: "12px 14px", marginBottom: 8,
                      display: "flex", alignItems: "center", gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 26, height: 26, borderRadius: 999,
                        background: "var(--hd-mint-bg)",
                        color: "var(--hd-moss-deep)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontFamily: "var(--hd-sans)", fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >{s.no}</div>
                    {s.empty || !p ? (
                      <>
                        <div
                          style={{
                            width: 50, height: 50, border: "1.5px dashed var(--hd-line)",
                            borderRadius: 12,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "var(--hd-ink-40)",
                          }}
                        >{Ico.plus({ width: 16, height: 16 })}</div>
                        <div style={{ flex: 1 }}>
                          <div
                            className="hd-serif"
                            style={{ fontSize: 15, color: "var(--hd-ink-60)" }}
                          >
                            {s.emptyLabel}
                          </div>
                          <div
                            style={{
                              fontSize: 11, color: "var(--hd-moss)", marginTop: 2,
                              fontFamily: "var(--hd-sans)", fontWeight: 500,
                            }}
                          >＋ 追加する</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <Thumb p={p} size={50} radius={10} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 11, color: "var(--hd-ink-60)",
                              fontFamily: "var(--hd-sans)",
                            }}
                          >{p.brand}</div>
                          <div
                            style={{
                              fontSize: 14, marginTop: 2, lineHeight: 1.3,
                              fontFamily: "var(--hd-sans)", fontWeight: 500,
                            }}
                          >{p.name}</div>
                          <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                            {EFFECTS.slice(0, 4).map((e) => (
                              <EffPill key={e.id} eff={e} filled size={16} />
                            ))}
                          </div>
                        </div>
                        <button
                          style={{
                            width: 28, height: 28, border: "1px solid var(--hd-hair)",
                            background: "transparent", borderRadius: 999, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "var(--hd-ink-40)",
                          }}
                        >{Ico.close({ width: 11, height: 11 })}</button>
                      </>
                    )}
                  </div>
                </React.Fragment>
              );
            })}

            <button
              className="hd-cta"
              style={{
                width: "100%", marginTop: 20,
                cursor: "pointer",
                fontSize: 14,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {Ico.sparkleSm({ width: 12, height: 12 })}
              ルーティンを分析
            </button>
          </div>

          <TabBarSoft active="notes" />
        </Screen>
      </div>
    </IPhoneFrame>
  );
}
