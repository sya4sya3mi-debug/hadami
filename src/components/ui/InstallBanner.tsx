"use client";

import { useEffect, useState } from "react";

type InstallState = "android" | "ios" | "hidden";

export default function InstallBanner() {
  const [state, setState] = useState<InstallState>("hidden");
  const [deferredPrompt, setDeferredPrompt] = useState<Event & { prompt: () => Promise<void> } | null>(null);

  useEffect(() => {
    // すでにPWAとしてインストール済み or 非表示に設定済みなら何もしない
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true);
    if (isStandalone) return;

    const dismissed = localStorage.getItem("hadami_install_dismissed");
    if (dismissed) return;

    // Android: beforeinstallpromptをキャプチャ
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as Event & { prompt: () => Promise<void> });
      setState("android");
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS Safari の判定
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
        background: "linear-gradient(135deg, #E8FAF8 0%, #FFF0F8 100%)",
        border: "1.5px solid #D0F0EC",
        borderRadius: "16px",
        padding: "14px 16px",
        marginBottom: "16px",
        position: "relative",
      }}
    >
      {/* 閉じるボタン */}
      <button
        onClick={handleDismiss}
        style={{
          position: "absolute",
          top: "10px",
          right: "12px",
          background: "none",
          border: "none",
          fontSize: "16px",
          color: "#9B9B9B",
          cursor: "pointer",
          lineHeight: 1,
          padding: "2px",
        }}
        aria-label="閉じる"
      >
        ✕
      </button>

      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", paddingRight: "24px" }}>
        <span style={{ fontSize: "24px", flexShrink: 0 }}>📱</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "13px", fontWeight: "700", color: "#2D2D2D", margin: "0 0 4px" }}>
            ホーム画面に追加しよう
          </p>

          {state === "android" && (
            <>
              <p style={{ fontSize: "12px", color: "#9B9B9B", margin: "0 0 10px" }}>
                アプリのようにすばやく起動できます
              </p>
              <button
                onClick={handleAndroidInstall}
                style={{
                  background: "#3A8F7A",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "7px 16px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                ホーム画面に追加
              </button>
            </>
          )}

          {state === "ios" && (
            <p style={{ fontSize: "12px", color: "#6B6B6B", margin: 0, lineHeight: 1.6 }}>
              Safariの
              <span style={{ display: "inline-block", margin: "0 3px", fontSize: "14px" }}>□↑</span>
              （共有）→「ホーム画面に追加」をタップ
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
