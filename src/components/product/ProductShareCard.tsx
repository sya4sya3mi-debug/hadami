"use client";

import "@/styles/hadami-tokens.css";

const SC_W = 540;
const SC_H = 540;

export type CardPattern = "A" | "B" | "C";

export const CARD_COLORS = [
  { label: "Crimson", value: "#C8203A" },
  { label: "Coral",   value: "#F26B5E" },
  { label: "Saffron", value: "#E5A41C" },
  { label: "Olive",   value: "#6F7A2E" },
  { label: "Emerald", value: "#138A5C" },
  { label: "Teal",    value: "#0E8B8E" },
  { label: "Cobalt",  value: "#1E4FB8" },
  { label: "Lilac",   value: "#7E5BCC" },
  { label: "Plum",    value: "#7A2660" },
  { label: "Ink",     value: "#1F1F1F" },
] as const;

export interface ProductShareCardEffect {
  label: string;
  score: number; // 0-10
}

export interface ProductShareCardProps {
  name: string;
  brand: string;
  productType: string;
  initials: string;
  bgColor?: string;
  imageUrl?: string;
  no?: number;
  effects: ProductShareCardEffect[];
  rating?: number;
  pattern?: CardPattern;
  accentColor?: string;
}

// ── shared helpers ────────────────────────────────────────────────────────────

function PhotoPanel({
  imageUrl,
  bgColor,
  initials,
  style,
}: {
  imageUrl?: string;
  bgColor: string;
  initials: string;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ position: "relative", overflow: "hidden", ...style }}>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          crossOrigin="anonymous"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <>
          <div style={{ position: "absolute", inset: 0, background: bgColor }} />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `repeating-linear-gradient(45deg,rgba(255,255,255,0.07) 0 2px,transparent 2px 8px),
                           repeating-linear-gradient(-45deg,rgba(0,0,0,0.03) 0 1px,transparent 1px 6px)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(135deg,rgba(255,255,255,0.5) 0%,transparent 45%,rgba(0,0,0,0.12) 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--hd-serif)",
              fontSize: 56,
              fontStyle: "italic",
              color: "rgba(255,255,255,0.85)",
              letterSpacing: "-0.03em",
            }}
          >
            {initials}
          </div>
        </>
      )}
      {/* top rule */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "var(--hd-ink)" }} />
    </div>
  );
}

function EffectBars({
  effects,
  accent,
}: {
  effects: ProductShareCardEffect[];
  accent: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {effects.map((e) => (
        <div key={e.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            className="hd-serif"
            style={{ fontSize: 12, width: 44, letterSpacing: "-0.01em", flexShrink: 0 }}
          >
            {e.label}
          </div>
          <div style={{ flex: 1, height: 2, background: "var(--hd-hair)", position: "relative" }}>
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                height: "100%",
                width: `${(e.score / 10) * 100}%`,
                background: accent,
              }}
            />
          </div>
          <div
            style={{
              fontFamily: "var(--hd-mono)",
              fontSize: 9,
              color: "var(--hd-ink-40)",
              width: 28,
              textAlign: "right",
              flexShrink: 0,
            }}
          >
            {e.score}/10
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Pattern A: left photo + right data ───────────────────────────────────────

function PatternA({
  name, brand, productType, initials, bgColor, imageUrl, no, effects, accent,
}: Omit<ProductShareCardProps, "pattern" | "accentColor" | "rating"> & { accent: string }) {
  const noLabel = no != null ? `No. ${String(no).padStart(3, "0")}` : "No. —";
  const displayEffects = effects.slice(0, 4);

  return (
    <div
      className="hd-root hd-softa"
      data-density="compact"
      style={{
        width: SC_W,
        height: SC_H,
        background: "var(--hd-bg)",
        color: "var(--hd-ink)",
        display: "grid",
        gridTemplateColumns: "260px 1fr",
        boxSizing: "border-box",
        overflow: "hidden",
        fontFamily: "var(--hd-sans)",
      }}
    >
      {/* Left */}
      <div style={{ position: "relative", overflow: "hidden" }}>
        <PhotoPanel imageUrl={imageUrl} bgColor={bgColor ?? "#b5c4b1"} initials={initials} style={{ position: "absolute", inset: 0 }} />
        <div
          style={{
            position: "absolute",
            bottom: 32,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              writingMode: "vertical-rl",
              fontFamily: "var(--hd-mono)",
              fontSize: 9,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: imageUrl ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.7)",
              textShadow: imageUrl ? "0 1px 3px rgba(0,0,0,0.5)" : undefined,
            }}
          >
            {productType} · {brand}
          </div>
        </div>
      </div>

      {/* Right */}
      <div
        style={{
          padding: "28px 30px 24px",
          display: "flex",
          flexDirection: "column",
          borderTop: "3px solid var(--hd-ink)",
        }}
      >
        <div style={{ paddingBottom: 16, borderBottom: "1px solid var(--hd-ink)" }}>
          <div style={{ fontFamily: "var(--hd-mono)", fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--hd-ink-40)" }}>
            {noLabel}
          </div>
          <div style={{ fontFamily: "var(--hd-mono)", fontSize: 10, letterSpacing: "0.12em", color: accent, marginTop: 6, textTransform: "uppercase" }}>
            {brand}
          </div>
          <div className="hd-serif" style={{ fontSize: 18, lineHeight: 1.2, marginTop: 6, letterSpacing: "-0.015em" }}>
            {name}
          </div>
        </div>

        <div style={{ marginTop: 16, flex: 1 }}>
          <div style={{ fontFamily: "var(--hd-mono)", fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--hd-ink-40)", marginBottom: 12 }}>
            Active Effects
          </div>
          {displayEffects.length > 0
            ? <EffectBars effects={displayEffects} accent={accent} />
            : <div style={{ fontFamily: "var(--hd-mono)", fontSize: 9, color: "var(--hd-ink-40)", letterSpacing: "0.1em" }}>——</div>
          }
        </div>

        <div style={{ paddingTop: 16, borderTop: "1px solid var(--hd-hair)", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontFamily: "var(--hd-mono)", fontSize: 8, color: "var(--hd-ink-40)", letterSpacing: "0.14em" }}>
            #マイコスメ #スキンケア
          </div>
          <div className="hd-serif" style={{ fontSize: 18, fontStyle: "italic", color: accent }}>
            HADAMI
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Pattern B: full-width photo top + data below ─────────────────────────────

function PatternB({
  name, brand, productType, initials, bgColor, imageUrl, effects, accent,
}: Omit<ProductShareCardProps, "pattern" | "accentColor" | "rating" | "no"> & { accent: string }) {
  const displayEffects = effects.slice(0, 3);

  return (
    <div
      className="hd-root hd-softa"
      data-density="compact"
      style={{
        width: SC_W,
        height: SC_H,
        background: "var(--hd-bg)",
        color: "var(--hd-ink)",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        overflow: "hidden",
        fontFamily: "var(--hd-sans)",
      }}
    >
      {/* Photo top */}
      <div style={{ position: "relative", height: 280, flexShrink: 0, overflow: "hidden" }}>
        <PhotoPanel imageUrl={imageUrl} bgColor={bgColor ?? "#b5c4b1"} initials={initials} style={{ position: "absolute", inset: 0 }} />
        {/* bottom gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 55%)" }} />
        {/* bottom-left brand */}
        <div style={{ position: "absolute", bottom: 16, left: 20 }}>
          <div style={{ fontFamily: "var(--hd-mono)", fontSize: 9, letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)" }}>
            {productType}
          </div>
          <div style={{ fontFamily: "var(--hd-mono)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.95)", marginTop: 3, fontWeight: 600 }}>
            {brand}
          </div>
        </div>
      </div>

      {/* Data bottom */}
      <div style={{ flex: 1, padding: "22px 28px 20px", display: "flex", flexDirection: "column", borderTop: "3px solid var(--hd-ink)" }}>
        <div className="hd-serif" style={{ fontSize: 22, lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 18 }}>
          {name}
        </div>

        {displayEffects.length > 0 && (
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--hd-mono)", fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--hd-ink-40)", marginBottom: 10 }}>
              Active Effects
            </div>
            <EffectBars effects={displayEffects} accent={accent} />
          </div>
        )}

        <div style={{ marginTop: "auto", paddingTop: 14, borderTop: "1px solid var(--hd-hair)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "var(--hd-mono)", fontSize: 8, color: "var(--hd-ink-40)", letterSpacing: "0.14em" }}>
            #マイコスメ #スキンケア
          </div>
          <div className="hd-serif" style={{ fontSize: 16, fontStyle: "italic", color: accent }}>
            HADAMI
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Pattern C: minimal typographic ───────────────────────────────────────────

function PatternC({
  name, brand, productType, effects, accent,
}: Pick<ProductShareCardProps, "name" | "brand" | "productType" | "effects"> & { accent: string }) {
  const displayEffects = effects.slice(0, 4);

  return (
    <div
      className="hd-root hd-softa"
      data-density="compact"
      style={{
        width: SC_W,
        height: SC_H,
        background: "var(--hd-bg)",
        color: "var(--hd-ink)",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        overflow: "hidden",
        fontFamily: "var(--hd-sans)",
        padding: "44px 52px 36px",
      }}
    >
      {/* Top rule */}
      <div style={{ height: 3, background: "var(--hd-ink)", marginBottom: 28 }} />

      {/* Type block */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontFamily: "var(--hd-mono)", fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--hd-ink-40)", marginBottom: 10 }}>
          {productType}
        </div>
        <div style={{ fontFamily: "var(--hd-mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: accent, marginBottom: 10, fontWeight: 600 }}>
          {brand}
        </div>
        <div className="hd-serif" style={{ fontSize: 34, lineHeight: 1.1, letterSpacing: "-0.025em", marginBottom: 28 }}>
          {name}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--hd-line)", marginBottom: 24 }} />

        {/* Effects */}
        {displayEffects.length > 0 && (
          <div>
            <div style={{ fontFamily: "var(--hd-mono)", fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--hd-ink-40)", marginBottom: 14 }}>
              Active Effects
            </div>
            <EffectBars effects={displayEffects} accent={accent} />
          </div>
        )}
      </div>

      {/* Bottom rule + footer */}
      <div>
        <div style={{ height: 1, background: "var(--hd-line)", marginBottom: 14 }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontFamily: "var(--hd-mono)", fontSize: 8, color: "var(--hd-ink-40)", letterSpacing: "0.14em" }}>
            #マイコスメ #スキンケア
          </div>
          <div className="hd-serif" style={{ fontSize: 18, fontStyle: "italic", color: accent }}>
            HADAMI
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function ProductShareCard({
  pattern = "A",
  accentColor = CARD_COLORS[0].value,
  ...props
}: ProductShareCardProps) {
  const accent = accentColor;

  if (pattern === "B") {
    return <PatternB {...props} accent={accent} />;
  }
  if (pattern === "C") {
    return <PatternC {...props} accent={accent} />;
  }
  return <PatternA {...props} accent={accent} />;
}
