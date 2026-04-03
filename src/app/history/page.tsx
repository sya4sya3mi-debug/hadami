"use client";

import Link from "next/link";
import { useProductStore } from "@/stores/useProductStore";
import Disclaimer from "@/components/ui/Disclaimer";

export default function HistoryPage() {
  const products = useProductStore((s) => s.products);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #F0FDFA 0%, #FFF0F5 100%)" }}>
      <div className="px-5 pt-8 pb-6">
        <h1 className="font-bold text-lg mb-5 flex items-center gap-2" style={{ color: "#2D2D2D" }}>
          🕐 製品履歴
        </h1>

        {products.length === 0 ? (
          <div className="text-center py-14">
            <div className="text-5xl mb-3">🌸</div>
            <p className="font-medium text-sm" style={{ color: "#2D2D2D" }}>まだ保存した製品はありません</p>
            <Link
              href="/scan"
              className="inline-block mt-4 px-6 py-2.5 rounded-full text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #5BBFAD, #7DD3C8)" }}
            >
              スキャンを始める →
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {products.map((p) => (
              <Link
                key={p.id}
                href={`/product/${p.id}`}
                className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm"
                style={{ border: "1px solid #F5E6EF" }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ background: "linear-gradient(135deg, #E8FAF8, #FFF0F5)" }}
                >
                  📦
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate text-sm" style={{ color: "#2D2D2D" }}>{p.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: "#9B9B9B" }}>{p.brand}</div>
                  <div className="text-xs mt-0.5" style={{ color: "#C5C5C5" }}>
                    {p.ingredients.length}成分 · {new Date(p.createdAt).toLocaleDateString("ja-JP")}
                  </div>
                </div>
                <span className="text-lg" style={{ color: "#5BBFAD" }}>›</span>
              </Link>
            ))}
          </div>
        )}

        <Disclaimer />
      </div>
    </div>
  );
}
