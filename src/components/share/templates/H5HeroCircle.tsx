"use client";

// H5: 円形ヒーロー＋サブ3円
// 中央上に大円、下部に3小円横並び。背景に accent 色のラジアルグラデーション。

import * as React from "react";
import ScatterDeco from "@/components/share/ScatterDeco";
import ShareProductImage from "@/components/share/ShareProductImage";
import { buildShareDecoTheme } from "@/lib/shareCardDeco";
import {
  ASPECT_DIMENSIONS,
  type ShareTemplateProps,
} from "./types";

// サブ円: 元 88px → 140px に拡大（メイン縮小と合わせてバランス取り）。
// 540 - (3 * 140) = 120 → 4分割で 30 ずつ均等配置 → x: 30, 200, 370
const SUB_OUTER = 140; // 外枠サイズ
const SUB_IMAGE = 124; // 内側画像サイズ
const SUB_POSITIONS = [
  { x: 30, y: 348 },
  { x: 200, y: 348 },
  { x: 370, y: 348 },
];
const TYPE_LABELS = ["MAIN", "STEP 02", "STEP 03", "STEP 04"];

const MAIN_OUTER = 220;
const MAIN_IMAGE = 204;

export default function H5HeroCircle({
  products,
  palette: p,
  deco,
  aspect: _aspect,
  username,
  skinType,
}: ShareTemplateProps) {
  const theme = buildShareDecoTheme(deco, p.accent);
  const dim = ASPECT_DIMENSIONS["1:1"];
  const main = products[0];
  const subs = products.slice(1, 4);

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
      <ScatterDeco items={theme.scatter} seed={3} />
      {/* 右上のラジアルグラデーション */}
      <div
        style={{
          position: "absolute",
          top: -50,
          right: -50,
          width: 240,
          height: 240,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${p.accent}1f 0%, transparent 70%)`,
        }}
      />

      {/* ヘッダー */}
      <div style={{ padding: "26px 32px 0", position: "relative", zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
          {theme.accent}
          <div
            style={{
              fontFamily: "var(--hd-mono)",
              fontSize: 9,
              letterSpacing: "0.22em",
              color: p.accent,
              textTransform: "uppercase",
            }}
          >
            MY 4 PICKS
          </div>
        </div>
        <div
          style={{
            fontFamily: "var(--hd-serif)",
            fontSize: 28,
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
          }}
        >
          私の<br />
          <span style={{ fontStyle: "italic", color: p.accent }}>新定番。</span>
        </div>
      </div>

      {/* メイン大円: 中央 */}
      <div
        style={{
          position: "absolute",
          top: 110,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 3,
        }}
      >
        <div
          style={{
            width: MAIN_OUTER,
            height: MAIN_OUTER,
            borderRadius: "50%",
            padding: 8,
            background: "#fff",
            boxShadow:
              "0 12px 32px rgba(0,0,0,0.18), 0 4px 8px rgba(0,0,0,0.08)",
            position: "relative",
            boxSizing: "border-box",
          }}
        >
          <ShareProductImage
            product={main}
            size={MAIN_IMAGE}
            radius={MAIN_IMAGE / 2}
            fontSize={42}
          />
          <div
            style={{
              position: "absolute",
              top: -8,
              left: "50%",
              transform: "translateX(-50%)",
              background: p.accent,
              color: "#fff",
              padding: "4px 14px",
              borderRadius: 999,
              fontFamily: "var(--hd-mono)",
              fontSize: 8.5,
              letterSpacing: "0.18em",
              display: "flex",
              alignItems: "center",
              gap: 4,
              whiteSpace: "nowrap",
            }}
          >
            {React.cloneElement(theme.badge, { color: "#fff" })}
            MY PICK · 1
          </div>
        </div>
      </div>

      {/* サブ3円: 下部横並び */}
      {SUB_POSITIONS.map((pos, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: pos.x,
            top: pos.y,
            zIndex: 3,
          }}
        >
          <div
            style={{
              width: SUB_OUTER,
              height: SUB_OUTER,
              borderRadius: "50%",
              padding: 7,
              background: "#fff",
              boxShadow: "0 8px 18px rgba(0,0,0,0.16)",
              position: "relative",
              boxSizing: "border-box",
            }}
          >
            <ShareProductImage
              product={subs[i]}
              size={SUB_IMAGE}
              radius={SUB_IMAGE / 2}
              fontSize={28}
            />
            <div
              style={{
                position: "absolute",
                bottom: -8,
                left: "50%",
                transform: "translateX(-50%)",
                background: p.bg,
                padding: "2px 10px",
                borderRadius: 999,
                fontFamily: "var(--hd-mono)",
                fontSize: 8,
                letterSpacing: "0.1em",
                color: p.ink60,
                border: `1px solid ${p.line}`,
                whiteSpace: "nowrap",
              }}
            >
              {i + 2}. {subs[i]?.brand?.slice(0, 8) || TYPE_LABELS[i + 1]}
            </div>
          </div>
        </div>
      ))}

      {/* フッター */}
      <div
        style={{
          position: "absolute",
          bottom: 14,
          left: 0,
          right: 0,
          textAlign: "center",
          zIndex: 4,
        }}
      >
        <div
          style={{
            fontFamily: "var(--hd-mono)",
            fontSize: 8,
            color: p.ink40,
            letterSpacing: "0.14em",
          }}
        >
          {username ? `@${username}` : ""}
          {skinType ? ` · ${skinType}` : ""}
        </div>
        <div
          style={{
            fontFamily: "var(--hd-serif)",
            fontSize: 14,
            fontStyle: "italic",
            color: p.accent,
            marginTop: 2,
          }}
        >
          HADAMI
        </div>
      </div>
    </div>
  );
}
