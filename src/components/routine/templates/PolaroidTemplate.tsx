"use client";

import { getRoutineCardLabel } from "@/lib/routineCards";
import { djb2Hash } from "@/lib/mineLayout";
import {
  TEMPLATE_CARD_WIDTH,
  TEMPLATE_CARD_HEIGHT,
  todayJP,
  getInitials,
  type TemplateProps,
  type TemplateStep,
} from "./types";

// Per-step rotation: -3°, -1.5°, 0°, 1.5°, 3° のいずれか（step_nameハッシュで安定）
function getPolaroidRotation(seed: string, fallbackIndex: number): number {
  const key = seed || `step-${fallbackIndex}`;
  const r = djb2Hash(key) % 5;
  return (r - 2) * 1.5;
}

function PolaroidPhoto({
  step,
  index,
  accentVar,
}: {
  step: TemplateStep;
  index: number;
  accentVar: string;
}) {
  const productName = step.product_name?.trim() || step.step_name;
  const brand = step.brand?.trim() || "";
  const initials = getInitials(productName || brand);
  const hasImage = !!step.product_image_url;
  const rotation = getPolaroidRotation(step.step_name + step.product_name, index);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#fdfcf8",
        padding: "8px 8px 36px",
        boxSizing: "border-box",
        boxShadow:
          "0 1px 2px rgba(0,0,0,0.08), 0 6px 18px rgba(0,0,0,0.12)",
        position: "relative",
        transform: `rotate(${rotation}deg)`,
        transformOrigin: "center center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          background: hasImage ? "#cdc4b3" : "var(--hd-mint-bg)",
          overflow: "hidden",
        }}
      >
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={step.product_image_url ?? ""}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <>
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(0,0,0,0.08) 100%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--hd-serif)",
                fontSize: 30,
                fontStyle: "italic",
                color: "var(--hd-ink-40)",
                letterSpacing: "-0.02em",
              }}
            >
              {initials}
            </div>
          </>
        )}
        {/* Step number — small accent dot top-left */}
        <div
          style={{
            position: "absolute",
            top: 6,
            left: 6,
            width: 16,
            height: 16,
            borderRadius: 999,
            background: accentVar,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--hd-serif)",
            fontSize: 10,
            fontStyle: "italic",
            color: "#fff",
            lineHeight: 1,
          }}
        >
          {index + 1}
        </div>
      </div>

      {/* Caption strip */}
      <div
        style={{
          position: "absolute",
          left: 8,
          right: 8,
          bottom: 6,
          height: 24,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          className="hd-serif"
          style={{
            fontFamily: "var(--hd-serif)",
            fontSize: 11,
            fontStyle: "italic",
            color: "var(--hd-ink)",
            letterSpacing: "-0.01em",
            lineHeight: 1.15,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {step.step_name || "—"}
        </div>
        <div
          style={{
            fontFamily: "var(--hd-mono)",
            fontSize: 7.5,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--hd-ink-40)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginTop: 1,
          }}
        >
          {brand || productName || "—"}
        </div>
      </div>
    </div>
  );
}

export default function PolaroidTemplate({
  config,
  mode,
  steps,
  accentVar,
}: TemplateProps) {
  const { skinType, concerns, username } = config;
  const modeLabel = getRoutineCardLabel(mode);
  const isMorning = mode === "am";
  const date = todayJP();

  const displaySteps = steps.slice(0, 5);
  const topRow = displaySteps.slice(0, 3);
  const bottomRow = displaySteps.slice(3, 5);
  const chips = [skinType, ...concerns].filter(Boolean).slice(0, 4);

  return (
    <div
      className="hd-root hd-softa"
      data-density="compact"
      style={{
        width: TEMPLATE_CARD_WIDTH,
        height: TEMPLATE_CARD_HEIGHT,
        background: "var(--hd-bg)",
        color: "var(--hd-ink)",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        padding: "32px 28px 24px",
      }}
    >
      {/* Top — title */}
      <div style={{ marginBottom: 20, textAlign: "center" }}>
        <div
          style={{
            fontFamily: "var(--hd-mono)",
            fontSize: 9,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: accentVar,
            marginBottom: 8,
          }}
        >
          HADAMI · {isMorning ? "Morning" : "Evening"} · Scrapbook
        </div>
        <div
          style={{
            fontFamily: "var(--hd-serif)",
            fontSize: 28,
            lineHeight: 1.1,
            letterSpacing: "-0.025em",
            color: "var(--hd-ink)",
          }}
        >
          私の{isMorning ? "朝の" : "夜の"}
          <span style={{ fontStyle: "italic", color: accentVar }}>
            ルーティン。
          </span>
        </div>
      </div>

      {/* Body — polaroid grid */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 20,
          paddingTop: 4,
        }}
      >
        {displaySteps.length === 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "var(--hd-ink-40)",
              fontFamily: "var(--hd-mono)",
              fontSize: 10,
              letterSpacing: "0.12em",
              textAlign: "center",
              lineHeight: 1.7,
            }}
          >
            このカードにはまだステップがありません
          </div>
        ) : (
          <>
            {/* Top row — up to 3 polaroids */}
            {topRow.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 14,
                  height: bottomRow.length > 0 ? 200 : 240,
                  paddingTop: 10,
                  paddingBottom: 10,
                }}
              >
                {topRow.map((step, i) => (
                  <PolaroidPhoto
                    key={i}
                    step={step}
                    index={i}
                    accentVar={accentVar}
                  />
                ))}
                {Array.from({ length: Math.max(0, 3 - topRow.length) }).map(
                  (_, i) => <div key={`empty-top-${i}`} />,
                )}
              </div>
            )}

            {/* Bottom row — up to 2 polaroids */}
            {bottomRow.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 18,
                  height: 220,
                  paddingTop: 10,
                  paddingBottom: 10,
                  paddingLeft: 28,
                  paddingRight: 28,
                }}
              >
                {bottomRow.map((step, i) => (
                  <PolaroidPhoto
                    key={i}
                    step={step}
                    index={i + 3}
                    accentVar={accentVar}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom — footer */}
      <div
        style={{
          marginTop: 16,
          paddingTop: 14,
          borderTop: "1px dashed var(--hd-line)",
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 4,
            flex: 1,
            minWidth: 0,
          }}
        >
          {chips.length === 0 ? (
            <span
              style={{
                fontFamily: "var(--hd-mono)",
                fontSize: 9,
                color: "var(--hd-ink-40)",
                letterSpacing: "0.12em",
              }}
            >
              ——
            </span>
          ) : (
            chips.map((t) => (
              <span
                key={t}
                style={{
                  fontFamily: "var(--hd-mono)",
                  fontSize: 8.5,
                  letterSpacing: "0.14em",
                  padding: "2px 7px",
                  border: "1px solid var(--hd-line)",
                  color: "var(--hd-ink-60)",
                  whiteSpace: "nowrap",
                }}
              >
                {t}
              </span>
            ))
          )}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "var(--hd-mono)",
              fontSize: 9,
              color: "var(--hd-ink-40)",
              letterSpacing: "0.1em",
            }}
          >
            {username ? `@${username} · ${date}` : `${date} · ${modeLabel}`}
          </span>
          <span
            style={{
              fontFamily: "var(--hd-serif)",
              fontSize: 16,
              fontStyle: "italic",
              color: accentVar,
              letterSpacing: "-0.02em",
            }}
          >
            HADAMI
          </span>
        </div>
      </div>
    </div>
  );
}
