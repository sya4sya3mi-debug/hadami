"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const { user, loading } = useUser();
  const unsavedScan = useZukanStore((s) => s.unsavedScan);

  // Optimistic active tab — instantly update on tap, sync back when pathname changes
  const [optimisticHref, setOptimisticHref] = useState<string | null>(null);
  const optimisticTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    setOptimisticHref(null);
  }, [pathname]);
  useEffect(() => () => clearTimeout(optimisticTimer.current), []);

  if (!loading && !user) return null;

  const handleClick = (e: React.MouseEvent, href: string) => {
    // Guard: unsaved scan confirmation
    if (unsavedScan && pathname.startsWith("/scan")) {
      e.preventDefault();
      if (
        !window.confirm(
          "スキャン結果がまだ保存されていません。破棄しますか？"
        )
      )
        return;
      useZukanStore.getState().setUnsavedScan(false);
      // Re-navigate after confirm
      window.location.href = href;
      return;
    }
    // Skip if already on target page
    const onTarget = href === "/" ? pathname === "/" : pathname.startsWith(href);
    if (onTarget) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    // Optimistic: instantly show tapped tab as active
    setOptimisticHref(href);
    clearTimeout(optimisticTimer.current);
    optimisticTimer.current = setTimeout(() => setOptimisticHref(null), 3000);
  };

  return (
    <nav
      role="navigation"
      aria-label="メインナビゲーション"
      style={{ maxWidth: "var(--app-shell-max-width)" }}
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full bg-white/95 border-t border-gray-200/60 z-[200] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex h-[56px] items-end">
        {TABS.map((tab) => {
          const effectiveHref = optimisticHref ?? pathname;
          const isActive =
            tab.href === "/" ? effectiveHref === "/" : effectiveHref.startsWith(tab.href);

          // Center scan button — raised circle (PayPay style)
          if (tab.center) {
            // On scan page: use <label> to natively open the file picker
            const scanContent = (
              <>
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
              </>
            );

            if (isActive) {
              return (
                <label
                  key={tab.href}
                  htmlFor="hadami-camera-input"
                  aria-label={tab.ariaLabel}
                  className="flex-1 flex flex-col items-center justify-center bg-transparent border-none cursor-pointer p-0"
                  style={{ marginTop: "-18px" }}
                >
                  {scanContent}
                </label>
              );
            }

            return (
              <Link
                key={tab.href}
                href={tab.href}
                prefetch={true}
                onClick={(e) => handleClick(e, tab.href)}
                aria-label={tab.ariaLabel}
                aria-current={undefined}
                className="flex-1 flex flex-col items-center justify-center bg-transparent border-none cursor-pointer p-0 no-underline"
                style={{ marginTop: "-18px" }}
              >
                {scanContent}
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              prefetch={true}
              onClick={(e) => handleClick(e, tab.href)}
              aria-label={tab.ariaLabel}
              aria-current={isActive ? "page" : undefined}
              className="flex-1 flex flex-col items-center justify-center gap-[3px] bg-transparent border-none cursor-pointer p-0 h-full no-underline"
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
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
