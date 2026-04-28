"use client";

import { Combination } from "@/types";
import { getIngredientByName, getIngredientCategoryInfo } from "@/lib/ingredients";
import { ActiveCategoryIcon } from "@/components/ui/CosmeticIcons";

interface Props {
  combo: Combination;
  ingredientProducts: [string[], string[]];
}

function getIngredientCatInfo(nameJa: string) {
  const ing = getIngredientByName(nameJa);
  if (!ing) return null;
  return getIngredientCategoryInfo(ing);
}

function IngredientTag({ name, products }: { name: string; products: string[] }) {
  const cat = getIngredientCatInfo(name);

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          padding: "8px 10px",
          textAlign: "center",
          background: "var(--hd-surface)",
          border: "1px solid var(--hd-line)",
        }}
      >
        {cat && (
          <div
            className="hd-mono hd-caps"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 9,
              letterSpacing: "0.14em",
              color: "var(--hd-ink-40)",
              marginBottom: 3,
            }}
          >
            <ActiveCategoryIcon category={cat.key} size={10} />
            {cat.label}
          </div>
        )}
        <div
          className="hd-serif"
          style={{
            fontSize: 13,
            color: "var(--hd-ink)",
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {name}
        </div>
      </div>
      {products.length > 0 && (
        <div
          className="hd-mono"
          style={{
            fontSize: 9,
            textAlign: "center",
            marginTop: 5,
            padding: "0 4px",
            lineHeight: 1.4,
            color: "var(--hd-ink-40)",
            letterSpacing: "0.04em",
          }}
        >
          {products.map((product, index) => (
            <span key={index}>
              {index > 0 && "、"}
              {product}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CombinationCard({ combo, ingredientProducts }: Props) {
  const isRecommended = combo.type === "recommended";

  return (
    <div
      style={{
        padding: 14,
        background: "var(--hd-bg)",
        border: "1px solid var(--hd-hair)",
        borderLeft: isRecommended ? "1px solid var(--hd-hair)" : "2px solid var(--hd-ink)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 12 }}>
        <IngredientTag name={combo.pair[0]} products={ingredientProducts[0]} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 12, flexShrink: 0 }}>
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: 999,
              background: "var(--hd-ink)",
              color: "var(--hd-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 600,
            }}
            aria-hidden="true"
          >
            {isRecommended ? "+" : "!"}
          </span>
        </div>

        <IngredientTag name={combo.pair[1]} products={ingredientProducts[1]} />
      </div>

      <div
        className="hd-serif"
        style={{
          fontSize: 14,
          color: "var(--hd-ink)",
          letterSpacing: "-0.01em",
          marginBottom: 4,
        }}
      >
        {combo.label}
      </div>
      <p
        style={{
          fontSize: 11,
          fontFamily: "var(--hd-sans)",
          lineHeight: 1.7,
          color: "var(--hd-ink-60)",
          margin: 0,
        }}
      >
        {combo.desc}
      </p>
    </div>
  );
}
