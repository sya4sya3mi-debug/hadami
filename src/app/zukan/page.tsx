"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useZukanStore, ZukanFilter } from "@/stores/useZukanStore";
import { useProductStore } from "@/stores/useProductStore";
import { MASTER_INGREDIENTS, INGREDIENT_GENRES } from "@/lib/ingredients";
import { IngredientGenre } from "@/types";
import { shareZukanProgress } from "@/lib/share";
import ZukanProgress from "@/components/zukan/ZukanProgress";
import IngredientCard from "@/components/zukan/IngredientCard";
import ShareModal from "@/components/ui/ShareModal";
import Disclaimer from "@/components/ui/Disclaimer";
import { useUser } from "@/lib/auth";
import PageLoading from "@/components/ui/PageLoading";
import AuthGuard from "@/components/ui/AuthGuard";

export default function ZukanPage() {
  const { loading } = useUser();
  const discoveredIds = useZukanStore((s) => s.discoveredIds);
  const filter = useZukanStore((s) => s.filter);
  const setFilter = useZukanStore((s) => s.setFilter);
  const recentlyFoundIds = useZukanStore((s) => s.recentlyFoundIds);
  const clearRecentlyFound = useZukanStore((s) => s.clearRecentlyFound);
  const products = useProductStore((s) => s.products);
  const [showShare, setShowShare] = useState(false);
  const [genreFilter, setGenreFilter] = useState<"all" | IngredientGenre>("all");

  // 成分ごとの発見回数を集計
  const ingredientCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const product of products) {
      for (const pi of product.ingredients) {
        counts[pi.ingredientId] = (counts[pi.ingredientId] || 0) + 1;
      }
    }
    return counts;
  }, [products]);

  // 直近発見がある場合、フィルターを「発見済み」に自動切替
  useEffect(() => {
    if (recentlyFoundIds.length > 0) {
      setFilter("discovered");
    }
    return () => {
      clearRecentlyFound();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return <PageLoading message="図鑑を読み込んでいます..." />;
  }

  const filteredIngredients = MASTER_INGREDIENTS.filter((ing) => {
    if (filter === "discovered" && !discoveredIds.includes(ing.id)) return false;
    if (filter === "undiscovered" && discoveredIds.includes(ing.id)) return false;
    if (genreFilter !== "all" && ing.genre !== genreFilter) return false;
    return true;
  });

  const shareText = shareZukanProgress(discoveredIds.length, MASTER_INGREDIENTS.length);

  return (
    <AuthGuard>
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #F0FDFA 0%, #FFF0F5 100%)" }}>
      <div className="px-5 pt-8 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="font-bold text-lg flex items-center gap-2" style={{ color: "#2D2D2D" }}>
            📖 成分図鑑
          </h1>
          <button
            onClick={() => setShowShare(true)}
            className="px-3 py-1.5 rounded-full text-sm font-medium"
            style={{ background: "linear-gradient(135deg, #F9A8C0, #5BBFAD)", color: "#fff" }}
          >
            共有
          </button>
        </div>

        <ZukanProgress discoveredIds={discoveredIds} />

        {/* Filter */}
        <div className="flex gap-2 mb-5">
          {([
            ["all", "すべて"],
            ["discovered", "発見済み ✨"],
            ["undiscovered", "未発見 ❓"],
          ] as [ZukanFilter, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={
                filter === key
                  ? { background: "#5BBFAD", color: "#fff" }
                  : { background: "#fff", color: "#9B9B9B", border: "1px solid #F2F2F2" }
              }
            >
              {label}
            </button>
          ))}
        </div>

        {/* Genre filter */}
        <div
          className="flex gap-1.5 mb-4 pb-1.5 overflow-x-auto"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
        >
          <button
            onClick={() => setGenreFilter("all")}
            className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
            style={
              genreFilter === "all"
                ? { background: "linear-gradient(135deg, #5BBFAD, #7DD3C8)", color: "#fff" }
                : { background: "#fff", color: "#9B9B9B", border: "1px solid #F0F0F0" }
            }
          >
            全ジャンル
          </button>
          {INGREDIENT_GENRES.map((g) => (
            <button
              key={g.key}
              onClick={() => setGenreFilter(g.key)}
              className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap"
              style={
                genreFilter === g.key
                  ? { background: g.color, color: "#fff" }
                  : { background: "#fff", color: "#9B9B9B", border: "1px solid #F0F0F0" }
              }
            >
              {g.icon} {g.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-6">
          {filteredIngredients.map((ing) => {
            const globalIndex = MASTER_INGREDIENTS.indexOf(ing) + 1;
            return (
              <Link key={ing.id} href={`/ingredient/${ing.id}`}>
                <IngredientCard ingredient={ing} discovered={discoveredIds.includes(ing.id)} index={globalIndex} isRecent={recentlyFoundIds.includes(ing.id)} foundCount={ingredientCounts[ing.id] || 0} />
              </Link>
            );
          })}
        </div>

        {filteredIngredients.length === 0 && (
          <div className="text-center py-10">
            <div className="text-4xl mb-2">🌿</div>
            <p className="text-sm" style={{ color: "#9B9B9B" }}>該当する成分はありません</p>
          </div>
        )}

        <Disclaimer />
      </div>

      {showShare && (
        <ShareModal text={shareText} onClose={() => setShowShare(false)} />
      )}
    </div>
    </AuthGuard>
  );
}
