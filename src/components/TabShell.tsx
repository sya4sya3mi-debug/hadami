"use client";

import { useState, useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";

// Lazy imports — each tab page is loaded only on first visit
import dynamic from "next/dynamic";
const HomePage = dynamic(() => import("@/app/page"), { ssr: false });
const ZukanPage = dynamic(() => import("@/app/zukan/page"), { ssr: false });
const ScanPage = dynamic(() => import("@/app/scan/page"), { ssr: false });
const DeckPage = dynamic(() => import("@/app/deck/page"), { ssr: false });
const HistoryPage = dynamic(() => import("@/app/history/page"), { ssr: false });

interface TabDef {
  path: string;
  match: (pathname: string) => boolean;
  Component: React.ComponentType;
}

const TABS: TabDef[] = [
  { path: "/", match: (p) => p === "/", Component: HomePage },
  { path: "/zukan", match: (p) => p.startsWith("/zukan"), Component: ZukanPage },
  { path: "/scan", match: (p) => p.startsWith("/scan"), Component: ScanPage },
  { path: "/deck", match: (p) => p.startsWith("/deck"), Component: DeckPage },
  { path: "/history", match: (p) => p.startsWith("/history"), Component: HistoryPage },
];

function getActiveTab(pathname: string): string | null {
  return TABS.find((t) => t.match(pathname))?.path ?? null;
}

/**
 * Keep-Alive Tab Shell
 *
 * - First visit to a tab: mounts the component (normal load)
 * - Subsequent visits: component is already mounted, just toggle CSS display (INSTANT)
 * - Non-tab routes (product detail, settings, etc.): fall through to Next.js routing
 */
export default function TabShell({ children }: { children: ReactNode }) {
  // usePathname: detects Next.js Link navigations (settings, product detail, etc.)
  const nextPathname = usePathname();
  // currentPath: also detects TabBar's history.pushState via popstate
  const [currentPath, setCurrentPath] = useState(nextPathname);

  // Sync from Next.js navigations (Link, router.push)
  useEffect(() => {
    setCurrentPath(nextPathname);
  }, [nextPathname]);

  // Sync from TabBar's history.pushState (fires popstate)
  useEffect(() => {
    const handler = () => setCurrentPath(window.location.pathname);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  const activeTab = getActiveTab(currentPath);
  const [mounted, setMounted] = useState<Set<string>>(new Set());

  // Mount a tab on first visit
  useEffect(() => {
    if (activeTab && !mounted.has(activeTab)) {
      setMounted((prev) => new Set(prev).add(activeTab));
    }
  }, [activeTab, mounted]);

  // Non-tab route: use Next.js routing as-is
  if (!activeTab) {
    return <>{children}</>;
  }

  // Tab route: render all mounted tabs, hide inactive ones
  return (
    <>
      {TABS.map((tab) => {
        if (!mounted.has(tab.path)) return null;
        const isActive = tab.path === activeTab;
        return (
          <div
            key={tab.path}
            className="animate-fade-in"
            style={{ display: isActive ? "block" : "none" }}
          >
            <tab.Component />
          </div>
        );
      })}
    </>
  );
}
