"use client";

import { Product, ProductGenre, RoutineType } from "@/types";
import { GENRE_SLOT_CONFIG, SECTION_INFO, getGenreByKey } from "@/lib/productGenres";
import GenreSlot from "./GenreSlot";


interface DeckEditorProps {
  routine: RoutineType;
  routineLabel: string;
  routineIcon: string;
  productsByGenre: Record<ProductGenre, Product[]>;
  onClose: () => void;
  onPrevDeck: () => void;
  onNextDeck: () => void;
  onAddSlot: (genre: ProductGenre) => void;
  onRemoveProduct: (productId: string) => void;
  onAutoRecommend: () => void;
}

export default function DeckEditor({
  routineLabel,
  routineIcon,
  productsByGenre,
  onClose,
  onPrevDeck,
  onNextDeck,
  onAddSlot,
  onRemoveProduct,
  onAutoRecommend,
}: DeckEditorProps) {
  const sections = ["base", "intensive", "protection", "special"] as const;

  return (
    <div className="fixed inset-0 z-[300] bg-bo-cream overflow-y-auto animate-fade-up">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bo-cream/95 backdrop-blur-md border-b border-bo-parchment">
        <div className="flex items-center justify-between px-5 py-3">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-[10px] bg-bo-parchment border-none flex items-center justify-center cursor-pointer shrink-0"
            aria-label="閉じる"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3D4F45" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <button onClick={onPrevDeck} className="w-7 h-7 rounded-full bg-bo-parchment border-none flex items-center justify-center cursor-pointer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3D4F45" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <span className="text-base font-bold font-serif text-bo-ink">{routineIcon} {routineLabel}</span>
            <button onClick={onNextDeck} className="w-7 h-7 rounded-full bg-bo-parchment border-none flex items-center justify-center cursor-pointer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3D4F45" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>

          <button
            onClick={onAutoRecommend}
            className="px-3 py-1.5 rounded-full text-[11px] font-bold border-none cursor-pointer font-sans bg-bo-accent text-white"
          >
            自動編成
          </button>
        </div>
      </div>

      {/* Slots by section */}
      <div className="px-5 pt-4 pb-10">
        {sections.map((section) => {
          const slotsInSection = GENRE_SLOT_CONFIG.filter((s) => s.section === section);
          const info = SECTION_INFO[section];
          if (!info) return null;

          return (
            <div key={section} className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold text-bo-accent font-sans tracking-wider">{info.step}</span>
                <span className="text-xs font-bold text-bo-ink font-sans">{info.label}</span>
              </div>
              {slotsInSection.map((slotConfig) => {
                const products = productsByGenre[slotConfig.genre] || [];
                const genreInfo = getGenreByKey(slotConfig.genre);
                if (!genreInfo) return null;

                if (products.length === 0) {
                  return (
                    <GenreSlot
                      key={`${slotConfig.genre}-empty`}
                      genre={slotConfig.genre}
                      stepLabel={slotConfig.stepLabel}
                      onAdd={() => onAddSlot(slotConfig.genre)}
                    />
                  );
                }

                return products.map((product) => (
                  <GenreSlot
                    key={`${slotConfig.genre}-${product.id}`}
                    genre={slotConfig.genre}
                    stepLabel={slotConfig.stepLabel}
                    product={product}
                    onAdd={() => onAddSlot(slotConfig.genre)}
                    onRemove={() => onRemoveProduct(product.id)}
                  />
                ));
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
