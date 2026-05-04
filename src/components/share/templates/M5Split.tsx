"use client";

// M5: 上下スプリット雑誌風
// 上部: メイン商品全面 + マガジンタイトル + EDITOR'S CHOICE
// 下部: メイン商品情報 + サブ3点ストリップ + フッター

import * as React from "react";
import ScatterDeco from "@/components/share/ScatterDeco";
import ShareProductImage from "@/components/share/ShareProductImage";
import { buildShareDecoTheme } from "@/lib/shareCardDeco";
import {
  ASPECT_DIMENSIONS,
  type ShareTemplateProps,
} from "./types";

export default function M5Split({
  products,
  palette: p,
  deco,
  aspect: _aspect,
  username,
  skinType,
}: ShareTemplateProps) {
  const theme = buildShareDecoTheme(deco, p.accent);
  // ヒーローエリアは accent が白系の方が映えるので、scatter 用のテーマを別構築
  const overlayTheme = buildShareDecoTheme(deco, "rgba(255,255,255,0.5)");
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
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 上部 */}
      <div
        style={{
          height: 360,
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <ShareProductImage product={main} size="100%" fontSize={72} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.42) 0%, transparent 30%, transparent 60%, rgba(0,0,0,0.52) 100%)",
          }}
        />
        <ScatterDeco items={overlayTheme.scatter} seed={4} />

        {/* 上部マガジンタイトル */}
        <div
          style={{
            position: "absolute",
            top: 22,
            left: 0,
            right: 0,
            textAlign: "center",
            zIndex: 3,
          }}
        >
          <div
            style={{
              fontFamily: "var(--hd-mono)",
              fontSize: 8,
              letterSpacing: "0.34em",
              color: "rgba(255,255,255,0.9)",
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            VOL.05 · MY 4 PICKS
          </div>
          <div
            style={{
              fontFamily: "var(--hd-serif)",
              fontSize: 56,
              lineHeight: 1,
              letterSpacing: "-0.04em",
              color: "#fff",
              fontStyle: "italic",
              textShadow: "0 2px 12px rgba(0,0,0,0.35)",
            }}
          >
            HADAMI
          </div>
        </div>

        {/* 下部 EDITOR'S CHOICE バッジ */}
        <div
          style={{
            position: "absolute",
            bottom: 18,
            left: 22,
            right: 22,
            zIndex: 3,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              background: p.accent,
              color: "#fff",
              padding: "4px 12px",
              borderRadius: 4,
              fontFamily: "var(--hd-mono)",
              fontSize: 9,
              letterSpacing: "0.16em",
              marginBottom: 8,
            }}
          >
            {React.cloneElement(theme.badge, { color: "#fff" })}
            EDITOR&apos;S CHOICE
          </div>
          <div
            style={{
              fontFamily: "var(--hd-serif)",
              fontSize: 26,
              lineHeight: 1,
              letterSpacing: "-0.03em",
              color: "#fff",
              textShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            毎朝、これから<span style={{ fontStyle: "italic" }}>はじまる。</span>
          </div>
        </div>
      </div>

      {/* 下部情報エリア */}
      <div
        style={{
          flex: 1,
          padding: "14px 22px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          minHeight: 0,
        }}
      >
        {/* FEATURE 行 */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              background: p.accent,
              color: "#fff",
              padding: "2px 8px",
              fontFamily: "var(--hd-mono)",
              fontSize: 8.5,
              letterSpacing: "0.16em",
              flexShrink: 0,
            }}
          >
            FEATURE
          </div>
          <div
            style={{
              fontFamily: "var(--hd-mono)",
              fontSize: 8.5,
              letterSpacing: "0.18em",
              color: p.accent,
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 140,
              flexShrink: 0,
            }}
          >
            {main?.brand || "BRAND"}
          </div>
          <div style={{ flex: 1, height: 1, background: p.line }} />
          <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <svg key={i} width="10" height="10" viewBox="0 0 12 12" aria-hidden="true">
                <path
                  d="M6 1l1.4 3 3.3.4-2.4 2.3.7 3.2L6 8.5l-3 1.4.7-3.2L1.3 4.4l3.3-.4z"
                  fill={i <= 4 ? p.accent : p.hair}
                />
              </svg>
            ))}
          </div>
        </div>

        {/* サブ3点 */}
        <div style={{ display: "flex", gap: 10 }}>
          {[0, 1, 2].map((i) => {
            const sub = subs[i];
            return (
              <div
                key={i}
                style={{ flex: 1, display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}
              >
                <ShareProductImage product={sub} size={36} radius={6} fontSize={11} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontFamily: "var(--hd-mono)",
                      fontSize: 7,
                      color: p.accent,
                      letterSpacing: "0.1em",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      textTransform: "uppercase",
                    }}
                  >
                    {sub?.brand?.slice(0, 12) || "—"}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--hd-mono)",
                      fontSize: 7.5,
                      color: p.ink60,
                      marginTop: 1,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    STEP {i + 2}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* フッター */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 6,
            borderTop: `1px solid ${p.line}`,
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
            }}
          >
            HADAMI ✦
          </div>
        </div>
      </div>
    </div>
  );
}
