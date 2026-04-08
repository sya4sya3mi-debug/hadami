"use client";

import { Product, ProductGenre, RoutineType } from "@/types";
import { GENRE_SLOT_CONFIG, SECTION_INFO } from "@/lib/productGenres";
import GenreSlot from "@/components/deck/GenreSlot";

interface DeckEditorProps {
  routine: RoutineType;
  routineLabel: string;
  routineIcon: string;
  productsByGenre: Record<ProductGenre, Product[]>;
  allProducts: Product[];
  onClose: () => void;
  onPrevDeck: () => void;
  onNextDeck: () => void;
  onAddSlot: (genre: ProductGenre) => void;
  onRemoveProduct: (id: string) => void;
  onAutoRecommend: () => void;
}

const SECTIONS = ["base", "intensive", "protection", "special"] as const;

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
  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col bg-bo-cream"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-bo-parchment">
        <button
          onClick={onPrevDeck}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-bo-parchment border-none cursor-pointer text-bo-ink-muted"
          aria-label="前のデッキ"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="text-center">
          <div className="text-[11px] text-bo-ink-muted font-sans tracking-widest uppercase">Edit Deck</div>
          <div className="text-base font-extrabold font-serif text-bo-ink mt-0.5">
            {routineIcon} {routineLabel}
          </div>
        </div>
        <button
          onClick={onNextDeck}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-bo-parchment border-none cursor-pointer text-bo-ink-muted"
          aria-label="次のデッキ"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Scrollable slot list */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6">
        {SECTIONS.map((section) => {
          const slotsInSection = GENRE_SLOT_CONFIG.filter((s) => s.section === section);
          const info = SECTION_INFO[section];
          return (
            <div key={section} className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[9px] font-bold text-bo-ink-faint font-sans tracking-widest uppercase">{info.step}</span>
                <span className="text-[11px] font-bold text-bo-ink-soft font-sans">{info.label}</span>
              </div>
              {slotsInSection.map((slot) => {
                const products = productsByGenre[slot.genre] ?? [];
                const product = products[0];
                return (
                  <GenreSlot
                    key={slot.genre}
                    genre={slot.genre}
                    stepLabel={slot.stepLabel}
                    product={product}
                    onAdd={() => onAddSlot(slot.genre)}
                    onRemove={product ? () => onRemoveProduct(product.id) : undefined}
                  />
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer buttons */}
      <div className="px-5 pb-8 pt-3 border-t border-bo-parchment flex gap-3">
        <button
          onClick={onAutoRecommend}
          className="flex-1 py-3 rounded-r1 bg-bo-parchment text-bo-ink text-[13px] font-bold font-sans border-none cursor-pointer"
        >
          ✨ 自動おすすめ
        </button>
        <button
          onClick={onClose}
          className="flex-1 py-3 rounded-r1 bg-bo-accent text-white text-[13px] font-bold font-sans border-none cursor-pointer"
        >
          完了
        </button>
      </div>
    </div>
  );
}
