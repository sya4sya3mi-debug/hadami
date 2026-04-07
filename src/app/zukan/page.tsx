"use client";

import { useState, useEffect, useMemo, useRef, Fragment, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useZukanStore, ZukanFilter } from "@/stores/useZukanStore";
import { useProductStore } from "@/stores/useProductStore";
import { MASTER_INGREDIENTS, INGREDIENT_GENRES, GENRE_DESCRIPTIONS, RARITY, getIngredientIndex, getIngredientById, INGREDIENT_COUNT, getGenreTotal } from "@/lib/ingredients";
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
  water:      { bg: "linear-gradient(145deg, #E3F4EE 0%, #D4EDE3 50%, #C5E8D8 100%)", pattern: "radial-gradient(ellipse at 30% 60%, rgba(58,143,122,0.08) 0%, transparent 50%)", color: "#3A7D65", emoji: "💧", label: "うるおい" },
  amino_acid: { bg: "linear-gradient(145deg, #E3E8F4 0%, #D4DBEB 50%, #C5CEE2 100%)", pattern: "radial-gradient(ellipse at 40% 50%, rgba(74,90,138,0.08) 0%, transparent 50%)", color: "#4A5A8A", emoji: "🧬", label: "アミノ酸" },
  vitamin:    { bg: "linear-gradient(145deg, #FFF5E5 0%, #FDECC8 50%, #FBE3B0 100%)", pattern: "radial-gradient(ellipse at 50% 50%, rgba(160,122,48,0.08) 0%, transparent 50%)", color: "#A07A30", emoji: "🍊", label: "ビタミン" },
  peptide:    { bg: "linear-gradient(145deg, #F4E3F0 0%, #EBD4E8 50%, #E2C5DF 100%)", pattern: "radial-gradient(ellipse at 60% 40%, rgba(138,74,122,0.08) 0%, transparent 50%)", color: "#8A4A7A", emoji: "🧪", label: "ペプチド" },
  botanical:  { bg: "linear-gradient(145deg, #E8EFE3 0%, #D8E6CF 50%, #C8DEC0 100%)", pattern: "radial-gradient(ellipse at 40% 70%, rgba(90,122,74,0.08) 0%, transparent 50%)", color: "#5A7A4A", emoji: "🌿", label: "ボタニカル" },
  oil_lipid:  { bg: "linear-gradient(145deg, #EAF0E5 0%, #DDE8D4 50%, #D0E0C5 100%)", pattern: "radial-gradient(ellipse at 50% 60%, rgba(74,122,85,0.08) 0%, transparent 50%)", color: "#4A7A55", emoji: "🫙", label: "オイル・脂質" },
  ferment:    { bg: "linear-gradient(145deg, #EDE3F0 0%, #E0D4EB 50%, #D5C8E2 100%)", pattern: "radial-gradient(ellipse at 60% 40%, rgba(107,74,138,0.08) 0%, transparent 50%)", color: "#6B4A8A", emoji: "🧫", label: "発酵・バイオ" },
  acid:       { bg: "linear-gradient(145deg, #E8E3F0 0%, #DAD4EB 50%, #CCC5E0 100%)", pattern: "radial-gradient(ellipse at 50% 50%, rgba(90,74,122,0.08) 0%, transparent 50%)", color: "#5A4A7A", emoji: "⚗️", label: "アシッド" },
  base:       { bg: "linear-gradient(145deg, #EDEDE8 0%, #E0E0D8 50%, #D5D5CC 100%)", pattern: "radial-gradient(ellipse at 50% 50%, rgba(107,107,90,0.08) 0%, transparent 50%)", color: "#6B6B5A", emoji: "⚙️", label: "ベース" },
};
const DEFAULT_TEX = { bg: "linear-gradient(145deg, #EDEDE8, #D5D5CC)", pattern: "", color: "#6B6B5A", emoji: "📦", label: "その他" };

/* Rarity colors/labels aligned with RARITY (4 tiers: ★1 コモン ~ ★4 レジェンダリー) */
const RARITY_COLORS: Record<number, string> = { 1: "#9CA3AF", 2: "#4CAF50", 3: "#E91E8C", 4: "#F59E0B" };
const RARITY_LABELS: Record<number, string> = { 1: "コモン", 2: "アンコモン", 3: "レア", 4: "レジェンダリー" };

/* ── Achievements ── */
function getAchievements(discoveredIds: string[]) {
  const count = discoveredIds.length;
  const idSet = new Set(discoveredIds);
  let rareCounts = 0;
  let legendCount = 0;
  const genres = new Set<string>();
  idSet.forEach((id) => {
    const ing = getIngredientById(id);
    if (!ing) return;
    const star = RARITY[ing.rarity].star;
    if (star >= 3) rareCounts++;
    if (star >= 4) legendCount++;
    genres.add(ing.genre);
  });

  return [
    { name: "はじめの一歩", desc: "初めて成分を発見した", icon: "🌱", done: count >= 1 },
    { name: "10種コレクト", desc: "成分を10種集めた", icon: "📗", done: count >= 10 },
    { name: "50種コレクト", desc: "成分を50種集めた", icon: "📙", done: count >= 50 },
    { name: "★3ハンター", desc: "レア以上を5種発見", icon: "⭐", done: rareCounts >= 5, progress: rareCounts < 5 ? `${rareCounts}/5` : undefined },
    { name: "★4ハンター", desc: "レジェンダリーを3種発見", icon: "🌟", done: legendCount >= 3, progress: legendCount < 3 ? `${legendCount}/3` : undefined },
    { name: "伝説の出会い", desc: "レジェンダリーの成分を発見", icon: "💎", done: legendCount >= 1 },
    { name: "全タイプ発見", desc: "全ジャンルで成分を発見", icon: "🗺️", done: genres.size >= INGREDIENT_GENRES.length },
    { name: "成分博士", desc: `${INGREDIENT_COUNT}種すべて発見`, icon: "🏆", done: count >= INGREDIENT_COUNT },
  ];
}

export default function ZukanPage() {
  const { loading } = useUser();
  const router = useRouter();
  const captureRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
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
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll to inline detail when selectedCard changes
  useEffect(() => {
    if (selectedCard && detailRef.current) {
      setTimeout(() => {
        detailRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 60);
    }
  }, [selectedCard]);

  // Toggle card selection (same card → close, different → switch)
  const handleCardTap = useCallback((ing: Ingredient) => {
    setSelectedCard((prev) => (prev?.id === ing.id ? null : ing));
  }, []);

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

  const discoveredIdSet = new Set(discoveredIds);
  const filteredIngredients = MASTER_INGREDIENTS.filter((ing) => {
    if (filter === "discovered" && !discoveredIdSet.has(ing.id)) return false;
    if (filter === "undiscovered" && discoveredIdSet.has(ing.id)) return false;
    if (genreFilter !== "all" && ing.genre !== genreFilter) return false;
    return true;
  });

  const shareText = shareZukanProgress(discoveredIds.length, INGREDIENT_COUNT);
  const achievements = getAchievements(discoveredIds);
  const doneCount = achievements.filter((a) => a.done).length;

  // Selected card index in filtered list (for inline detail insertion)
  const selectedIdx = selectedCard ? filteredIngredients.indexOf(selectedCard) : -1;
  // Insert detail panel after the last card in the same row (5 cols)
  const detailInsertAfter = selectedIdx >= 0 ? Math.floor(selectedIdx / 5) * 5 + 4 : -1;

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
  // Genre stats for filter pills
  const discoveredSet = new Set(discoveredIds);
  const genreStats = Object.entries(CARD_TEXTURES).map(([genreKey, tex]) => {
    const total = getGenreTotal(genreKey);
    let disc = 0;
    discoveredSet.forEach((id) => {
      const ing = getIngredientById(id);
      if (ing && ing.genre === genreKey) disc++;
    });
    return { id: genreKey, ...tex, discovered: disc, total };
  }).filter((g) => g.total > 0);

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
              {discoveredIds.length} / {INGREDIENT_COUNT} 種コレクト
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

          {/* Genre filter pills */}
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
            {genreStats.map((gs) => (
              <button
                key={gs.id}
                onClick={() => {
                  setFilter("all");
                  setGenreFilter(gs.id as IngredientGenre);
                }}
                className="py-1.5 px-3 rounded-full border-none text-[10px] font-semibold font-sans cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1"
                style={{
                  background: genreFilter === gs.id ? gs.color : "white",
                  color: genreFilter === gs.id ? "#fff" : "#7E9389",
                }}
              >
                {gs.emoji} {gs.label} <span className="text-[9px] opacity-80">{gs.discovered}/{gs.total}</span>
              </button>
            ))}
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

          {/* Genre description card */}
          {genreFilter !== "all" && (() => {
            const g = INGREDIENT_GENRES.find((gi) => gi.key === genreFilter);
            const desc = GENRE_DESCRIPTIONS[genreFilter];
            if (!g || !desc) return null;
            const totalInGenre = getGenreTotal(genreFilter);
            const discoveredInGenre = genreStats.find((gs) => gs.id === genreFilter)?.discovered || 0;
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

          {/* Mini Card Grid — 5 columns */}
          <div className="grid grid-cols-5 gap-1.5 mb-6">
            {filteredIngredients.map((ing, i) => {
              const globalIndex = getIngredientIndex(ing.id);
              const isSelected = selectedCard?.id === ing.id;
              const cardTex = CARD_TEXTURES[ing.genre] || DEFAULT_TEX;

              // Show detail after the last card in the selected card's row
              const shouldShowDetail = selectedCard && (
                i === detailInsertAfter ||
                (i === filteredIngredients.length - 1 && selectedIdx >= 0 && detailInsertAfter >= filteredIngredients.length)
              );

              return (
                <Fragment key={ing.id}>
                  <div
                    onClick={() => handleCardTap(ing)}
                    className="animate-fade-up"
                    style={{
                      animationDelay: `${Math.min(i, 30) * 15}ms`,
                      outline: isSelected ? `2px solid ${cardTex.color}` : "none",
                      borderRadius: 12,
                      outlineOffset: -1,
                    }}
                  >
                    <IngredientCard
                      ingredient={ing}
                      discovered={discoveredIdSet.has(ing.id)}
                      index={globalIndex}
                      isRecent={recentlyFoundIds.includes(ing.id)}
                      foundCount={ingredientCounts[ing.id] || 0}
                    />
                  </div>

                  {shouldShowDetail && (() => {
                    const sc = selectedCard!;
                    const isDiscovered = discoveredIdSet.has(sc.id);
                    const tex = CARD_TEXTURES[sc.genre] || DEFAULT_TEX;
                    const rarityInfo = RARITY[sc.rarity];
                    const scIndex = getIngredientIndex(sc.id);
                    const containingProducts = products.filter((p) =>
                      p.ingredients.some((pi) => pi.ingredientId === sc.id)
                    );

                    return (
                      <div
                        ref={detailRef}
                        className="col-span-5 rounded-xl p-4 border animate-fade-up relative"
                        style={{
                          background: tex.bg,
                          borderColor: `${tex.color}30`,
                        }}
                      >
                        {/* Close button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedCard(null); }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full border-none cursor-pointer flex items-center justify-center text-xs"
                          style={{ background: `${tex.color}15`, color: tex.color }}
                          aria-label="閉じる"
                        >
                          ✕
                        </button>

                        {isDiscovered ? (
                          <>
                            {/* Header: emoji + name + INCI */}
                            <div className="flex items-start gap-3 mb-3 pr-6">
                              <span
                                className="text-3xl shrink-0"
                                style={{
                                  filter: rarityInfo.star >= 4
                                    ? `drop-shadow(0 0 6px ${RARITY_COLORS[rarityInfo.star]}60)`
                                    : "none",
                                }}
                              >
                                {tex.emoji}
                              </span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] font-black font-serif opacity-50" style={{ color: tex.color }}>
                                    #{String(scIndex).padStart(3, "0")}
                                  </span>
                                  <span
                                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                    style={{ background: `${RARITY_COLORS[rarityInfo.star]}20`, color: RARITY_COLORS[rarityInfo.star] }}
                                  >
                                    {RARITY_LABELS[rarityInfo.star]}
                                  </span>
                                </div>
                                <h3 className="text-sm font-bold font-sans m-0 mt-0.5" style={{ color: tex.color }}>
                                  {sc.nameJa}
                                </h3>
                                <p className="text-[10px] text-bo-ink-muted font-sans m-0 mt-0.5 italic">
                                  {sc.nameInci}
                                </p>
                              </div>
                            </div>

                            {/* Stars */}
                            <div className="text-sm text-[#D4A853] tracking-wider mb-3">
                              {"★".repeat(rarityInfo.star)}{"☆".repeat(4 - rarityInfo.star)}
                            </div>

                            {/* Note */}
                            <p className="text-xs leading-relaxed text-bo-ink font-sans m-0 mb-2">
                              {sc.note}
                            </p>

                            {/* Fun fact */}
                            {sc.funFact && (
                              <div
                                className="rounded-lg p-2.5 mb-2 text-[11px] leading-relaxed font-sans"
                                style={{ background: `${tex.color}08`, color: tex.color }}
                              >
                                💡 {sc.funFact}
                              </div>
                            )}

                            {/* Caution */}
                            {sc.caution && (
                              <div className="rounded-lg p-2.5 mb-2 text-[11px] leading-relaxed font-sans bg-amber-50 text-amber-700">
                                ⚠️ {sc.caution}
                              </div>
                            )}

                            {/* Genre badge */}
                            <div className="flex items-center gap-1.5 mb-3">
                              <span
                                className="text-[10px] font-bold px-2 py-1 rounded-full"
                                style={{ background: `${tex.color}15`, color: tex.color }}
                              >
                                {tex.emoji} {tex.label}
                              </span>
                            </div>

                            {/* Containing products */}
                            {containingProducts.length > 0 && (
                              <div className="border-t pt-2.5" style={{ borderColor: `${tex.color}15` }}>
                                <p className="text-[10px] font-bold text-bo-ink-muted mb-1.5 m-0">
                                  📦 この成分を含む製品（{containingProducts.length}件）
                                </p>
                                <div className="flex flex-col gap-1">
                                  {containingProducts.slice(0, 5).map((prod) => (
                                    <button
                                      key={prod.id}
                                      onClick={(e) => { e.stopPropagation(); router.push(`/product/${prod.id}`); }}
                                      className="text-left text-[11px] font-sans px-2.5 py-1.5 rounded-lg border-none cursor-pointer truncate"
                                      style={{ background: `${tex.color}08`, color: tex.color }}
                                    >
                                      {prod.name}
                                    </button>
                                  ))}
                                  {containingProducts.length > 5 && (
                                    <span className="text-[10px] text-bo-ink-faint pl-2">
                                      …ほか{containingProducts.length - 5}件
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          /* Undiscovered state */
                          <div className="flex flex-col items-center py-4 text-center">
                            <span className="text-3xl mb-2 opacity-30">🔒</span>
                            <p className="text-xs font-bold text-bo-ink-muted mb-1 m-0">
                              #{String(scIndex).padStart(3, "0")} — 未発見の成分
                            </p>
                            <div className="text-sm text-[#D4A853] tracking-wider mb-2">
                              {"★".repeat(rarityInfo.star)}{"☆".repeat(4 - rarityInfo.star)}
                              <span className="text-[10px] ml-1.5" style={{ color: RARITY_COLORS[rarityInfo.star] }}>
                                {RARITY_LABELS[rarityInfo.star]}
                              </span>
                            </div>
                            <p className="text-[11px] text-bo-ink-faint mb-3 m-0">
                              この成分はまだ発見されていません
                            </p>
                            <button
                              onClick={(e) => { e.stopPropagation(); router.push("/scan"); }}
                              className="px-4 py-2 rounded-full text-xs font-bold border-none bg-bo-accent text-white cursor-pointer"
                            >
                              📷 スキャンして見つけよう
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </Fragment>
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

        {/* Scroll to top button */}
        {showScrollTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-[calc(16px+env(safe-area-inset-bottom)+56px)] right-4 z-30 w-10 h-10 rounded-full bg-bo-accent text-white shadow-bo-accent flex items-center justify-center border-none cursor-pointer animate-fade-in"
            aria-label="上へ戻る"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M18 15l-6-6-6 6" />
            </svg>
          </button>
        )}
      </div>
    </AuthGuard>
  );
}
