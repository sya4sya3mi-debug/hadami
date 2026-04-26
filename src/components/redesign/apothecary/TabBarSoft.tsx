"use client";

import * as React from "react";
import Link from "next/link";
import { Ico } from "./Icons";

type Active = "home" | "book" | "scan" | "notes" | "my";

const ITEMS: { id: Active; label: string; href: string; ico?: keyof typeof Ico; center?: boolean }[] = [
  { id: "home",  label: "ホーム",     href: "/redesign/soft/home",  ico: "home"  },
  { id: "book",  label: "図鑑",       href: "/redesign/soft/zukan", ico: "book"  },
  { id: "scan",  label: "スキャン",   href: "/redesign/soft/scan",  center: true },
  { id: "notes", label: "ケア",       href: "/redesign/soft/care",  ico: "notes" },
  { id: "my",    label: "マイコスメ", href: "/redesign/soft/mine",  ico: "user"  },
];

export function TabBarSoft({ active }: { active: Active }) {
  return (
    <div
      className="hd-tabbar"
      style={{
        borderTop: "1px solid var(--hd-hair)",
        background: "var(--hd-surface)",
        display: "grid",
        gridTemplateColumns: "repeat(5,1fr)",
        height: 78,
        flexShrink: 0,
        position: "relative",
        paddingBottom: 10,
      }}
    >
      {ITEMS.map((it) =>
        it.center ? (
          <div key={it.id} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Link
              href={it.href}
              aria-label="スキャン"
              style={{
                width: 62,
                height: 62,
                borderRadius: 999,
                background: "var(--hd-moss)",
                color: "#fff",
                border: "none",
                transform: "translateY(-16px)",
                boxShadow: "0 10px 28px oklch(0.38 0.05 155 / 0.32)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                textDecoration: "none",
              }}
            >
              {Ico.camera({ width: 26, height: 26 })}
            </Link>
          </div>
        ) : (
          <Link
            key={it.id}
            href={it.href}
            style={{
              background: "none",
              border: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              cursor: "pointer",
              color: active === it.id ? "var(--hd-moss)" : "var(--hd-ink-40)",
              textDecoration: "none",
            }}
          >
            {it.ico && Ico[it.ico]({ width: 22, height: 22 })}
            <span
              style={{
                fontFamily: "var(--hd-sans)",
                fontSize: 10,
                letterSpacing: "0.04em",
                fontWeight: active === it.id ? 600 : 400,
              }}
            >
              {it.label}
            </span>
          </Link>
        )
      )}
    </div>
  );
}
