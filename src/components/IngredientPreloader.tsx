"use client";

import { useEffect } from "react";

export default function IngredientPreloader() {
  useEffect(() => {
    // Pre-warm ingredient indexes during browser idle time
    // so they're ready before the user navigates to any tab
    const warm = () => {
      import("@/lib/ingredients").then((m) => m.getIngredientById("niacinamide"));
    };
    if ("requestIdleCallback" in window) {
      const id = requestIdleCallback(warm);
      return () => cancelIdleCallback(id);
    } else {
      const id = setTimeout(warm, 200);
      return () => clearTimeout(id);
    }
  }, []);
  return null;
}
