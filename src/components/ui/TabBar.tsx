"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/lib/auth";
import { useZukanStore } from "@/stores/useZukanStore";

const TABS = [
  { href: "/", label: "\u30DB\u30FC\u30E0", iconId: "home" },
  { href: "/scan", label: "\u64AE\u308B", iconId: "scan" },
  { href: "/zukan", label: "\u96C6\u3081\u308B", iconId: "zukan" },
  { href: "/deck", label: "\u7D44\u3080", iconId: "deck" },
  { href: "/history", label: "My\u30B3\u30B9\u30E1", iconId: "cosme" },
] as const;

function TabIcon({ id, active }: { id: string; active: boolean }) {
  const color = active ? "#5BBFAD" : "#9B9B9B";
  const sw = active ? "2" : "1.5";
  switch (id) {
    case "home":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1z" />
          <path d="M9 21V12h6v9" />
        </svg>
      );
    case "scan":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      );
    case "zukan":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </svg>
      );
    case "deck":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8" />
          <path d="M12 17v4" />
          <path d="M7 8h2M7 12h6" />
        </svg>
      );
    case "cosme":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    default:
      return null;
  }
}

export default function TabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useUser();
  const unsavedScan = useZukanStore((s) => s.unsavedScan);

  // Prefetch all tab routes for instant navigation
  useEffect(() => {
    TABS.forEach((tab) => router.prefetch(tab.href));
  }, [router]);

  if (!loading && !user) return null;

  const handleNavigation = (href: string) => {
    if (unsavedScan && pathname.startsWith("/scan")) {
      if (!window.confirm("スキャン結果がまだ保存されていません。破棄しますか？")) return;
      useZukanStore.getState().setUnsavedScan(false);
    }
    router.push(href);
  };

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: "100%",
        background: "rgba(255,255,255,0.94)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderTop: "1px solid #F5E6EF",
        zIndex: 100,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          height: "56px",
          padding: "0 8px",
        }}
      >
        {TABS.map((tab) => {
          const isActive =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <a
              key={tab.href}
              href={tab.href}
              onClick={(e) => {
                e.preventDefault();
                handleNavigation(tab.href);
              }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
                textDecoration: "none",
                flex: 1,
                cursor: "pointer",
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "40px",
                  height: "28px",
                  borderRadius: "12px",
                  background: isActive
                    ? "linear-gradient(135deg, #E8FAF8, #FFF0F5)"
                    : "transparent",
                  transform: isActive ? "scale(1.1)" : "scale(1)",
                  transition: "all 0.2s",
                }}
              >
                <TabIcon id={tab.iconId} active={isActive} />
              </span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: isActive ? "700" : "400",
                  color: isActive ? "#5BBFAD" : "#9B9B9B",
                }}
              >
                {tab.label}
              </span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
