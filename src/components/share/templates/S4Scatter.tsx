"use client";

// S4: ステッカー散らし（4点をランダムに傾けて配置）
// 上部にタイトル、その下に4ステッカーを座標指定で散らす

import * as React from "react";
import ScatterDeco from "@/components/share/ScatterDeco";
import ShareProductImage from "@/components/share/ShareProductImage";
import { buildShareDecoTheme } from "@/lib/shareCardDeco";
import {
  ASPECT_DIMENSIONS,
  type ShareTemplateProps,
} from "./types";

// タイトル(～y:130)・フッター(y:500〜)に被らないよう y 範囲を 130-490 に集約。
// 左右対称に再配置: 中央寄せ + 上下行で重ならないよう間隔調整。
const ITEMS = [
  { x: 50, y: 130, size: 168, tilt: -6 },
  { x: 230, y: 140, size: 158, tilt: 5 },
  { x: 60, y: 295, size: 158, tilt: 4 },
  { x: 250, y: 295, size: 168, tilt: -4 },
];

export default function S4Scatter({
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
      <ScatterDeco items={theme.scatter} seed={5} />

      {/* ヘッダー */}
      <div style={{ padding: "24px 28px 0", position: "relative", zIndex: 2 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
              {theme.badge}
              <div
                style={{
                  fontFamily: "var(--hd-mono)",
                  fontSize: 9,
                  letterSpacing: "0.24em",
                  color: p.accent,
                  textTransform: "uppercase",
                }}
              >
                MY 4 FAVORITES
              </div>
              {theme.badge}
            </div>
            <div
              style={{
                fontFamily: "var(--hd-serif)",
                fontSize: 32,
                lineHeight: 0.95,
                letterSpacing: "-0.03em",
              }}
            >
              お気に入り<br />
              <span style={{ fontStyle: "italic", color: p.accent }}>コレクション</span>
            </div>
          </div>
          <div
            style={{
              background: p.accent,
              color: "#fff",
              padding: "5px 12px",
              borderRadius: 999,
              fontFamily: "var(--hd-mono)",
              fontSize: 8,
              letterSpacing: "0.14em",
              display: "flex",
              alignItems: "center",
              gap: 4,
              flexShrink: 0,
            }}
          >
            4 ITEMS
            {React.cloneElement(theme.badge, { color: "#fff" })}
          </div>
        </div>
      </div>

      {/* ステッカー: 4点を散らす */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 3,
        }}
      >
        {ITEMS.map((item, i) => {
          const product = products[i];
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: item.x,
                top: item.y,
                transform: `rotate(${item.tilt}deg)`,
              }}
            >
              <div
                style={{
                  background: "#fff",
                  padding: 6,
                  borderRadius: item.size * 0.22,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.08)",
                }}
              >
                <ShareProductImage
                  product={product}
                  size={item.size}
                  radius={item.size * 0.18}
                  fontSize={item.size * 0.18}
                />
                <div
                  style={{
                    textAlign: "center",
                    paddingTop: 4,
                    fontFamily: "var(--hd-serif)",
                    fontStyle: "italic",
                    fontSize: 13,
                    color: p.ink60,
                    lineHeight: 1.1,
                    maxWidth: item.size,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {i + 1}. {product?.brand || "—"}
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
          bottom: 18,
          left: 28,
          right: 28,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          zIndex: 4,
        }}
      >
        <div
          style={{
            fontFamily: "var(--hd-mono)",
            fontSize: 8.5,
            color: p.ink40,
            letterSpacing: "0.1em",
          }}
        >
          {username ? `@${username}` : ""}
          {skinType ? ` · ${skinType}` : ""}
        </div>
        <div
          style={{
            fontFamily: "var(--hd-serif)",
            fontSize: 18,
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
