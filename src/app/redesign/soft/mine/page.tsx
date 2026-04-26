"use client";

import * as React from "react";
import { Screen, StatusBar } from "@/components/redesign/apothecary/Screen";
import { TabBarSoft } from "@/components/redesign/apothecary/TabBarSoft";
import { Thumb } from "@/components/redesign/apothecary/Thumb";
import { EffPill } from "@/components/redesign/apothecary/EffPill";
import { Ico } from "@/components/redesign/apothecary/Icons";
import { PRODUCTS, EFFECTS } from "@/components/redesign/apothecary/tokens";
import { IPhoneFrame } from "@/components/redesign/apothecary/IPhoneFrame";

const GRID = [
  { key: "toner",  fav: true },
  { key: "lano",   fav: false },
  { key: "pcalm",  fav: true },
  { key: "madeca", fav: false },
];

const FILTERS: { id: string; jp: string; icon?: (p?: React.SVGProps<SVGSVGElement>) => React.ReactElement }[] = [
  { id: "fav",   jp: "お気に入り", icon: Ico.star },
  { id: "all",   jp: "すべて" },
  { id: "toner", jp: "化粧水" },
  { id: "serum", jp: "美容液" },
  { id: "cream", jp: "クリーム" },
  { id: "spf",   jp: "日焼け止め" },
];

export default function MineSoft() {
  const [filter, setFilter] = React.useState("all");

  return (
    <IPhoneFrame>
      <div className="hd-soft" style={{ height: "100%" }}>
        <Screen>
          <StatusBar />

          <div style={{ padding: "4px 24px 14px" }}>
            <div
              style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "flex-end",
              }}
            >
              <div>
                <div className="hd-serif" style={{ fontSize: 26, letterSpacing: "-0.02em" }}>
                  マイコスメ
                </div>
                <div
                  style={{
                    fontSize: 12, color: "var(--hd-ink-60)", marginTop: 4,
                    fontFamily: "var(--hd-sans)",
                  }}
                >
                  全25件
                </div>
              </div>
              <div
                style={{
                  display: "flex", border: "1px solid var(--hd-hair)",
                  borderRadius: 999, padding: 3,
                }}
              >
                {(["grid", "list"] as const).map((m, i) => (
                  <div
                    key={m}
                    style={{
                      padding: "6px 10px",
                      background: i === 0 ? "var(--hd-moss)" : "transparent",
                      color: i === 0 ? "#fff" : "var(--hd-ink-40)",
                      borderRadius: 999,
                      display: "flex", alignItems: "center",
                    }}
                  >
                    {i === 0 ? (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="1" y="1" width="5" height="5" rx="1" />
                        <rect x="8" y="1" width="5" height="5" rx="1" />
                        <rect x="1" y="8" width="5" height="5" rx="1" />
                        <rect x="8" y="8" width="5" height="5" rx="1" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M1 3h12M1 7h12M1 11h12" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ padding: "0 24px 14px", overflowX: "auto", flexShrink: 0 }}>
            <div style={{ display: "flex", gap: 8 }}>
              {FILTERS.map((f) => {
                const on = filter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={on ? "hd-chip-on" : "hd-chip-off"}
                    style={{
                      display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
                      padding: "8px 14px", cursor: "pointer",
                      background: on ? "var(--hd-moss)" : "transparent",
                      color: on ? "#fff" : "var(--hd-ink)",
                      fontFamily: "var(--hd-sans)",
                    }}
                  >
                    {f.icon && f.icon({ width: 11, height: 11 })}
                    <span style={{ fontSize: 13, fontWeight: on ? 600 : 500 }}>{f.jp}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ flex: 1, overflow: "auto", padding: "0 20px 24px" }}>
            <div className="hd-stagger" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {GRID.map((g, i) => {
                const p = PRODUCTS[g.key];
                return (
                  <div
                    key={i}
                    style={{
                      background: "var(--hd-surface)",
                      borderRadius: 16,
                      overflow: "hidden",
                      border: "1px solid var(--hd-hair)",
                    }}
                  >
                    <div
                      style={{
                        position: "relative", width: "100%", aspectRatio: "1/1.15",
                        background: p.color, overflow: "hidden",
                      }}
                    >
                      <Thumb p={p} size="100%" radius={0} border={false} />
                      <div
                        style={{
                          position: "absolute", top: 10, left: 10,
                          background: "rgba(255,255,255,0.95)",
                          padding: "4px 10px",
                          borderRadius: 999,
                          fontSize: 10, color: "var(--hd-ink)",
                          fontFamily: "var(--hd-sans)", fontWeight: 600,
                        }}
                      >{p.cat}</div>
                      <div
                        style={{
                          position: "absolute", top: 10, right: 10,
                          width: 30, height: 30, borderRadius: 999,
                          background: g.fav ? "var(--hd-moss)" : "rgba(255,255,255,0.95)",
                          color: g.fav ? "#fff" : "var(--hd-ink-40)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >{Ico.star({ width: 13, height: 13 })}</div>
                    </div>
                    <div style={{ padding: "12px 12px 14px" }}>
                      <div
                        style={{
                          fontSize: 11, color: "var(--hd-ink-60)", marginBottom: 4,
                          fontFamily: "var(--hd-sans)",
                        }}
                      >
                        {p.brand}
                      </div>
                      <div
                        style={{
                          fontSize: 13, lineHeight: 1.3,
                          fontFamily: "var(--hd-sans)", fontWeight: 500,
                        }}
                      >
                        {p.name}
                      </div>
                      <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
                        {EFFECTS.slice(0, 4).map((e) => (
                          <EffPill key={e.id} eff={e} filled size={15} />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <TabBarSoft active="my" />
        </Screen>
      </div>
    </IPhoneFrame>
  );
}
