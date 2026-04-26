"use client";

import "@/styles/hadami-tokens.css";
import {
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

const SC_W = 560;
const SC_H = 720;

function todayJP() {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function getInitials(name: string): string {
  if (!name) return "—";
  const trimmed = name.trim();
  const ascii = trimmed.match(/[A-Za-z]+/g)?.join(" ") ?? "";
  if (ascii) {
    return ascii
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join("");
  }
  return trimmed.charAt(0);
}

function ProductTile({
  step,
  index,
  fontSize = 26,
}: {
  step: StepItem;
  index: number;
  fontSize?: number;
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
                "repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 2px, transparent 2px, transparent 8px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 6px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)",
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
              fontSize,
              fontStyle: "italic",
              color: "rgba(255,255,255,0.85)",
              letterSpacing: "-0.02em",
            }}
          >
            {initials}
          </div>
        </>
      )}

      {/* Step badge */}
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          width: 18,
          height: 18,
          borderRadius: 999,
          background: "var(--hd-moss)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--hd-serif)",
          fontSize: 11,
          fontStyle: "italic",
          color: "#fff",
          lineHeight: 1,
        }}
      >
        {index + 1}
      </div>

      {/* Bottom info band */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(4px)",
          padding: "6px 8px",
        }}
      >
        <div
          style={{
            fontFamily: "var(--hd-mono)",
            fontSize: 7.5,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.65)",
            lineHeight: 1.2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {step.step_name}
        </div>
        <div
          style={{
            fontFamily: "var(--hd-sans)",
            fontSize: 9.5,
            color: "rgba(255,255,255,0.95)",
            fontWeight: 600,
            lineHeight: 1.2,
            marginTop: 1,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {productName}
        </div>
      </div>
    </div>
  );
}

export default function RoutineShareCard({ config, mode, steps }: Props) {
  const { skinType, concerns, username } = config;
  const modeLabel = getRoutineCardLabel(mode);
  const isMorning = mode === "am";
  const date = todayJP();

  // Display up to 5 steps in the editorial 3+2 grid
  const displaySteps = steps.slice(0, 5);
  const topRow = displaySteps.slice(0, 3);
  const bottomRow = displaySteps.slice(3, 5);

  const titleFirst = isMorning ? "私の" : "私の";
  const titleSecond = isMorning ? "朝の" : "夜の";
  const titleAccent = "ルーティン。";

  // Build chip list: skin type + concerns (limit to 4)
  const chips = [skinType, ...concerns].filter(Boolean).slice(0, 4);

  return (
    <div
      className="hd-root hd-softa"
      data-density="compact"
      style={{
        width: SC_W,
        height: SC_H,
        background: "var(--hd-bg)",
        color: "var(--hd-ink)",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* Top frame rule */}
      <div style={{ height: 3, background: "var(--hd-ink)" }} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 248px",
          height: SC_H - 6,
          boxSizing: "border-box",
        }}
      >
        {/* Left — title column */}
        <div
          style={{
            padding: "32px 0 28px 32px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderRight: "1px solid var(--hd-ink)",
            minWidth: 0,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--hd-mono)",
                fontSize: 9,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "var(--hd-moss)",
                marginBottom: 14,
              }}
            >
              HADAMI · {isMorning ? "Morning" : "Evening"}
            </div>
            <div
              style={{
                fontFamily: "var(--hd-serif)",
                fontSize: 56,
                lineHeight: 0.88,
                letterSpacing: "-0.035em",
                color: "var(--hd-ink)",
              }}
            >
              {titleFirst}
              <br />
              {titleSecond}
              <br />
              <span style={{ fontStyle: "italic", color: "var(--hd-moss)" }}>
                {titleAccent}
              </span>
            </div>
            <div
              style={{
                marginTop: 18,
                height: 2,
                width: 44,
                background: "var(--hd-moss)",
              }}
            />
          </div>

          <div>
            <div
              style={{
                fontFamily: "var(--hd-mono)",
                fontSize: 8,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "var(--hd-ink-40)",
                marginBottom: 10,
              }}
            >
              Skin Profile · {modeLabel}
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 5,
                marginBottom: 14,
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
            <div
              style={{
                fontFamily: "var(--hd-mono)",
                fontSize: 9,
                color: "var(--hd-ink-40)",
                letterSpacing: "0.1em",
              }}
            >
              {username ? `@${username} · ${date}` : date}
            </div>
            <div
              style={{
                fontFamily: "var(--hd-serif)",
                fontSize: 22,
                fontStyle: "italic",
                color: "var(--hd-moss)",
                letterSpacing: "-0.02em",
                marginTop: 10,
              }}
            >
              HADAMI
            </div>
          </div>
        </div>

        {/* Right — product grid (3 top + 2 bottom) */}
        {displaySteps.length > 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 2,
                flex: bottomRow.length > 0 ? "0 0 auto" : 1,
                height: bottomRow.length > 0 ? Math.round(SC_H * 0.5) : "100%",
              }}
            >
              {topRow.map((step, i) => (
                <ProductTile key={i} step={step} index={i} fontSize={28} />
              ))}
              {/* Fill empty top cells if fewer than 3 */}
              {Array.from({ length: Math.max(0, 3 - topRow.length) }).map((_, i) => (
                <div
                  key={`empty-top-${i}`}
                  style={{
                    background: "var(--hd-surface-2)",
                    border: "1px dashed var(--hd-line)",
                    boxSizing: "border-box",
                  }}
                />
              ))}
            </div>
            {bottomRow.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 2,
                  flex: 1,
                }}
              >
                {bottomRow.map((step, i) => (
                  <ProductTile
                    key={i}
                    step={step}
                    index={i + 3}
                    fontSize={32}
                  />
                ))}
                {Array.from({ length: Math.max(0, 2 - bottomRow.length) }).map(
                  (_, i) => (
                    <div
                      key={`empty-bot-${i}`}
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
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
              color: "var(--hd-ink-40)",
              fontFamily: "var(--hd-mono)",
              fontSize: 10,
              letterSpacing: "0.12em",
              textAlign: "center",
              lineHeight: 1.7,
            }}
          >
            このカードには
            <br />
            まだステップが
            <br />
            ありません
          </div>
        )}
      </div>

      {/* Bottom frame rule */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          background: "var(--hd-ink)",
        }}
      />
    </div>
  );
}
