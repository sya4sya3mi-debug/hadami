"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ZukanFilter = "all" | "discovered" | "undiscovered";

interface ZukanState {
  discoveredIds: string[];
  filter: ZukanFilter;
  recentlyFoundIds: string[];
  unsavedScan: boolean;
  setFilter: (filter: ZukanFilter) => void;
  discover: (ingredientIds: string[]) => string[];
  isDiscovered: (id: string) => boolean;
  replaceAll: (ingredientIds: string[]) => void;
  clearAll: () => void;
  setRecentlyFound: (ids: string[]) => void;
  clearRecentlyFound: () => void;
  setUnsavedScan: (v: boolean) => void;
}

export const useZukanStore = create<ZukanState>()(
  persist(
    (set, get) => ({
      discoveredIds: [],
      filter: "all" as ZukanFilter,
      recentlyFoundIds: [],
      unsavedScan: false,
      setFilter: (filter) => set({ filter }),
      discover: (ingredientIds) => {
        const current = get().discoveredIds;
        const newIds = ingredientIds.filter((id) => !current.includes(id));
        if (newIds.length > 0) {
          set({ discoveredIds: [...current, ...newIds] });
        }
        return newIds;
      },
      isDiscovered: (id) => get().discoveredIds.includes(id),
      replaceAll: (ingredientIds) => set({ discoveredIds: ingredientIds }),
      clearAll: () => set({ discoveredIds: [] }),
      setRecentlyFound: (ids) => set({ recentlyFoundIds: ids }),
      clearRecentlyFound: () => set({ recentlyFoundIds: [] }),
      setUnsavedScan: (v) => set({ unsavedScan: v }),
    }),
    {
      name: "hadami-zukan",
      partialize: (state) => ({
        discoveredIds: state.discoveredIds,
        filter: state.filter,
      }),
    }
  )
);
