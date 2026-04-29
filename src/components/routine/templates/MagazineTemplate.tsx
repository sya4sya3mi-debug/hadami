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

function HeroTile({
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
        background: "#cdc4b3",
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
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.45) 0%, transparent 55%, rgba(0,0,0,0.12) 100%)",
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
              fontSize: 78,
              fontStyle: "italic",
              color: "rgba(255,255,255,0.85)",
              letterSpacing: "-0.04em",
            }}
          >
            {initials}
          </div>
        </>
      )}

      {/* Hero badge — large step number */}
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 14,
          padding: "5px 12px",
          background: accentVar,
          fontFamily: "var(--hd-mono)",
          fontSize: 10,
          letterSpacing: "0.2em",
          color: "#fff",
          textTransform: "uppercase",
        }}
      >
        STEP {String(index + 1).padStart(2, "0")}
      </div>

      {/* Hero caption */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "16px 18px 14px",
          background:
            "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.35) 60%, transparent 100%)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--hd-mono)",
            fontSize: 9,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.7)",
            marginBottom: 4,
          }}
        >
          {step.step_name}
        </div>
        <div
          style={{
            fontFamily: "var(--hd-serif)",
            fontSize: 16,
            fontStyle: "italic",
            color: "#fff",
            letterSpacing: "-0.01em",
            lineHeight: 1.25,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            textOverflow: "ellipsis",
          }}
        >
          {productName}
        </div>
        {brand && (
          <div
            style={{
              fontFamily: "var(--hd-mono)",
              fontSize: 8,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.65)",
              marginTop: 4,
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
          >
            {brand}
          </div>
        )}
      </div>
    </div>
  );
}

function SubTile({
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
        background: "#cdc4b3",
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
            fontSize: 26,
            fontStyle: "italic",
            color: "rgba(255,255,255,0.85)",
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.3), rgba(0,0,0,0.1))",
          }}
        >
          {initials}
        </div>
      )}

      <div
        style={{
          position: "absolute",
          top: 6,
          left: 6,
          width: 16,
          height: 16,
          borderRadius: 999,
          background: accentVar,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--hd-serif)",
          fontSize: 10,
          fontStyle: "italic",
          lineHeight: 1,
        }}
      >
        {index + 1}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "5px 7px",
          background: "rgba(0,0,0,0.55)",
          fontFamily: "var(--hd-sans)",
          fontSize: 9,
          fontWeight: 600,
          color: "#fff",
          lineHeight: 1.2,
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
        }}
      >
        {productName}
      </div>
    </div>
  );
}

export default function MagazineTemplate({
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
  const heroStep = displaySteps[0] ?? null;
  const subSteps = displaySteps.slice(1, 5);
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
      }}
    >
      {/* Top — masthead band */}
      <div
        style={{
          padding: "26px 32px 18px",
          borderBottom: "1px solid var(--hd-ink)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <div
            style={{
              fontFamily: "var(--hd-mono)",
              fontSize: 9,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: accentVar,
            }}
          >
            HADAMI · ISSUE {isMorning ? "AM" : "PM"}
          </div>
          <div
            style={{
              fontFamily: "var(--hd-mono)",
              fontSize: 8,
              letterSpacing: "0.22em",
              color: "var(--hd-ink-40)",
            }}
          >
            {date}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div
            style={{
              fontFamily: "var(--hd-serif)",
              fontSize: 32,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              color: "var(--hd-ink)",
            }}
          >
            私の{isMorning ? "朝の" : "夜の"}
            <span style={{ fontStyle: "italic", color: accentVar }}>
              ルーティン。
            </span>
          </div>
          <div
            style={{
              fontFamily: "var(--hd-mono)",
              fontSize: 8,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--hd-ink-40)",
              textAlign: "right",
              flexShrink: 0,
            }}
          >
            {modeLabel}
            <br />
            COVER STORY
          </div>
        </div>
      </div>

      {/* Body — hero + sub grid */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: subSteps.length > 0 ? "1fr 192px" : "1fr",
          gap: 8,
          padding: 8,
          boxSizing: "border-box",
        }}
      >
        {/* Hero */}
        <div style={{ minWidth: 0, position: "relative" }}>
          {heroStep ? (
            <HeroTile step={heroStep} index={0} accentVar={accentVar} />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "var(--hd-surface-2)",
                border: "1px dashed var(--hd-line)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--hd-mono)",
                fontSize: 10,
                color: "var(--hd-ink-40)",
                letterSpacing: "0.14em",
                textAlign: "center",
                lineHeight: 1.7,
              }}
            >
              ステップを
              <br />
              追加してください
            </div>
          )}
        </div>

        {/* Sub grid 2x2 */}
        {subSteps.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gridTemplateRows: "1fr 1fr",
              gap: 6,
              minWidth: 0,
            }}
          >
            {subSteps.map((step, i) => (
              <SubTile
                key={i}
                step={step}
                index={i + 1}
                accentVar={accentVar}
              />
            ))}
            {Array.from({ length: Math.max(0, 4 - subSteps.length) }).map(
              (_, i) => (
                <div
                  key={`empty-sub-${i}`}
                  style={{
                    background: "var(--hd-surface-2)",
                    border: "1px dashed var(--hd-line)",
                    boxSizing: "border-box",
                  }}
                />
              ),
            )}
          </div>
        )}
      </div>

      {/* Bottom — footer band */}
      <div
        style={{
          padding: "12px 32px 18px",
          borderTop: "1px solid var(--hd-ink)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
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
                  padding: "2px 8px",
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
            gap: 10,
            flexShrink: 0,
          }}
        >
          {username && (
            <span
              style={{
                fontFamily: "var(--hd-mono)",
                fontSize: 9,
                color: "var(--hd-ink-40)",
                letterSpacing: "0.1em",
              }}
            >
              @{username}
            </span>
          )}
          <span
            style={{
              fontFamily: "var(--hd-serif)",
              fontSize: 18,
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
