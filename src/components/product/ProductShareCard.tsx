"use client";

import "@/styles/hadami-tokens.css";
import * as React from "react";
import ScatterDeco from "@/components/share/ScatterDeco";
import {
  SHARE_PALETTES,
  getSharePalette,
  type SharePalette,
  type SharePaletteKey,
} from "@/lib/shareCardPalettes";
import {
  buildShareDecoTheme,
  type ShareDecoKey,
} from "@/lib/shareCardDeco";

const SC_W = 540;
const SC_H = 540;

export type CardPattern = "A" | "B" | "C";

// 旧 API 互換: 単色カラーチップ。新規実装では SHARE_PALETTES を優先利用する。
export const CARD_COLORS = SHARE_PALETTES.map((p) => ({
  label: p.label,
  value: p.swatch,
}));

export interface ProductShareCardEffect {
  label: string;
  score: number; // 該当成分数
}

export interface ProductShareCardProps {
  name: string;
  brand: string;
  productType: string;
  initials: string;
  bgColor?: string;        // 商品サムネ用フォールバック
  imageUrl?: string;
  no?: number;
  effects: ProductShareCardEffect[];
  rating?: number;          // 0-5（0/未設定なら非表示）
  comment?: string;         // 使用感コメント（空なら非表示）
  pattern?: CardPattern;
  paletteKey?: SharePaletteKey;
  deco?: ShareDecoKey;
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
        // html2canvas は <img> + object-fit: cover を正しく描画できず縦に
        // 引き伸ばすため、background-image + background-size: cover を使う。
        <div
          role="img"
          aria-label=""
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
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
    </div>
  );
}

function RatingStars({
  rating,
  accent,
  hair,
  size = 12,
}: {
  rating: number;
  accent: string;
  hair: string;
  size?: number;
}) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div
      style={{
        display: "inline-flex",
        gap: 2,
        alignItems: "center",
      }}
      aria-label={`評価 ${filled}/5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 12 12"
          aria-hidden="true"
        >
          <path
            d="M6 1l1.4 3 3.3.4-2.4 2.3.7 3.2L6 8.5l-3 1.4.7-3.2L1.3 4.4l3.3-.4z"
            fill={i <= filled ? accent : hair}
          />
        </svg>
      ))}
    </div>
  );
}

function CommentBlock({
  comment,
  ink,
  accent,
  fontSize = 12,
}: {
  comment: string;
  ink: string;
  accent: string;
  fontSize?: number;
}) {
  return (
    <div
      style={{
        fontFamily: "var(--hd-serif)",
        fontStyle: "italic",
        fontSize,
        lineHeight: 1.5,
        color: ink,
        letterSpacing: "-0.005em",
        position: "relative",
        paddingLeft: 14,
        borderLeft: `2px solid ${accent}`,
        // 長文コメントで Active Effects が下に押し出されるのを防ぐため
        // 最大 3 行で打ち切る。
        display: "-webkit-box",
        WebkitLineClamp: 3,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}
    >
      <span style={{ color: accent, marginRight: 2 }}>&ldquo;</span>
      {comment}
      <span style={{ color: accent, marginLeft: 2 }}>&rdquo;</span>
    </div>
  );
}

function EffectBars({
  effects,
  ink,
  hair,
}: {
  effects: ProductShareCardEffect[];
  ink: string;
  hair: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {effects.map((e) => (
        <div key={e.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              fontFamily: "var(--hd-serif)",
              fontSize: 12,
              flexShrink: 0,
              letterSpacing: "-0.01em",
              color: ink,
            }}
          >
            {e.label}
          </div>
          <div style={{ flex: 1, height: 1, background: hair }} />
        </div>
      ))}
    </div>
  );
}

// ── Pattern A: left photo + right data ───────────────────────────────────────

function PatternA({
  name, brand, productType, initials, bgColor, imageUrl, no,
  effects, rating, comment, palette, deco,
}: Omit<ProductShareCardProps, "pattern" | "paletteKey"> & { palette: SharePalette; deco: ShareDecoKey }) {
  const noLabel = no != null ? `No. ${String(no).padStart(3, "0")}` : "No. —";
  // コメントの有無にかかわらず effects は 4 件まで表示する。
  // コメントが長いと縦に伸びるが、CSS の overflow: hidden でクリップされる側を
  // コメントブロックに寄せている (下記 CommentBlock の maxHeight)。
  const hasComment = !!comment?.trim();
  const displayEffects = effects.slice(0, 4);
  const decoTheme = buildShareDecoTheme(deco, palette.accent);

  return (
    <div
      className="hd-root hd-softa"
      data-density="compact"
      style={{
        width: SC_W,
        height: SC_H,
        background: palette.bg,
        color: palette.ink,
        display: "grid",
        gridTemplateColumns: "260px 1fr",
        boxSizing: "border-box",
        overflow: "hidden",
        fontFamily: "var(--hd-sans)",
        position: "relative",
      }}
    >
      {/* Left: photo */}
      <div style={{ position: "relative", overflow: "hidden" }}>
        <PhotoPanel
          imageUrl={imageUrl}
          bgColor={bgColor ?? palette.accent2}
          initials={initials}
          style={{ position: "absolute", inset: 0 }}
        />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: palette.ink }} />
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

      {/* Right: data */}
      <div
        style={{
          padding: "26px 28px 22px",
          display: "flex",
          flexDirection: "column",
          borderTop: `3px solid ${palette.ink}`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* deco scatter (right pane only) */}
        <ScatterDeco items={decoTheme.scatter} seed={3} />

        <div
          style={{
            paddingBottom: 14,
            borderBottom: `1px solid ${palette.ink}`,
            position: "relative",
            zIndex: 2,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontFamily: "var(--hd-mono)",
                fontSize: 9,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: palette.ink40,
              }}
            >
              {noLabel}
            </div>
            {decoTheme.badge}
          </div>
          <div
            style={{
              fontFamily: "var(--hd-mono)",
              fontSize: 10,
              letterSpacing: "0.12em",
              color: palette.accent,
              marginTop: 6,
              textTransform: "uppercase",
            }}
          >
            {brand}
          </div>
          <div
            style={{
              fontFamily: "var(--hd-serif)",
              fontSize: 17,
              lineHeight: 1.2,
              marginTop: 4,
              letterSpacing: "-0.015em",
              color: palette.ink,
            }}
          >
            {name}
          </div>
          {rating != null && rating > 0 && (
            <div style={{ marginTop: 8 }}>
              <RatingStars rating={rating} accent={palette.accent} hair={palette.hair} size={11} />
            </div>
          )}
        </div>

        <div style={{ marginTop: 14, flex: 1, position: "relative", zIndex: 2, minHeight: 0 }}>
          {hasComment && (
            <div style={{ marginBottom: 14 }}>
              <CommentBlock
                comment={comment!.trim()}
                ink={palette.ink}
                accent={palette.accent}
                fontSize={11.5}
              />
            </div>
          )}
          {displayEffects.length > 0 && (
            <>
              <div
                style={{
                  fontFamily: "var(--hd-mono)",
                  fontSize: 9,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: palette.ink40,
                  marginBottom: 8,
                }}
              >
                Active Effects
              </div>
              <EffectBars
                effects={displayEffects}
                ink={palette.ink}
                hair={palette.hair}
              />
            </>
          )}
        </div>

        <div
          style={{
            paddingTop: 14,
            borderTop: `1px solid ${palette.hair}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            position: "relative",
            zIndex: 2,
          }}
        >
          <div style={{ fontFamily: "var(--hd-mono)", fontSize: 8, color: palette.ink40, letterSpacing: "0.14em" }}>
            #マイコスメ #スキンケア
          </div>
          <div
            style={{
              fontFamily: "var(--hd-serif)",
              fontStyle: "italic",
              fontSize: 18,
              color: palette.accent,
            }}
          >
            HADAMI
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Pattern B: full-width photo top + data below ─────────────────────────────

function PatternB({
  name, brand, productType, initials, bgColor, imageUrl,
  effects, rating, comment, palette, deco,
}: Omit<ProductShareCardProps, "pattern" | "paletteKey" | "no"> & { palette: SharePalette; deco: ShareDecoKey }) {
  const hasComment = !!comment?.trim();
  // コメントの有無にかかわらず最大 3 件まで表示。
  const displayEffects = effects.slice(0, 3);
  const decoTheme = buildShareDecoTheme(deco, palette.accent);

  return (
    <div
      className="hd-root hd-softa"
      data-density="compact"
      style={{
        width: SC_W,
        height: SC_H,
        background: palette.bg,
        color: palette.ink,
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        overflow: "hidden",
        fontFamily: "var(--hd-sans)",
      }}
    >
      {/* Photo top */}
      <div style={{ position: "relative", height: 260, flexShrink: 0, overflow: "hidden" }}>
        <PhotoPanel
          imageUrl={imageUrl}
          bgColor={bgColor ?? palette.accent2}
          initials={initials}
          style={{ position: "absolute", inset: 0 }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 55%)",
          }}
        />
        <div style={{ position: "absolute", bottom: 16, left: 20 }}>
          <div
            style={{
              fontFamily: "var(--hd-mono)",
              fontSize: 9,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.7)",
            }}
          >
            {productType}
          </div>
          <div
            style={{
              fontFamily: "var(--hd-mono)",
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.95)",
              marginTop: 3,
              fontWeight: 600,
            }}
          >
            {brand}
          </div>
        </div>
        {/* badge top-right */}
        <div
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.95)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
        >
          {React.cloneElement(decoTheme.badge, { size: 16 })}
        </div>
      </div>

      {/* Data bottom */}
      <div
        style={{
          flex: 1,
          padding: "20px 26px 18px",
          display: "flex",
          flexDirection: "column",
          borderTop: `3px solid ${palette.ink}`,
          position: "relative",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        <ScatterDeco items={decoTheme.scatter} seed={5} />
        <div style={{ position: "relative", zIndex: 2 }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <div
              style={{
                fontFamily: "var(--hd-serif)",
                fontSize: 21,
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                color: palette.ink,
                flex: 1,
                minWidth: 0,
              }}
            >
              {name}
            </div>
            {rating != null && rating > 0 && (
              <div style={{ flexShrink: 0, paddingTop: 4 }}>
                <RatingStars
                  rating={rating}
                  accent={palette.accent}
                  hair={palette.hair}
                  size={12}
                />
              </div>
            )}
          </div>
        </div>

        {hasComment && (
          <div style={{ marginTop: 14, position: "relative", zIndex: 2 }}>
            <CommentBlock
              comment={comment!.trim()}
              ink={palette.ink}
              accent={palette.accent}
              fontSize={12}
            />
          </div>
        )}

        {displayEffects.length > 0 && (
          <div style={{ flex: 1, marginTop: 14, position: "relative", zIndex: 2, minHeight: 0 }}>
            <div
              style={{
                fontFamily: "var(--hd-mono)",
                fontSize: 9,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: palette.ink40,
                marginBottom: 10,
              }}
            >
              Active Effects
            </div>
            <EffectBars
              effects={displayEffects}
              ink={palette.ink}
              hair={palette.hair}
            />
          </div>
        )}

        <div
          style={{
            marginTop: "auto",
            paddingTop: 12,
            borderTop: `1px solid ${palette.hair}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "relative",
            zIndex: 2,
          }}
        >
          <div
            style={{
              fontFamily: "var(--hd-mono)",
              fontSize: 8,
              color: palette.ink40,
              letterSpacing: "0.14em",
            }}
          >
            #マイコスメ #スキンケア
          </div>
          <div
            style={{
              fontFamily: "var(--hd-serif)",
              fontStyle: "italic",
              fontSize: 16,
              color: palette.accent,
            }}
          >
            HADAMI
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Pattern C: minimal typographic ───────────────────────────────────────────

function PatternC({
  name, brand, productType, effects, rating, comment, palette, deco,
}: Pick<ProductShareCardProps, "name" | "brand" | "productType" | "effects" | "rating" | "comment"> & {
  palette: SharePalette;
  deco: ShareDecoKey;
}) {
  const hasComment = !!comment?.trim();
  // コメントの有無にかかわらず最大 4 件まで表示。
  const displayEffects = effects.slice(0, 4);
  const decoTheme = buildShareDecoTheme(deco, palette.accent);

  return (
    <div
      className="hd-root hd-softa"
      data-density="compact"
      style={{
        width: SC_W,
        height: SC_H,
        background: palette.bg,
        color: palette.ink,
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        overflow: "hidden",
        fontFamily: "var(--hd-sans)",
        padding: "40px 48px 32px",
        position: "relative",
      }}
    >
      <ScatterDeco items={decoTheme.scatter} seed={11} />

      {/* Top rule */}
      <div
        style={{
          height: 3,
          background: palette.ink,
          marginBottom: 22,
          position: "relative",
          zIndex: 2,
        }}
      />

      {/* Type block */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          position: "relative",
          zIndex: 2,
          minHeight: 0,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div
            style={{
              fontFamily: "var(--hd-mono)",
              fontSize: 9,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: palette.ink40,
            }}
          >
            {productType}
          </div>
          {decoTheme.cornerTop}
        </div>
        <div
          style={{
            fontFamily: "var(--hd-mono)",
            fontSize: 11,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: palette.accent,
            marginBottom: 8,
            fontWeight: 600,
          }}
        >
          {brand}
        </div>
        <div
          style={{
            fontFamily: "var(--hd-serif)",
            fontSize: 30,
            lineHeight: 1.1,
            letterSpacing: "-0.025em",
            marginBottom: 14,
            color: palette.ink,
          }}
        >
          {name}
        </div>
        {rating != null && rating > 0 && (
          <div style={{ marginBottom: 18 }}>
            <RatingStars
              rating={rating}
              accent={palette.accent}
              hair={palette.hair}
              size={14}
            />
          </div>
        )}

        {hasComment && (
          <div style={{ marginBottom: 18 }}>
            <CommentBlock
              comment={comment!.trim()}
              ink={palette.ink}
              accent={palette.accent}
              fontSize={13}
            />
          </div>
        )}

        {/* Divider */}
        <div style={{ height: 1, background: palette.line, marginBottom: 18 }} />

        {/* Effects */}
        {displayEffects.length > 0 && (
          <div>
            <div
              style={{
                fontFamily: "var(--hd-mono)",
                fontSize: 9,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: palette.ink40,
                marginBottom: 12,
              }}
            >
              Active Effects
            </div>
            <EffectBars
              effects={displayEffects}
              ink={palette.ink}
              hair={palette.hair}
            />
          </div>
        )}
      </div>

      {/* Bottom rule + footer */}
      <div style={{ position: "relative", zIndex: 2 }}>
        <div style={{ height: 1, background: palette.line, marginBottom: 12 }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div
            style={{
              fontFamily: "var(--hd-mono)",
              fontSize: 8,
              color: palette.ink40,
              letterSpacing: "0.14em",
            }}
          >
            #マイコスメ #スキンケア
          </div>
          <div
            style={{
              fontFamily: "var(--hd-serif)",
              fontStyle: "italic",
              fontSize: 18,
              color: palette.accent,
            }}
          >
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
  paletteKey = "blossom",
  deco = "hearts",
  ...props
}: ProductShareCardProps) {
  const palette = getSharePalette(paletteKey);

  if (pattern === "B") {
    return <PatternB {...props} palette={palette} deco={deco} />;
  }
  if (pattern === "C") {
    return <PatternC {...props} palette={palette} deco={deco} />;
  }
  return <PatternA {...props} palette={palette} deco={deco} />;
}
