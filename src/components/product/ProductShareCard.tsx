"use client";

import "@/styles/hadami-tokens.css";

const SC_W = 540;
const SC_H = 540;

export interface ProductShareCardEffect {
  label: string;
  score: number; // 0-10
}

export interface ProductShareCardProps {
  name: string;
  brand: string;
  productType: string;
  initials: string;
  bgColor?: string;
  imageUrl?: string;
  no?: number;
  effects: ProductShareCardEffect[];
  rating?: number; // 0-5
}

function starPath() {
  return "M6 1l1.4 3 3.3.4-2.4 2.3.7 3.2L6 8.5l-3 1.4.7-3.2L1.3 4.4l3.3-.4z";
}

export default function ProductShareCard({
  name,
  brand,
  productType,
  initials,
  bgColor = "#b5c4b1",
  imageUrl,
  no,
  effects,
  rating = 0,
}: ProductShareCardProps) {
  const noLabel = no != null ? `No. ${String(no).padStart(3, "0")}` : "No. —";
  const displayEffects = effects.slice(0, 4);

  return (
    <div
      className="hd-root hd-softa"
      data-density="compact"
      style={{
        width: SC_W,
        height: SC_H,
        background: "var(--hd-bg)",
        color: "var(--hd-ink)",
        display: "grid",
        gridTemplateColumns: "210px 1fr",
        boxSizing: "border-box",
        overflow: "hidden",
        fontFamily: "var(--hd-sans)",
      }}
    >
      {/* Left — product portrait */}
      <div style={{ position: "relative", overflow: "hidden" }}>
        {imageUrl ? (
          /* Actual product photo */
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            crossOrigin="anonymous"
          />
        ) : (
          <>
            {/* Base color */}
            <div style={{ position: "absolute", inset: 0, background: bgColor }} />
            {/* Linen texture */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `repeating-linear-gradient(45deg, rgba(255,255,255,0.07) 0 2px, transparent 2px 8px),
                             repeating-linear-gradient(-45deg, rgba(0,0,0,0.03) 0 1px, transparent 1px 6px)`,
              }}
            />
            {/* Highlight */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 45%, rgba(0,0,0,0.12) 100%)",
              }}
            />
            {/* Initials */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--hd-serif)",
                fontSize: 56,
                fontStyle: "italic",
                color: "rgba(255,255,255,0.85)",
                letterSpacing: "-0.03em",
              }}
            >
              {initials}
            </div>
          </>
        )}
        {/* Side label (vertical) */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              writingMode: "vertical-rl",
              fontFamily: "var(--hd-mono)",
              fontSize: 9,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: imageUrl ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.7)",
              textShadow: imageUrl ? "0 1px 3px rgba(0,0,0,0.5)" : undefined,
            }}
          >
            {productType} · {brand}
          </div>
        </div>
        {/* Top frame rule */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: "var(--hd-ink)",
          }}
        />
      </div>

      {/* Right — data sheet */}
      <div
        style={{
          padding: "28px 30px 24px",
          display: "flex",
          flexDirection: "column",
          borderTop: "3px solid var(--hd-ink)",
        }}
      >
        {/* Brand + name block */}
        <div
          style={{
            paddingBottom: 16,
            borderBottom: "1px solid var(--hd-ink)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--hd-mono)",
              fontSize: 9,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--hd-ink-40)",
            }}
          >
            {noLabel}
          </div>
          <div
            style={{
              fontFamily: "var(--hd-mono)",
              fontSize: 10,
              letterSpacing: "0.12em",
              color: "var(--hd-moss)",
              marginTop: 6,
              textTransform: "uppercase",
            }}
          >
            {brand}
          </div>
          <div
            className="hd-serif"
            style={{
              fontSize: 18,
              lineHeight: 1.2,
              marginTop: 6,
              letterSpacing: "-0.015em",
            }}
          >
            {name}
          </div>
          {/* Stars */}
          {rating > 0 && (
            <div style={{ display: "flex", gap: 3, marginTop: 10, alignItems: "center" }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <svg key={i} width={11} height={11} viewBox="0 0 12 12">
                  <path
                    d={starPath()}
                    fill={i <= Math.round(rating) ? "var(--hd-moss)" : "var(--hd-hair)"}
                  />
                </svg>
              ))}
              <span
                style={{
                  fontFamily: "var(--hd-mono)",
                  fontSize: 9,
                  color: "var(--hd-ink-40)",
                  marginLeft: 4,
                }}
              >
                {rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Effect bars */}
        <div style={{ marginTop: 16, flex: 1 }}>
          <div
            style={{
              fontFamily: "var(--hd-mono)",
              fontSize: 9,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--hd-ink-40)",
              marginBottom: 12,
            }}
          >
            Active Effects
          </div>
          {displayEffects.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {displayEffects.map((e) => (
                <div
                  key={e.label}
                  style={{ display: "flex", alignItems: "center", gap: 10 }}
                >
                  <div
                    className="hd-serif"
                    style={{
                      fontSize: 12,
                      width: 44,
                      letterSpacing: "-0.01em",
                      flexShrink: 0,
                    }}
                  >
                    {e.label}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      height: 2,
                      background: "var(--hd-hair)",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        height: "100%",
                        width: `${(e.score / 10) * 100}%`,
                        background: "var(--hd-moss)",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--hd-mono)",
                      fontSize: 9,
                      color: "var(--hd-ink-40)",
                      width: 28,
                      textAlign: "right",
                      flexShrink: 0,
                    }}
                  >
                    {e.score}/10
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                fontFamily: "var(--hd-mono)",
                fontSize: 9,
                color: "var(--hd-ink-40)",
                letterSpacing: "0.1em",
              }}
            >
              ——
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            paddingTop: 16,
            borderTop: "1px solid var(--hd-hair)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div
            style={{
              fontFamily: "var(--hd-mono)",
              fontSize: 8,
              color: "var(--hd-ink-40)",
              letterSpacing: "0.14em",
            }}
          >
            #マイコスメ #スキンケア
          </div>
          <div
            className="hd-serif"
            style={{
              fontSize: 18,
              fontStyle: "italic",
              color: "var(--hd-moss)",
            }}
          >
            HADAMI
          </div>
        </div>
      </div>
    </div>
  );
}
