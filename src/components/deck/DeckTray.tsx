"use client";

import { Product, ProductGenre } from "@/types";
import { getSlotConfigForRoutine } from "@/lib/productGenres";
import GenreSlot from "./GenreSlot";

interface DeckTrayProps {
  productsByGenre: Record<ProductGenre, Product[]>;
  routine: "morning" | "night";
  onAddSlot: (genre: ProductGenre) => void;
  onRemoveProduct: (productId: string) => void;
}

export default function DeckTray({
  productsByGenre,
  routine,
  onAddSlot,
  onRemoveProduct,
}: DeckTrayProps) {
  const slots = getSlotConfigForRoutine(routine);
  return (
    <div>
      {slots.map((slot) => {
        const products = productsByGenre[slot.genre] || [];
        const isFilled = products.length > 0;

        return (
          <div key={slot.genre}>
            {isFilled ? (
              products.map((product) => (
                <GenreSlot
                  key={product.id}
                  genre={slot.genre}
                  stepLabel={slot.stepLabel}
                  product={product}
                  onAdd={() => onAddSlot(slot.genre)}
                  onRemove={() => onRemoveProduct(product.id)}
                />
              ))
            ) : (
              <GenreSlot
                genre={slot.genre}
                stepLabel={slot.stepLabel}
                onAdd={() => onAddSlot(slot.genre)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
