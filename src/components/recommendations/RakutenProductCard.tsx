import type { RakutenProduct } from "@/types";
import { buildRakutenImageProxyUrl } from "@/lib/rakutenImage";
import { RAKUTEN_CARD_WIDTH_PX } from "./cardLayout";

interface Props {
  product: RakutenProduct;
  fullWidth?: boolean;
}

export default function RakutenProductCard({ product, fullWidth }: Props) {
  const imageSrc = buildRakutenImageProxyUrl(product.imageUrl);

  if (fullWidth) {
    // 横並びレイアウト（カルーセル用）
    return (
      <a
        href={product.affiliateUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        style={{
          display: "flex",
          width: "100%",
          background: "var(--hd-surface)",
          border: "1px solid var(--hd-hair)",
          textDecoration: "none",
          color: "inherit",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <span
          className="hd-mono hd-caps"
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            fontSize: 9,
            padding: "2px 6px",
            color: "var(--hd-ink-40)",
            background: "var(--hd-bg)",
            border: "1px solid var(--hd-hair)",
            zIndex: 10,
          }}
        >
          PR
        </span>

        <div
          style={{
            flexShrink: 0,
            width: 96,
            height: 96,
            background: "var(--hd-surface-2)",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc}
              alt={product.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span
              className="hd-mono hd-caps"
              style={{ color: "var(--hd-ink-40)" }}
            >
              No Img
            </span>
          )}
        </div>

        <div
          style={{
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            minWidth: 0,
            flex: 1,
          }}
        >
          <div
            className="hd-mono hd-caps"
            style={{
              color: "var(--hd-ink-40)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              marginBottom: 4,
            }}
          >
            {product.shopName}
          </div>
          <div
            className="hd-serif"
            style={{
              fontSize: 13,
              lineHeight: 1.35,
              letterSpacing: "-0.01em",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {product.name}
          </div>
          <div
            style={{
              marginTop: 8,
              display: "flex",
              alignItems: "baseline",
              gap: 10,
            }}
          >
            <span
              className="hd-mono"
              style={{
                fontSize: 13,
                color: "var(--hd-ink)",
                letterSpacing: "0.02em",
              }}
            >
              ¥{product.price.toLocaleString()}
            </span>
            {product.reviewScore > 0 && (
              <span
                className="hd-mono"
                style={{
                  fontSize: 10,
                  color: "var(--hd-ink-60)",
                  letterSpacing: "0.05em",
                }}
              >
                ★ {product.reviewScore.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </a>
    );
  }

  // 縦並びレイアウト（水平スクロール用）
  return (
    <a
      href={product.affiliateUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      style={{
        display: "block",
        background: "var(--hd-surface)",
        border: "1px solid var(--hd-hair)",
        textDecoration: "none",
        color: "inherit",
        position: "relative",
        minWidth: `${RAKUTEN_CARD_WIDTH_PX}px`,
        maxWidth: `${RAKUTEN_CARD_WIDTH_PX}px`,
        overflow: "hidden",
      }}
    >
      <span
        className="hd-mono hd-caps"
        style={{
          position: "absolute",
          top: 6,
          right: 6,
          fontSize: 9,
          padding: "2px 6px",
          color: "var(--hd-ink-40)",
          background: "var(--hd-bg)",
          border: "1px solid var(--hd-hair)",
          zIndex: 10,
        }}
      >
        PR
      </span>

      <div
        style={{
          width: "100%",
          height: 88,
          background: "var(--hd-surface-2)",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={product.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span
            className="hd-mono hd-caps"
            style={{ color: "var(--hd-ink-40)" }}
          >
            No Img
          </span>
        )}
      </div>

      <div style={{ padding: "10px 10px 12px" }}>
        <div
          className="hd-mono hd-caps"
          style={{
            color: "var(--hd-ink-40)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginBottom: 4,
          }}
        >
          {product.shopName}
        </div>
        <div
          className="hd-serif"
          style={{
            fontSize: 12,
            lineHeight: 1.35,
            letterSpacing: "-0.01em",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: 32,
          }}
        >
          {product.name}
        </div>
        <div
          style={{
            marginTop: 8,
            display: "flex",
            alignItems: "baseline",
            gap: 8,
          }}
        >
          <span
            className="hd-mono"
            style={{
              fontSize: 12,
              color: "var(--hd-ink)",
              letterSpacing: "0.02em",
            }}
          >
            ¥{product.price.toLocaleString()}
          </span>
          {product.reviewScore > 0 && (
            <span
              className="hd-mono"
              style={{
                fontSize: 10,
                color: "var(--hd-ink-60)",
                letterSpacing: "0.05em",
              }}
            >
              ★ {product.reviewScore.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}
