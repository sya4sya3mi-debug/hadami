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
}: ClassifyStepProps) {
  return (
    <div className="space-y-5 animate-fade-up">
      {/* Product info card */}
      <div className="bg-white rounded-r2 p-[18px] border border-bo-parchment shadow-bo1">
        <div className="flex gap-3.5">
          {/* Thumbnail */}
          {imagePreview ? (
            <div className="w-[72px] h-[72px] rounded-[14px] overflow-hidden shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-[72px] h-[72px] rounded-[14px] shrink-0 flex items-center justify-center text-[28px] bg-gradient-to-br from-bo-accent-soft to-bo-parchment">
              📦
            </div>
          )}

          {/* Editable fields */}
          <div className="flex-1 min-w-0 space-y-2.5">
            <div>
              <label className="block text-[9px] font-medium mb-0.5 text-bo-ink-muted font-sans">コスメ名</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => onProductNameChange(e.target.value)}
                className="w-full text-[13px] font-bold outline-none border-b-[1.5px] border-bo-parchment pb-1 bg-transparent text-bo-ink font-sans"
                placeholder="コスメ名を入力"
              />
            </div>
            <div>
              <label className="block text-[9px] font-medium mb-0.5 text-bo-ink-muted font-sans">ブランド</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => onBrandChange(e.target.value)}
                className="w-full text-xs outline-none border-b-[1.5px] border-bo-parchment pb-1 bg-transparent text-bo-ink font-sans"
                placeholder="ブランド名を入力"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Genre selector */}
      <div>
        <div className={`flex items-center gap-2 mb-2.5 ${!SCAN_GENRES.some((g) => g.key === productType) ? "text-bo-accent" : "text-bo-ink"}`}>
          <span className="text-xs font-bold font-sans">コスメタイプを選択</span>
          {!SCAN_GENRES.some((g) => g.key === productType) && (
            <span className="text-[10px] font-medium text-bo-accent font-sans animate-pulse">← 必ず選んでください</span>
          )}
        </div>
        <div className={`flex gap-2 overflow-x-auto hide-scrollbar pb-2 rounded-r1 transition-all ${!SCAN_GENRES.some((g) => g.key === productType) ? "ring-2 ring-bo-accent/40 ring-offset-1" : ""}`}>
          {SCAN_GENRES.map((genre) => {
            const isSelected = productType === genre.key;
            return (
              <button
                key={genre.key}
                onClick={() => onProductTypeChange(genre.key)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[20px] text-[11px] font-semibold whitespace-nowrap shrink-0 transition-all duration-200 font-sans ${
                  isSelected
                    ? "bg-bo-accent text-white shadow-bo-accent"
                    : "bg-white text-bo-ink-muted shadow-bo1 border border-bo-parchment"
                }`}
              >
                <span className="inline-flex">
                  <ProductGenreIcon genre={genre.key} size={14} />
                </span>
                <span>{genre.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Continue button */}
      <button
        onClick={onContinue}
        className="w-full py-3.5 rounded-r1 bg-bo-accent text-white text-[13px] font-bold font-sans shadow-bo-accent"
      >
        成分を確認する →
      </button>
    </div>
  );
}
