import type { SupabaseClient } from "@supabase/supabase-js";

type ProductRef = {
  id: string;
  name: string;
  brand: string | null;
  package_image_url: string | null;
};

type StepWithProduct = {
  product_name: string | null;
  product?: ProductRef | null;
};

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function buildFullProductName(product: ProductRef) {
  return normalizeName(product.brand ? `${product.brand} ${product.name}` : product.name);
}

export async function attachFallbackProducts<T extends StepWithProduct>(
  supabase: SupabaseClient,
  userId: string,
  steps: T[]
): Promise<T[]> {
  const needsFallback = steps.some(
    (step) => step.product_name && !step.product?.package_image_url
  );

  if (!needsFallback) return steps;

  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, brand, package_image_url")
    .eq("user_id", userId);

  if (error || !products) return steps;

  const normalizedProducts = (products as ProductRef[]).filter((product) => product.name);
  const productsByFullName = new Map<string, ProductRef>();
  const productsByName = new Map<string, ProductRef[]>();

  normalizedProducts.forEach((product) => {
    productsByFullName.set(buildFullProductName(product), product);

    const normalizedName = normalizeName(product.name);
    const existing = productsByName.get(normalizedName) ?? [];
    existing.push(product);
    productsByName.set(normalizedName, existing);
  });

  return steps.map((step) => {
    if (!step.product_name || step.product?.package_image_url) return step;

    const normalizedStepName = normalizeName(step.product_name);
    const exactMatch = productsByFullName.get(normalizedStepName);
    if (exactMatch) {
      return { ...step, product: exactMatch };
    }

    const nameMatches = productsByName.get(normalizedStepName);
    if (nameMatches?.length === 1) {
      return { ...step, product: nameMatches[0] };
    }

    return step;
  });
}
