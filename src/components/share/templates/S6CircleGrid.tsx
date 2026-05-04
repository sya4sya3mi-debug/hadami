"use client";

// S6: 円形ステッカー4点・田の字
// 中央上にタイトル、4つの円形商品を 2×2 配置で散らす

import * as React from "react";
import ScatterDeco from "@/components/share/ScatterDeco";
import ShareProductImage from "@/components/share/ShareProductImage";
import { buildShareDecoTheme } from "@/lib/shareCardDeco";
import {
  ASPECT_DIMENSIONS,
  type ShareTemplateProps,
} from "./types";

// 円形ステッカー: 元 148px → 180px に拡大。
// 540 横に 2 列。outer = 180 + 16(padding) = 196 → 残 540-2*196 = 148 → 4分割 で約 37 ずつ
// y は title (~y:100) と footer (y: 498~) を避けて 120-466 にレイアウト。
const POSITIONS = [
  { x: 30, y: 120, tilt: -5 },
  { x: 314, y: 105, tilt: 4 },
  { x: 26, y: 290, tilt: 4 },
  { x: 318, y: 280, tilt: -4 },
];
const SIZE = 180;

export default function S6CircleGrid({
  products,
  palette: p,
  deco,
  aspect: _aspect,
  username,
  skinType,
}: ShareTemplateProps) {
  const theme = buildShareDecoTheme(deco, p.accent);
  const dim = ASPECT_DIMENSIONS["1:1"];

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
      <ScatterDeco items={theme.scatter} seed={9} />

      {/* タイトル: 中央寄せ */}
      <div
        style={{
          padding: "22px 28px 0",
          position: "relative",
          zIndex: 2,
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            justifyContent: "center",
          }}
        >
          {theme.badge}
          <div
            style={{
              fontFamily: "var(--hd-mono)",
              fontSize: 9,
              letterSpacing: "0.28em",
              color: p.accent,
              textTransform: "uppercase",
            }}
          >
            MY 4 PICKS
          </div>
          {theme.badge}
        </div>
        <div
          style={{
            fontFamily: "var(--hd-serif)",
            fontSize: 28,
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
            marginTop: 6,
          }}
        >
          わたしの
          <span style={{ fontStyle: "italic", color: p.accent }}>偏愛コスメ</span>
        </div>
      </div>

      {/* 円形4点 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 3,
        }}
      >
        {POSITIONS.map((pos, i) => {
          const product = products[i];
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: pos.x,
                top: pos.y,
                transform: `rotate(${pos.tilt}deg)`,
              }}
            >
              <div
                style={{
                  width: SIZE + 16,
                  height: SIZE + 16,
                  borderRadius: "50%",
                  padding: 8,
                  background: "#fff",
                  boxShadow:
                    "0 8px 22px rgba(0,0,0,0.18), 0 2px 4px rgba(0,0,0,0.08)",
                  position: "relative",
                  boxSizing: "border-box",
                }}
              >
                <ShareProductImage
                  product={product}
                  size={SIZE}
                  radius={SIZE / 2}
                  fontSize={26}
                />
                {/* ステップ */}
                <div
                  style={{
                    position: "absolute",
                    top: -4,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: p.accent,
                    color: "#fff",
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--hd-serif)",
                    fontSize: 13,
                    fontStyle: "italic",
                  }}
                >
                  {i + 1}
                </div>
                {/* キャプション: ブランド名 */}
                <div
                  style={{
                    position: "absolute",
                    bottom: -12,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: p.bg,
                    padding: "2px 10px",
                    borderRadius: 999,
                    fontFamily: "var(--hd-serif)",
                    fontStyle: "italic",
                    fontSize: 12,
                    color: p.ink60,
                    border: `1px solid ${p.line}`,
                    whiteSpace: "nowrap",
                    maxWidth: 130,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {product?.brand || "—"}
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
          bottom: 14,
          left: 28,
          right: 28,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 4,
        }}
      >
        <div
          style={{
            fontFamily: "var(--hd-mono)",
            fontSize: 8,
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
            fontSize: 16,
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
