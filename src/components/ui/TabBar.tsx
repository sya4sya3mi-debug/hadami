"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/lib/auth";
import { useZukanStore } from "@/stores/useZukanStore";

const TABS = [
  {
    href: "/",
    label: "ホーム",
    ariaLabel: "ホーム画面",
    paths: [
      "M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1z",
      "M9 21V12h6v9",
    ],
  },
  {
    href: "/scan",
    label: "撮る",
    ariaLabel: "コスメを撮影してスキャン",
    paths: [
      "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z",
      "M12 13a4 4 0 100-8 4 4 0 000 8z",
    ],
  },
  {
    href: "/zukan",
    label: "集める",
    ariaLabel: "成分図鑑を見る",
    paths: [
      "M4 19.5A2.5 2.5 0 016.5 17H20",
      "M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z",
    ],
  },
  {
    href: "/deck",
    label: "組む",
    ariaLabel: "スキンケアデッキを編集",
    paths: [
      "M12 3l1.5 3.5L17 8l-3.5 1.5L12 13l-1.5-3.5L7 8l3.5-1.5z",
      "M19 12l1 2.5 2.5 1-2.5 1L19 19l-1-2.5-2.5-1 2.5-1z",
    ],
  },
  {
    href: "/history",
    label: "マイコスメ",
    ariaLabel: "保存したコスメ一覧",
    paths: [
      "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2",
      "M12 7a4 4 0 100-8 4 4 0 000 8z",
    ],
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
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-bo-cream/[0.88] backdrop-blur-[28px] backdrop-saturate-[1.8] border-t border-bo-ink-faint/30 z-[200] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex h-[58px]">
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
              className="flex-1 flex flex-col items-center justify-center gap-0.5 bg-transparent border-none cursor-pointer p-0"
            >
              <div
                className={`w-8 h-6 flex items-center justify-center rounded-lg transition-all duration-300 ${
                  isActive
                    ? "bg-bo-accent-glow scale-[1.15] -translate-y-px"
                    : "bg-transparent scale-100"
                }`}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={isActive ? "#3A8F7A" : "#7E9389"}
                  strokeWidth={isActive ? 2.2 : 1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {tab.paths.map((d, i) => (
                    <path key={i} d={d} />
                  ))}
                </svg>
              </div>
              <span
                className={`text-[9px] tracking-[0.02em] transition-all duration-200 font-sans ${
                  isActive
                    ? "font-bold text-bo-accent"
                    : "font-normal text-bo-ink-muted"
                }`}
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
