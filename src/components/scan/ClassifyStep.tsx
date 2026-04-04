"use client";

import { PRODUCT_GENRES } from "@/lib/productGenres";
import { ProductGenre } from "@/types";

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
    <div className="space-y-5 animate-float-up">
      {/* Product info card */}
      <div
        className="bg-white rounded-2xl p-4"
        style={{ border: "1px solid #F5E6EF", boxShadow: "0 2px 8px rgba(249,168,192,0.08)" }}
      >
        <div className="flex gap-4">
          {/* Thumbnail */}
          {imagePreview ? (
            <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
              <img src={imagePreview} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div
              className="w-20 h-20 rounded-xl shrink-0 flex items-center justify-center text-3xl"
              style={{ background: "linear-gradient(135deg, #E8FAF8, #FFF0F5)" }}
            >
              📦
            </div>
          )}

          {/* Editable fields */}
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <label className="block text-[10px] font-medium mb-0.5" style={{ color: "#9B9B9B" }}>製品名</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => onProductNameChange(e.target.value)}
                className="w-full text-sm font-bold outline-none border-b pb-1"
                style={{ borderColor: "#F2F2F2", color: "#2D2D2D" }}
                placeholder="製品名を入力"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium mb-0.5" style={{ color: "#9B9B9B" }}>ブランド</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => onBrandChange(e.target.value)}
                className="w-full text-xs outline-none border-b pb-1"
                style={{ borderColor: "#F2F2F2", color: "#2D2D2D" }}
                placeholder="ブランド名を入力"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Genre selector */}
      <div>
        <div className="text-xs font-bold mb-3" style={{ color: "#2D2D2D" }}>
          製品タイプを選択
        </div>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2" style={{ WebkitOverflowScrolling: "touch" }}>
          {PRODUCT_GENRES.map((genre) => {
            const isSelected = productType === genre.key;
            return (
              <button
                key={genre.key}
                onClick={() => onProductTypeChange(genre.key)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-all duration-200"
                style={
                  isSelected
                    ? {
                        background: "linear-gradient(135deg, #5BBFAD, #7DD3C8)",
                        color: "#fff",
                        boxShadow: "0 2px 8px rgba(91,191,173,0.3)",
                      }
                    : {
                        background: "#fff",
                        color: "#9B9B9B",
                        border: "1px solid #F2F2F2",
                      }
                }
              >
                <span>{genre.icon}</span>
                <span>{genre.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Continue button */}
      <button
        onClick={onContinue}
        className="w-full py-4 rounded-2xl text-white text-sm font-bold"
        style={{
          background: "linear-gradient(135deg, #5BBFAD, #7DD3C8)",
          boxShadow: "0 4px 16px rgba(91,191,173,0.35)",
        }}
      >
        成分を確認する →
      </button>
    </div>
  );
}
