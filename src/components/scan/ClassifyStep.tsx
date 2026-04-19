"use client";

import { PRODUCT_GENRES } from "@/lib/productGenres";
import { ProductGenre } from "@/types";
import { ProductGenreIcon } from "@/components/ui/CosmeticIcons";

const SCAN_GENRES = PRODUCT_GENRES.filter((g) =>
  ["toner", "serum", "emulsion", "cream", "sunscreen", "mask_pack"].includes(g.key)
);

interface ClassifyStepProps {
  productName: string;
  brand: string;
  productType: ProductGenre;
  imagePreview?: string;
  onProductNameChange: (name: string) => void;
  onBrandChange: (brand: string) => void;
  onProductTypeChange: (type: ProductGenre) => void;
  onContinue: () => void;
  onBack?: () => void;
}

export default function ClassifyStep({
  productName,
  brand,
  productType,
  imagePreview,
  onProductNameChange,
  onBrandChange,
  onProductTypeChange,
  onContinue,
  onBack,
}: ClassifyStepProps) {
  const needsType = !SCAN_GENRES.some((g) => g.key === productType);

  return (
    <div className="space-y-3 animate-fade-up">
      {/* Hero image */}
      {imagePreview ? (
        <div className="relative w-full h-[120px] rounded-r2 overflow-hidden shadow-bo2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imagePreview} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-3 left-4">
            <div className="px-3 py-1.5 rounded-r1 bg-white/20 backdrop-blur-lg text-[10px] font-bold text-white font-sans
                            inline-flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              撮影完了
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full h-[120px] rounded-r2 flex items-center justify-center
                        bg-gradient-to-br from-bo-accent-soft to-bo-parchment shadow-bo2">
          <span className="text-5xl">📦</span>
        </div>
      )}

      {/* Editable fields card */}
      <div className="bg-white rounded-r2 shadow-bo1 p-5 space-y-3.5">
        <div>
          <label className="block text-[10px] font-semibold mb-1.5 text-bo-ink-muted font-sans uppercase tracking-wider">
            コスメ名
          </label>
          <input
            type="text"
            value={productName}
            onChange={(e) => onProductNameChange(e.target.value)}
            className="w-full text-sm font-bold outline-none border-none bg-bo-cream rounded-r1 px-3 py-2.5
                       text-bo-ink font-sans focus:ring-2 focus:ring-bo-accent/30 transition-shadow"
            placeholder="コスメ名を入力"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold mb-1.5 text-bo-ink-muted font-sans uppercase tracking-wider">
            ブランド
          </label>
          <input
            type="text"
            value={brand}
            onChange={(e) => onBrandChange(e.target.value)}
            className="w-full text-sm outline-none border-none bg-bo-cream rounded-r1 px-3 py-2.5
                       text-bo-ink font-sans focus:ring-2 focus:ring-bo-accent/30 transition-shadow"
            placeholder="ブランド名を入力"
          />
        </div>
      </div>

      {/* Genre selector */}
      <div>
        <div className="flex items-center gap-2.5 mb-3">
          <span className="text-sm font-bold font-sans text-bo-ink">コスメタイプを選択</span>
          {needsType && (
            <span className="text-[10px] font-bold text-bo-accent font-sans animate-pulse
                             px-2 py-0.5 rounded-full bg-bo-accent-soft">
              必須
            </span>
          )}
        </div>
        <div className={`grid grid-cols-3 gap-2 ${needsType ? "ring-2 ring-bo-accent/30 ring-offset-4 ring-offset-bo-cream rounded-r2 transition-all" : ""}`}>
          {SCAN_GENRES.map((genre) => {
            const isSelected = productType === genre.key;
            return (
              <button
                key={genre.key}
                onClick={() => onProductTypeChange(genre.key)}
                className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-r2 text-xs font-semibold
                           transition-all duration-200 font-sans pressable border-none cursor-pointer ${
                  isSelected
                    ? "bg-bo-accent text-white shadow-bo-accent"
                    : "bg-white text-bo-ink-muted shadow-bo1"
                }`}
              >
                <span className="inline-flex">
                  <ProductGenreIcon genre={genre.key} size={20} />
                </span>
                <span className="text-[11px]">{genre.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        {onBack && (
          <button
            onClick={onBack}
            className="flex-none py-4 px-4 rounded-r2 bg-white text-bo-ink-muted text-sm font-bold font-sans
                       shadow-bo1 pressable border-none cursor-pointer flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            特定
          </button>
        )}
        <button
          onClick={onContinue}
          className="flex-1 py-4 rounded-r2 bg-bo-accent text-white text-sm font-bold font-sans
                     shadow-bo-accent pressable border-none cursor-pointer
                     flex items-center justify-center gap-2"
        >
          成分を確認する
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
