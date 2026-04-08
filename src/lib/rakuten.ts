import type { SupabaseClient } from "@supabase/supabase-js";
import type { RakutenProduct } from "@/types";

const RAKUTEN_API_URL =
  "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601";

interface RakutenItem {
  itemName: string;
  itemPrice: number;
  mediumImageUrls: { imageUrl: string }[];
  affiliateUrl: string;
  reviewAverage: number;
  shopName: string;
}

export async function searchRakutenCached(
  keyword: string,
  supabase: SupabaseClient
): Promise<RakutenProduct[]> {
  // 1. キャッシュ確認
  const { data: cached } = await supabase
    .from("rakuten_product_cache")
    .select("results")
    .eq("search_keyword", keyword)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (cached) {
    return cached.results as RakutenProduct[];
  }

  // 2. 楽天API呼び出し
  const appId = process.env.RAKUTEN_APP_ID;
  const affiliateId = process.env.RAKUTEN_AFFILIATE_ID;

  if (!appId || !affiliateId) {
    console.error("Rakuten API keys not configured");
    return [];
  }

  const params = new URLSearchParams({
    applicationId: appId,
    affiliateId: affiliateId,
    keyword,
    genreId: "100939", // コスメ・美容ジャンル
    hits: "5",
    sort: "+reviewCount",
    imageFlag: "1",
  });

  const res = await fetch(`${RAKUTEN_API_URL}?${params}`);

  if (!res.ok) {
    console.error("Rakuten API error:", res.status, await res.text());
    return [];
  }

  const data = await res.json();

  const products: RakutenProduct[] = (data.Items || []).map(
    ({ Item }: { Item: RakutenItem }) => ({
      name: Item.itemName,
      price: Item.itemPrice,
      imageUrl: Item.mediumImageUrls?.[0]?.imageUrl || null,
      affiliateUrl: Item.affiliateUrl,
      reviewScore: Item.reviewAverage,
      shopName: Item.shopName,
    })
  );

  // 3. キャッシュ保存（認証ユーザーのクライアントで書込み）
  await supabase
    .from("rakuten_product_cache")
    .upsert(
      {
        search_keyword: keyword,
        results: products,
        fetched_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      { onConflict: "search_keyword" }
    )
    .then(({ error }) => {
      if (error) console.error("Cache upsert error:", error);
    });

  return products;
}
