"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useProductStore } from "@/stores/useProductStore";
import { getIngredientById, RARITY } from "@/lib/ingredients";
import { getCategoryByKey } from "@/lib/categories";
import { findCombinations } from "@/lib/combinations";
import { shareProductCheck } from "@/lib/share";
import { getGenreByKey } from "@/lib/productGenres";
import Badge from "@/components/ui/Badge";
import ShareModal from "@/components/ui/ShareModal";
import Disclaimer from "@/components/ui/Disclaimer";
import { useUser } from "@/lib/auth";
import PageLoading from "@/components/ui/PageLoading";
import AuthGuard from "@/components/ui/AuthGuard";

export default function ProductDetailPage() {
  const { loading } = useUser();
  const { id } = useParams<{ id: string }>();
  const product = useProductStore((s) => s.getProduct(id));
  const [showShare, setShowShare] = useState(false);

  if (loading) {
    return <PageLoading message="製品情報を読み込んでいます..." />;
  }

  if (!product) {
    return (
      <div className="min-h-screen px-5 pt-10 text-center" style={{ background: "linear-gradient(160deg, #F0FDFA, #FFF0F5)" }}>
        <p style={{ color: "#9B9B9B" }}>製品が見つかりません</p>
        <Link href="/history" className="text-sm mt-2 inline-block font-medium" style={{ color: "#5BBFAD" }}>
          Myコスメに戻る
        </Link>
      </div>
    );
  }

  const genre = getGenreByKey(product.productType || "other");

  const ingredients = product.ingredients
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((pi) => getIngredientById(pi.ingredientId))
    .filter((i) => i !== undefined);

  const ingredientNames = ingredients.map((i) => i.nameJa);
  const combinations = findCombinations(ingredientNames);
  const shareText = shareProductCheck(product, ingredientNames);

  return (
    <AuthGuard>
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #F0FDFA 0%, #FFF0F5 100%)" }}>
      <div className="px-5 pt-8 pb-6">
        <Link href="/history" className="text-sm font-medium mb-5 inline-block" style={{ color: "#5BBFAD" }}>
          ← Myコスメ
        </Link>

        {/* Product photo */}
        {product.packageImage && (
          <div className="mb-4 rounded-2xl overflow-hidden bg-white shadow-sm" style={{ border: "1px solid #F5E6EF" }}>
            <div className="relative w-full" style={{ aspectRatio: "4/3" }}>
              <Image
                src={product.packageImage}
                alt={product.name}
                fill
                className="object-contain"
                sizes="(max-width: 430px) 100vw, 430px"

              />
            </div>
          </div>
        )}

        {/* Product header */}
        <div
          className="flex items-center gap-4 mb-6 bg-white rounded-2xl p-4 shadow-sm"
          style={{ border: "1px solid #F5E6EF" }}
        >
          {!product.packageImage && (
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
              style={{ background: "linear-gradient(135deg, #E8FAF8, #FFF0F5)" }}
            >
              📦
            </div>
          )}
          <div>
            <h1 className="font-bold text-lg" style={{ color: "#2D2D2D" }}>{product.name}</h1>
            <p className="text-sm" style={{ color: "#9B9B9B" }}>{product.brand}</p>
            {genre && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs mt-1"
                style={{ background: `${genre.color}18`, color: genre.color }}
              >
                {genre.icon} {genre.label}
              </span>
            )}
          </div>
        </div>

        {/* Ingredients list */}
        <h2 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: "#2D2D2D" }}>
          <span className="w-1 h-4 rounded-full inline-block" style={{ background: "#5BBFAD" }} />
          全成分（{ingredients.length}種）
        </h2>
        <div className="space-y-2 mb-6">
          {ingredients.map((ing, idx) => (
            <Link
              key={ing.id}
              href={`/ingredient/${ing.id}`}
              className="flex items-center gap-3 bg-white rounded-2xl p-3.5 shadow-sm"
              style={{ border: "1px solid #F5E6EF" }}
            >
              <span className="text-xl">{RARITY[ing.rarity].icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm" style={{ color: "#2D2D2D" }}>{ing.nameJa}</span>
                  <Badge rarity={ing.rarity} size="sm" />
                </div>
                <div className="text-xs mt-0.5" style={{ color: "#9B9B9B" }}>{ing.nameInci}</div>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {ing.categories.map((cat) => {
                    const c = getCategoryByKey(cat);
                    return c ? (
                      <span
                        key={cat}
                        className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{ background: c.color + "20", color: c.color }}
                      >
                        {c.icon} {c.label}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
              <span className="text-xs font-medium shrink-0" style={{ color: "#BDBDBD" }}>
                #{idx + 1}
              </span>
            </Link>
          ))}
        </div>

        {/* Combinations */}
        {combinations.length > 0 && (
          <div className="mb-6">
            <h2 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: "#2D2D2D" }}>
              <span className="w-1 h-4 rounded-full inline-block" style={{ background: "#F9A8C0" }} />
              組み合わせ情報
            </h2>
            <div className="space-y-2">
              {combinations.map((combo, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-3.5"
                  style={
                    combo.type === "recommended"
                      ? { background: "#E8FAF8", border: "1px solid #5BBFAD30" }
                      : { background: "#FFF3F3", border: "1px solid #F48C8C30" }
                  }
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span>{combo.type === "recommended" ? "📚" : "📋"}</span>
                    <span className="font-bold text-sm" style={{ color: "#2D2D2D" }}>{combo.label}</span>
                  </div>
                  <p className="text-xs" style={{ color: "#9B9B9B" }}>{combo.desc}</p>
                  <p className="text-xs mt-1" style={{ color: "#BDBDBD" }}>出典: {combo.source}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setShowShare(true)}
            className="flex-1 py-3 rounded-2xl text-sm font-medium"
            style={{ border: "1.5px solid #F2F2F2", color: "#9B9B9B" }}
          >
            Xに共有する 🐦
          </button>
          {product.packageImage && (
            <a
              href={product.packageImage}
              download={`${product.name}.jpg`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 rounded-2xl text-sm font-medium text-center"
              style={{ border: "1.5px solid #E8FAF8", color: "#5BBFAD", background: "#F0FDFA" }}
            >
              写真を保存 📥
            </a>
          )}
        </div>

        <Disclaimer />
      </div>

      {showShare && <ShareModal text={shareText} onClose={() => setShowShare(false)} />}
    </div>
    </AuthGuard>
  );
}
