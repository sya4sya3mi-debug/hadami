"use client";

import {
  getRoutineCardEmoji,
  getRoutineCardHeading,
  getRoutineCardLabel,
  type RoutineCardMode,
} from "@/lib/routineCards";
import type { RoutineCardConfig } from "@/lib/routines";

type StepItem = {
  icon: string;
  step_name: string;
  product_name?: string | null;
  brand?: string | null;
  product_image_url?: string | null;
};

type Props = {
  config: RoutineCardConfig;
  mode: RoutineCardMode;
  steps: StepItem[];
};

const BODY_FONT_STACK =
  "'YakuHanJPs', -apple-system, system-ui, 'Segoe UI', 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif";
const DISPLAY_FONT_STACK = BODY_FONT_STACK;

const hexToRgba = (hex: string, alpha: number) => {
  const h = hex.replace("#", "");
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return hex;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const SKIN_TYPE_EMOJI: Record<string, string> = {
  乾燥肌: "🏜️",
  脂性肌: "💧",
  混合肌: "🌗",
  敏感肌: "🌸",
  普通肌: "✨",
};

export default function RoutineShareCard({ config, mode, steps }: Props) {
  const { skinType, concerns, note, username, theme, accentColor } = config;
  const isDark = theme === "dark";
  const modeLabel = getRoutineCardLabel(mode);
  const modeEmoji = getRoutineCardEmoji(mode);
  const heading = getRoutineCardHeading(mode);

  const bg = isDark
    ? "linear-gradient(135deg, #0d1f1c, #162e29)"
    : "linear-gradient(135deg, #f0faf7, #e8f5f1)";
  const cardBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.85)";
  const textMain = isDark ? "#e8f0ed" : "#1a2e28";
  const textSub = isDark ? "#8aaa9e" : "#5a7a70";
  const borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)";

  return (
    <div
      style={{
        width: 560,
        background: bg,
        borderRadius: 28,
        padding: 30,
        fontFamily: BODY_FONT_STACK,
        color: textMain,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 2,
            color: accentColor,
            textTransform: "uppercase",
            marginBottom: 6,
            fontFamily: DISPLAY_FONT_STACK,
            lineHeight: 1.2,
          }}
        >
          HADAMI
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            lineHeight: 1.25,
            marginBottom: 10,
            fontFamily: DISPLAY_FONT_STACK,
          }}
        >
          {modeEmoji} {heading}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span
            style={{
              display: "inline-block",
              height: 24,
              lineHeight: "24px",
              padding: "0 12px",
              background: isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.72)",
              color: textMain,
              fontSize: 13,
              fontWeight: 700,
              borderRadius: 999,
              border: `1px solid ${borderColor}`,
              whiteSpace: "nowrap",
              verticalAlign: "middle",
            }}
          >
            {modeLabel}カード
          </span>
          <span
            style={{
              display: "inline-block",
              height: 24,
              lineHeight: "24px",
              padding: "0 12px",
              background: isDark ? "rgba(255,255,255,0.08)" : hexToRgba(accentColor, 0.08),
              color: accentColor,
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 999,
              whiteSpace: "nowrap",
              verticalAlign: "middle",
            }}
          >
            {skinType}
          </span>
          {username && (
            <span style={{ fontSize: 12, color: textSub }}>by @{username}</span>
          )}
        </div>
      </div>

      {concerns.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: 18,
          }}
        >
          {concerns.map((concern) => (
            <span
              key={concern}
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 12,
                border: `1px solid ${borderColor}`,
                color: textSub,
                background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.6)",
              }}
            >
              {concern}
            </span>
          ))}
        </div>
      )}

      <StepList
        steps={steps}
        accentColor={accentColor}
        cardBg={cardBg}
        textMain={textMain}
        textSub={textSub}
        borderColor={borderColor}
        isDark={isDark}
      />

      {note && (
        <div
          style={{
            background: cardBg,
            borderRadius: 12,
            padding: "12px 16px",
            fontSize: 13,
            lineHeight: 1.6,
            color: textSub,
            marginBottom: 20,
            border: `1px solid ${borderColor}`,
          }}
        >
          💬 {note}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 10,
          color: textSub,
          opacity: 0.7,
        }}
      >
        <span>hadami.vercel.app</span>
        <span
          style={{
            fontFamily: DISPLAY_FONT_STACK,
            lineHeight: 1.2,
            fontWeight: 600,
            color: accentColor,
          }}
        >
          HADAMI
        </span>
      </div>
    </div>
  );
}

function StepList({
  steps,
  accentColor,
  cardBg,
  textMain,
  textSub,
  borderColor,
  isDark,
}: {
  steps: StepItem[];
  accentColor: string;
  cardBg: string;
  textMain: string;
  textSub: string;
  borderColor: string;
  isDark: boolean;
}) {
  return (
    <div style={{ marginBottom: steps.length > 0 ? 18 : 0 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {steps.length === 0 ? (
          <div
            style={{
              fontSize: 13,
              color: textSub,
              opacity: 0.6,
              padding: "10px 0",
            }}
          >
            このカードにはまだステップがありません
          </div>
        ) : (
          steps.map((step, index) => {
            const hasProductName = Boolean(step.product_name);
            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "stretch",
                  gap: 14,
                  background: cardBg,
                  borderRadius: 18,
                  padding: "14px",
                  border: `1px solid ${borderColor}`,
                  minWidth: 0,
                  minHeight: 108,
                }}
              >
                <div
                  style={{
                    width: 84,
                    height: 108,
                    flexShrink: 0,
                    alignSelf: "center",
                    borderRadius: 16,
                    overflow: "hidden",
                    background: isStepImageAvailable(step)
                      ? isDark
                        ? "rgba(255,255,255,0.12)"
                        : "rgba(255,255,255,0.9)"
                      : isDark
                      ? "rgba(255,255,255,0.08)"
                      : hexToRgba(accentColor, 0.07),
                    border: `1px solid ${borderColor}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {step.product_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={step.product_image_url}
                      alt=""
                      crossOrigin="anonymous"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        objectPosition: "center center",
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: 34, lineHeight: 1 }}>{step.icon}</span>
                  )}
                </div>

                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      display: "inline-block",
                      alignSelf: "flex-start",
                      height: 22,
                      lineHeight: "22px",
                      padding: "0 10px",
                      borderRadius: 999,
                      background: isDark ? "rgba(255,255,255,0.08)" : hexToRgba(accentColor, 0.07),
                      color: accentColor,
                      fontSize: 12,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      verticalAlign: "middle",
                    }}
                  >
                    {step.step_name}
                  </div>
                  {step.brand && (
                    <div
                      style={{
                        fontSize: 12,
                        color: textSub,
                        lineHeight: 1.45,
                      }}
                    >
                      {step.brand}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: hasProductName ? 16 : 14,
                      fontWeight: hasProductName ? 700 : 600,
                      color: textMain,
                      lineHeight: 1.5,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {step.product_name || `${step.step_name}をセットしてください`}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function isStepImageAvailable(step: StepItem) {
  return typeof step.product_image_url === "string" && step.product_image_url.length > 0;
}
