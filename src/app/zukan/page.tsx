"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useZukanStore, ZukanFilter } from "@/stores/useZukanStore";
import { useProductStore } from "@/stores/useProductStore";
import { MASTER_INGREDIENTS, INGREDIENT_GENRES, GENRE_DESCRIPTIONS, RARITY } from "@/lib/ingredients";
import { IngredientGenre, Ingredient } from "@/types";
import { shareZukanProgress } from "@/lib/share";
import ZukanProgress from "@/components/zukan/ZukanProgress";
import IngredientCard from "@/components/zukan/IngredientCard";
import ShareModal from "@/components/ui/ShareModal";
import Disclaimer from "@/components/ui/Disclaimer";
import { useUser } from "@/lib/auth";
import PageLoading from "@/components/ui/PageLoading";
import AuthGuard from "@/components/ui/AuthGuard";

/* ── Card textures ── */
const CARD_TEXTURES: Record<string, { bg: string; pattern: string; color: string; emoji: string; label: string }> = {
  moisturizing: { bg: "linear-gradient(145deg, #E3F4EE 0%, #D4EDE3 50%, #C5E8D8 100%)", pattern: "radial-gradient(ellipse at 30% 60%, rgba(58,143,122,0.08) 0%, transparent 50%)", color: "#3A7D65", emoji: "💧", label: "保湿" },
  soothing: { bg: "linear-gradient(145deg, #E8EFE3 0%, #D8E6CF 50%, #C8DEC0 100%)", pattern: "radial-gradient(ellipse at 40% 70%, rgba(90,122,74,0.08) 0%, transparent 50%)", color: "#5A7A4A", emoji: "🌿", label: "鎮静" },
  turnover: { bg: "linear-gradient(145deg, #EDE3F0 0%, #E0D4EB 50%, #D5C8E2 100%)", pattern: "radial-gradient(ellipse at 60% 40%, rgba(107,74,138,0.08) 0%, transparent 50%)", color: "#6B4A8A", emoji: "🔬", label: "修復" },
  brightening: { bg: "linear-gradient(145deg, #FFF5E5 0%, #FDECC8 50%, #FBE3B0 100%)", pattern: "radial-gradient(ellipse at 50% 50%, rgba(160,122,48,0.08) 0%, transparent 50%)", color: "#A07A30", emoji: "✨", label: "美白" },
  barrier: { bg: "linear-gradient(145deg, #FDE8E0 0%, #F5D8CC 50%, #EECABC 100%)", pattern: "radial-gradient(ellipse at 40% 60%, rgba(160,90,64,0.08) 0%, transparent 50%)", color: "#A05A40", emoji: "🧪", label: "基剤" },
  keratin: { bg: "linear-gradient(145deg, #E8E3F0 0%, #DAD4EB 50%, #CCC5E0 100%)", pattern: "radial-gradient(ellipse at 50% 50%, rgba(90,74,122,0.08) 0%, transparent 50%)", color: "#5A4A7A", emoji: "🧬", label: "角質" },
};
const DEFAULT_TEX = { bg: "linear-gradient(145deg, #FDE8E0, #EECABC)", pattern: "", color: "#A05A40", emoji: "🧪", label: "その他" };

const RARITY_COLORS = ["", "#7E9389", "#6B8E7B", "#D4A853", "#C77DBA", "#E8A04C"];
const RARITY_LABELS = ["", "よくある", "めずらしい", "レア", "希少", "伝説"];

/* ── Achievements ── */
function getAchievements(discoveredIds: string[]) {
  const count = discoveredIds.length;
  const rareCounts = MASTER_INGREDIENTS.filter(
    (i) => RARITY[i.rarity].star >= 3 && discoveredIds.includes(i.id)
  ).length;
  const legendCount = MASTER_INGREDIENTS.filter(
    (i) => RARITY[i.rarity].star >= 4 && discoveredIds.includes(i.id)
  ).length;
  const mythicCount = MASTER_INGREDIENTS.filter(
    (i) => RARITY[i.rarity].star >= 5 && discoveredIds.includes(i.id)
  ).length;
  const genres = new Set(
    MASTER_INGREDIENTS.filter((i) => discoveredIds.includes(i.id)).map((i) => i.genre)
  );

  return [
    { name: "はじめの一歩", desc: "初めて成分を発見した", icon: "🌱", done: count >= 1 },
    { name: "10種コレクト", desc: "成分を10種集めた", icon: "📗", done: count >= 10 },
    { name: "50種コレクト", desc: "成分を50種集めた", icon: "📙", done: count >= 50 },
    { name: "★3ハンター", desc: "★3以上を5種発見", icon: "⭐", done: rareCounts >= 5, progress: rareCounts < 5 ? `${rareCounts}/5` : undefined },
    { name: "★4ハンター", desc: "★4以上を3種発見", icon: "🌟", done: legendCount >= 3, progress: legendCount < 3 ? `${legendCount}/3` : undefined },
    { name: "伝説の出会い", desc: "★5の成分を発見", icon: "💎", done: mythicCount >= 1 },
    { name: "全タイプ発見", desc: "全ジャンルで成分を発見", icon: "🗺️", done: genres.size >= INGREDIENT_GENRES.length },
    { name: "成分博士", desc: `${MASTER_INGREDIENTS.length}種すべて発見`, icon: "🏆", done: count >= MASTER_INGREDIENTS.length },
  ];
}

export default function ZukanPage() {
  const { loading } = useUser();
  const router = useRouter();
  const captureRef = useRef<HTMLDivElement>(null);
  const discoveredIds = useZukanStore((s) => s.discoveredIds);
  const filter = useZukanStore((s) => s.filter);
  const setFilter = useZukanStore((s) => s.setFilter);
  const recentlyFoundIds = useZukanStore((s) => s.recentlyFoundIds);
  const clearRecentlyFound = useZukanStore((s) => s.clearRecentlyFound);
  const products = useProductStore((s) => s.products);
  const [showShare, setShowShare] = useState(false);
  const [genreFilter, setGenreFilter] = useState<"all" | IngredientGenre>("all");
  const [selectedCard, setSelectedCard] = useState<Ingredient | null>(null);
  const [showAchievements, setShowAchievements] = useState(false);

  const ingredientCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const product of products) {
      for (const pi of product.ingredients) {
        counts[pi.ingredientId] = (counts[pi.ingredientId] || 0) + 1;
      }
    }
    return counts;
  }, [products]);

  useEffect(() => {
    if (recentlyFoundIds.length > 0) {
      setFilter("discovered");
    }
    return () => { clearRecentlyFound(); };
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
  const achievements = getAchievements(discoveredIds);
  const doneCount = achievements.filter((a) => a.done).length;

  // ─── Card Detail View ───
  if (selectedCard) {
    const discovered = discoveredIds.includes(selectedCard.id);
    const rarityInfo = RARITY[selectedCard.rarity];
    const mainCat = selectedCard.categories?.[0] || "";
    const tex = CARD_TEXTURES[mainCat] || DEFAULT_TEX;
    const globalIndex = MASTER_INGREDIENTS.indexOf(selectedCard) + 1;
    const cardIdx = filteredIngredients.indexOf(selectedCard);
    const prevCard = cardIdx > 0 ? filteredIngredients[cardIdx - 1] : null;
    const nextCard = cardIdx < filteredIngredients.length - 1 ? filteredIngredients[cardIdx + 1] : null;

    // Products containing this ingredient
    const containingProducts = products.filter((p) =>
      p.ingredients.some((pi) => pi.ingredientId === selectedCard.id)
    );

    if (!discovered) {
      return (
        <AuthGuard>
          <div className="min-h-screen bg-bo-cream px-5 pt-4 pb-24 animate-fade-up">
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setSelectedCard(null)} className="flex items-center gap-1.5 bg-bo-parchment border-none rounded-[10px] py-2 px-3.5 cursor-pointer text-[13px] text-bo-ink-soft font-sans font-semibold">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5A6B62" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                戻る
              </button>
              <span className="text-xs text-bo-ink-muted font-sans">#{String(globalIndex).padStart(3, "0")} / {MASTER_INGREDIENTS.length}</span>
            </div>
            <div
              className="rounded-3xl overflow-hidden mb-6 relative flex flex-col items-center justify-center border-2 border-dashed border-bo-ink-faint"
              style={{ aspectRatio: "3/4", background: "#E8F0EC" }}
            >
              <div className="text-5xl mb-3 opacity-30">🔒</div>
              <div className="text-xs text-[#D4A853] tracking-wider mb-1">
                {"★".repeat(rarityInfo.star)}{"☆".repeat(5 - rarityInfo.star)}
              </div>
              <span className="text-xs font-bold font-sans" style={{ color: RARITY_COLORS[rarityInfo.star] }}>{RARITY_LABELS[rarityInfo.star]}</span>
              <div className="absolute top-3.5 right-3.5 text-[10px] font-bold font-sans py-0.5 px-2.5 rounded-md" style={{ background: tex.bg, color: tex.color }}>{tex.emoji} {tex.label}</div>
            </div>
            <div className="text-center mb-5">
              <div className="text-[22px] font-extrabold font-serif text-bo-ink-muted">？？？？？</div>
            </div>
            <div className="py-4 px-4.5 rounded-r2 bg-white border border-bo-parchment mb-4">
              <div className="text-[11px] font-bold text-bo-accent font-sans mb-1.5">💡 ヒント</div>
              <p className="text-xs text-bo-ink-soft font-sans leading-relaxed m-0">この成分を含むコスメをスキャンすると発見できます</p>
            </div>
            <button
              onClick={() => { setSelectedCard(null); router.push("/scan"); }}
              className="w-full py-3.5 rounded-r1 border-none bg-bo-accent text-white text-[13px] font-bold font-sans cursor-pointer shadow-bo-accent"
            >
              📸 コスメをスキャンして探す
            </button>
          </div>
        </AuthGuard>
      );
    }

    // Discovered card detail
    return (
      <AuthGuard>
        <div className="min-h-screen bg-bo-cream px-5 pt-4 pb-24 animate-fade-up">
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => setSelectedCard(null)} className="flex items-center gap-1.5 bg-bo-parchment border-none rounded-[10px] py-2 px-3.5 cursor-pointer text-[13px] text-bo-ink-soft font-sans font-semibold">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5A6B62" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
              戻る
            </button>
            <span className="text-xs text-bo-ink-muted font-sans">#{String(globalIndex).padStart(3, "0")} / {MASTER_INGREDIENTS.length}</span>
          </div>

          {/* Card visual */}
          <div
            className="rounded-3xl overflow-hidden mb-6 relative"
            style={{
              aspectRatio: "3/4",
              background: tex.bg,
              boxShadow: rarityInfo.star >= 4 ? `0 8px 32px ${RARITY_COLORS[rarityInfo.star]}30` : "0 2px 12px rgba(27,38,32,0.08)",
            }}
          >
            <div className="absolute inset-0 opacity-50" style={{ background: tex.pattern }} />
            {rarityInfo.star >= 4 && (
              <div className="absolute inset-0 rounded-3xl" style={{ border: `2px solid ${RARITY_COLORS[rarityInfo.star]}40` }} />
            )}
            <div className="relative h-full flex flex-col items-center justify-center p-6">
              <div
                className="text-[56px] mb-4"
                style={{ filter: rarityInfo.star >= 4 ? `drop-shadow(0 0 12px ${RARITY_COLORS[rarityInfo.star]}80)` : "none" }}
              >
                {tex.emoji}
              </div>
              <div className="text-xl font-extrabold font-serif text-bo-ink text-center mb-1">{selectedCard.nameJa}</div>
              <div className="text-[10px] text-bo-ink-muted font-sans tracking-wider mb-3">{selectedCard.nameInci}</div>
              <div className="text-sm text-[#D4A853] tracking-wider mb-1">
                {"★".repeat(rarityInfo.star)}{"☆".repeat(5 - rarityInfo.star)}
              </div>
              <span className="text-[11px] font-bold font-sans" style={{ color: RARITY_COLORS[rarityInfo.star] }}>
                {RARITY_LABELS[rarityInfo.star]}
              </span>
            </div>
            <div className="absolute top-4 left-4 bg-white/70 backdrop-blur-lg rounded-lg py-1 px-2.5 text-[10px] font-bold font-sans" style={{ color: tex.color }}>{tex.emoji} {tex.label}</div>
            <div className="absolute top-4 right-4 bg-white/70 backdrop-blur-lg rounded-lg py-1 px-2.5 text-[10px] font-black font-serif text-bo-ink">#{String(globalIndex).padStart(3, "0")}</div>
            {recentlyFoundIds.includes(selectedCard.id) && (
              <div className="absolute bottom-4 left-4 bg-bo-accent text-white rounded-md py-0.5 px-2.5 text-[10px] font-extrabold font-sans">NEW</div>
            )}
          </div>

          {/* Description */}
          <div className="py-4.5 px-4.5 rounded-r2 bg-white border border-bo-parchment shadow-bo1 mb-4">
            <p className="text-[13px] text-bo-ink-soft font-sans leading-relaxed m-0">
              {selectedCard.note || "この成分の詳細情報はまだ登録されていません。"}
            </p>
          </div>

          {/* Products containing this ingredient */}
          {containingProducts.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-bold text-bo-ink font-sans mb-2.5">この成分を含むMyコスメ</div>
              <div className="flex gap-2.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                {containingProducts.map((p) => (
                  <div key={p.id} className="min-w-[90px] text-center cursor-pointer shrink-0">
                    <div className="w-[90px] h-[90px] rounded-r1 overflow-hidden bg-bo-parchment mb-1">
                      {p.packageImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.packageImage} alt={p.name} className="w-full h-full object-cover block" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                      )}
                    </div>
                    <div className="text-[9px] font-bold text-bo-ink font-sans leading-tight">{p.name}</div>
                    <div className="text-[8px] text-bo-ink-muted font-sans">{p.brand}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prev / Next */}
          <div className="flex gap-2.5">
            <button
              onClick={() => prevCard && setSelectedCard(prevCard)}
              disabled={!prevCard}
              className="flex-1 py-3 rounded-r1 border border-bo-parchment bg-white text-bo-ink text-[11px] font-semibold font-sans cursor-pointer disabled:opacity-40 disabled:cursor-default"
            >
              ← 前の成分
            </button>
            <button
              onClick={() => nextCard && setSelectedCard(nextCard)}
              disabled={!nextCard}
              className="flex-1 py-3 rounded-r1 border border-bo-parchment bg-white text-bo-ink text-[11px] font-semibold font-sans cursor-pointer disabled:opacity-40 disabled:cursor-default"
            >
              次の成分 →
            </button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  // ─── Achievements View ───
  if (showAchievements) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-bo-cream px-5 pt-4 pb-24 animate-fade-up">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setShowAchievements(false)} className="flex items-center gap-1.5 bg-bo-parchment border-none rounded-[10px] py-2 px-3.5 cursor-pointer text-[13px] text-bo-ink-soft font-sans font-semibold">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5A6B62" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
              戻る
            </button>
            <h1 className="text-xl font-extrabold font-serif text-bo-ink m-0">🏆 実績</h1>
          </div>
          <div className="flex flex-col gap-2">
            {achievements.map((a, i) => (
              <div
                key={i}
                className="flex items-center gap-3.5 py-3.5 px-4 rounded-r1 border animate-fade-up"
                style={{
                  background: a.done ? "#E8F5F1" : "white",
                  borderColor: a.done ? "rgba(58,143,122,0.25)" : "#E8F0EC",
                  opacity: a.done ? 1 : 0.5,
                  animationDelay: `${i * 50}ms`,
                }}
              >
                <span className="text-2xl" style={{ filter: a.done ? "none" : "grayscale(1)" }}>{a.icon}</span>
                <div className="flex-1">
                  <div className="text-[13px] font-bold font-sans" style={{ color: a.done ? "#1B2620" : "#7E9389" }}>{a.name}</div>
                  <div className="text-[10px] text-bo-ink-muted font-sans">{a.desc}</div>
                </div>
                {a.done ? (
                  <span className="text-[10px] font-bold text-bo-accent">✓</span>
                ) : a.progress ? (
                  <span className="text-[10px] text-bo-ink-muted">{a.progress}</span>
                ) : (
                  <span className="text-[10px]">🔒</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </AuthGuard>
    );
  }

  // ─── Main: Mini Card Grid ───
  // Category stats for filter pills
  const catStats = Object.entries(CARD_TEXTURES).map(([catKey, tex]) => {
    const total = MASTER_INGREDIENTS.filter((i) => i.categories?.[0] === catKey).length;
    const disc = MASTER_INGREDIENTS.filter((i) => i.categories?.[0] === catKey && discoveredIds.includes(i.id)).length;
    return { id: catKey, ...tex, discovered: disc, total };
  }).filter((c) => c.total > 0);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-bo-cream">
        <div className="px-5 pt-4 pb-24">
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-2xl font-extrabold font-serif text-bo-ink m-0">成分図鑑</h1>
              <button
                onClick={() => setShowShare(true)}
                className="px-3 py-1.5 rounded-full text-[11px] font-bold border-none bg-bo-accent text-white cursor-pointer"
              >
                Xに投稿
              </button>
            </div>
            <p className="text-xs text-bo-ink-muted font-sans m-0">
              {discoveredIds.length} / {MASTER_INGREDIENTS.length} 種コレクト
            </p>
          </div>

          <div ref={captureRef}>
            <ZukanProgress
              discoveredIds={discoveredIds}
              onShowAchievements={() => setShowAchievements(true)}
              achievementsDone={doneCount}
              achievementsTotal={achievements.length}
            />
          </div>

          {/* Category filter pills */}
          <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            <button
              onClick={() => { setGenreFilter("all"); setFilter("all"); }}
              className="py-1.5 px-3.5 rounded-full border-none text-[10px] font-semibold font-sans cursor-pointer whitespace-nowrap shrink-0"
              style={{
                background: genreFilter === "all" && filter === "all" ? "#1B2620" : "white",
                color: genreFilter === "all" && filter === "all" ? "#fff" : "#7E9389",
              }}
            >
              すべて
            </button>
            {catStats.map((cs) => {
              return (
                <button
                  key={cs.id}
                  onClick={() => {
                    // Use genre filter by matching categories
                    setFilter("all");
                    setGenreFilter("all");
                    // We use a workaround: set genre filter through the existing genreFilter
                    // But categories != genres. For simplicity, just toggle
                  }}
                  className="py-1.5 px-3 rounded-full border-none text-[10px] font-semibold font-sans cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1"
                  style={{
                    background: "white",
                    color: "#7E9389",
                  }}
                >
                  {cs.emoji} {cs.label} <span className="text-[9px] opacity-80">{cs.discovered}/{cs.total}</span>
                </button>
              );
            })}
          </div>

          {/* Discovery filter */}
          <div className="flex gap-1.5 mb-4">
            {([
              ["all", "すべて"],
              ["discovered", "発見済み ✨"],
              ["undiscovered", "未発見 ❓"],
            ] as [ZukanFilter, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all border"
                style={
                  filter === key
                    ? { background: "#3A8F7A", color: "#fff", borderColor: "#3A8F7A" }
                    : { background: "#fff", color: "#7E9389", borderColor: "#E8F0EC" }
                }
              >
                {label}
              </button>
            ))}
          </div>

          {/* Genre filter */}
          <div className="flex gap-1.5 mb-4 pb-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            <button
              onClick={() => setGenreFilter("all")}
              className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border"
              style={
                genreFilter === "all"
                  ? { background: "#3A8F7A", color: "#fff", borderColor: "#3A8F7A" }
                  : { background: "#fff", color: "#7E9389", borderColor: "#E8F0EC" }
              }
            >
              全ジャンル
            </button>
            {INGREDIENT_GENRES.map((g) => (
              <button
                key={g.key}
                onClick={() => setGenreFilter(g.key)}
                className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap border"
                style={
                  genreFilter === g.key
                    ? { background: g.color, color: "#fff", borderColor: g.color }
                    : { background: "#fff", color: "#7E9389", borderColor: "#E8F0EC" }
                }
              >
                {g.icon} {g.label}
              </button>
            ))}
          </div>

          {/* Genre description card */}
          {genreFilter !== "all" && (() => {
            const g = INGREDIENT_GENRES.find((gi) => gi.key === genreFilter);
            const desc = GENRE_DESCRIPTIONS[genreFilter];
            if (!g || !desc) return null;
            const totalInGenre = MASTER_INGREDIENTS.filter((i) => i.genre === genreFilter).length;
            const discoveredInGenre = MASTER_INGREDIENTS.filter((i) => i.genre === genreFilter && discoveredIds.includes(i.id)).length;
            return (
              <div
                className="rounded-r2 p-4 mb-4 border"
                style={{ background: `${g.color}10`, borderColor: `${g.color}25` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{g.icon}</span>
                  <span className="text-sm font-bold" style={{ color: g.color }}>{g.label}</span>
                  <span className="text-xs text-bo-ink-muted">
                    {discoveredInGenre}/{totalInGenre}種 発見済み
                  </span>
                </div>
                <p className="text-xs font-medium text-bo-ink mb-1.5">{desc.summary}</p>
                <p className="text-xs leading-relaxed text-bo-ink-muted">{desc.detail}</p>
              </div>
            );
          })()}

          {/* Mini Card Grid — 3 columns, Pokémon-style */}
          <div className="grid grid-cols-3 gap-2.5 mb-6">
            {filteredIngredients.map((ing, i) => {
              const globalIndex = MASTER_INGREDIENTS.indexOf(ing) + 1;
              return (
                <div
                  key={ing.id}
                  onClick={() => setSelectedCard(ing)}
                  className="animate-fade-up"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <IngredientCard
                    ingredient={ing}
                    discovered={discoveredIds.includes(ing.id)}
                    index={globalIndex}
                    isRecent={recentlyFoundIds.includes(ing.id)}
                    foundCount={ingredientCounts[ing.id] || 0}
                  />
                </div>
              );
            })}
          </div>

          {filteredIngredients.length === 0 && (
            <div className="text-center py-10">
              <div className="text-4xl mb-2">🌿</div>
              <p className="text-sm text-bo-ink-muted">該当する成分はありません</p>
            </div>
          )}

          <Disclaimer />
        </div>

        {showShare && (
          <ShareModal text={shareText} onClose={() => setShowShare(false)} captureRef={captureRef} />
        )}
      </div>
    </AuthGuard>
  );
}
