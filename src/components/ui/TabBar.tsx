"use client";

import "@/styles/hadami-tokens.css";
import { usePathname } from "next/navigation";
import { useUser } from "@/lib/auth";
import { useZukanStore } from "@/stores/useZukanStore";
import { Ico } from "@/components/redesign/apothecary/Icons";

type TabId = "home" | "book" | "scan" | "notes" | "my";

const TABS: {
  id: TabId;
  href: string;
  label: string;
  jp: string;
  ariaLabel: string;
  icon?: keyof typeof Ico;
  center?: boolean;
}[] = [
  { id: "home",  href: "/",        label: "HOME",  jp: "ホーム",       ariaLabel: "ホーム画面",                 icon: "home"  },
  { id: "book",  href: "/zukan",   label: "INDEX", jp: "図鑑",         ariaLabel: "成分図鑑を見る",             icon: "book"  },
  { id: "scan",  href: "/scan",    label: "SCAN",  jp: "スキャン",     ariaLabel: "コスメを撮影してスキャン",   center: true  },
  { id: "notes", href: "/deck",    label: "CARE",  jp: "スキンケア管理", ariaLabel: "スキンケア管理を開く",       icon: "notes" },
  { id: "my",    href: "/history", label: "MINE",  jp: "マイコスメ",   ariaLabel: "保存したコスメ一覧",         icon: "user"  },
];

export default function TabBar() {
  const pathname = usePathname();
  const { user, loading } = useUser();
  const unsavedScan = useZukanStore((s) => s.unsavedScan);

  const isAuthPath =
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/terms");

  if (isAuthPath) return null;
  if (pathname.startsWith("/redesign")) return null;
  if (!loading && !user) return null;

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : href === "/deck"
      ? pathname.startsWith("/deck") || pathname.startsWith("/routine")
      : pathname.startsWith(href);

  const handleClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();

    if (typeof document !== "undefined" && document.body.dataset.modalOpen) {
      return;
    }

    if (unsavedScan && pathname.startsWith("/scan")) {
      if (
        !window.confirm(
          "スキャン結果がまだ保存されていません。破棄しますか？"
        )
      )
        return;
      useZukanStore.getState().setUnsavedScan(false);
    }

    const onTarget = href === "/" ? pathname === "/" : pathname.startsWith(href);
    if (onTarget) {
      if (href === "/scan") {
        window.dispatchEvent(new CustomEvent("hadami:scan-tab-pressed"));
        return;
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    window.history.pushState({}, "", href);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <nav
      role="navigation"
      aria-label="メインナビゲーション"
      className="hd-root hd-softa hd-tabbar"
      data-density="compact"
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: "var(--app-shell-max-width)",
        background: "var(--hd-surface)",
        borderTop: "1px solid var(--hd-hair)",
        zIndex: 200,
        paddingBottom: "calc(8px + env(safe-area-inset-bottom))",
        height: "calc(74px + env(safe-area-inset-bottom))",
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
      }}
    >
      {TABS.map((tab) => {
        const active = isActive(tab.href);

        if (tab.center) {
          const scanContent = (
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: 999,
                background: "var(--hd-ink)",
                color: "var(--hd-bg)",
                border: "none",
                transform: "translateY(-14px)",
                boxShadow: "0 8px 24px oklch(0.38 0.05 155 / 0.28)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              {Ico.camera({ width: 22, height: 22 })}
            </div>
          );

          if (active) {
            return (
              <label
                key={tab.id}
                htmlFor="hadami-camera-input"
                aria-label={tab.ariaLabel}
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("hadami:scan-tab-pressed"));
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                {scanContent}
              </label>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={(e) => handleClick(e, tab.href)}
              aria-label={tab.ariaLabel}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              {scanContent}
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            onClick={(e) => handleClick(e, tab.href)}
            aria-label={tab.ariaLabel}
            aria-current={active ? "page" : undefined}
            style={{
              position: "relative",
              background: "none",
              border: "none",
              padding: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              cursor: "pointer",
              color: active ? "var(--hd-moss)" : "var(--hd-ink-40)",
            }}
          >
            {tab.icon && Ico[tab.icon]({ width: 19, height: 19 })}
            <span
              style={{
                fontFamily: "var(--hd-mono)",
                fontSize: 9,
                letterSpacing: "0.22em",
              }}
            >
              {tab.label}
            </span>
            {active && (
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  bottom: 4,
                  width: 3,
                  height: 3,
                  borderRadius: 999,
                  background: "var(--hd-moss)",
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
