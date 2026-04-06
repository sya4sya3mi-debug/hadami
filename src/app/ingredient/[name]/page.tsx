"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { getIngredientById, getGenreInfo } from "@/lib/ingredients";
import { getCategoryByKey } from "@/lib/categories";
import { useProductStore } from "@/stores/useProductStore";
import { useZukanStore } from "@/stores/useZukanStore";
import { shareIngredientDiscovery } from "@/lib/share";
import Badge from "@/components/ui/Badge";
import ShareModal from "@/components/ui/ShareModal";
import Disclaimer from "@/components/ui/Disclaimer";
import { useUser } from "@/lib/auth";
import PageLoading from "@/components/ui/PageLoading";

export default function IngredientDetailPage() {
  const { loading } = useUser();
  const { name } = useParams<{ name: string }>();
  const ingredient = getIngredientById(name);
  const products = useProductStore((s) => s.products);
  const discoveredIds = useZukanStore((s) => s.discoveredIds);
  const [showShare, setShowShare] = useState(false);

  if (loading) {
    return <PageLoading message="成分情報を読み込んでいます..." />;
  }
  const isDiscovered = discoveredIds.includes(name);

  if (!ingredient) {
    return (
      <div className="min-h-screen px-5 pt-10 text-center" style={{ background: "linear-gradient(160deg, #F0FDFA, #FFF0F5)" }}>
        <p style={{ color: "#9B9B9B" }}>成分が見つかりません</p>
        <Link href="/zukan" className="text-sm mt-2 inline-block font-medium" style={{ color: "#5BBFAD" }}>
          図鑑に戻る
        </Link>
      </div>
    );
  }

  if (!isDiscovered) {
    return (
      <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #F0FDFA, #FFF0F5)" }}>
        <div className="px-5 pt-8">
          <Link href="/zukan" className="text-sm font-medium mb-4 inline-block" style={{ color: "#5BBFAD" }}>
            ← 図鑑
          </Link>
          <div className="text-center py-14">
            <span className="text-7xl">❓</span>
            <h1 className="font-bold text-xl mt-4" style={{ color: "#2D2D2D" }}>未発見の成分</h1>
            <p className="text-sm mt-2" style={{ color: "#9B9B9B" }}>
              この成分はまだ発見されていません。<br />
              化粧品をスキャンして見つけましょう！
            </p>
            <Link
              href="/scan"
              className="inline-block mt-5 px-8 py-3 rounded-2xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #5BBFAD, #7DD3C8)" }}
            >
              スキャンする 📷
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const genreInfo = getGenreInfo(ingredient.genre);
  const containingProducts = products.filter((p) =>
    p.ingredients.some((pi) => pi.ingredientId === ingredient.id)
  );
  const shareText = shareIngredientDiscovery(ingredient);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #F0FDFA 0%, #FFF0F5 100%)" }}>
      <div className="px-5 pt-8 pb-6">
        <Link href="/zukan" className="text-sm font-medium mb-4 inline-block" style={{ color: "#5BBFAD" }}>
          ← 図鑑
        </Link>

        {/* Header */}
        <div className="text-center mb-6">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mx-auto mb-3"
            style={{ background: `linear-gradient(135deg, ${genreInfo?.color || ingredient.color}20, ${genreInfo?.color || ingredient.color}08)` }}
          >
            {genreInfo?.icon || "📦"}
          </div>
          <h1 className="font-bold text-2xl" style={{ color: "#2D2D2D" }}>{ingredient.nameJa}</h1>
          <p className="text-sm mt-1" style={{ color: "#9B9B9B" }}>{ingredient.nameInci}</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Badge rarity={ingredient.rarity} />
            {genreInfo && (
              <span
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: genreInfo.color + "20", color: genreInfo.color }}
              >
                {genreInfo.icon} {genreInfo.label}
              </span>
            )}
          </div>
          <div className="flex gap-1.5 justify-center mt-2 flex-wrap">
            {ingredient.categories.map((cat) => {
              const c = getCategoryByKey(cat);
              return c ? (
                <span
                  key={cat}
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: c.color + "20", color: c.color }}
                >
                  {c.icon} {c.label}
                </span>
              ) : null;
            })}
          </div>
        </div>

        {/* Description */}
        <div
          className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
          style={{ border: "1px solid #F5E6EF" }}
        >
          <h2 className="font-bold text-sm mb-2" style={{ color: "#2D2D2D" }}>📌 一般的な分類の説明</h2>
          <p className="text-sm leading-relaxed" style={{ color: "#6B6B6B" }}>{ingredient.note}</p>
        </div>

        {/* Fun fact */}
        {ingredient.funFact && (
          <div className="rounded-2xl p-4 mb-3" style={{ background: "#E8FAF8", border: "1px solid #5BBFAD20" }}>
            <h2 className="font-bold text-sm mb-2" style={{ color: "#5BBFAD" }}>💡 トリビア</h2>
            <p className="text-sm leading-relaxed" style={{ color: "#6B6B6B" }}>{ingredient.funFact}</p>
          </div>
        )}

        {/* Caution */}
        {ingredient.caution && (
          <div className="rounded-2xl p-4 mb-3" style={{ background: "#FFF3F3", border: "1px solid #F48C8C20" }}>
            <h2 className="font-bold text-sm mb-2" style={{ color: "#F48C8C" }}>📋 一般的な注意事項</h2>
            <p className="text-sm leading-relaxed" style={{ color: "#6B6B6B" }}>{ingredient.caution}</p>
          </div>
        )}

        {/* Products */}
        {containingProducts.length > 0 && (
          <div className="mb-4">
            <h2 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: "#2D2D2D" }}>
              <span className="w-1 h-4 rounded-full inline-block" style={{ background: "#F9A8C0" }} />
              この成分を含む保存済みコスメ
            </h2>
            <div className="space-y-2">
              {containingProducts.map((p) => (
                <Link
                  key={p.id}
                  href={`/product/${p.id}`}
                  className="flex items-center gap-3 bg-white rounded-2xl p-3.5 shadow-sm"
                  style={{ border: "1px solid #F5E6EF" }}
                >
                  <span className="text-xl">📦</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate" style={{ color: "#2D2D2D" }}>{p.name}</div>
                    <div className="text-xs" style={{ color: "#9B9B9B" }}>{p.brand}</div>
                  </div>
                  <span style={{ color: "#5BBFAD" }}>›</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => setShowShare(true)}
          className="w-full py-3 rounded-2xl text-sm font-medium mb-4"
          style={{ border: "1.5px solid #F2F2F2", color: "#9B9B9B" }}
        >
          Xに共有する 🐦
        </button>

        <Disclaimer />
      </div>

      {showShare && <ShareModal text={shareText} onClose={() => setShowShare(false)} />}
    </div>
  );
}
