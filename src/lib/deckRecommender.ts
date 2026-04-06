import { Product, Ingredient, IngredientGenre, RecommendationResult, Combination } from "@/types";
import { findCombinations } from "@/lib/combinations";


interface ProductProfile {
  product: Product;
  ingredientNames: string[];
  genres: IngredientGenre[];
}

const WEIGHT_RECOMMENDED = 3.0;
const WEIGHT_CAUTION = -5.0;
const WEIGHT_GENRE = 2.0;

const EMPTY_GENRE_COVERAGE: Record<IngredientGenre, number> = {
  water: 0, amino_acid: 0, vitamin: 0, peptide: 0, botanical: 0,
  oil_lipid: 0, ferment: 0, acid: 0, base: 0,
};

function buildProfile(
  product: Product,
  getIngredient: (id: string) => Ingredient | undefined
): ProductProfile {
  const ingredientNames: string[] = [];
  const genreSet: Record<string, boolean> = {};

  for (const pi of product.ingredients) {
    const ing = getIngredient(pi.ingredientId);
    if (ing) {
      ingredientNames.push(ing.nameJa);
      genreSet[ing.genre] = true;
    }
  }

  return {
    product,
    ingredientNames,
    genres: Object.keys(genreSet) as IngredientGenre[],
  };
}

function computeScore(profiles: ProductProfile[]): {
  score: number;
  recommended: Combination[];
  cautions: Combination[];
  genreCoverage: Record<IngredientGenre, number>;
  coveredCount: number;
} {
  const nameSet: Record<string, boolean> = {};
  const genreCoverage: Record<IngredientGenre, number> = { ...EMPTY_GENRE_COVERAGE };

  for (const p of profiles) {
    for (const name of p.ingredientNames) nameSet[name] = true;
    for (const genre of p.genres) genreCoverage[genre]++;
  }

  const allNames = Object.keys(nameSet);
  const combos = findCombinations(allNames);
  const recommended = combos.filter((c) => c.type === "recommended");
  const cautions = combos.filter((c) => c.type === "note");
  const coveredCount = Object.values(genreCoverage).filter((c) => c > 0).length;

  const score =
    WEIGHT_RECOMMENDED * recommended.length +
    WEIGHT_CAUTION * cautions.length +
    WEIGHT_GENRE * coveredCount;

  return { score, recommended, cautions, genreCoverage, coveredCount };
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
      genreCoverage: { ...EMPTY_GENRE_COVERAGE },
      coveredGenreCount: 0,
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
      genreCoverage: result.genreCoverage,
      coveredGenreCount: result.coveredCount,
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
    genreCoverage: finalResult.genreCoverage,
    coveredGenreCount: finalResult.coveredCount,
  };
}
