"use client";

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
  amSteps: StepItem[];
  pmSteps: StepItem[];
};

const SKIN_TYPE_EMOJI: Record<string, string> = {
  乾燥肌: "🏜️",
  脂性肌: "💧",
  混合肌: "🌗",
  敏感肌: "🌸",
  普通肌: "✨",
};

export default function RoutineShareCard({ config, amSteps, pmSteps }: Props) {
  const { title, skinType, concerns, note, username, theme, accentColor } = config;
  const isDark = theme === "dark";

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
        width: 540,
        background: bg,
        borderRadius: 24,
        padding: 32,
        fontFamily: "'Zen Kaku Gothic New', sans-serif",
        color: textMain,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 2,
            color: accentColor,
            textTransform: "uppercase",
            marginBottom: 6,
            fontFamily: "'Shippori Mincho', serif",
          }}
        >
          HADAMI
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            fontFamily: "'Shippori Mincho', serif",
            lineHeight: 1.4,
            marginBottom: 8,
          }}
        >
          {title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: isDark ? "rgba(255,255,255,0.08)" : `${accentColor}15`,
              color: accentColor,
              fontSize: 12,
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: 20,
            }}
          >
            {SKIN_TYPE_EMOJI[skinType] ?? "✨"} {skinType}
          </span>
          {username && (
            <span style={{ fontSize: 12, color: textSub }}>by @{username}</span>
          )}
        </div>
      </div>

      {/* Concerns */}
      {concerns.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: 20,
          }}
        >
          {concerns.map((c) => (
            <span
              key={c}
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 12,
                border: `1px solid ${borderColor}`,
                color: textSub,
                background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.6)",
              }}
            >
              {c}
            </span>
          ))}
        </div>
      )}

      {/* AM / PM Steps */}
      <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
        <StepColumn
          label="Morning"
          emoji="☀️"
          steps={amSteps}
          accentColor={accentColor}
          cardBg={cardBg}
          textMain={textMain}
          textSub={textSub}
          borderColor={borderColor}
        />
        <StepColumn
          label="Night"
          emoji="🌙"
          steps={pmSteps}
          accentColor={accentColor}
          cardBg={cardBg}
          textMain={textMain}
          textSub={textSub}
          borderColor={borderColor}
        />
      </div>

      {/* Note */}
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

      {/* Footer */}
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
        <span style={{ fontFamily: "'Shippori Mincho', serif", fontWeight: 600, color: accentColor }}>
          HADAMI
        </span>
      </div>
    </div>
  );
}

function StepColumn({
  label,
  emoji,
  steps,
  accentColor,
  cardBg,
  textMain,
  textSub,
  borderColor,
}: {
  label: string;
  emoji: string;
  steps: StepItem[];
  accentColor: string;
  cardBg: string;
  textMain: string;
  textSub: string;
  borderColor: string;
}) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: accentColor,
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {emoji} {label}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {steps.length === 0 ? (
          <div style={{ fontSize: 12, color: textSub, opacity: 0.5, padding: "8px 0" }}>
            未設定
          </div>
        ) : (
          steps.map((s, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                background: cardBg,
                borderRadius: 10,
                padding: "7px 8px",
                border: `1px solid ${borderColor}`,
                minWidth: 0,
              }}
            >
              {/* アイコン */}
              <span style={{ fontSize: 14, flexShrink: 0 }}>{s.icon}</span>

              {/* テキスト部分 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: textMain,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.step_name}
                </div>
                {(s.brand || s.product_name) && (
                  <div
                    style={{
                      fontSize: 9,
                      color: textSub,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      lineHeight: 1.4,
                    }}
                  >
                    {s.brand && <span style={{ opacity: 0.8 }}>{s.brand} · </span>}
                    {s.product_name}
                  </div>
                )}
              </div>

              {/* 商品画像サムネイル */}
              {s.product_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.product_image_url}
                  alt=""
                  style={{
                    width: 28,
                    height: 28,
                    objectFit: "contain",
                    borderRadius: 6,
                    flexShrink: 0,
                    background: "rgba(255,255,255,0.5)",
                    border: `1px solid ${borderColor}`,
                  }}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
