"use client";

import { useEffect } from "react";

// Increment this when you need to force all users to get fresh content
const APP_VERSION = "11";

export default function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV === "development") {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((r) => r.unregister());
      });
      return;
    }

    // Check if we need to force-refresh
    const storedVersion = localStorage.getItem("hadami-app-version");
    if (storedVersion !== APP_VERSION) {
      // Version mismatch: nuke all caches + re-register SW
      caches.keys().then((keys) =>
        Promise.all(keys.map((k) => caches.delete(k)))
      ).then(() => {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          Promise.all(regs.map((r) => r.unregister())).then(() => {
            localStorage.setItem("hadami-app-version", APP_VERSION);
            // Re-register fresh SW and reload to get new content
            navigator.serviceWorker.register("/sw.js").then(() => {
              window.location.reload();
            });
          });
        });
      });
      return;
    }

    // Normal registration + check for updates
    navigator.serviceWorker.register("/sw.js").then((reg) => {
      // Force update check
      reg.update().catch(() => {});
    }).catch(console.error);
  }, []);
  return null;
}
