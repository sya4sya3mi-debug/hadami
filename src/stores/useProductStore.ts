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
  toggleFavorite: (id: string) => void;
  updateLastUsedAt: (id: string, lastUsedAt: string) => void;
  updatePurchasedAt: (id: string, purchasedAt: string | undefined) => void;
  updateProductName: (id: string, name: string) => void;
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
      toggleFavorite: (id) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
          ),
        })),
      updateLastUsedAt: (id, lastUsedAt) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, lastUsedAt } : p
          ),
        })),
      updatePurchasedAt: (id, purchasedAt) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, purchasedAt } : p
          ),
        })),
      updateProductName: (id, name) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, name } : p
          ),
        })),
    }),
    { name: "hadami-products" }
  )
);
