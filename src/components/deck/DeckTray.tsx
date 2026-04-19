"use client";

import { Product, ProductGenre } from "@/types";
import { GENRE_SLOT_CONFIG, SECTION_INFO, getGenreByKey } from "@/lib/productGenres";
import GenreSlot from "./GenreSlot";

interface DeckTrayProps {
  productsByGenre: Record<ProductGenre, Product[]>;
  onAddSlot: (genre: ProductGenre) => void;
  onRemoveProduct: (productId: string) => void;
}

export default function DeckTray({ productsByGenre, onAddSlot, onRemoveProduct }: DeckTrayProps) {
  const sections = ["base", "intensive", "protection", "special"] as const;

  return (
    <div>
      {sections.map((section) => {
        const info = SECTION_INFO[section];
        const slotsInSection = GENRE_SLOT_CONFIG.filter((s) => s.section === section);

        return (
          <div key={section}>
              {/* Section header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bo-accent/[0.08]">
                <span className="text-[11px] font-extrabold tracking-widest text-bo-accent uppercase font-sans">
                  {info.step}
                </span>
              </div>
              <span className="text-sm font-bold text-bo-ink font-sans">{info.label}</span>
            </div>

            {slotsInSection.map((slotConfig) => {
              const products = productsByGenre[slotConfig.genre] || [];
              const genreInfo = getGenreByKey(slotConfig.genre);

              return (
                <div key={slotConfig.genre}>
                  {/* Render filled slots */}
                  {products.map((product) => (
                    <GenreSlot
                      key={product.id}
                      genre={slotConfig.genre}
                      stepLabel={slotConfig.stepLabel}
                      product={product}
                      onAdd={() => onAddSlot(slotConfig.genre)}
                      onRemove={() => onRemoveProduct(product.id)}
                    />
                  ))}

                  {/* Render empty slot if no products */}
                  {products.length === 0 && (
                    <GenreSlot
                      genre={slotConfig.genre}
                      stepLabel={slotConfig.stepLabel}
                      onAdd={() => onAddSlot(slotConfig.genre)}
                    />
                  )}

                  {/* Multi-slot: show add button if < max and at least 1 filled */}
                  {slotConfig.maxSlots > 1 && products.length > 0 && products.length < slotConfig.maxSlots && (
                    <button
                      onClick={() => onAddSlot(slotConfig.genre)}
                      className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-r1 cursor-pointer text-xs font-semibold mb-3
                                 bg-white font-sans border border-dashed border-bo-accent/30 text-bo-accent
                                 pressable"
                    >
                      + {genreInfo?.label}を追加（最大{slotConfig.maxSlots}）
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
