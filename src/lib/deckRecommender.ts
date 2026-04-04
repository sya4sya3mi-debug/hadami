import { Product, Ingredient, CategoryKey, RecommendationResult, Combination } from "@/types";
import { findCombinations } from "@/lib/combinations";

interface ProductProfile {
  product: Product;
  ingredientNames: string[];
  categories: CategoryKey[];
}

const WEIGHT_RECOMMENDED = 3.0;
const WEIGHT_CAUTION = -5.0;
const WEIGHT_CATEGORY = 2.0;

function buildProfile(
  product: Product,
  getIngredient: (id: string) => Ingredient | undefined
): ProductProfile {
  const ingredientNames: string[] = [];
  const categorySet: Record<string, boolean> = {};

  for (const pi of product.ingredients) {
    const ing = getIngredient(pi.ingredientId);
    if (ing) {
      ingredientNames.push(ing.nameJa);
      for (const cat of ing.categories) categorySet[cat] = true;
    }
  }

  return {
    product,
    ingredientNames,
    categories: Object.keys(categorySet) as CategoryKey[],
  };
}

function computeScore(profiles: ProductProfile[]): {
  score: number;
  recommended: Combination[];
  cautions: Combination[];
  categoryCoverage: Record<CategoryKey, number>;
  coveredCount: number;
} {
  const nameSet: Record<string, boolean> = {};
  const categoryCoverage: Record<CategoryKey, number> = {
    moisturizing: 0, brightening: 0, turnover: 0,
    barrier: 0, soothing: 0, keratin: 0,
  };

  for (const p of profiles) {
    for (const name of p.ingredientNames) nameSet[name] = true;
    for (const cat of p.categories) categoryCoverage[cat]++;
  }

  const allNames = Object.keys(nameSet);
  const combos = findCombinations(allNames);
  const recommended = combos.filter((c) => c.type === "recommended");
  const cautions = combos.filter((c) => c.type === "note");
  const coveredCount = Object.values(categoryCoverage).filter((c) => c > 0).length;

  const score =
    WEIGHT_RECOMMENDED * recommended.length +
    WEIGHT_CAUTION * cautions.length +
    WEIGHT_CATEGORY * coveredCount;

  return { score, recommended, cautions, categoryCoverage, coveredCount };
}

export function recommendDeck(
  products: Product[],
  getIngredient: (id: string) => Ingredient | undefined
): RecommendationResult {
  if (products.length === 0) {
    return {
      productIds: [],
      score: 0,
      recommendedCombinations: [],
      cautionCombinations: [],
      categoryCoverage: {
        moisturizing: 0, brightening: 0, turnover: 0,
        barrier: 0, soothing: 0, keratin: 0,
      },
      coveredCategoryCount: 0,
    };
  }

  const profiles = products.map((p) => buildProfile(p, getIngredient));

  if (products.length <= 2) {
    const result = computeScore(profiles);
    return {
      productIds: profiles.map((p) => p.product.id),
      score: result.score,
      recommendedCombinations: result.recommended,
      cautionCombinations: result.cautions,
      categoryCoverage: result.categoryCoverage,
      coveredCategoryCount: result.coveredCount,
    };
  }

  // --- Greedy selection ---
  const selected: ProductProfile[] = [];
  let remaining = [...profiles];

  while (remaining.length > 0) {
    let bestIndex = -1;
    let bestScore = -Infinity;

    for (let j = 0; j < remaining.length; j++) {
      const trial = [...selected, remaining[j]];
      const { score } = computeScore(trial);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = j;
      }
    }

    if (bestIndex < 0) break;

    const currentScore = selected.length > 0 ? computeScore(selected).score : 0;
    if (bestScore <= currentScore && selected.length >= 2) break;

    selected.push(remaining[bestIndex]);
    remaining = remaining.filter((_, idx) => idx !== bestIndex);
  }

  // --- Local search refinement ---
  let improved = true;
  while (improved) {
    improved = false;
    const currentScore = computeScore(selected).score;

    for (let i = 0; i < selected.length; i++) {
      for (let j = 0; j < remaining.length; j++) {
        const trial = [...selected];
        const removed = trial.splice(i, 1)[0];
        trial.push(remaining[j]);

        const { score } = computeScore(trial);
        if (score > currentScore) {
          const swapped = remaining[j];
          remaining[j] = removed;
          selected[i] = swapped;
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
  }

  const finalResult = computeScore(selected);

  return {
    productIds: selected.map((p) => p.product.id),
    score: finalResult.score,
    recommendedCombinations: finalResult.recommended,
    cautionCombinations: finalResult.cautions,
    categoryCoverage: finalResult.categoryCoverage,
    coveredCategoryCount: finalResult.coveredCount,
  };
}
