"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "development") {
        // 開発環境ではSWを解除してキャッシュ問題を防ぐ
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((r) => r.unregister());
        });
        return;
      }
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }
  }, []);
  return null;
}
