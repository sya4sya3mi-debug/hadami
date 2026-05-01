"use client";

import { useEffect, useState } from "react";

export default function ScrollToTop() {
  const [show, setShow] = useState(false);
  const brandGreen = "#1A2820";
  const brandCream = "#F2EFE8";

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
      className="fixed right-4 z-[190] flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md shadow-bo2 transition-opacity duration-200 cursor-pointer pressable"
      style={{
        bottom: "calc(72px + env(safe-area-inset-bottom))",
        background: brandGreen,
        border: `1px solid ${brandGreen}`,
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke={brandCream}
        strokeWidth="2.5"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  );
}
