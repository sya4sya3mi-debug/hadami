"use client";

// H6: 上ヒーロー＋下サブ3点
// 上部 360px がヒーロー（タイトル + 商品情報パネル）、下部にサブ3点横並び

import * as React from "react";
import ShareProductImage from "@/components/share/ShareProductImage";
import { buildShareDecoTheme } from "@/lib/shareCardDeco";
import {
  ASPECT_DIMENSIONS,
  shortName,
  type ShareTemplateProps,
} from "./types";

export default function H6HeroTop({
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
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 上部ヒーロー */}
      <div
        style={{
          height: 360,
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <ShareProductImage product={main} size="100%" fontSize={64} />
        {/* 上部グラデ＋ラベル */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            padding: "24px 28px",
            background: "linear-gradient(to bottom, rgba(0,0,0,0.42), transparent)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 6,
                }}
              >
                {React.cloneElement(theme.badge, { color: "rgba(255,255,255,0.9)" })}
                <div
                  style={{
                    fontFamily: "var(--hd-mono)",
                    fontSize: 9,
                    letterSpacing: "0.22em",
                    color: "rgba(255,255,255,0.92)",
                    textTransform: "uppercase",
                  }}
                >
                  MY 4 ITEMS · STEP 01
                </div>
              </div>
              <div
                style={{
                  fontFamily: "var(--hd-serif)",
                  fontSize: 32,
                  lineHeight: 0.95,
                  letterSpacing: "-0.03em",
                  color: "#fff",
                  textShadow: "0 2px 8px rgba(0,0,0,0.25)",
                }}
              >
                <span style={{ fontStyle: "italic" }}>お気に入り。</span>
              </div>
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.95)",
                padding: "5px 12px",
                borderRadius: 999,
                fontFamily: "var(--hd-mono)",
                fontSize: 8.5,
                letterSpacing: "0.16em",
                color: p.accent,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {theme.badge}
              4 ITEMS
            </div>
          </div>
        </div>
        {/* 下部商品情報カード */}
        <div
          style={{
            position: "absolute",
            bottom: 14,
            left: 18,
            right: 18,
            background: "rgba(255,255,255,0.96)",
            borderRadius: 10,
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            boxShadow: "0 6px 16px rgba(0,0,0,0.16)",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: p.accent,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--hd-serif)",
              fontSize: 14,
              fontStyle: "italic",
            }}
          >
            1
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: "var(--hd-mono)",
                fontSize: 8,
                letterSpacing: "0.16em",
                color: p.accent,
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {main?.brand || "—"}
            </div>
            <div
              style={{
                fontFamily: "var(--hd-serif)",
                fontSize: 14,
                lineHeight: 1.1,
                marginTop: 2,
                letterSpacing: "-0.015em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {shortName(main?.name ?? "—", 3)}
            </div>
          </div>
        </div>
      </div>

      {/* 下サブ3点 */}
      <div
        style={{
          flex: 1,
          padding: "16px 18px",
          display: "flex",
          gap: 12,
          alignItems: "center",
          minHeight: 0,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{ flex: 1, position: "relative", maxHeight: "100%" }}
          >
            <div
              style={{
                borderRadius: 10,
                overflow: "hidden",
                aspectRatio: "1 / 1",
                boxShadow: "0 3px 8px rgba(0,0,0,0.12)",
                position: "relative",
              }}
            >
              <ShareProductImage product={subs[i]} size="100%" fontSize={22} radius={10} />
              <div
                style={{
                  position: "absolute",
                  top: 5,
                  left: 5,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "#fff",
                  color: p.accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--hd-serif)",
                  fontSize: 10,
                  fontStyle: "italic",
                }}
              >
                {i + 2}
              </div>
              {subs[i]?.brand && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 5,
                    right: 5,
                    fontFamily: "var(--hd-mono)",
                    fontSize: 7,
                    color: "rgba(255,255,255,0.92)",
                    background: "rgba(0,0,0,0.38)",
                    padding: "2px 5px",
                    borderRadius: 4,
                    letterSpacing: "0.1em",
                    maxWidth: "calc(100% - 10px)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {subs[i]?.brand?.slice(0, 8) ?? ""}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* フッター */}
      <div
        style={{
          padding: "0 18px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexShrink: 0,
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
          HADAMI
        </div>
      </div>
    </div>
  );
}
