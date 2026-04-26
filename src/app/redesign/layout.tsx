import * as React from "react";
import "@/styles/hadami-tokens.css";

export const metadata = {
  title: "HADAMI — Redesign (Apothecary)",
};

export default function RedesignLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Shippori+Mincho:wght@400;500;600&family=Noto+Sans+JP:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap"
        rel="stylesheet"
      />
      <style>{`
        body:has(.hd-root) main { padding-bottom: 0 !important; }
        body:has(.hd-root) { background: #f0eee9; }
      `}</style>
      <div className="hd-root" data-density="compact" data-card="default">
        {children}
      </div>
    </>
  );
}
