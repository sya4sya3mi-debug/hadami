import type { SupabaseClient } from "@supabase/supabase-js";
import https from "https";
import type { RakutenProduct } from "@/types";
import { normalizeRakutenImageUrl } from "@/lib/rakutenImage";

const RAKUTEN_API_URL =
  "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20220601";

interface RakutenItem {
  itemName: string;
  itemPrice: number;
  mediumImageUrls: { imageUrl: string }[];
  affiliateUrl: string;
  reviewAverage: number;
  shopName: string;
}

interface RakutenApiResponse {
  Items: { Item: RakutenItem }[];
  count: number;
  hits: number;
}

/** Node.js https モジュールで Origin ヘッダーを確実に送信する */
function httpsGet(url: string, headers: Record<string, string>): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = https.request(
      {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: "GET",
        headers,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode ?? 500,
            body: Buffer.concat(chunks).toString("utf-8"),
          });
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

/** 複数キーワードのキャッシュを1回のDBクエリで取得する */
export async function batchGetCached(
  keywords: string[],
  supabase: SupabaseClient
): Promise<Record<string, RakutenProduct[]>> {
  const { data } = await supabase
    .from("rakuten_product_cache")
    .select("search_keyword, results")
    .in("search_keyword", keywords)
    .gt("expires_at", new Date().toISOString());

  const result: Record<string, RakutenProduct[]> = {};
  for (const row of data || []) {
    result[row.search_keyword] = (row.results as RakutenProduct[]).map((product) => ({
      ...product,
      imageUrl: normalizeRakutenImageUrl(product.imageUrl),
    }));
  }
  return result;
}

/** 楽天APIを呼び出してキャッシュに保存する（キャッシュ確認なし） */
export async function fetchAndCacheRakuten(
  keyword: string,
  supabase: SupabaseClient
): Promise<RakutenProduct[]> {
  const appId = process.env.RAKUTEN_APP_ID;
  const accessKey = process.env.RAKUTEN_ACCESS_KEY;
  const affiliateId = process.env.RAKUTEN_AFFILIATE_ID;

  if (!appId || !accessKey || !affiliateId) {
    console.error("Rakuten API keys not configured");
    return [];
  }

  const params = new URLSearchParams({
    applicationId: appId,
    accessKey: accessKey,
    affiliateId: affiliateId,
    keyword,
    hits: "6",
    sort: "-reviewCount",
    format: "json",
    imageFlag: "1",
  });

  // Node.js の globalThis.fetch (undici) は Origin を forbidden header として除去するため
  // https モジュールを直接使用して Origin ヘッダーを確実に送信する
  const { statusCode, body: responseText } = await httpsGet(
    `${RAKUTEN_API_URL}?${params}`,
    { Origin: "https://hadami.vercel.app" }
  );

  if (statusCode !== 200) {
    console.error("Rakuten API error:", statusCode, responseText);
    return [];
  }

  const data: RakutenApiResponse = JSON.parse(responseText);

  const products: RakutenProduct[] = (data.Items || []).map(({ Item }) => ({
    name: Item.itemName,
    price: Item.itemPrice,
    imageUrl: normalizeRakutenImageUrl(Item.mediumImageUrls?.[0]?.imageUrl || null),
    affiliateUrl: Item.affiliateUrl,
    reviewScore: Item.reviewAverage,
    shopName: Item.shopName,
  }));

  // キャッシュ保存（非同期・待機不要）
  supabase
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

/** @deprecated batchGetCached + fetchAndCacheRakuten を直接使うこと */
export async function searchRakutenCached(
  keyword: string,
  supabase: SupabaseClient
): Promise<RakutenProduct[]> {
  const cached = await batchGetCached([keyword], supabase);
  if (cached[keyword]) return cached[keyword];
  return fetchAndCacheRakuten(keyword, supabase);
}
