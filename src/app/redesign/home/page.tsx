"use client";

import * as React from "react";
import { Screen, StatusBar } from "@/components/redesign/apothecary/Screen";
import { TabBarA } from "@/components/redesign/apothecary/TabBarA";
import { Thumb } from "@/components/redesign/apothecary/Thumb";
import { Ico } from "@/components/redesign/apothecary/Icons";
import { PRODUCTS } from "@/components/redesign/apothecary/tokens";
import { IPhoneFrame } from "@/components/redesign/apothecary/IPhoneFrame";

const apo = { border: "1px solid var(--hd-hair)" };

const ROUTINE = [
  { key: "heartleaf", step: "01", type: "TONER" },
  { key: "cica",      step: "02", type: "SERUM" },
  { key: "madeca",    step: "03", type: "CREAM" },
  { key: "pcalm",     step: "04", type: "SPF 50+" },
];

export default function HomePage() {
  const [checked, setChecked] = React.useState<Record<string, boolean>>({ heartleaf: true });
  const done = Object.values(checked).filter(Boolean).length;

  return (
    <IPhoneFrame>
      <Screen>
        <StatusBar />

        {/* Header */}
        <div style={{ padding: "8px 24px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div className="hd-mono hd-caps" style={{ color: "var(--hd-ink-40)", marginBottom: 10 }}>
                25 APR · TUE · 朝
              </div>
              <div className="hd-serif" style={{ lineHeight: 1.0, letterSpacing: "-0.02em", fontSize: 32 }}>
                Good morning,<br />
                <span style={{ fontStyle: "italic" }}>みお.</span>
              </div>
            </div>
            <div
              style={{
                width: 40, height: 40, borderRadius: 999, background: "var(--hd-moss)",
                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--hd-serif)", fontSize: 18,
              }}
            >み</div>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "0 0 24px" }}>
          {/* Routine */}
          <div style={{ padding: "0 24px" }}>
            <div
              style={{
                display: "flex", alignItems: "baseline", justifyContent: "space-between",
                paddingBottom: 12, borderBottom: "1px solid var(--hd-ink)",
              }}
            >
              <div>
                <div className="hd-mono hd-caps" style={{ color: "var(--hd-ink-40)" }}>Morning Ritual</div>
                <div className="hd-serif" style={{ fontSize: 20, marginTop: 4 }}>朝のルーティン</div>
              </div>
              <div className="hd-mono" style={{ fontSize: 12, color: "var(--hd-ink-60)" }}>
                {String(done).padStart(2, "0")} / 04
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
                      padding: "18px 0", display: "flex", alignItems: "center", gap: 16,
                      borderBottom: i < ROUTINE.length - 1 ? "1px solid var(--hd-hair)" : "none",
                      cursor: "pointer", opacity: on ? 0.55 : 1,
                      transition: "opacity .2s",
                    }}
                  >
                    <div
                      className="hd-mono"
                      style={{
                        width: 22, fontSize: 11, color: "var(--hd-ink-40)",
                        textDecoration: on ? "line-through" : "none",
                      }}
                    >{r.step}</div>
                    <Thumb p={p} size={50} apo />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="hd-mono hd-caps" style={{ color: "var(--hd-ink-40)", marginBottom: 4 }}>
                        {r.type} — {p.brand}
                      </div>
                      <div className="hd-serif" style={{ fontSize: 16, lineHeight: 1.25, letterSpacing: "-0.01em" }}>
                        {p.name}
                      </div>
                    </div>
                    <div
                      style={{
                        width: 22, height: 22, borderRadius: 999,
                        border: on ? "none" : "1px solid var(--hd-ink-40)",
                        background: on ? "var(--hd-ink)" : "transparent",
                        color: "var(--hd-bg)",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}
                    >
                      {on && (
                        <span key={`chk-${r.key}-on`} className="hd-pop-in" style={{ display: "flex" }}>
                          {Ico.check({ width: 10, height: 10, strokeWidth: 2 })}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stats strip */}
          <div
            style={{
              margin: "32px 0 0", padding: "24px",
              borderTop: "1px solid var(--hd-hair)",
              borderBottom: "1px solid var(--hd-hair)",
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0,
            }}
          >
            {[
              { n: "111", l: "成分コレクト" },
              { n: "025", l: "マイコスメ" },
              { n: "031", l: "スキャン回数" },
            ].map((s, i) => (
              <div
                key={s.l}
                style={{
                  padding: "0 8px", textAlign: "center",
                  borderLeft: i > 0 ? "1px solid var(--hd-hair)" : "none",
                }}
              >
                <div className="hd-serif" style={{ fontSize: 34, lineHeight: 1, letterSpacing: "-0.02em" }}>
                  {s.n}
                </div>
                <div
                  className="hd-mono hd-caps"
                  style={{ color: "var(--hd-ink-40)", marginTop: 8, fontSize: 9 }}
                >{s.l}</div>
              </div>
            ))}
          </div>

          {/* Ingredient memo */}
          <div style={{ padding: "32px 24px 24px" }}>
            <div className="hd-mono hd-caps" style={{ color: "var(--hd-ink-40)" }}>
              Today&apos;s Ingredient · No. 03
            </div>
            <div
              className="hd-serif"
              style={{ fontSize: 22, lineHeight: 1.25, marginTop: 14, letterSpacing: "-0.01em" }}
            >
              ツボクサエキス <span style={{ fontStyle: "italic", color: "var(--hd-moss)" }}>Centella Asiatica</span> —<br />
              韓国では「鎮静の王様」と称される、★3 のレア成分。
            </div>
            <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10 }}>
              <span
                className="hd-mono"
                style={{
                  fontSize: 10, letterSpacing: "0.2em",
                  borderBottom: "1px solid var(--hd-ink)", paddingBottom: 2,
                }}
              >READ ESSAY</span>
              {Ico.chev({ width: 10, height: 10 })}
            </div>
          </div>

          {/* Recent scans */}
          <div style={{ padding: "16px 0 0 24px" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", paddingRight: 24 }}>
              <div className="hd-mono hd-caps" style={{ color: "var(--hd-ink-40)" }}>Recent Scans · 最近</div>
              <div
                className="hd-mono"
                style={{ fontSize: 10, color: "var(--hd-ink-60)", letterSpacing: "0.15em" }}
              >VIEW ALL →</div>
            </div>
            <div
              style={{
                display: "flex", gap: 12, marginTop: 14,
                overflowX: "auto", paddingBottom: 6, paddingRight: 24,
              }}
            >
              {(["lano", "pcalm", "verveine", "toner"] as const).map((k) => {
                const p = PRODUCTS[k];
                return (
                  <div key={k} style={{ width: 128, flexShrink: 0 }}>
                    <div
                      style={{
                        width: 128, height: 156, background: p.color,
                        position: "relative", overflow: "hidden", border: apo.border,
                      }}
                    >
                      <Thumb p={p} size={128} radius={0} border={false} apo />
                      <div
                        style={{
                          position: "absolute", bottom: 8, left: 8, right: 8,
                          background: "rgba(255,255,255,0.9)", padding: "4px 8px",
                        }}
                      >
                        <div className="hd-mono hd-caps" style={{ fontSize: 8, color: "var(--hd-ink-60)" }}>
                          {p.cat}
                        </div>
                      </div>
                    </div>
                    <div className="hd-serif" style={{ fontSize: 13, marginTop: 8, lineHeight: 1.3 }}>
                      {p.name}
                    </div>
                    <div
                      className="hd-mono hd-caps"
                      style={{ fontSize: 8, color: "var(--hd-ink-40)", marginTop: 4 }}
                    >{p.brand}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <TabBarA active="home" />
      </Screen>
    </IPhoneFrame>
  );
}
