import { DISCLAIMER_TEXT } from "@/lib/compliance";

export default function Disclaimer() {
  return (
    <div
      style={{
        marginTop: 32,
        paddingTop: 20,
        borderTop: "1px solid var(--hd-hair)",
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontSize: 10,
          fontFamily: "var(--hd-sans)",
          color: "var(--hd-ink-40)",
          lineHeight: 1.75,
          margin: 0,
          padding: "0 4px",
        }}
      >
        {DISCLAIMER_TEXT}
      </p>
      <div style={{ marginTop: 24 }}>
        <div
          className="hd-mono hd-caps"
          style={{ color: "var(--hd-ink-40)", marginBottom: 6 }}
        >
          Produced by
        </div>
        <a
          href="https://blog-engine.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="hd-serif"
          style={{
            fontSize: 14,
            fontStyle: "italic",
            color: "var(--hd-ink)",
            textDecoration: "underline",
            textUnderlineOffset: 4,
          }}
        >
          みおのミハダノート
        </a>
      </div>
    </div>
  );
}
