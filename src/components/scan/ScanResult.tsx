"use client";

import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Ingredient, Combination, ProductGenre } from "@/types";
import { RARITY, ACTIVE_CATEGORIES, getIngredientCategoryInfo, getIngredientCategories, isActiveIngredient } from "@/lib/ingredients";
import { getGenreByKey } from "@/lib/productGenres";
import Badge, { StarIcon } from "@/components/ui/Badge";
import Disclaimer from "@/components/ui/Disclaimer";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import RecommendSection from "@/components/recommendations/RecommendSection";
import { ActiveCategoryIcon, ProductGenreIcon } from "@/components/ui/CosmeticIcons";
import BottomSheet from "@/components/scan/BottomSheet";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import ShareModal from "@/components/ui/ShareModal";
import { generateScanResultShareImage } from "@/lib/generateShareImage";

interface ScanResultProps {
  productName: string;
  brand: string;
  productType: ProductGenre;
  foundIngredients: { ingredient: Ingredient; orderIndex: number }[];
  unknownIngredients: string[];
  combinations: Combination[];
  onSave?: () => void;
  saved: boolean;
  imagePreview?: string;
  newDiscoveryIds?: Set<string>;
}

export default function ScanResult({
  productName,
  brand,
  productType,
  foundIngredients,
  unknownIngredients,
  combinations,
  onSave,
  saved,
  imagePreview,
  newDiscoveryIds,
}: ScanResultProps) {
  const [showUnknown, setShowUnknown] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["_all"]));
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [shareModalOpen, setShareModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [shareImageBase64, setShareImageBase64] = useState<string | null>(null);

  const genre = getGenreByKey(productType);

  // 有効成分とその他を分離
  const activeIngredients = foundIngredients.filter((f) => isActiveIngredient(f.ingredient.id));
  const otherIngredients = foundIngredients.filter((f) => !isActiveIngredient(f.ingredient.id));

  // Group active ingredients by effect category
  const grouped = new Map<string, { ingredient: Ingredient; orderIndex: number }[]>();
  for (const item of activeIngredients) {
    const catKey = item.ingredient.categories[0] || "_other";
    if (!grouped.has(catKey)) grouped.set(catKey, []);
    grouped.get(catKey)!.push(item);
  }

  const toggleCategory = (key: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const [isSaving, setIsSaving] = useState(false);
  const handleSave = async () => {
    if (!onSave || saved || isSaving) return;
    try {
      setIsSaving(true);
      await onSave();
    } finally {
      setIsSaving(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleShare = useCallback(async () => {
    const activeIngs = foundIngredients
      .filter((f) => isActiveIngredient(f.ingredient.id))
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((f) => f.ingredient);
    const img = await generateScanResultShareImage({
      productName,
      brand,
      productType,
      imagePreview,
      activeIngredients: activeIngs,
    });
    setShareImageBase64(img);
    setShareModalOpen(true);
  }, [productName, brand, productType, imagePreview, foundIngredients]);

  const contentPaddingClass = saved ? "pb-36" : "pb-24";

  return (
    <div className={`space-y-5 animate-fade-up ${contentPaddingClass}`}>
      {/* Product header card */}
      <div className="bg-white dark:bg-gray-800 rounded-r3 overflow-hidden shadow-bo2">
        <div className="h-1 bg-gradient-to-r from-bo-accent via-bo-safe to-[#6BC4A0]" />
        <div className="p-5">
          <div className="flex items-center gap-3.5">
            {imagePreview ? (
              <div className="w-16 h-16 rounded-r1 overflow-hidden shrink-0 shadow-bo1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-r1 shrink-0 flex items-center justify-center text-2xl
                              bg-gradient-to-br from-bo-accent-soft to-bo-parchment">
                {genre?.icon || "📦"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-base font-serif truncate text-bo-ink dark:text-white">{productName}</div>
              <div className="text-xs mt-0.5 truncate text-bo-ink-muted dark:text-gray-400 font-sans tracking-wide">{brand}</div>
            </div>
            {genre && (
              <span
                className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-r1 font-semibold shrink-0 font-sans"
                style={{ background: genre.color + "18", color: genre.color }}
              >
                <ProductGenreIcon genre={genre.key} size={12} />
                {genre.label}
              </span>
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-bo-parchment dark:border-gray-700">
            <div className="flex-1 text-center">
              <div className="text-lg font-black text-bo-accent font-sans">{activeIngredients.length}</div>
              <div className="text-[10px] text-bo-ink-muted dark:text-gray-400 font-sans mt-0.5">美容成分</div>
            </div>
            {otherIngredients.length > 0 && (
              <div className="flex-1 text-center border-l border-bo-parchment dark:border-gray-700">
                <div className="text-lg font-black text-bo-ink-muted dark:text-gray-300 font-sans">{otherIngredients.length}</div>
                <div className="text-[10px] text-bo-ink-muted dark:text-gray-400 font-sans mt-0.5">その他の成分</div>
              </div>
            )}
            {combinations.length > 0 && (
              <div className="flex-1 text-center border-l border-bo-parchment dark:border-gray-700">
                <div className="text-lg font-black text-bo-accent font-sans">{combinations.length}</div>
                <div className="text-[10px] text-bo-ink-muted dark:text-gray-400 font-sans mt-0.5">組み合わせ</div>
              </div>
            )}
          </div>

          {/* Save button — inline in header card */}
          {!saved && onSave && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full mt-4 py-3.5 rounded-r2 font-bold text-[15px] font-sans border-none cursor-pointer
                         bg-bo-accent text-white shadow-bo-accent pressable
                         flex items-center justify-center gap-2
                         disabled:opacity-60 disabled:cursor-wait"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              {isSaving ? "保存中..." : "マイコスメに保存する"}
            </button>
          )}
          {saved && (
            <div className="flex items-center gap-2 mt-4 px-3 py-2.5 rounded-r2 bg-bo-accent-soft/60">
              <div className="w-5 h-5 rounded-full bg-bo-accent flex items-center justify-center shrink-0">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </div>
              <span className="text-xs font-bold text-bo-accent font-sans">保存しました</span>
            </div>
          )}
        </div>
      </div>

      {/* レコメンドセクション（保存後に表示） */}
      {saved && <RecommendSection enabled={saved} />}

      {/* 検出成分セクション */}
      <div>
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-bo-ink dark:text-white font-sans">
          <span className="w-1.5 h-5 rounded-full inline-block bg-bo-accent" />
          検出成分
        </h3>

        {activeIngredients.length > 8 ? (
          <div className="space-y-2.5">
            {Array.from(grouped.entries()).map(([catKey, items]) => {
              const catInfo = ACTIVE_CATEGORIES.find((c) => c.key === catKey);
              const isOpen = expandedCategories.has(catKey);
              return (
                <div key={catKey}>
                  <button
                    onClick={() => toggleCategory(catKey)}
                    className="w-full flex items-center justify-between rounded-r2 px-4 py-3 text-sm
                               bg-white dark:bg-gray-800 shadow-bo1 border-none cursor-pointer pressable"
                  >
                    <div className="flex items-center gap-2.5">
                      {catInfo ? (
                        <div
                          className="w-8 h-8 rounded-[10px] flex items-center justify-center"
                          style={{ background: catInfo.color + "15" }}
                        >
                          <ActiveCategoryIcon category={catInfo.key} size={16} />
                        </div>
                      ) : (
                        <span className="text-base">📋</span>
                      )}
                      <span className="font-bold text-sm font-sans dark:brightness-125" style={{ color: catInfo?.color || "#212121" }}>
                        {catInfo?.label || "その他"}
                      </span>
                      <span className="text-xs text-bo-ink-faint font-sans">({items.length})</span>
                    </div>
                    <svg
                      width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="#9E9E9E" strokeWidth="2" strokeLinecap="round"
                      className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    >
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="space-y-2 mt-2">
                      {items.map(({ ingredient, orderIndex }, idx) => (
                        <IngredientRow
                          key={ingredient.id}
                          ingredient={ingredient}
                          orderIndex={orderIndex}
                          delay={Math.min(idx, 10) * 50}
                          isNew={newDiscoveryIds?.has(ingredient.id)}
                          onSelect={setSelectedIngredient}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {activeIngredients.map(({ ingredient, orderIndex }, idx) => (
              <IngredientRow
                key={ingredient.id}
                ingredient={ingredient}
                orderIndex={orderIndex}
                delay={Math.min(idx, 10) * 50}
                isNew={newDiscoveryIds?.has(ingredient.id)}
                onSelect={setSelectedIngredient}
              />
            ))}
          </div>
        )}

        {activeIngredients.length === 0 && (
          <div className="text-center py-10 rounded-r2 bg-white shadow-bo1">
            <div className="text-3xl mb-3">🔍</div>
            <p className="text-sm text-bo-ink-muted font-sans">美容成分が検出されませんでした</p>
          </div>
        )}
      </div>

      {/* その他の成分（折りたたみ） */}
      {otherIngredients.length > 0 && (
        <div>
          <button
            onClick={() => setShowUnknown(!showUnknown)}
            className="flex items-center gap-2 text-sm text-bo-ink-muted dark:text-gray-400 font-sans bg-transparent border-none cursor-pointer pressable"
          >
            <span>その他の成分（{otherIngredients.length}種）</span>
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              className={`transition-transform duration-200 ${showUnknown ? "rotate-180" : ""}`}
            >
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
          {showUnknown && (
            <div className="mt-2 space-y-2">
              {otherIngredients.map(({ ingredient, orderIndex }, idx) => (
                <IngredientRow
                  key={ingredient.id}
                  ingredient={ingredient}
                  orderIndex={orderIndex}
                  delay={Math.min(idx, 10) * 30}
                  onSelect={setSelectedIngredient}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 未登録成分 */}
      {unknownIngredients.length > 0 && (
        <div>
          <div className="text-xs text-bo-ink-faint dark:text-gray-500 font-sans">
            未登録成分（{unknownIngredients.length}種）：{unknownIngredients.join("、")}
          </div>
        </div>
      )}

      {/* Combinations */}
      {combinations.length > 0 && (
        <div>
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-bo-ink dark:text-white font-sans">
            <span className="w-1.5 h-5 rounded-full inline-block bg-bo-accent" />
            組み合わせ情報
          </h3>
          <div className="space-y-2.5">
            {combinations.map((combo, i) => {
              const isGood = combo.type === "recommended";
              return (
                <div
                  key={i}
                  className="rounded-r2 overflow-hidden bg-white dark:bg-gray-800 shadow-bo1"
                >
                  {/* Left color accent via top bar */}
                  <div className={`h-0.5 ${isGood ? "bg-bo-safe" : "bg-bo-danger"}`} />
                  <div className="p-4 flex gap-3">
                    <div
                      className={`w-10 h-10 rounded-[12px] flex items-center justify-center text-lg shrink-0 ${
                        isGood ? "bg-[#E8F5EE]" : "bg-red-50"
                      }`}
                    >
                      {isGood ? "✨" : "⚠️"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-bo-ink dark:text-white font-sans">{combo.label}</div>
                      <p className="text-xs mt-1 text-bo-ink-muted dark:text-gray-400 font-sans leading-relaxed">{combo.desc}</p>
                      <p className="text-[10px] mt-1.5 text-bo-ink-faint dark:text-gray-500 font-sans">出典: {combo.source}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Disclaimer />

      {/* 成分詳細シート（Portal経由で最前面に表示） */}
      {selectedIngredient && typeof document !== "undefined" && createPortal(
        <IngredientDetailSheet
          ingredient={selectedIngredient}
          onClose={() => setSelectedIngredient(null)}
        />,
        document.body,
      )}

      {/* Share modal */}
      {shareModalOpen && typeof document !== "undefined" && createPortal(
        <ShareModal
          text={`【コスメチェック】${productName}（${brand}）\n注目成分：${activeIngredients.slice(0, 3).map((f) => f.ingredient.nameJa).join(" / ")}\n\n#HADAMI #成分チェック`}
          onClose={() => setShareModalOpen(false)}
          imageBase64={shareImageBase64 ?? undefined}
        />,
        document.body,
      )}

    </div>
  );
}

function IngredientRow({
  ingredient,
  orderIndex,
  delay,
  isNew,
  onSelect,
}: {
  ingredient: Ingredient;
  orderIndex: number;
  delay: number;
  isNew?: boolean;
  onSelect: (ingredient: Ingredient) => void;
}) {
  return (
    <button
      onClick={() => onSelect(ingredient)}
      className={`w-full text-left flex items-center gap-3 rounded-r2 p-3.5 animate-stagger-in pressable border-none cursor-pointer ${
        isNew
          ? "border-2 border-bo-accent shadow-[0_2px_12px_rgba(58,143,122,0.18)] bg-bo-accent-soft/30 dark:bg-bo-accent/10"
          : "bg-white dark:bg-gray-800 shadow-bo1"
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="inline-flex items-center gap-px">
        {Array.from({ length: RARITY[ingredient.rarity].star }).map((_, i) => (
          <StarIcon key={i} color={RARITY[ingredient.rarity].color} size={14} />
        ))}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-sm text-bo-ink dark:text-white font-sans">{ingredient.nameJa}</span>
          <Badge rarity={ingredient.rarity} size="sm" />
          {isNew && (
            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-bo-accent text-white shadow-bo-accent">
              NEW
            </span>
          )}
        </div>
        <div className="text-[11px] mt-0.5 text-bo-ink-muted dark:text-gray-400 font-sans">{ingredient.nameInci}</div>
        {(() => {
          const c = getIngredientCategoryInfo(ingredient);
          return c ? (
            <div className="flex gap-1 mt-1.5">
              <span
                className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-medium font-sans"
                style={{ background: c.color + "18", color: c.color }}
              >
                <ActiveCategoryIcon category={c.key} size={11} />
                {c.label}
              </span>
            </div>
          ) : null;
        })()}
      </div>
      {/* Order number + chevron */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[10px] font-medium text-bo-ink-faint font-sans">#{orderIndex + 1}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#BDBDBD" strokeWidth="2" strokeLinecap="round">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </div>
    </button>
  );
}

function IngredientDetailSheet({
  ingredient,
  onClose,
}: {
  ingredient: Ingredient | null;
  onClose: () => void;
}) {
  if (!ingredient) return null;

  const catInfo = getIngredientCategoryInfo(ingredient);
  const allCats = getIngredientCategories(ingredient);

  return (
    <BottomSheet open={true} onClose={onClose} title={ingredient.nameJa}>
      <div className="pb-6 space-y-3">
        {/* Header */}
        <div className="flex flex-col items-center gap-2 py-3">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${catInfo?.color || ingredient.color}20, ${catInfo?.color || ingredient.color}08)` }}
          >
            <ActiveCategoryIcon category={catInfo?.key} size={24} />
          </div>
          <p className="text-xs text-bo-ink-muted font-sans">{ingredient.nameInci}</p>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <Badge rarity={ingredient.rarity} size="sm" />
            {allCats.map((c) => (
              <span
                key={c.key}
                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium font-sans"
                style={{ background: c.color + "18", color: c.color }}
              >
                <ActiveCategoryIcon category={c.key} size={12} />
                {c.label}
              </span>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="bg-white rounded-r2 p-3.5 shadow-bo1 border border-bo-parchment">
          <h2 className="font-bold text-xs mb-1.5 text-bo-ink font-sans">📌 一般的な分類の説明</h2>
          <p className="text-xs leading-relaxed text-bo-ink-soft font-sans">{ingredient.note}</p>
        </div>

        {/* Fun fact */}
        {ingredient.funFact && (
          <div className="rounded-r2 p-3.5 bg-bo-accent-soft border border-bo-accent/20">
            <h2 className="font-bold text-xs mb-1.5 text-bo-accent font-sans">💡 トリビア</h2>
            <p className="text-xs leading-relaxed text-bo-ink-soft font-sans">{ingredient.funFact}</p>
          </div>
        )}

        {/* Caution */}
        {ingredient.caution && (
          <div className="rounded-r2 p-3.5 bg-bo-danger-bg border border-bo-danger/20">
            <h2 className="font-bold text-xs mb-1.5 text-bo-danger font-sans">📋 一般的な注意事項</h2>
            <p className="text-xs leading-relaxed text-bo-ink-soft font-sans">{ingredient.caution}</p>
          </div>
        )}

      </div>
    </BottomSheet>
  );
}
