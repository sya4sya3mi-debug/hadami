"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/lib/auth";
import { useZukanStore } from "@/stores/useZukanStore";

// iOS-style tab bar icons (outline + filled variants)
const TABS = [
  {
    href: "/",
    label: "ホーム",
    ariaLabel: "ホーム画面",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        {active ? (
          <path
            d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"
            fill="currentColor"
          />
        ) : (
          <path
            d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5zm2-18l9 8.5V21h-6v-6h-6v6H4V10.5L12 2z"
            fill="currentColor"
          />
        )}
      </svg>
    ),
  },
  {
    href: "/scan",
    label: "スキャン",
    ariaLabel: "コスメを撮影してスキャン",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        {active ? (
          <>
            <path
              d="M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4z"
              fill="currentColor"
            />
            <path
              d="M9 2L7.17 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2h-3.17L15 2H9zm3 15a5 5 0 110-10 5 5 0 010 10z"
              fill="currentColor"
            />
          </>
        ) : (
          <>
            <path
              d="M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4z"
              fill="currentColor"
            />
            <path
              d="M9 2L7.17 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2h-3.17L15 2H9zM4 18V6h3.17L9 4h6l1.83 2H20v12H4zm8-3a3 3 0 110-6 3 3 0 010 6z"
              fill="currentColor"
            />
          </>
        )}
      </svg>
    ),
  },
  {
    href: "/zukan",
    label: "図鑑",
    ariaLabel: "成分図鑑を見る",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        {active ? (
          <path
            d="M18 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"
            fill="currentColor"
          />
        ) : (
          <path
            d="M18 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2zm0 18H6V4h5v8l-2.5-1.5L6 12V4H4v16h14V4h2v16h-2zM6 4h5v8l-2.5-1.5L6 12V4z"
            fill="currentColor"
          />
        )}
      </svg>
    ),
  },
  {
    href: "/deck",
    label: "デッキ",
    ariaLabel: "スキンケアデッキを編集",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        {active ? (
          <path
            d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2zm0 12.5l1.05 3.24L16.5 19l-3.45 1.26L12 23.5l-1.05-3.24L7.5 19l3.45-1.26L12 14.5z"
            fill="currentColor"
          />
        ) : (
          <path
            d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2zm0 3.52L10.6 9.74 6.5 10.87l4.1 1.13L12 16.48l1.4-4.48 4.1-1.13-4.1-1.13L12 5.52zm0 9l1.05 3.24L16.5 19l-3.45 1.26L12 23.5l-1.05-3.24L7.5 19l3.45-1.26L12 14.5z"
            fill="currentColor"
          />
        )}
      </svg>
    ),
  },
  {
    href: "/history",
    label: "マイコスメ",
    ariaLabel: "保存したコスメ一覧",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        {active ? (
          <path
            d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"
            fill="currentColor"
          />
        ) : (
          <path
            d="M12 12a5 5 0 100-10 5 5 0 000 10zm0-8a3 3 0 110 6 3 3 0 010-6zm0 10c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4zm6 4H6c0-.45 1.76-2 6-2s6 1.55 6 2z"
            fill="currentColor"
          />
        )}
      </svg>
    ),
  },
] as const;

export default function TabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useUser();
  const unsavedScan = useZukanStore((s) => s.unsavedScan);
  const [, startTransition] = useTransition();

  if (!loading && !user) return null;

  const handleTouchStart = (href: string) => {
    router.prefetch(href);
  };

  const handleNavigation = (href: string) => {
    if (unsavedScan && pathname.startsWith("/scan")) {
      if (
        !window.confirm(
          "スキャン結果がまだ保存されていません。破棄しますか？"
        )
      )
        return;
      useZukanStore.getState().setUnsavedScan(false);
    }
    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <nav
      role="navigation"
      aria-label="メインナビゲーション"
      style={{ maxWidth: "var(--app-shell-max-width)" }}
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full bg-white/90 backdrop-blur-xl border-t border-gray-200/60 z-[200] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex h-[56px]">
        {TABS.map((tab) => {
          const isActive =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <button
              key={tab.href}
              onClick={() => handleNavigation(tab.href)}
              onTouchStart={() => handleTouchStart(tab.href)}
              aria-label={tab.ariaLabel}
              aria-current={isActive ? "page" : undefined}
              className="flex-1 flex flex-col items-center justify-center gap-[3px] bg-transparent border-none cursor-pointer p-0"
              style={{ color: isActive ? "#3A8F7A" : "#8E8E93" }}
            >
              {tab.icon(isActive)}
              <span
                className="text-[10px] font-sans leading-none"
                style={{
                  fontWeight: isActive ? 600 : 400,
                  letterSpacing: "0.01em",
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
