"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ShareCosmeticsClient from "@/components/share/ShareCosmeticsClient";
import { useProductStore } from "@/stores/useProductStore";
import type { Product } from "@/types";

const DRAFT_KEY = "hadami.shareCosmetics.draft";

type Draft = {
  selectedProductIds: string[];
  username?: string;
  skinType?: string;
};

function ShareCosmeticsInner() {
  const router = useRouter();
  const allProducts = useProductStore((s) => s.products);
  const [products, setProducts] = useState<Product[]>([]);
  const [username, setUsername] = useState("");
  const [skinType, setSkinType] = useState("");
  // sessionStorage にドラフトが存在するかを最初に確認。
  // 無ければ即座に /history にリダイレクト。
  // 在ればストアのハイドレーション完了（ = allProducts に値が入る）を待ってから products を解決する。
  const [draftIds, setDraftIds] = useState<string[] | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) {
        router.replace("/history");
        return;
      }
      const parsed = JSON.parse(raw) as Partial<Draft>;
      const ids = Array.isArray(parsed.selectedProductIds)
        ? parsed.selectedProductIds.filter((v): v is string => typeof v === "string")
        : [];
      if (ids.length === 0) {
        router.replace("/history");
        return;
      }
      setDraftIds(ids);
      setUsername(typeof parsed.username === "string" ? parsed.username : "");
      setSkinType(typeof parsed.skinType === "string" ? parsed.skinType : "");
    } catch {
      router.replace("/history");
    }
  }, [router]);

  // ストアハイドレーション後に products を解決
  useEffect(() => {
    if (!draftIds || allProducts.length === 0) return;
    const resolvedProducts = draftIds
      .map((id) => allProducts.find((p) => p.id === id))
      .filter((p): p is Product => !!p)
      .slice(0, 4);
    if (resolvedProducts.length === 0) {
      router.replace("/history");
      return;
    }
    setProducts(resolvedProducts);
  }, [draftIds, allProducts, router]);

  if (products.length === 0) return null;

  return (
    <ShareCosmeticsClient
      initialProducts={products}
      initialUsername={username}
      initialSkinType={skinType}
    />
  );
}

export default function ShareCosmeticsPage() {
  return (
    <Suspense fallback={null}>
      <ShareCosmeticsInner />
    </Suspense>
  );
}
