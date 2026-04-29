"use client";

interface SectionDividerProps {
  title: string;
  count?: string | number;
  marginTop?: number;
  marginBottom?: number;
}

export default function SectionDivider({
  title,
  count,
  marginTop = 28,
  marginBottom = 16,
}: SectionDividerProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginTop,
        marginBottom,
      }}
    >
      <span
        className="hd-mono hd-caps"
        style={{
          fontSize: 9,
          color: "var(--hd-ink-60)",
          letterSpacing: "0.22em",
          flexShrink: 0,
        }}
      >
        {title}
      </span>
      <span
        aria-hidden
        style={{
          flex: 1,
          height: 1,
          background: "var(--hd-ink-20)",
        }}
      />
      {count !== undefined && (
        <span
          className="hd-mono"
          style={{
            fontSize: 9,
            color: "var(--hd-ink-40)",
            letterSpacing: "0.18em",
            flexShrink: 0,
          }}
        >
          {typeof count === "number" ? String(count).padStart(2, "0") : count}
        </span>
      )}
    </div>
  );
}
