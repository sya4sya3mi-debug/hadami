"use client";

import { RARITY, MASTER_INGREDIENTS, INGREDIENT_COUNT } from "@/lib/ingredients";
import { RarityKey } from "@/types";
import { StarIcon } from "@/components/ui/Badge";

/* ── Collector level definitions ── */
const LEVELS = [
  { lv: 1, need: 10, title: "新米コレクター", icon: "🌱" },
  { lv: 2, need: 30, title: "見習い調合師", icon: "🧪" },
  { lv: 3, need: 50, title: "成分ハンター", icon: "🔍" },
  { lv: 4, need: 100, title: "上級探索者", icon: "🗺️" },
  { lv: 5, need: 150, title: "マスター調合師", icon: "⚗️" },
  { lv: 6, need: 200, title: "伝説の研究者", icon: "🔬" },
  { lv: 7, need: 323, title: "成分博士", icon: "👑" },
];

interface ZukanProgressProps {
  discoveredIds: string[];
  onShowAchievements?: () => void;
  achievementsDone?: number;
  achievementsTotal?: number;
}

export default function ZukanProgress({
  discoveredIds,
  onShowAchievements,
  achievementsDone = 0,
  achievementsTotal = 0,
}: ZukanProgressProps) {
  const total = INGREDIENT_COUNT;
  const discovered = discoveredIds.length;
  const discoveredSet = new Set(discoveredIds);

  const currentLevel = LEVELS.filter((l) => discovered >= l.need).pop() || LEVELS[0];
  const nextLevel = LEVELS.find((l) => discovered < l.need);
  const progressToNext = nextLevel
    ? ((discovered - (currentLevel.need || 0)) / (nextLevel.need - (currentLevel.need || 0))) * 100
    : 100;

  const rarityCounts = (Object.keys(RARITY) as RarityKey[]).map((key) => {
    const all = MASTER_INGREDIENTS.filter((i) => i.rarity === key);
    const found = all.filter((i) => discoveredSet.has(i.id));
    return { ...RARITY[key], key, total: all.length, found: found.length };
  });

  return (
    <div className="mb-3.5">
      {/* Collector Level */}
      <div className="rounded-r2 p-4 mb-3 bg-gradient-to-br from-bo-accent-soft to-bo-parchment border border-bo-accent/[0.12]">
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="w-9 h-9 rounded-[10px] bg-bo-accent flex items-center justify-center text-lg">
            {currentLevel.icon}
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-extrabold font-serif text-bo-ink">
              Lv.{currentLevel.lv} {currentLevel.title}
            </div>
            {nextLevel && (
              <div className="text-[9px] text-bo-ink-muted font-sans">
                次: Lv.{nextLevel.lv} まであと{nextLevel.need - discovered}種
              </div>
            )}
          </div>
          {onShowAchievements && (
            <button
              onClick={onShowAchievements}
              className="py-1 px-2.5 rounded-lg bg-white border border-bo-parchment text-[10px] font-bold text-bo-ink-soft font-sans cursor-pointer"
            >
              🏆 {achievementsDone}/{achievementsTotal}
            </button>
          )}
        </div>
        {nextLevel && (
          <div className="h-1 rounded-sm bg-white/50 overflow-hidden">
            <div
              className="h-full rounded-sm bg-bo-accent transition-all duration-700"
              style={{ width: `${Math.round(progressToNext)}%` }}
            />
          </div>
        )}
      </div>

      {/* Rarity breakdown */}
      <div className="bg-white rounded-r2 border border-bo-parchment shadow-bo1 p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="font-bold text-sm text-bo-ink font-sans">コンプリート率</span>
          <span className="font-bold text-sm text-bo-accent font-sans">
            {total > 0 ? Math.round((discovered / total) * 100) : 0}%
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden mb-3 bg-bo-parchment">
          <div
            className="h-full rounded-full bg-bo-accent transition-all"
            style={{ width: `${total > 0 ? Math.round((discovered / total) * 100) : 0}%` }}
          />
        </div>
        <div className="text-center text-2xl font-bold text-bo-accent mb-3">
          {discovered}
          <span className="text-sm font-normal text-bo-ink-muted">/{total}種</span>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {rarityCounts.map((r) => (
            <div
              key={r.key}
              className="text-center py-2 rounded-xl"
              style={{ background: r.color + "15" }}
            >
              <span className="inline-flex items-center justify-center gap-px">
                {Array.from({ length: r.star }).map((_, i) => (
                  <StarIcon key={i} color={r.color} size={12} />
                ))}
              </span>
              <div className="text-xs font-bold mt-0.5" style={{ color: r.color }}>
                {r.found}/{r.total}
              </div>
              {/* rarity label hidden */}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
