"use client";

import { useState, useEffect } from "react";

export default function ScrollToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShow(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="ページトップへ戻る"
      className="fixed right-4 z-[190] w-10 h-10 rounded-full bg-white/90 backdrop-blur-md
                 border border-bo-parchment shadow-bo2 flex items-center justify-center
                 cursor-pointer pressable transition-opacity duration-200"
      style={{ bottom: "calc(72px + env(safe-area-inset-bottom))" }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3A8F7A" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  );
}
