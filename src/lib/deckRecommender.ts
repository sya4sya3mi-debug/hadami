import { Product, Ingredient, IngredientGenre, RecommendationResult, Combination, RoutineType } from "@/types";
import { findCombinations } from "@/lib/combinations";
import { getSlotConfigForRoutine } from "@/lib/productGenres";


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
  getIngredient: (id: string) => Ingredient | undefined,
  routine: RoutineType = "morning",
): RecommendationResult {
  // ルーティン別のスロット制約を取得（AM=4枠, PM=4枠, 各ジャンル1枠ずつ）
  const slotRoutine: "morning" | "night" =
    routine === "night" ? "night" : "morning";
  const slotConfig = getSlotConfigForRoutine(slotRoutine);
  const allowedGenres = new Set<string>(slotConfig.map((s) => s.genre));
  const maxSlots = slotConfig.length;

  // ルーティンで使うジャンルに合致する商品のみを候補にする
  const eligibleProducts = products.filter((p) =>
    allowedGenres.has(p.productType ?? ""),
  );

  if (eligibleProducts.length === 0) {
    return {
      productIds: [],
      score: 0,
      recommendedCombinations: [],
      cautionCombinations: [],
      genreCoverage: { ...EMPTY_GENRE_COVERAGE },
      coveredGenreCount: 0,
    };
  }

  const profiles = eligibleProducts.map((p) => buildProfile(p, getIngredient));

  // --- Greedy selection（ジャンル重複禁止 + maxSlots 上限）---
  const selected: ProductProfile[] = [];
  const usedGenres = new Set<string>();
  let remaining = profiles.filter(
    (p) => !usedGenres.has(p.product.productType ?? ""),
  );

  while (remaining.length > 0 && selected.length < maxSlots) {
    let bestIndex = -1;
    let bestScore = -Infinity;

    for (let j = 0; j < remaining.length; j++) {
      const candidateGenre = remaining[j].product.productType ?? "";
      if (usedGenres.has(candidateGenre)) continue;
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

    const chosen = remaining[bestIndex];
    selected.push(chosen);
    usedGenres.add(chosen.product.productType ?? "");
    remaining = remaining.filter(
      (p, idx) =>
        idx !== bestIndex && !usedGenres.has(p.product.productType ?? ""),
    );
  }

  // --- Local search refinement（同ジャンル内で入れ替え）---
  let improved = true;
  while (improved) {
    improved = false;
    const currentScore = computeScore(selected).score;

    for (let i = 0; i < selected.length; i++) {
      const targetGenre = selected[i].product.productType ?? "";
      const candidatePool = profiles.filter(
        (p) =>
          (p.product.productType ?? "") === targetGenre &&
          p.product.id !== selected[i].product.id,
      );

      for (const candidate of candidatePool) {
        const trial = [...selected];
        trial[i] = candidate;
        const { score } = computeScore(trial);
        if (score > currentScore) {
          selected[i] = candidate;
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
  }

  const finalResult = computeScore(selected);

  // ステップ番号通り（slotConfig の genre 順）に並べ替え
  const genreOrder = new Map<string, number>();
  slotConfig.forEach((s, idx) => genreOrder.set(s.genre, idx));
  const orderedSelected = [...selected].sort((a, b) => {
    const oa = genreOrder.get(a.product.productType ?? "") ?? 99;
    const ob = genreOrder.get(b.product.productType ?? "") ?? 99;
    return oa - ob;
  });

  return {
    productIds: orderedSelected.map((p) => p.product.id),
    score: finalResult.score,
    recommendedCombinations: finalResult.recommended,
    cautionCombinations: finalResult.cautions,
    genreCoverage: finalResult.genreCoverage,
    coveredGenreCount: finalResult.coveredCount,
  };
}
