"use client";

import { useState } from "react";
import Link from "next/link";
import { useZukanStore } from "@/stores/useZukanStore";
import { MASTER_INGREDIENTS } from "@/lib/ingredients";
import { shareZukanProgress } from "@/lib/share";
import ZukanProgress from "@/components/zukan/ZukanProgress";
import IngredientCard from "@/components/zukan/IngredientCard";
import ShareModal from "@/components/ui/ShareModal";
import Disclaimer from "@/components/ui/Disclaimer";

type Filter = "all" | "discovered" | "undiscovered";

export default function ZukanPage() {
  const discoveredIds = useZukanStore((s) => s.discoveredIds);
  const [filter, setFilter] = useState<Filter>("all");
  const [showShare, setShowShare] = useState(false);

  const filteredIngredients = MASTER_INGREDIENTS.filter((ing) => {
    if (filter === "discovered") return discoveredIds.includes(ing.id);
    if (filter === "undiscovered") return !discoveredIds.includes(ing.id);
    return true;
  });

  const shareText = shareZukanProgress(discoveredIds.length, MASTER_INGREDIENTS.length);

  return (
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
          ] as const).map(([key, label]) => (
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

        {/* Grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-6">
          {filteredIngredients.map((ing) => (
            <Link key={ing.id} href={`/ingredient/${ing.id}`}>
              <IngredientCard ingredient={ing} discovered={discoveredIds.includes(ing.id)} />
            </Link>
          ))}
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
  );
}
