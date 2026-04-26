"use client";

import * as React from "react";
import Link from "next/link";
import { Ico } from "./Icons";

type Active = "home" | "book" | "scan" | "notes" | "my";

const ITEMS: { id: Active; label: string; href: string; ico?: keyof typeof Ico; center?: boolean }[] = [
  { id: "home",  label: "HOME",  href: "/redesign/softa/home",  ico: "home"  },
  { id: "book",  label: "INDEX", href: "/redesign/softa/zukan", ico: "book"  },
  { id: "scan",  label: "SCAN",  href: "/redesign/softa/scan",  center: true },
  { id: "notes", label: "CARE",  href: "/redesign/softa/care",  ico: "notes" },
  { id: "my",    label: "MINE",  href: "/redesign/softa/mine",  ico: "user"  },
];

export function TabBarSoftA({ active }: { active: Active }) {
  return (
    <div
      className="hd-tabbar"
      style={{
        borderTop: "1px solid var(--hd-hair)",
        background: "var(--hd-surface)",
        display: "grid",
        gridTemplateColumns: "repeat(5,1fr)",
        height: 74,
        flexShrink: 0,
        position: "relative",
        paddingBottom: 8,
      }}
    >
      {ITEMS.map((it) =>
        it.center ? (
          <div key={it.id} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Link
              href={it.href}
              aria-label="Scan"
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
                textDecoration: "none",
              }}
            >
              {Ico.camera({ width: 22, height: 22 })}
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
              gap: 5,
              cursor: "pointer",
              color: active === it.id ? "var(--hd-moss)" : "var(--hd-ink-40)",
              textDecoration: "none",
            }}
          >
            {it.ico && Ico[it.ico]({ width: 19, height: 19 })}
            <span style={{ fontFamily: "var(--hd-mono)", fontSize: 9, letterSpacing: "0.22em" }}>
              {it.label}
            </span>
            {active === it.id && (
              <div
                style={{
                  position: "absolute",
                  bottom: 10,
                  width: 3,
                  height: 3,
                  borderRadius: 999,
                  background: "var(--hd-moss)",
                }}
              />
            )}
          </Link>
        )
      )}
    </div>
  );
}
