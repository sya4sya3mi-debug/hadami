"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "ホーム", icon: "🏠" },
  { href: "/scan", label: "撮る", icon: "📷" },
  { href: "/zukan", label: "集める", icon: "📖" },
  { href: "/deck", label: "組む", icon: "🃏" },
  { href: "/history", label: "履歴", icon: "🕐" },
] as const;

export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: "430px",
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
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
                textDecoration: "none",
                flex: 1,
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
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
