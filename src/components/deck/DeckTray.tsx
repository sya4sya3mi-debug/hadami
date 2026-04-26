"use client";

import { Product, ProductGenre } from "@/types";
import { GENRE_SLOT_CONFIG } from "@/lib/productGenres";
import GenreSlot from "./GenreSlot";

interface DeckTrayProps {
  productsByGenre: Record<ProductGenre, Product[]>;
  onAddSlot: (genre: ProductGenre) => void;
  onRemoveProduct: (productId: string) => void;
}

export default function DeckTray({
  productsByGenre,
  onAddSlot,
  onRemoveProduct,
}: DeckTrayProps) {
  return (
    <div>
      {GENRE_SLOT_CONFIG.map((slotConfig) => {
        const products = productsByGenre[slotConfig.genre] || [];
        const isFilled = products.length > 0;

        return (
          <div key={slotConfig.genre}>
            {isFilled ? (
              products.map((product) => (
                <GenreSlot
                  key={product.id}
                  genre={slotConfig.genre}
                  stepLabel={slotConfig.stepLabel}
                  product={product}
                  onAdd={() => onAddSlot(slotConfig.genre)}
                  onRemove={() => onRemoveProduct(product.id)}
                />
              ))
            ) : (
              <GenreSlot
                genre={slotConfig.genre}
                stepLabel={slotConfig.stepLabel}
                onAdd={() => onAddSlot(slotConfig.genre)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
