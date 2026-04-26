"use client";

import Link from "next/link";
import Image from "next/image";
import { Product, RoutineType } from "@/types";
import { Ico } from "@/components/redesign/apothecary/Icons";

interface EmptyDeckStateProps {
  routine: RoutineType;
  allProducts: Product[];
  onCreateRoutine: () => void;
  onAutoRecommend: () => void;
}

const moonIco = (p: React.SVGProps<SVGSVGElement> = {}) => (
  <svg
    viewBox="0 0 20 20"
    width={20}
    height={20}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.4}
    {...p}
  >
    <path d="M16 11.5a6.5 6.5 0 1 1-8-8 5 5 0 0 0 8 8z" strokeLinejoin="round" />
  </svg>
);

export default function EmptyDeckState({
  routine,
  allProducts,
  onCreateRoutine,
  onAutoRecommend,
}: EmptyDeckStateProps) {
  const hasProducts = allProducts.length > 0;

  return (
    <div style={{ textAlign: "center", padding: "56px 12px" }}>
      <div
        className="hd-mono hd-caps"
        style={{ color: "var(--hd-ink-40)", marginBottom: 12 }}
      >
        {routine === "morning" ? "Morning · 朝" : "Night · 夜"} Routine
      </div>

      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 999,
          margin: "0 auto 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--hd-moss)",
          background: "var(--hd-mint-bg)",
        }}
      >
        {routine === "morning"
          ? Ico.sun({ width: 28, height: 28 })
          : moonIco({ width: 24, height: 24 })}
      </div>

      <div
        className="hd-serif"
        style={{
          fontSize: 22,
          letterSpacing: "-0.02em",
          lineHeight: 1.25,
          marginBottom: 8,
        }}
      >
        {routine === "morning" ? "朝のルーティン" : "夜のルーティン"}を<br />
        <span style={{ fontStyle: "italic" }}>はじめましょう。</span>
      </div>

      {hasProducts ? (
        <>
          <p
            style={{
              fontFamily: "var(--hd-sans)",
              fontSize: 13,
              color: "var(--hd-ink-60)",
              lineHeight: 1.85,
              marginBottom: 24,
            }}
          >
            あなたのコスメから、最適な
            <br />
            スキンケアを組み立てます。
          </p>

          {/* Product preview thumbnails */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              marginBottom: 28,
              flexWrap: "wrap",
            }}
          >
            {allProducts.slice(0, 5).map((p) => (
              <div
                key={p.id}
                className="hd-softa-thumb"
                style={{
                  width: 44,
                  height: 44,
                  flexShrink: 0,
                  overflow: "hidden",
                  background: "var(--hd-surface-2)",
                  border: "1px solid var(--hd-hair)",
                  position: "relative",
                }}
              >
                {p.packageImage ? (
                  <Image
                    src={p.packageImageThumb ?? p.packageImage}
                    alt={p.name}
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="44px"
                  />
                ) : null}
              </div>
            ))}
            {allProducts.length > 5 && (
              <div
                className="hd-mono"
                style={{
                  width: 44,
                  height: 44,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid var(--hd-hair)",
                  fontSize: 11,
                  color: "var(--hd-ink-60)",
                  letterSpacing: "0.05em",
                }}
              >
                +{allProducts.length - 5}
              </div>
            )}
          </div>

          <button
            onClick={onCreateRoutine}
            style={{
              width: "100%",
              padding: "14px 0",
              background: "var(--hd-ink)",
              color: "var(--hd-bg)",
              border: "none",
              fontFamily: "var(--hd-sans)",
              fontSize: 14,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <span>ルーティンを作る</span>
            <span
              className="hd-mono"
              style={{ fontSize: 9, letterSpacing: "0.2em", opacity: 0.7 }}
            >
              CREATE →
            </span>
          </button>

          <button
            onClick={onAutoRecommend}
            style={{
              width: "100%",
              marginTop: 10,
              padding: "13px 0",
              background: "transparent",
              color: "var(--hd-ink)",
              border: "1px solid var(--hd-ink)",
              fontFamily: "var(--hd-sans)",
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            {Ico.sparkleSm({ width: 12, height: 12 })}
            <span>AIにおまかせ</span>
            <span
              className="hd-mono"
              style={{ fontSize: 9, letterSpacing: "0.2em", color: "var(--hd-ink-60)" }}
            >
              AUTO →
            </span>
          </button>
        </>
      ) : (
        <>
          <p
            style={{
              fontFamily: "var(--hd-sans)",
              fontSize: 13,
              color: "var(--hd-ink-60)",
              lineHeight: 1.85,
              marginBottom: 28,
            }}
          >
            まずは化粧品をスキャンして
            <br />
            成分を読み取りましょう。
          </p>
          <Link
            href="/scan"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              width: "100%",
              padding: "14px 0",
              background: "var(--hd-ink)",
              color: "var(--hd-bg)",
              textDecoration: "none",
              fontFamily: "var(--hd-sans)",
              fontSize: 14,
              boxSizing: "border-box",
            }}
          >
            {Ico.camera({ width: 16, height: 16 })}
            <span>スキャンする</span>
            <span
              className="hd-mono"
              style={{ fontSize: 9, letterSpacing: "0.2em", opacity: 0.7 }}
            >
              SCAN →
            </span>
          </Link>
        </>
      )}
    </div>
  );
}
