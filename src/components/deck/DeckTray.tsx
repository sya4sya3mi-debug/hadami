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
        let slotsInSection = GENRE_SLOT_CONFIG.filter((s) => s.section === section);

        // For special section, only show slots that have products or the first 2 slots
        if (section === "special") {
          const slotsWithProducts = slotsInSection.filter((s) => (productsByGenre[s.genre]?.length || 0) > 0);
          const emptySlots = slotsInSection.filter((s) => (productsByGenre[s.genre]?.length || 0) === 0);
          slotsInSection = [...slotsWithProducts, ...emptySlots.slice(0, Math.max(0, 2 - slotsWithProducts.length))];
        }

        return (
          <div key={section}>
            {/* Section header */}
            <div className="flex items-center gap-2 mb-2 pl-1 mt-1">
              <span className="text-[10px] font-semibold text-bo-ink-faint font-serif">{info.step}</span>
              <span className="text-[11px] font-bold tracking-wide text-bo-ink-muted font-sans">{info.label}</span>
              <div className="flex-1 h-px bg-bo-parchment" />
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

                  {/* Render empty slot if no products, or add button if multi-slot */}
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
                      className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl cursor-pointer text-xs font-medium mb-2 bg-transparent font-sans border-[1.5px] border-dashed border-bo-accent/30 text-bo-accent"
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
