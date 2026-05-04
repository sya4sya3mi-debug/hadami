"use client";

// S5: ステッカー風 2×2 グリッド（4点均等）
// 1:1 と 9:16 で同じ思想（タイトル上部 + 2x2 グリッド + フッター）

import * as React from "react";
import ScatterDeco from "@/components/share/ScatterDeco";
import ShareProductImage from "@/components/share/ShareProductImage";
import { buildShareDecoTheme } from "@/lib/shareCardDeco";
import {
  ASPECT_DIMENSIONS,
  type ShareTemplateProps,
} from "./types";

const TILTS = [-3, 2, 3, -2];

export default function S5Grid2x2({
  products,
  palette: p,
  deco,
  aspect,
  username,
  skinType,
}: ShareTemplateProps) {
  const theme = buildShareDecoTheme(deco, p.accent);
  const dim = ASPECT_DIMENSIONS[aspect];
  const isPortrait = aspect === "9:16";

  const titlePad = isPortrait ? "32px 24px 18px" : "22px 32px 14px";
  const gridPad = isPortrait ? "0 24px" : "0 28px";
  const gridGap = isPortrait ? 18 : 16;
  const cardRadius = isPortrait ? 16 : 14;
  const cardPad = isPortrait ? 8 : 7;
  const titleSize = isPortrait ? 34 : 28;
  const titleLine = isPortrait ? 1.0 : 0.95;
  const subSize = isPortrait ? 11 : 8.5;
  const titleStepFlex = isPortrait ? 1.6 : 1; // 9:16 はグリッドにより多めの高さ
  const stepLabelSize = isPortrait ? 26 : 22;
  const stepLabelFont = isPortrait ? 13 : 12;

  return (
    <div
      style={{
        width: dim.width,
        height: dim.height,
        background: p.bg,
        fontFamily: "var(--hd-sans)",
        color: p.ink,
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <ScatterDeco items={theme.scatter} seed={7} />

      {/* タイトル */}
      <div style={{ padding: titlePad, position: "relative", zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {theme.cornerTop}
          <div
            style={{
              fontFamily: "var(--hd-serif)",
              fontSize: titleSize,
              lineHeight: titleLine,
              letterSpacing: "-0.03em",
            }}
          >
            私の
            <span style={{ fontStyle: "italic", color: p.accent }}>
              {isPortrait ? "4ピックス" : "4ステップ"}
            </span>
          </div>
        </div>
        <div
          style={{
            fontFamily: "var(--hd-mono)",
            fontSize: subSize,
            letterSpacing: "0.18em",
            color: p.ink40,
            textTransform: "uppercase",
            marginTop: 6,
          }}
        >
          MY 4 PICKS · COSMETICS
        </div>
      </div>

      {/* 2×2 グリッド */}
      <div
        style={{
          padding: gridPad,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: gridGap,
          position: "relative",
          zIndex: 2,
          flex: titleStepFlex,
          alignContent: isPortrait ? "center" : "flex-start",
          height: isPortrait ? `calc(100% - 200px)` : undefined,
          alignItems: "center",
        }}
      >
        {[0, 1, 2, 3].map((i) => {
          const product = products[i];
          return (
            <div key={i} style={{ transform: `rotate(${TILTS[i]}deg)` }}>
              <div
                style={{
                  background: "#fff",
                  padding: cardPad,
                  borderRadius: cardRadius,
                  boxShadow: "0 7px 20px rgba(0,0,0,0.14)",
                }}
              >
                <div
                  style={{
                    aspectRatio: "1 / 1",
                    borderRadius: cardRadius - 6,
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <ShareProductImage
                    product={product}
                    size="100%"
                    fontSize={isPortrait ? 30 : 22}
                    radius={cardRadius - 6}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: 5,
                      left: 5,
                      width: stepLabelSize,
                      height: stepLabelSize,
                      borderRadius: "50%",
                      background: p.accent,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--hd-serif)",
                      fontSize: stepLabelFont,
                      fontStyle: "italic",
                    }}
                  >
                    {i + 1}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 4px 2px",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--hd-serif)",
                      fontStyle: "italic",
                      fontSize: isPortrait ? 14 : 12,
                      color: p.ink60,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    {product?.brand || "—"}
                  </div>
                  <div style={{ flexShrink: 0, marginLeft: 4 }}>{theme.badge}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* フッター */}
      <div
        style={{
          position: "absolute",
          bottom: isPortrait ? 24 : 14,
          left: isPortrait ? 24 : 28,
          right: isPortrait ? 24 : 28,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 4,
        }}
      >
        <div
          style={{
            fontFamily: "var(--hd-mono)",
            fontSize: isPortrait ? 10 : 8,
            color: p.ink40,
            letterSpacing: "0.12em",
          }}
        >
          {username ? `@${username}` : ""}
          {skinType ? ` · ${skinType}` : ""}
        </div>
        <div
          style={{
            fontFamily: "var(--hd-serif)",
            fontSize: isPortrait ? 20 : 16,
            fontStyle: "italic",
            color: p.accent,
          }}
        >
          HADAMI
        </div>
      </div>
    </div>
  );
}
