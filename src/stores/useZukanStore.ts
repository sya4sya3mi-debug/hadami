"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ZukanState {
  discoveredIds: string[];
  discover: (ingredientIds: string[]) => string[];
  isDiscovered: (id: string) => boolean;
}

export const useZukanStore = create<ZukanState>()(
  persist(
    (set, get) => ({
      discoveredIds: [],
      discover: (ingredientIds) => {
        const current = get().discoveredIds;
        const newIds = ingredientIds.filter((id) => !current.includes(id));
        if (newIds.length > 0) {
          set({ discoveredIds: [...current, ...newIds] });
        }
        return newIds;
      },
      isDiscovered: (id) => get().discoveredIds.includes(id),
    }),
    { name: "hadami-zukan" }
  )
);
