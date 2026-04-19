"use client";

import { useEffect } from "react";

// Increment this when you need to force all users to get fresh content
const APP_VERSION = "15";

export default function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV === "development") {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((r) => r.unregister());
      }).catch(() => {});
      return;
    }

    try {
      const storedVersion = localStorage.getItem("hadami-app-version");
      if (storedVersion !== APP_VERSION) {
        // Version mismatch: nuke all caches + re-register SW
        (async () => {
          try {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map((r) => r.unregister()));
            try {
              localStorage.setItem("hadami-app-version", APP_VERSION);
            } catch {
              // localStorage が使えない場合はリロードしない（ループ防止）
              return;
            }
            await navigator.serviceWorker.register("/sw.js");
            window.location.reload();
          } catch (e) {
            console.warn("SW version refresh failed:", e);
          }
        })();
        return;
      }
    } catch {
      // localStorage アクセス失敗（プライベートブラウジング等）→ SW登録のみ
    }

    // Normal registration + check for updates
    navigator.serviceWorker.register("/sw.js").then((reg) => {
      reg.update().catch(() => {});
    }).catch(() => {});
  }, []);
  return null;
}
