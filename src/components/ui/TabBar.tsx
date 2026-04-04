"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/lib/auth";
import { useZukanStore } from "@/stores/useZukanStore";

const TABS = [
  { href: "/", label: "ホーム", icon: "🏠" },
  { href: "/scan", label: "撮る", icon: "📷" },
  { href: "/zukan", label: "集める", icon: "📖" },
  { href: "/deck", label: "組む", icon: "✨" },
  { href: "/history", label: "Myコスメ", icon: "🧴" },
] as const;

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
                  fontSize: "20px",
                  background: isActive
                    ? "linear-gradient(135deg, #E8FAF8, #FFF0F5)"
                    : "transparent",
                  transform: isActive ? "scale(1.1)" : "scale(1)",
                  transition: "all 0.2s",
                }}
              >
                {tab.icon}
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
