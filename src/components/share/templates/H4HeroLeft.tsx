"use client";

// H4: 左ヒーロー＋右3点縦並び
// 1:1 (540×540) と 9:16 (360×640) の2バリアント

import * as React from "react";
import ScatterDeco from "@/components/share/ScatterDeco";
import ShareProductImage from "@/components/share/ShareProductImage";
import { buildShareDecoTheme } from "@/lib/shareCardDeco";
import {
  ASPECT_DIMENSIONS,
  shortName,
  type ShareTemplateProps,
} from "./types";

export default function H4HeroLeft({
  products,
  palette: p,
  deco,
  aspect,
  username,
  skinType,
}: ShareTemplateProps) {
  const theme = buildShareDecoTheme(deco, p.accent);
  const main = products[0];
  const subs = products.slice(1, 4);
  const dim = ASPECT_DIMENSIONS[aspect];

  if (aspect === "9:16") {
    return (
      <div
        style={{
          width: dim.width,
          height: dim.height,
          background: p.bg,
          fontFamily: "var(--hd-sans)",
          color: p.ink,
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* 上部：大ヒーロー (約 65% 高さ) */}
        <div
          style={{
            height: Math.round(dim.height * 0.66),
            position: "relative",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <ShareProductImage product={main} size="100%" fontSize={56} />

          {/* 上部ラベル */}
          <div
            style={{
              position: "absolute",
              top: 18,
              left: 18,
              right: 18,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "rgba(255,255,255,0.95)",
                padding: "5px 12px",
                borderRadius: 999,
                fontFamily: "var(--hd-mono)",
                fontSize: 9,
                letterSpacing: "0.18em",
                color: p.accent,
                textTransform: "uppercase",
              }}
            >
              {theme.badge}
              STEP 01 · MAIN
            </div>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.95)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
              }}
            >
              {React.cloneElement(theme.badge, { size: 14 })}
            </div>
          </div>

          {/* 下部商品名 */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "40px 20px 16px",
              background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--hd-mono)",
                fontSize: 9,
                letterSpacing: "0.18em",
                color: "rgba(255,255,255,0.85)",
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              {main?.brand || ""}
            </div>
            <div
              style={{
                fontFamily: "var(--hd-serif)",
                fontSize: 22,
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                color: "#fff",
              }}
            >
              {shortName(main?.name ?? "", 3)}
            </div>
          </div>
        </div>

        {/* 下部：タイトル＋サブ3点 */}
        <div
          style={{
            flex: 1,
            padding: "20px 20px 18px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          <ScatterDeco items={theme.scatter} seed={17} />
          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
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
                MY CARE · 4 ITEMS
              </div>
            </div>
            <div
              style={{
                fontFamily: "var(--hd-serif)",
                fontSize: 26,
                lineHeight: 0.96,
                letterSpacing: "-0.025em",
              }}
            >
              お気に入り
              <br />
              <span style={{ fontStyle: "italic", color: p.accent }}>4選。</span>
            </div>
          </div>

          {/* サブ3点：横並び */}
          <div style={{ display: "flex", gap: 8, position: "relative", zIndex: 2 }}>
            {[0, 1, 2].map((i) => {
              const s = subs[i];
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    aspectRatio: "1 / 1",
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: 8,
                  }}
                >
                  <ShareProductImage product={s} size="100%" fontSize={20} radius={8} />
                  <div
                    style={{
                      position: "absolute",
                      top: 4,
                      left: 4,
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.95)",
                      color: p.accent,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--hd-serif)",
                      fontSize: 10,
                      fontStyle: "italic",
                      fontWeight: 600,
                    }}
                  >
                    {i + 2}
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
              alignItems: "flex-end",
              position: "relative",
              zIndex: 2,
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
                fontSize: 14,
                fontStyle: "italic",
                color: p.accent,
              }}
            >
              HADAMI
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 1:1 版
  return (
    <div
      style={{
        width: dim.width,
        height: dim.height,
        background: p.bg,
        fontFamily: "var(--hd-sans)",
        color: p.ink,
        display: "grid",
        gridTemplateColumns: "1fr 160px",
        boxSizing: "border-box",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* 左：大ヒーロー */}
      <div style={{ position: "relative", overflow: "hidden" }}>
        <ShareProductImage product={main} size="100%" fontSize={48} />
        <div style={{ position: "absolute", top: 22, left: 22 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,255,255,0.95)",
              padding: "5px 14px",
              borderRadius: 999,
              fontFamily: "var(--hd-mono)",
              fontSize: 9,
              letterSpacing: "0.18em",
              color: p.accent,
              textTransform: "uppercase",
            }}
          >
            {theme.badge}
            STEP 01 · MAIN
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            top: 22,
            right: 22,
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.95)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
          }}
        >
          {React.cloneElement(theme.badge, { size: 18 })}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "40px 22px 20px",
            background: "linear-gradient(to top, rgba(0,0,0,0.58), transparent)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--hd-mono)",
              fontSize: 9,
              letterSpacing: "0.18em",
              color: "rgba(255,255,255,0.85)",
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            {main?.brand || ""}
          </div>
          <div
            style={{
              fontFamily: "var(--hd-serif)",
              fontSize: 22,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "#fff",
            }}
          >
            {shortName(main?.name ?? "", 3)}
          </div>
        </div>
      </div>

      {/* 右：タイトル + サブ3点縦積み */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "22px 18px 14px", borderBottom: `1px solid ${p.line}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
            {theme.accent}
            <div
              style={{
                fontFamily: "var(--hd-mono)",
                fontSize: 7.5,
                letterSpacing: "0.2em",
                color: p.accent,
                textTransform: "uppercase",
              }}
            >
              MY CARE
            </div>
          </div>
          <div
            style={{
              fontFamily: "var(--hd-serif)",
              fontSize: 22,
              lineHeight: 0.95,
              letterSpacing: "-0.025em",
            }}
          >
            お気に
            <br />
            <span style={{ fontStyle: "italic", color: p.accent }}>入りたち</span>
          </div>
          <div
            style={{
              fontFamily: "var(--hd-mono)",
              fontSize: 8,
              color: p.ink40,
              letterSpacing: "0.1em",
              marginTop: 8,
            }}
          >
            4 ITEMS
          </div>
        </div>

        {/* サブ3点：縦に均等 */}
        {[0, 1, 2].map((i) => {
          const s = subs[i];
          return (
            <div
              key={i}
              style={{
                flex: 1,
                position: "relative",
                overflow: "hidden",
                borderBottom: i < 2 ? `2px solid ${p.bg}` : "none",
              }}
            >
              <ShareProductImage product={s} size="100%" fontSize={22} />
              <div
                style={{
                  position: "absolute",
                  top: 6,
                  left: 6,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.95)",
                  color: p.accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--hd-serif)",
                  fontSize: 11,
                  fontStyle: "italic",
                  fontWeight: 600,
                }}
              >
                {i + 2}
              </div>
            </div>
          );
        })}

        {/* フッター */}
        <div style={{ padding: "10px 18px 14px", borderTop: `1px solid ${p.line}` }}>
          <div
            style={{
              fontFamily: "var(--hd-mono)",
              fontSize: 8,
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
    </div>
  );
}
