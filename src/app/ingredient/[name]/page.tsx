"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { getIngredientById, getGenreInfo } from "@/lib/ingredients";
import { useProductStore } from "@/stores/useProductStore";
import { useZukanStore } from "@/stores/useZukanStore";
import Badge from "@/components/ui/Badge";
import Disclaimer from "@/components/ui/Disclaimer";
import { useUser } from "@/lib/auth";
import PageLoading from "@/components/ui/PageLoading";

export default function IngredientDetailPage() {
  const { loading } = useUser();
  const { name } = useParams<{ name: string }>();
  const ingredient = getIngredientById(name);
  const products = useProductStore((s) => s.products);
  const discoveredIds = useZukanStore((s) => s.discoveredIds);

  if (loading) {
    return <PageLoading message="成分情報を読み込んでいます..." />;
  }
  const isDiscovered = discoveredIds.includes(name);

  if (!ingredient) {
    return (
      <div className="min-h-screen px-5 pt-10 text-center bg-bo-cream">
        <p className="text-bo-ink-muted">成分が見つかりません</p>
        <Link href="/zukan" className="text-sm mt-2 inline-block font-medium text-bo-accent">
          図鑑に戻る
        </Link>
      </div>
    );
  }

  if (!isDiscovered) {
    return (
      <div className="min-h-screen bg-bo-cream">
        <div className="px-5 pt-8">
          <Link href="/zukan" className="text-sm font-medium mb-4 inline-block text-bo-accent">
            ← 図鑑
          </Link>
          <div className="text-center py-14">
            <span className="text-7xl">❓</span>
            <h1 className="font-bold text-xl mt-4 text-bo-ink">未発見の成分</h1>
            <p className="text-sm mt-2 text-bo-ink-muted">
              この成分はまだ発見されていません。<br />
              化粧品をスキャンして見つけましょう！
            </p>
            <Link
              href="/scan"
              className="inline-block mt-5 px-8 py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-br from-bo-accent to-bo-accent-light"
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
  return (
    <div className="min-h-screen bg-bo-cream">
      <div className="px-5 pt-8 pb-6">
        <Link href="/zukan" className="text-sm font-medium mb-4 inline-block text-bo-accent">
          ← 図鑑
        </Link>

        {/* Header */}
        <div className="text-center mb-5">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mx-auto mb-2"
            style={{ background: `linear-gradient(135deg, ${genreInfo?.color || ingredient.color}20, ${genreInfo?.color || ingredient.color}08)` }}
          >
            {genreInfo?.icon || "📦"}
          </div>
          <h1 className="font-bold text-lg text-bo-ink font-sans">{ingredient.nameJa}</h1>
          <p className="text-xs mt-0.5 text-bo-ink-muted font-sans">{ingredient.nameInci}</p>
          <div className="flex items-center justify-center gap-2 mt-1.5">
            <Badge rarity={ingredient.rarity} size="sm" />
            {genreInfo && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-medium font-sans"
                style={{ background: genreInfo.color + "18", color: genreInfo.color }}
              >
                {genreInfo.icon} {genreInfo.label}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-r2 p-3.5 mb-2.5 shadow-bo1 border border-bo-parchment">
          <h2 className="font-bold text-xs mb-1.5 text-bo-ink font-sans">📌 一般的な分類の説明</h2>
          <p className="text-xs leading-relaxed text-bo-ink-soft font-sans">{ingredient.note}</p>
        </div>

        {/* Fun fact */}
        {ingredient.funFact && (
          <div className="rounded-r2 p-3.5 mb-2.5 bg-bo-accent-soft border border-bo-accent/20">
            <h2 className="font-bold text-xs mb-1.5 text-bo-accent font-sans">💡 トリビア</h2>
            <p className="text-xs leading-relaxed text-bo-ink-soft font-sans">{ingredient.funFact}</p>
          </div>
        )}

        {/* Caution */}
        {ingredient.caution && (
          <div className="rounded-r2 p-3.5 mb-2.5 bg-bo-danger-bg border border-bo-danger/20">
            <h2 className="font-bold text-xs mb-1.5 text-bo-danger font-sans">📋 一般的な注意事項</h2>
            <p className="text-xs leading-relaxed text-bo-ink-soft font-sans">{ingredient.caution}</p>
          </div>
        )}

        {/* Products */}
        {containingProducts.length > 0 && (
          <div className="mb-4">
            <h2 className="font-bold text-xs mb-2 flex items-center gap-2 text-bo-ink font-sans">
              <span className="w-1 h-3.5 rounded-full inline-block bg-bo-accent" />
              この成分を含む保存済みコスメ
            </h2>
            <div className="space-y-1.5">
              {containingProducts.map((p) => (
                <Link
                  key={p.id}
                  href={`/product/${p.id}`}
                  className="flex items-center gap-2.5 bg-white rounded-r1 p-2.5 shadow-bo1 border border-bo-parchment"
                >
                  <span className="text-base">📦</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs truncate text-bo-ink font-sans">{p.name}</div>
                    <div className="text-[10px] text-bo-ink-muted font-sans">{p.brand}</div>
                  </div>
                  <span className="text-bo-accent text-xs">›</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <Disclaimer />
      </div>
    </div>
  );
}
