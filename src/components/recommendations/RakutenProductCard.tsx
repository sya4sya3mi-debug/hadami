import type { RakutenProduct } from "@/types";
import { buildRakutenImageProxyUrl } from "@/lib/rakutenImage";
import {
  RAKUTEN_CARD_IMAGE_HEIGHT_PX,
  RAKUTEN_CARD_WIDTH_PX,
} from "./cardLayout";

interface Props {
  product: RakutenProduct;
}

export default function RakutenProductCard({ product }: Props) {
  const imageSrc = buildRakutenImageProxyUrl(product.imageUrl);

  return (
    <a
      href={product.affiliateUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="block rounded-r1 border border-bo-parchment bg-white shadow-bo1 hover:shadow-bo2 transition-shadow no-underline relative"
      style={{
        minWidth: `${RAKUTEN_CARD_WIDTH_PX}px`,
        maxWidth: `${RAKUTEN_CARD_WIDTH_PX}px`,
      }}
    >
      {/* PRラベル（ステマ規制対応） */}
      <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded z-10" style={{ color: "#B88A2D", background: "#FDF6E3" }}>
        PR
      </span>

      {/* 商品画像 */}
      <div
        className="w-full bg-bo-cream rounded-t-r1 overflow-hidden"
        style={{ height: "80px" }}
      >
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-3xl text-bo-ink-faint">📦</span>
        )}
      </div>

      {/* 情報 */}
      <div className="p-2">
        <div className="text-[11px] font-semibold text-bo-ink font-sans line-clamp-2 leading-tight min-h-[24px]">
          {product.name}
        </div>

        <div className="mt-1.5 flex items-baseline gap-1">
          <span className="text-sm font-black text-bo-accent font-sans">
            ¥{product.price.toLocaleString()}
          </span>
        </div>

        {product.reviewScore > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[10px] text-amber-500">★</span>
            <span className="text-[10px] font-medium text-bo-ink-muted font-sans">
              {product.reviewScore.toFixed(1)}
            </span>
          </div>
        )}

        <div className="text-[9px] text-bo-ink-faint font-sans mt-1 truncate">
          {product.shopName}
        </div>
      </div>
    </a>
  );
}
