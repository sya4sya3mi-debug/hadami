"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product, ProductGenre } from "@/types";

interface ProductState {
  products: Product[];
  addProduct: (product: Product) => void;
  removeProduct: (id: string) => void;
  getProduct: (id: string) => Product | undefined;
  getRecentProducts: (count: number) => Product[];
  replaceAll: (products: Product[]) => void;
  clearAll: () => void;
  updateProductImage: (id: string, packageImage: string) => void;
  updateProductType: (id: string, productType: ProductGenre) => void;
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
      removeProduct: (id) =>
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        })),
      getProduct: (id) => get().products.find((p) => p.id === id),
      getRecentProducts: (count) => get().products.slice(0, count),
      replaceAll: (products) => set({ products }),
      clearAll: () => set({ products: [] }),
      updateProductImage: (id, packageImage) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, packageImage } : p
          ),
        })),
      updateProductType: (id, productType) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, productType } : p
          ),
        })),
    }),
    { name: "hadami-products" }
  )
);
