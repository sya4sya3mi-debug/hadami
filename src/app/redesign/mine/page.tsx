"use client";

import * as React from "react";
import { Screen, StatusBar } from "@/components/redesign/apothecary/Screen";
import { TabBarA } from "@/components/redesign/apothecary/TabBarA";
import { Thumb } from "@/components/redesign/apothecary/Thumb";
import { EffPill } from "@/components/redesign/apothecary/EffPill";
import { Ico } from "@/components/redesign/apothecary/Icons";
import { PRODUCTS, EFFECTS } from "@/components/redesign/apothecary/tokens";
import { IPhoneFrame } from "@/components/redesign/apothecary/IPhoneFrame";

const apo = { border: "1px solid var(--hd-hair)", cardBg: "var(--hd-surface)" };

const GRID = [
  { key: "toner",  fav: true },
  { key: "lano",   fav: false },
  { key: "pcalm",  fav: true },
  { key: "madeca", fav: false },
];

const FILTERS = [
  { id: "fav",   jp: "お気に入り", en: "FAV",   icon: Ico.star },
  { id: "all",   jp: "すべて",     en: "ALL",   icon: undefined },
  { id: "toner", jp: "化粧水",     en: "TONER", icon: undefined },
  { id: "serum", jp: "美容液",     en: "SERUM", icon: undefined },
  { id: "cream", jp: "クリーム",   en: "CREAM", icon: undefined },
  { id: "spf",   jp: "日焼け止め", en: "SPF",   icon: undefined },
];

export default function MinePage() {
  const [filter, setFilter] = React.useState("all");

  return (
    <IPhoneFrame>
      <Screen>
        <StatusBar />

        <div style={{ padding: "4px 24px 16px" }}>
          <div className="hd-mono hd-caps" style={{ color: "var(--hd-ink-40)" }}>
            My Cosmetics · 025
          </div>
          <div
            style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "flex-end", marginTop: 4,
            }}
          >
            <div
              className="hd-serif"
              style={{ letterSpacing: "-0.02em", lineHeight: 1.05, fontSize: 28 }}
            >
              Personal<br />
              <span style={{ fontStyle: "italic" }}>collection.</span>
            </div>
            <div style={{ display: "flex", border: "1px solid var(--hd-ink)" }}>
              {(["grid", "list"] as const).map((m, i) => (
                <div
                  key={m}
                  style={{
                    padding: "8px 10px",
                    background: i === 0 ? "var(--hd-ink)" : "transparent",
                    color: i === 0 ? "var(--hd-bg)" : "var(--hd-ink)",
                    borderLeft: i > 0 ? "1px solid var(--hd-ink)" : "none",
                    display: "flex", alignItems: "center",
                  }}
                >
                  {i === 0 ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <rect x="1" y="1" width="5" height="5" />
                      <rect x="8" y="1" width="5" height="5" />
                      <rect x="1" y="8" width="5" height="5" />
                      <rect x="8" y="8" width="5" height="5" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <path d="M1 3h12M1 7h12M1 11h12" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ padding: "0 24px 14px", overflowX: "auto", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {FILTERS.map((f) => {
              const on = filter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
                    padding: "8px 12px", cursor: "pointer",
                    background: on ? "var(--hd-ink)" : "transparent",
                    color: on ? "var(--hd-bg)" : "var(--hd-ink)",
                    border: on ? "none" : "1px solid var(--hd-line)",
                  }}
                >
                  {f.icon && f.icon({ width: 10, height: 10 })}
                  <span className="hd-serif" style={{ fontSize: 12 }}>{f.jp}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "0 24px 24px" }}>
          <div className="hd-stagger" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {GRID.map((g, i) => {
              const p = PRODUCTS[g.key];
              return (
                <div key={i} style={{ border: apo.border, background: apo.cardBg }}>
                  <div
                    style={{
                      position: "relative", width: "100%", aspectRatio: "1/1.15",
                      background: p.color, overflow: "hidden",
                    }}
                  >
                    <Thumb p={p} size="100%" radius={0} border={false} apo />
                    <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 4 }}>
                      <div
                        className="hd-mono"
                        style={{
                          fontSize: 8, letterSpacing: "0.15em",
                          background: "rgba(255,255,255,0.9)", padding: "3px 6px",
                          color: "var(--hd-ink)", textTransform: "uppercase",
                        }}
                      >{p.cat}</div>
                    </div>
                    <div
                      style={{
                        position: "absolute", top: 8, right: 8,
                        display: "flex", flexDirection: "column", gap: 6,
                      }}
                    >
                      <div
                        style={{
                          width: 26, height: 26, borderRadius: 999,
                          background: g.fav ? "var(--hd-ink)" : "rgba(255,255,255,0.9)",
                          color: g.fav ? "var(--hd-bg)" : "var(--hd-ink-40)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >{Ico.star({ width: 11, height: 11 })}</div>
                      <div
                        style={{
                          width: 26, height: 26, borderRadius: 999,
                          background: "rgba(255,255,255,0.9)", color: "var(--hd-ink-40)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >{Ico.close({ width: 10, height: 10 })}</div>
                    </div>
                  </div>
                  <div style={{ padding: "12px 12px 14px" }}>
                    <div
                      className="hd-mono hd-caps"
                      style={{ color: "var(--hd-ink-40)", marginBottom: 4 }}
                    >
                      {p.brand} — {String(i + 1).padStart(3, "0")}
                    </div>
                    <div
                      className="hd-serif"
                      style={{ fontSize: 14, lineHeight: 1.25, letterSpacing: "-0.01em" }}
                    >{p.name}</div>
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

        <TabBarA active="my" />
      </Screen>
    </IPhoneFrame>
  );
}
