"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DeckItem, RoutineType, ProductGenre } from "@/types";
import { getSlotConfig } from "@/lib/productGenres";

interface DeckState {
  items: DeckItem[];
  addItem: (productId: string, routine: RoutineType) => void;
  removeItem: (productId: string, routine: RoutineType) => void;
  getRoutineItems: (routine: RoutineType) => DeckItem[];
  reorder: (routine: RoutineType, productIds: string[]) => void;
  replaceAll: (items: DeckItem[]) => void;
  clearAll: () => void;
  /** ジャンル制限付き追加。genre指定でスロット上限をチェック */
  addItemWithGenre: (
    productId: string,
    routine: RoutineType,
    genre: ProductGenre,
    getProductGenre: (id: string) => ProductGenre | undefined
  ) => boolean;
  /** スロット内の製品を入れ替え */
  swapItem: (oldProductId: string, newProductId: string, routine: RoutineType) => void;
}

export const useDeckStore = create<DeckState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (productId, routine) =>
        set((state) => {
          const exists = state.items.find(
            (i) => i.productId === productId && i.routine === routine
          );
          if (exists) return state;
          const routineItems = state.items.filter((i) => i.routine === routine);
          return {
            items: [
              ...state.items,
              { productId, routine, orderIndex: routineItems.length },
            ],
          };
        }),
      addItemWithGenre: (productId, routine, genre, getProductGenre) => {
        const state = get();
        const exists = state.items.find(
          (i) => i.productId === productId && i.routine === routine
        );
        if (exists) return false;

        const config = getSlotConfig(genre);
        if (config) {
          const genreCount = state.items.filter(
            (i) => i.routine === routine && getProductGenre(i.productId) === genre
          ).length;
          if (genreCount >= config.maxSlots) return false;
        }

        const routineItems = state.items.filter((i) => i.routine === routine);
        set({
          items: [
            ...state.items,
            { productId, routine, orderIndex: routineItems.length },
          ],
        });
        return true;
      },
      removeItem: (productId, routine) =>
        set((state) => {
          const remainingItems = state.items.filter(
            (i) => !(i.productId === productId && i.routine === routine)
          );
          let routineIndex = 0;

          return {
            items: remainingItems.map((item) => {
              if (item.routine !== routine) return item;

              const nextItem = { ...item, orderIndex: routineIndex };
              routineIndex += 1;
              return nextItem;
            }),
          };
        }),
      getRoutineItems: (routine) =>
        get()
          .items.filter((i) => i.routine === routine)
          .sort((a, b) => a.orderIndex - b.orderIndex),
      reorder: (routine, productIds) =>
        set((state) => ({
          items: state.items.map((item) => {
            if (item.routine !== routine) return item;
            const newIndex = productIds.indexOf(item.productId);
            return newIndex >= 0 ? { ...item, orderIndex: newIndex } : item;
          }),
        })),
      swapItem: (oldProductId, newProductId, routine) =>
        set((state) => ({
          items: state.items.map((item) => {
            if (item.productId === oldProductId && item.routine === routine) {
              return { ...item, productId: newProductId };
            }
            return item;
          }),
        })),
      replaceAll: (items) => set({ items }),
      clearAll: () => set({ items: [] }),
    }),
    { name: "hadami-deck" }
  )
);
