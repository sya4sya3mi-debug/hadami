"use client";

// M4: クラシック雑誌表紙（全面ヒーロー＋下サブ3点ストリップ）
// 1:1 と 9:16 の2バリアント

import * as React from "react";
import ShareProductImage from "@/components/share/ShareProductImage";
import ScatterDeco from "@/components/share/ScatterDeco";
import { buildShareDecoTheme } from "@/lib/shareCardDeco";
import {
  ASPECT_DIMENSIONS,
  shortName,
  type ShareTemplateProps,
} from "./types";

export default function M4Cover({
  products,
  palette: p,
  deco,
  aspect,
  username,
  skinType,
}: ShareTemplateProps) {
  const theme = buildShareDecoTheme(deco, p.accent);
  // 全面用に白に近い半透明アクセントで scatter（ヒーロー上の散布）
  const overlayDeco = buildShareDecoTheme(deco, "rgba(255,255,255,0.55)");
  const main = products[0];
  const subs = products.slice(1, 4);
  const dim = ASPECT_DIMENSIONS[aspect];
  const isPortrait = aspect === "9:16";

  const issueLabel = (() => {
    const d = new Date();
    const months = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC",
    ];
    return `${months[d.getMonth()]} ${d.getFullYear()} · MY COSMETICS`;
  })();

  const titleSize = isPortrait ? 64 : 48;
  const titleTop = isPortrait ? 44 : 22;
  const issueSize = isPortrait ? 12 : 8.5;
  const issueLetter = isPortrait ? "0.36em" : "0.32em";
  const colTop = isPortrait ? 240 : 130;
  const leftPad = isPortrait ? 32 : 24;
  const rightPad = isPortrait ? 32 : 22;
  const headlineSize = isPortrait ? 60 : 38;
  const headlineMax = isPortrait ? 360 : 230;
  const panelMax = isPortrait ? 280 : 185;
  const subStripBottom = isPortrait ? 110 : 60;
  const subStripPad = isPortrait ? 32 : 22;
  const footerBottom = isPortrait ? 32 : 18;
  const subThumbSize = isPortrait ? 64 : 64;

  return (
    <div
      style={{
        width: dim.width,
        height: dim.height,
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
        fontFamily: "var(--hd-sans)",
        background: p.bg,
      }}
    >
      {/* 全面ヒーロー */}
      <ShareProductImage product={main} size="100%" fontSize={isPortrait ? 110 : 72} />
      {/* グラデーションオーバーレイ */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg,rgba(255,255,255,0.45) 0%,transparent 40%,rgba(0,0,0,0.45) 100%)",
        }}
      />
      {/* デコ散布（白系） */}
      <ScatterDeco items={overlayDeco.scatter} seed={11} />

      {/* マガジンタイトル */}
      <div
        style={{
          position: "absolute",
          top: titleTop,
          left: 0,
          right: 0,
          textAlign: "center",
          zIndex: 3,
        }}
      >
        <div
          style={{
            fontFamily: "var(--hd-serif)",
            fontSize: titleSize,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            color: "#fff",
            fontStyle: "italic",
            textShadow: "0 2px 12px rgba(0,0,0,0.3)",
          }}
        >
          HADAMI
        </div>
        <div
          style={{
            fontFamily: "var(--hd-mono)",
            fontSize: issueSize,
            letterSpacing: issueLetter,
            color: "rgba(255,255,255,0.9)",
            marginTop: 4,
            textTransform: "uppercase",
          }}
        >
          {issueLabel}
        </div>
      </div>

      {/* 左：MY 4 PICKS バッジ＋ヘッドライン */}
      <div
        style={{
          position: "absolute",
          left: leftPad,
          top: colTop,
          maxWidth: headlineMax,
          zIndex: 3,
        }}
      >
        <div
          style={{
            background: p.accent,
            color: "#fff",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: isPortrait ? "6px 16px" : "4px 12px",
            fontFamily: "var(--hd-mono)",
            fontSize: isPortrait ? 12 : 9,
            letterSpacing: "0.16em",
            marginBottom: 12,
          }}
        >
          {React.cloneElement(theme.badge, { color: "#fff" })}
          MY 4 PICKS
        </div>
        <div
          style={{
            fontFamily: "var(--hd-serif)",
            fontSize: headlineSize,
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
            color: "#fff",
            textShadow: "0 2px 8px rgba(0,0,0,0.3)",
          }}
        >
          私の
          <br />
          <span style={{ fontStyle: "italic" }}>新しい定番。</span>
        </div>
      </div>

      {/* 右：商品情報パネル（メイン商品） */}
      <div
        style={{
          position: "absolute",
          right: rightPad,
          top: colTop,
          background: "rgba(255,255,255,0.96)",
          borderRadius: isPortrait ? 16 : 12,
          padding: isPortrait ? "18px 20px" : "14px 16px",
          maxWidth: panelMax,
          boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
          zIndex: 3,
        }}
      >
        <div
          style={{
            fontFamily: "var(--hd-mono)",
            fontSize: isPortrait ? 11 : 8.5,
            letterSpacing: "0.2em",
            color: p.accent,
            textTransform: "uppercase",
          }}
        >
          {main?.brand || "BRAND"}
        </div>
        <div
          style={{
            fontFamily: "var(--hd-serif)",
            fontSize: isPortrait ? 18 : 14,
            lineHeight: 1.2,
            marginTop: 6,
            letterSpacing: "-0.015em",
            color: p.ink,
          }}
        >
          {shortName(main?.name ?? "商品名", 3)}
        </div>
        <div style={{ display: "flex", gap: 2, marginTop: 8 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <svg key={i} width={isPortrait ? 14 : 11} height={isPortrait ? 14 : 11} viewBox="0 0 12 12" aria-hidden="true">
              <path
                d="M6 1l1.4 3 3.3.4-2.4 2.3.7 3.2L6 8.5l-3 1.4.7-3.2L1.3 4.4l3.3-.4z"
                fill={i <= 4 ? p.accent : p.hair}
              />
            </svg>
          ))}
        </div>
      </div>

      {/* 下サブ3点ストリップ */}
      <div
        style={{
          position: "absolute",
          bottom: subStripBottom,
          left: subStripPad,
          right: subStripPad,
          display: "flex",
          gap: 8,
          zIndex: 3,
        }}
      >
        {[0, 1, 2].map((i) => {
          const sub = subs[i];
          return (
            <div
              key={i}
              style={{
                // flex-basis: 0 を強制してブランド名の長さに依らず 3 等分。
                flex: "1 1 0",
                minWidth: 0,
                background: "rgba(255,255,255,0.97)",
                borderRadius: isPortrait ? 12 : 10,
                padding: isPortrait ? "10px 12px" : "10px 10px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.14)",
                display: "flex",
                alignItems: "center",
                gap: isPortrait ? 10 : 9,
                overflow: "hidden",
              }}
            >
              <ShareProductImage
                product={sub}
                size={subThumbSize}
                radius={isPortrait ? 10 : 8}
                fontSize={isPortrait ? 16 : 16}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontFamily: "var(--hd-mono)",
                    fontSize: isPortrait ? 10 : 8,
                    letterSpacing: "0.1em",
                    color: p.accent,
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {sub?.brand || "—"}
                </div>
                <div
                  style={{
                    fontFamily: "var(--hd-serif)",
                    fontSize: isPortrait ? 12 : 11,
                    color: p.ink60,
                    marginTop: 3,
                    fontStyle: "italic",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    lineHeight: 1.15,
                  }}
                >
                  {shortName(sub?.name ?? "—", 2)}
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
          bottom: footerBottom,
          left: subStripPad,
          right: subStripPad,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 3,
        }}
      >
        <div
          style={{
            fontFamily: "var(--hd-mono)",
            fontSize: isPortrait ? 10 : 8,
            color: "rgba(255,255,255,0.92)",
            letterSpacing: "0.14em",
          }}
        >
          {username ? `@${username}` : ""}
          {skinType ? ` · ${skinType}` : ""} · #マイコスメ
        </div>
        <div
          style={{
            fontFamily: "var(--hd-serif)",
            fontSize: isPortrait ? 18 : 14,
            fontStyle: "italic",
            color: "#fff",
            textShadow: "0 1px 4px rgba(0,0,0,0.3)",
          }}
        >
          HADAMI
        </div>
      </div>
    </div>
  );
}
