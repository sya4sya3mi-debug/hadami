"use client";

import * as React from "react";
import { Screen, StatusBar } from "@/components/redesign/apothecary/Screen";
import { TabBarSoftA } from "@/components/redesign/apothecary/TabBarSoftA";
import { Thumb } from "@/components/redesign/apothecary/Thumb";
import { EffPill } from "@/components/redesign/apothecary/EffPill";
import { Ico } from "@/components/redesign/apothecary/Icons";
import { PRODUCTS, EFFECTS } from "@/components/redesign/apothecary/tokens";
import { IPhoneFrame } from "@/components/redesign/apothecary/IPhoneFrame";

const STEPS = [
  { no: "01", section: "BASE",     jp: "ベースケア",     key: "heartleaf" },
  { no: "02", section: "TARGETED", jp: "集中ケア",       key: "cica"      },
  { no: "03", section: "PROTECT",  jp: "保護ケア",       key: "emulsion", empty: true,  emptyLabel: "乳液" },
  { no: "04", section: "PROTECT",  jp: "保護ケア",       key: "madeca"    },
  { no: "05", section: "PROTECT",  jp: "保護ケア",       key: "pcalm"     },
  { no: "06", section: "SPECIAL",  jp: "スペシャル",     key: "mask",     empty: true,  emptyLabel: "パック・マスク" },
];

const moonIco = (p: React.SVGProps<SVGSVGElement> = {}) => (
  <svg viewBox="0 0 20 20" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={1.3} {...p}>
    <path d="M16 11.5a6.5 6.5 0 1 1-8-8 5 5 0 0 0 8 8z" strokeLinejoin="round" />
  </svg>
);

export default function CareSoftA() {
  const [tab, setTab] = React.useState<"morning" | "night">("morning");

  return (
    <IPhoneFrame>
      <div className="hd-softa" style={{ height: "100%" }}>
        <Screen>
          <StatusBar />

          <div style={{ padding: "4px 24px 20px" }}>
            <div
              style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "flex-start", marginBottom: 16,
              }}
            >
              <div>
                <div className="hd-mono hd-caps" style={{ color: "var(--hd-ink-40)" }}>Regimen · 01</div>
                <div className="hd-serif" style={{ marginTop: 4, letterSpacing: "-0.02em", fontSize: 28, lineHeight: 1.05 }}>
                  スキンケア<br />
                  <span style={{ fontStyle: "italic" }}>管理.</span>
                </div>
              </div>
              <button
                style={{
                  border: "1px solid var(--hd-ink)", background: "transparent",
                  padding: "8px 14px", display: "flex", alignItems: "center",
                  gap: 6, cursor: "pointer", height: 34,
                }}
              >
                {Ico.sparkleSm({ width: 11, height: 11 })}
                <span className="hd-mono" style={{ fontSize: 9, letterSpacing: "0.18em" }}>
                  AUTO-COMPOSE
                </span>
              </button>
            </div>

            {/* AM/PM — A pure (sharp segmented) */}
            <div
              style={{
                display: "grid", gridTemplateColumns: "1fr 1fr",
                border: "1px solid var(--hd-ink)",
              }}
            >
              {[
                { id: "morning" as const, en: "AM", jp: "朝", count: 4, ico: Ico.sun },
                { id: "night"   as const, en: "PM", jp: "夜", count: 4, ico: moonIco },
              ].map((t) => {
                const on = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    style={{
                      padding: "14px 0", cursor: "pointer",
                      background: on ? "var(--hd-ink)" : "transparent",
                      color: on ? "var(--hd-bg)" : "var(--hd-ink)",
                      border: "none", display: "flex", alignItems: "center",
                      justifyContent: "center", gap: 10,
                    }}
                  >
                    {t.ico({ width: 14, height: 14 })}
                    <span className="hd-serif" style={{ fontSize: 15 }}>{t.jp}</span>
                    <span
                      className="hd-mono"
                      style={{ fontSize: 9, letterSpacing: "0.15em", opacity: 0.7 }}
                    >
                      {t.en} · {String(t.count).padStart(2, "0")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ flex: 1, overflow: "auto", padding: "0 20px 24px" }}>
            {STEPS.map((s, i) => {
              const p = !s.empty ? PRODUCTS[s.key] : null;
              const prevSection = i > 0 ? STEPS[i - 1].section : null;
              const showHeader = s.section !== prevSection;
              return (
                <React.Fragment key={i}>
                  {showHeader && (
                    <div
                      style={{
                        display: "flex", alignItems: "baseline", gap: 12,
                        marginTop: i === 0 ? 0 : 18,
                        paddingBottom: 8, borderBottom: "1px solid var(--hd-hair)",
                        marginBottom: 10,
                      }}
                    >
                      <span className="hd-mono hd-caps" style={{ color: "var(--hd-ink-40)" }}>
                        {s.section}
                      </span>
                      <span className="hd-serif" style={{ fontSize: 14, color: "var(--hd-ink-60)" }}>
                        {s.jp}
                      </span>
                    </div>
                  )}
                  {/* Step row — wrapped in B-style rounded card */}
                  <div
                    className="hd-softa-card"
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "12px 14px", marginBottom: 8,
                      background: "var(--hd-surface)",
                      border: "1px solid var(--hd-hair)",
                    }}
                  >
                    <div
                      className="hd-mono"
                      style={{ width: 22, fontSize: 11, color: "var(--hd-ink-40)" }}
                    >{s.no}</div>
                    {s.empty || !p ? (
                      <>
                        <div
                          className="hd-softa-thumb"
                          style={{
                            width: 50, height: 50, border: "1px dashed var(--hd-line)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "var(--hd-ink-40)",
                          }}
                        >{Ico.plus({ width: 14, height: 14 })}</div>
                        <div style={{ flex: 1 }}>
                          <div className="hd-serif" style={{ fontSize: 16, color: "var(--hd-ink-60)" }}>
                            {s.emptyLabel}
                          </div>
                          <div
                            className="hd-mono hd-caps"
                            style={{ color: "var(--hd-ink-40)", marginTop: 2 }}
                          >TAP TO ADD</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <Thumb p={p} size={50} radius={14} apo />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="hd-mono hd-caps" style={{ color: "var(--hd-ink-40)" }}>
                            {p.brand}
                          </div>
                          <div
                            className="hd-serif"
                            style={{ fontSize: 15, marginTop: 3, lineHeight: 1.25 }}
                          >{p.name}</div>
                          <div style={{ display: "flex", gap: 5, marginTop: 8 }}>
                            {EFFECTS.slice(0, 4).map((e) => (
                              <EffPill key={e.id} eff={e} filled size={16} />
                            ))}
                          </div>
                        </div>
                        <button
                          style={{
                            width: 24, height: 24, border: "1px solid var(--hd-hair)",
                            background: "transparent", borderRadius: 999, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "var(--hd-ink-40)",
                          }}
                        >{Ico.close({ width: 10, height: 10 })}</button>
                      </>
                    )}
                  </div>
                </React.Fragment>
              );
            })}

            {/* Analyze CTA — A pure (sharp outlined button) */}
            <button
              style={{
                width: "100%", marginTop: 24, padding: "16px 0",
                border: "1px solid var(--hd-ink)", background: "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 10, cursor: "pointer",
              }}
            >
              <span className="hd-serif" style={{ fontSize: 14 }}>ルーティン分析</span>
              <span
                className="hd-mono"
                style={{ fontSize: 9, letterSpacing: "0.2em", color: "var(--hd-ink-60)" }}
              >ANALYZE →</span>
            </button>
          </div>

          <TabBarSoftA active="notes" />
        </Screen>
      </div>
    </IPhoneFrame>
  );
}
