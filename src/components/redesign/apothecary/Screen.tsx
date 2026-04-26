import * as React from "react";

type Props = { children: React.ReactNode; bg?: string };

export function Screen({ children, bg = "var(--hd-bg)" }: Props) {
  return (
    <div
      className="hd"
      style={{
        height: "100%",
        width: "100%",
        background: bg,
        color: "var(--hd-ink)",
        fontFamily: "var(--hd-sans)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {children}
    </div>
  );
}

export function StatusBar({ dark = false }: { dark?: boolean }) {
  const c = dark ? "#fff" : "var(--hd-ink)";
  return (
    <div
      style={{
        height: 44,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 22px 0 28px",
        fontFamily: "var(--hd-sans)",
        fontSize: 14,
        fontWeight: 600,
        color: c,
        flexShrink: 0,
      }}
    >
      <span>9:41</span>
      <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
        <svg width="16" height="10" viewBox="0 0 16 10">
          <rect x="0" y="6" width="2.5" height="4" rx=".5" fill={c} />
          <rect x="4" y="4" width="2.5" height="6" rx=".5" fill={c} />
          <rect x="8" y="2" width="2.5" height="8" rx=".5" fill={c} />
          <rect x="12" y="0" width="2.5" height="10" rx=".5" fill={c} />
        </svg>
        <svg width="22" height="10" viewBox="0 0 22 10">
          <rect x=".5" y=".5" width="18" height="9" rx="2" fill="none" stroke={c} strokeOpacity=".5" />
          <rect x="2" y="2" width="15" height="6" rx="1" fill={c} />
          <rect x="19.5" y="3.5" width="1.5" height="3" rx=".5" fill={c} fillOpacity=".5" />
        </svg>
      </span>
    </div>
  );
}
