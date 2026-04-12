"use client";

import { useEffect, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/lib/auth";
import { useZukanStore } from "@/stores/useZukanStore";

// Tab definitions — scan is at index 2 (center)
const TABS = [
  {
    href: "/",
    label: "ホーム",
    ariaLabel: "ホーム画面",
    center: false,
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        {active ? (
          <path d="M12 2L2 9l10 13L22 9z" fill="currentColor" />
        ) : (
          <path d="M12 2L2 9l10 13L22 9 12 2zm0 2.8L19.5 9.5 12 19.5 4.5 9.5 12 4.8z" fill="currentColor" />
        )}
      </svg>
    ),
  },
  {
    href: "/zukan",
    label: "図鑑",
    ariaLabel: "成分図鑑を見る",
    center: false,
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        {active ? (
          <path d="M18 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" fill="currentColor" />
        ) : (
          <path d="M18 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2zm0 18H6V4h5v8l-2.5-1.5L6 12V4H4v16h14V4h2v16h-2zM6 4h5v8l-2.5-1.5L6 12V4z" fill="currentColor" />
        )}
      </svg>
    ),
  },
  {
    href: "/scan",
    label: "スキャン",
    ariaLabel: "コスメを撮影してスキャン",
    center: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    icon: (_active: boolean) => (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4z"
          fill="white"
        />
        <path
          d="M9 2L7.17 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2h-3.17L15 2H9zm3 15a5 5 0 110-10 5 5 0 010 10z"
          fill="white"
        />
      </svg>
    ),
  },
  {
    href: "/deck",
    label: "ルーティン",
    ariaLabel: "スキンケアルーティンを編集",
    center: false,
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        {active ? (
          <>
            <path d="M4 3h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" fill="currentColor" fillOpacity="0.15" />
            <path d="M4 3h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="2" />
            <path d="M7 7h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z" fill="currentColor" />
          </>
        ) : (
          <>
            <path d="M4 3h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M7 7h10M7 11h10M7 15h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </>
        )}
      </svg>
    ),
  },
  {
    href: "/history",
    label: "マイコスメ",
    ariaLabel: "保存したコスメ一覧",
    center: false,
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        {active ? (
          <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z" fill="currentColor" />
        ) : (
          <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0-8a3 3 0 110 6 3 3 0 010-6zm0 10c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4zm6 4H6c0-.45 1.76-2 6-2s6 1.55 6 2z" fill="currentColor" />
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

  // Prefetch all tab routes on mount for instant navigation
  useEffect(() => {
    TABS.forEach((tab) => router.prefetch(tab.href));
  }, [router]);

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
      <div className="flex h-[56px] items-end">
        {TABS.map((tab) => {
          const isActive =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);

          // Center scan button — raised circle (PayPay style)
          if (tab.center) {
            return (
              <button
                key={tab.href}
                onClick={() => handleNavigation(tab.href)}
                onTouchStart={() => handleTouchStart(tab.href)}
                aria-label={tab.ariaLabel}
                aria-current={isActive ? "page" : undefined}
                className="flex-1 flex flex-col items-center justify-center bg-transparent border-none cursor-pointer p-0"
                style={{ marginTop: "-18px" }}
              >
                <div
                  className="w-[52px] h-[52px] rounded-full flex items-center justify-center shadow-lg"
                  style={{
                    background: isActive
                      ? "linear-gradient(135deg, #3A8F7A, #2D7A66)"
                      : "linear-gradient(135deg, #3A8F7A, #4BA68E)",
                    boxShadow: "0 4px 12px rgba(58, 143, 122, 0.35)",
                  }}
                >
                  {tab.icon(isActive)}
                </div>
                <span
                  className="text-[10px] font-sans leading-none mt-1"
                  style={{
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "#3A8F7A" : "#8E8E93",
                    letterSpacing: "0.01em",
                  }}
                >
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.href}
              onClick={() => handleNavigation(tab.href)}
              onTouchStart={() => handleTouchStart(tab.href)}
              aria-label={tab.ariaLabel}
              aria-current={isActive ? "page" : undefined}
              className="flex-1 flex flex-col items-center justify-center gap-[3px] bg-transparent border-none cursor-pointer p-0 h-full"
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
