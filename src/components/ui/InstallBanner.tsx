"use client";

import { useEffect, useState } from "react";

type InstallState = "android" | "ios" | "hidden";

export default function InstallBanner() {
  const [state, setState] = useState<InstallState>("hidden");
  const [deferredPrompt, setDeferredPrompt] = useState<
    Event & { prompt: () => Promise<void> } | null
  >(null);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator &&
        (navigator as { standalone?: boolean }).standalone === true);
    if (isStandalone) return;

    const dismissed = localStorage.getItem("hadami_install_dismissed");
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as Event & { prompt: () => Promise<void> });
      setState("android");
    };
    window.addEventListener("beforeinstallprompt", handler);

    const isIos =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !(window as { MSStream?: unknown }).MSStream;
    if (isIos && !isStandalone) {
      setState("ios");
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    setState("hidden");
    localStorage.setItem("hadami_install_dismissed", "1");
  };

  const handleDismiss = () => {
    setState("hidden");
    localStorage.setItem("hadami_install_dismissed", "1");
  };

  if (state === "hidden") return null;

  return (
    <div
      style={{
        background: "var(--hd-surface)",
        border: "1px solid var(--hd-ink)",
        padding: "14px 16px",
        marginBottom: 20,
        position: "relative",
      }}
    >
      <button
        onClick={handleDismiss}
        aria-label="閉じる"
        style={{
          position: "absolute",
          top: 8,
          right: 10,
          background: "none",
          border: "none",
          color: "var(--hd-ink-40)",
          cursor: "pointer",
          lineHeight: 1,
          padding: 4,
          fontFamily: "var(--hd-mono)",
          fontSize: 12,
        }}
      >
        ✕
      </button>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 14,
          paddingRight: 24,
        }}
      >
        <div
          className="hd-mono hd-caps"
          style={{
            color: "var(--hd-ink-40)",
            paddingTop: 2,
            flexShrink: 0,
          }}
        >
          PWA
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            className="hd-serif"
            style={{
              fontSize: 15,
              letterSpacing: "-0.01em",
              marginBottom: 4,
            }}
          >
            ホーム画面に追加
          </div>

          {state === "android" && (
            <>
              <p
                style={{
                  fontFamily: "var(--hd-sans)",
                  fontSize: 11,
                  color: "var(--hd-ink-60)",
                  margin: "0 0 10px",
                  lineHeight: 1.6,
                }}
              >
                アプリのようにすばやく起動できます。
              </p>
              <button
                onClick={handleAndroidInstall}
                style={{
                  background: "var(--hd-ink)",
                  color: "var(--hd-bg)",
                  border: "none",
                  padding: "8px 16px",
                  fontFamily: "var(--hd-sans)",
                  fontSize: 12,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>追加する</span>
                <span
                  className="hd-mono"
                  style={{ fontSize: 9, letterSpacing: "0.18em", opacity: 0.7 }}
                >
                  →
                </span>
              </button>
            </>
          )}

          {state === "ios" && (
            <p
              style={{
                fontFamily: "var(--hd-sans)",
                fontSize: 11,
                color: "var(--hd-ink-60)",
                margin: 0,
                lineHeight: 1.7,
              }}
            >
              Safari の
              <span
                className="hd-mono"
                style={{
                  display: "inline-block",
                  margin: "0 4px",
                  padding: "1px 4px",
                  border: "1px solid var(--hd-line)",
                  fontSize: 10,
                }}
              >
                □↑
              </span>
              （共有）→「ホーム画面に追加」をタップ
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
