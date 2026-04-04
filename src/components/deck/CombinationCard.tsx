"use client";

import { Combination } from "@/types";

interface Props {
  combo: Combination;
}

export default function CombinationCard({ combo }: Props) {
  const isRecommended = combo.type === "recommended";

  return (
    <div
      className={`rounded-2xl p-4 ${isRecommended ? "animate-resonance-glow" : ""}`}
      style={
        isRecommended
          ? {
              background: "linear-gradient(135deg, #E8FAF8 0%, #FFF0F5 100%)",
              border: "1px solid rgba(91,191,173,0.3)",
            }
          : {
              background: "#FFF8F0",
              border: "1px solid rgba(244,140,140,0.25)",
            }
      }
    >
      {/* 成分ペア + コネクター */}
      <div className="flex items-center justify-center gap-2 mb-3">
        {/* 成分A */}
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${isRecommended ? "animate-pill-glow" : ""}`}
          style={
            isRecommended
              ? { background: "rgba(91,191,173,0.15)", color: "#3DA898" }
              : { background: "rgba(244,140,140,0.12)", color: "#C0635E" }
          }
        >
          {combo.pair[0]}
        </span>

        {/* コネクター（中央の共鳴シンボル） */}
        <span
          className={`text-base leading-none ${isRecommended ? "animate-resonance-pulse" : ""}`}
          style={{ display: "inline-block" }}
        >
          {isRecommended ? "✦" : "⚠️"}
        </span>

        {/* 成分B */}
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${isRecommended ? "animate-pill-glow" : ""}`}
          style={
            isRecommended
              ? { background: "rgba(249,168,192,0.18)", color: "#C0638A" }
              : { background: "rgba(244,140,140,0.12)", color: "#C0635E" }
          }
        >
          {combo.pair[1]}
        </span>
      </div>

      {/* ラベルと説明 */}
      <div
        className="text-xs font-bold text-center mb-1"
        style={{ color: isRecommended ? "#2D2D2D" : "#B85050" }}
      >
        {combo.label}
      </div>
      <p className="text-xs text-center leading-relaxed" style={{ color: "#9B9B9B" }}>
        {combo.desc}
      </p>
    </div>
  );
}
