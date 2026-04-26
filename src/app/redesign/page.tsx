import * as React from "react";
import Link from "next/link";

const VARIANTS: {
  id: string;
  title: string;
  jp: string;
  desc: string;
  base: string;
}[] = [
  {
    id: "a",
    title: "Variant A",
    jp: "Apothecary",
    desc: "調剤室。印字ラベルと罫線。Aesop / Byredo 寄りの静謐な路線。",
    base: "/redesign",
  },
  {
    id: "soft",
    title: "Variant A · Soft",
    jp: "Apothecary Soft",
    desc: "Apothecary の骨格を残しつつ、温度を上げた中間案。日本語主役・モスグリーン強め・角丸・大きめタップ領域。",
    base: "/redesign/soft",
  },
  {
    id: "softa",
    title: "Variant A · Soft A",
    jp: "Apothecary + B Cards",
    desc: "A 純正のセリフ・英字キャプション・モノトーン・罫線をそのままに、カード/タイル/サムネだけを B 寄りの角丸 (16〜20px) に。",
    base: "/redesign/softa",
  },
];

const SCREENS = [
  { suffix: "/home",  label: "01 · ホーム" },
  { suffix: "/zukan", label: "02 · 成分図鑑" },
  { suffix: "/care",  label: "03 · スキンケア管理" },
  { suffix: "/mine",  label: "04 · マイコスメ" },
  { suffix: "/scan",  label: "05 · スキャン" },
];

export default function RedesignIndex() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#faf8f3",
        padding: "48px 32px 64px",
        fontFamily: "var(--hd-sans)",
        color: "var(--hd-ink)",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div
          style={{
            fontSize: 11, letterSpacing: "0.18em",
            color: "var(--hd-ink-40)", marginBottom: 14,
            textTransform: "uppercase",
          }}
        >
          HADAMI · Redesign
        </div>
        <div
          className="hd-serif"
          style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.025em" }}
        >
          静謐な美容雑誌のように。
        </div>
        <p
          style={{
            marginTop: 20,
            fontSize: 14,
            lineHeight: 1.7,
            color: "var(--hd-ink-60)",
          }}
        >
          下記の 2 案を実機で並べて比較してください。
        </p>

        {VARIANTS.map((v) => (
          <div
            key={v.id}
            style={{
              marginTop: 40,
              padding: "24px 0 0",
              borderTop: "1px solid var(--hd-ink)",
            }}
          >
            <div
              style={{
                fontSize: 11, letterSpacing: "0.18em",
                color: "var(--hd-ink-40)", marginBottom: 6,
                textTransform: "uppercase",
              }}
            >
              {v.title}
            </div>
            <div
              className="hd-serif"
              style={{ fontSize: 26, letterSpacing: "-0.02em" }}
            >
              {v.jp}
            </div>
            <p
              style={{
                marginTop: 8, fontSize: 13, lineHeight: 1.65,
                color: "var(--hd-ink-60)",
              }}
            >
              {v.desc}
            </p>

            <div style={{ marginTop: 16 }}>
              {SCREENS.map((s, i) => (
                <Link
                  key={s.suffix}
                  href={`${v.base}${s.suffix}`}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    padding: "14px 0",
                    borderTop: i === 0 ? "1px solid var(--hd-hair)" : "none",
                    borderBottom: "1px solid var(--hd-hair)",
                    color: "inherit",
                    textDecoration: "none",
                  }}
                >
                  <span style={{ fontSize: 14 }}>{s.label}</span>
                  <span
                    style={{
                      fontSize: 11, letterSpacing: "0.18em",
                      color: "var(--hd-moss)",
                    }}
                  >
                    OPEN →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
