"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUser } from "@/lib/auth";
import { ADMIN_NAV_ITEMS, isAdminClient } from "@/lib/adminConfig";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || !isAdminClient(user.id))) {
      router.replace("/");
    }
  }, [loading, user, router]);

  if (loading || !user || !isAdminClient(user.id)) return null;

  return (
    <div
      className="hd-root"
      style={{
        minHeight: "100vh",
        background: "var(--hd-bg)",
        color: "var(--hd-ink)",
      }}
    >
      {/* 上部 hairline — 管理画面モードインジケーター */}
      <div
        style={{ height: 2, width: "100%", background: "var(--hd-ink)" }}
        aria-hidden="true"
      />

      {/* スティッキーヘッダー */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "var(--hd-bg)",
          borderBottom: "1px solid var(--hd-line)",
        }}
      >
        <div
          style={{
            maxWidth: 600,
            margin: "0 auto",
            padding: "14px 20px 10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span
              className="hd-serif"
              style={{ fontSize: 18, letterSpacing: "-0.01em" }}
            >
              hadami
            </span>
            <span
              className="hd-mono"
              style={{
                fontSize: 9,
                letterSpacing: "0.25em",
                color: "var(--hd-ink-60)",
                padding: "3px 8px",
                border: "1px solid var(--hd-line)",
              }}
            >
              ADMIN
            </span>
          </div>
          <Link
            href="/"
            className="hd-mono"
            style={{
              padding: "6px 12px",
              border: "1px solid var(--hd-ink)",
              background: "var(--hd-bg)",
              color: "var(--hd-ink)",
              fontSize: 9,
              letterSpacing: "0.2em",
              textDecoration: "none",
            }}
          >
            SITE →
          </Link>
        </div>

        {/* ナビ */}
        <div
          style={{
            maxWidth: 600,
            margin: "0 auto",
            padding: "0 20px 12px",
            display: "flex",
            gap: 0,
            flexWrap: "wrap",
            borderTop: "1px solid var(--hd-line)",
          }}
        >
          {ADMIN_NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="hd-mono"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 14px",
                  fontSize: 10,
                  letterSpacing: "0.2em",
                  textDecoration: "none",
                  background: active ? "var(--hd-ink)" : "transparent",
                  color: active ? "var(--hd-bg)" : "var(--hd-ink-60)",
                  borderRight: "1px solid var(--hd-line)",
                  textTransform: "uppercase",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ページコンテンツ */}
      <div
        style={{
          maxWidth: 600,
          margin: "0 auto",
          padding: "24px 20px 128px",
        }}
      >
        {children}
      </div>
    </div>
  );
}
