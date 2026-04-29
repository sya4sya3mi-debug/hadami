"use client";

import { getRoutineCardLabel } from "@/lib/routineCards";
import {
  TEMPLATE_CARD_WIDTH,
  TEMPLATE_CARD_HEIGHT,
  todayJP,
  getInitials,
  type TemplateProps,
  type TemplateStep,
} from "./types";

function MinimalTile({
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

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        background: "var(--hd-surface-2)",
        border: "1px solid var(--hd-hair)",
        boxSizing: "border-box",
        width: "100%",
        height: "100%",
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
      )}

      {/* Step number — minimal subtle */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          fontFamily: "var(--hd-mono)",
          fontSize: 9,
          letterSpacing: "0.18em",
          color: hasImage ? "rgba(255,255,255,0.95)" : accentVar,
          background: hasImage ? "rgba(0,0,0,0.35)" : "transparent",
          padding: hasImage ? "2px 6px" : 0,
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </div>

      {/* Step name caption at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "8px 10px",
          background: hasImage
            ? "linear-gradient(to top, rgba(0,0,0,0.55), transparent)"
            : "transparent",
        }}
      >
        <div
          style={{
            fontFamily: "var(--hd-sans)",
            fontSize: 10,
            fontWeight: 500,
            color: hasImage ? "#fff" : "var(--hd-ink)",
            lineHeight: 1.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {step.step_name}
        </div>
      </div>
    </div>
  );
}

export default function MinimalTemplate({
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
  const stepCount = displaySteps.length;
  const chips = [skinType, ...concerns].filter(Boolean).slice(0, 4);

  // Minimal layout — different grid patterns per step count
  let gridTemplate: string;
  let gridRows: string;
  if (stepCount <= 1) {
    gridTemplate = "1fr";
    gridRows = "1fr";
  } else if (stepCount === 2) {
    gridTemplate = "1fr 1fr";
    gridRows = "1fr";
  } else if (stepCount === 3) {
    gridTemplate = "1fr 1fr 1fr";
    gridRows = "1fr";
  } else if (stepCount === 4) {
    gridTemplate = "1fr 1fr";
    gridRows = "1fr 1fr";
  } else {
    gridTemplate = "1fr 1fr 1fr";
    gridRows = "1fr 1fr";
  }

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
        padding: "44px 44px 36px",
      }}
    >
      {/* Top — title block */}
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              width: 28,
              height: 1.5,
              background: accentVar,
            }}
          />
          <div
            style={{
              fontFamily: "var(--hd-mono)",
              fontSize: 9,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: accentVar,
            }}
          >
            HADAMI · {isMorning ? "Morning" : "Evening"}
          </div>
        </div>
        <div
          style={{
            fontFamily: "var(--hd-serif)",
            fontSize: 36,
            lineHeight: 1.15,
            letterSpacing: "-0.025em",
            color: "var(--hd-ink)",
            marginBottom: 14,
          }}
        >
          私の{isMorning ? "朝の" : "夜の"}
          <span style={{ fontStyle: "italic", color: accentVar }}>
            ルーティン。
          </span>
        </div>
        {/* Skin chips */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 5,
          }}
        >
          {chips.length === 0 ? (
            <span
              style={{
                fontFamily: "var(--hd-mono)",
                fontSize: 9,
                color: "var(--hd-ink-40)",
                letterSpacing: "0.1em",
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
                  fontSize: 9,
                  letterSpacing: "0.12em",
                  padding: "3px 9px",
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
      </div>

      {/* Middle — product grid */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {displaySteps.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: gridTemplate,
              gridTemplateRows: gridRows,
              gap: 10,
              width: "100%",
              height: "100%",
            }}
          >
            {displaySteps.map((step, i) => (
              <MinimalTile key={i} step={step} index={i} accentVar={accentVar} />
            ))}
          </div>
        ) : (
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
        )}
      </div>

      {/* Bottom — footer */}
      <div
        style={{
          marginTop: 24,
          paddingTop: 18,
          borderTop: "1px solid var(--hd-hair)",
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            fontFamily: "var(--hd-mono)",
            fontSize: 9,
            color: "var(--hd-ink-40)",
            letterSpacing: "0.12em",
          }}
        >
          {username ? `@${username} · ${date}` : date}
          <span style={{ marginLeft: 10, color: "var(--hd-ink-60)" }}>
            {modeLabel}
          </span>
        </div>
        <div
          style={{
            fontFamily: "var(--hd-serif)",
            fontSize: 18,
            fontStyle: "italic",
            color: accentVar,
            letterSpacing: "-0.02em",
          }}
        >
          HADAMI
        </div>
      </div>
    </div>
  );
}
