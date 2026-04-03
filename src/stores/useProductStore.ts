"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/types";

interface ProductState {
  products: Product[];
  addProduct: (product: Product) => void;
  getProduct: (id: string) => Product | undefined;
  getRecentProducts: (count: number) => Product[];
}

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      products: [],
      addProduct: (product) =>
        set((state) => {
          const exists = state.products.find((p) => p.id === product.id);
          if (exists) return state;
          return { products: [product, ...state.products] };
        }),
      getProduct: (id) => get().products.find((p) => p.id === id),
      getRecentProducts: (count) => get().products.slice(0, count),
    }),
    { name: "hadami-products" }
  )
);
