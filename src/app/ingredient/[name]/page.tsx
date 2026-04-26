"use client";

import "@/styles/hadami-tokens.css";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getIngredientById, getIngredientCategoryInfo, getIngredientCategories } from "@/lib/ingredients";
import { useProductStore } from "@/stores/useProductStore";
import { useZukanStore } from "@/stores/useZukanStore";
import Badge from "@/components/ui/Badge";
import Disclaimer from "@/components/ui/Disclaimer";
import TargetedRakutenSection from "@/components/recommendations/TargetedRakutenSection";
import { useUser } from "@/lib/auth";

import { ActiveCategoryIcon } from "@/components/ui/CosmeticIcons";
import {
  QuestionMarkCircleIcon,
  LightbulbIcon,
  InfoIcon,
  AlertIcon,
  PackageIcon,
  ChevronRightIcon,
  CameraIcon,
} from "@/components/ui/Icons";

const backBtnStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  fontSize: 13, fontWeight: 600,
  color: "var(--hd-moss)",
  background: "transparent",
  border: "none", cursor: "pointer",
  marginBottom: 16, padding: 0,
  fontFamily: "var(--hd-sans)",
};

export default function IngredientDetailPage() {
  const { loading } = useUser();
  const router = useRouter();
  const { name } = useParams<{ name: string }>();
  const ingredient = getIngredientById(name);
  const products = useProductStore((s) => s.products);
  const discoveredIds = useZukanStore((s) => s.discoveredIds);

  if (loading) return null;
  const isDiscovered = discoveredIds.includes(name);

  if (!ingredient) {
    return (
      <div className="hd-root hd-softa" data-density="compact">
        <div className="hd hd-page" style={{ minHeight: "100vh", padding: "40px 20px", textAlign: "center", background: "var(--hd-bg)" }}>
          <p style={{ color: "var(--hd-ink-60)", fontFamily: "var(--hd-sans)" }}>成分が見つかりません</p>
          <button onClick={() => router.back()} style={{ ...backBtnStyle, marginTop: 8 }}>← 戻る</button>
        </div>
      </div>
    );
  }

  if (!isDiscovered) {
    return (
      <div className="hd-root hd-softa" data-density="compact">
        <div className="hd hd-page" style={{ minHeight: "100vh", background: "var(--hd-bg)" }}>
          <div style={{ padding: "32px 20px" }}>
            <button onClick={() => router.back()} style={backBtnStyle}>← 戻る</button>
            <div style={{ textAlign: "center", padding: "44px 0" }}>
              <QuestionMarkCircleIcon size={64} color="#C0B8A8" />
              <div className="hd-serif" style={{ fontSize: 22, marginTop: 14 }}>未発見の成分</div>
              <p
                style={{
                  fontSize: 13, marginTop: 8, color: "var(--hd-ink-60)",
                  fontFamily: "var(--hd-sans)", lineHeight: 1.65,
                }}
              >
                この成分はまだ発見されていません。<br />
                化粧品をスキャンして見つけましょう！
              </p>
              <Link
                href="/scan"
                className="hd-cta"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  marginTop: 20, textDecoration: "none", fontSize: 14,
                }}
              >
                <CameraIcon size={16} color="white" />
                スキャンする
              </Link>
              <div style={{ marginTop: 20, textAlign: "left" }}>
                <TargetedRakutenSection
                  enabled={true}
                  icon="PR"
                  title={`${ingredient.nameJa} を含む商品を見てみる`}
                  description="まだ未発見でも、配合商品から先に触れておくと次の収集候補を決めやすくなります。"
                  keywords={[
                    `${ingredient.nameJa} 配合 スキンケア`,
                    `${ingredient.nameJa} 美容液`,
                  ]}
                  ingredientHints={[ingredient.nameJa]}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const catInfo = getIngredientCategoryInfo(ingredient);
  const allCats = getIngredientCategories(ingredient);
  const containingProducts = products.filter((p) =>
    p.ingredients.some((pi) => pi.ingredientId === ingredient.id)
  );

  return (
    <div className="hd-root hd-softa" data-density="compact">
      <div className="hd hd-page" style={{ minHeight: "100vh", background: "var(--hd-bg)" }}>
        <div style={{ padding: "32px 20px 24px" }}>
          <button onClick={() => router.back()} style={backBtnStyle}>← 戻る</button>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 22 }}>
            <div
              style={{
                position: "relative",
                width: 60, height: 60, borderRadius: 999,
                margin: "0 auto 10px",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: `linear-gradient(135deg, ${(catInfo?.color || ingredient.color)}25, ${(catInfo?.color || ingredient.color)}08)`,
                color: catInfo?.color || ingredient.color,
              }}
            >
              <ActiveCategoryIcon category={catInfo?.key} size={26} />
            </div>
            <div className="hd-serif" style={{ fontSize: 22, lineHeight: 1.2 }}>
              {ingredient.nameJa}
            </div>
            <p
              style={{
                fontSize: 11, marginTop: 4, color: "var(--hd-ink-60)",
                fontFamily: "var(--hd-sans)", margin: "4px 0 0",
              }}
            >
              {ingredient.nameInci}
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <Badge rarity={ingredient.rarity} size="sm" />
              {allCats.map((c) => (
                <span
                  key={c.key}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    fontSize: 10, padding: "3px 10px", borderRadius: 999,
                    fontWeight: 500, fontFamily: "var(--hd-sans)",
                    background: c.color + "18", color: c.color,
                  }}
                >
                  <ActiveCategoryIcon category={c.key} size={11} />
                  {c.label}
                </span>
              ))}
            </div>
          </div>

          {/* Description */}
          <div
            style={{
              background: "var(--hd-surface)", borderRadius: 14,
              padding: 14, marginBottom: 10,
              border: "1px solid var(--hd-hair)",
            }}
          >
            <h2
              style={{
                fontSize: 12, fontWeight: 700, marginBottom: 6,
                display: "flex", alignItems: "center", gap: 6,
                fontFamily: "var(--hd-sans)",
                color: "var(--hd-ink)",
              }}
            >
              <InfoIcon size={13} color="currentColor" />
              一般的な分類の説明
            </h2>
            <p style={{ fontSize: 12, lineHeight: 1.65, color: "var(--hd-ink-60)", fontFamily: "var(--hd-sans)", margin: 0 }}>
              {ingredient.note}
            </p>
          </div>

          {/* Fun fact */}
          {ingredient.funFact && (
            <div
              style={{
                background: "var(--hd-mint-bg)", borderRadius: 14,
                padding: 14, marginBottom: 10,
                border: "1px solid oklch(0.38 0.05 155 / 0.18)",
              }}
            >
              <h2
                style={{
                  fontSize: 12, fontWeight: 700, marginBottom: 6,
                  display: "flex", alignItems: "center", gap: 6,
                  color: "var(--hd-moss-deep)",
                  fontFamily: "var(--hd-sans)",
                }}
              >
                <LightbulbIcon size={13} color="currentColor" />
                トリビア
              </h2>
              <p style={{ fontSize: 12, lineHeight: 1.65, color: "var(--hd-ink-60)", fontFamily: "var(--hd-sans)", margin: 0 }}>
                {ingredient.funFact}
              </p>
            </div>
          )}

          {/* Caution */}
          {ingredient.caution && (
            <div
              style={{
                background: "var(--hd-surface)", borderRadius: 14,
                padding: 14, marginBottom: 10,
                border: "1px solid var(--hd-terra)",
                borderLeft: "3px solid var(--hd-terra)",
              }}
            >
              <h2
                style={{
                  fontSize: 12, fontWeight: 700, marginBottom: 6,
                  display: "flex", alignItems: "center", gap: 6,
                  color: "var(--hd-terra)",
                  fontFamily: "var(--hd-sans)",
                }}
              >
                <AlertIcon size={13} color="currentColor" />
                一般的な注意事項
              </h2>
              <p style={{ fontSize: 12, lineHeight: 1.65, color: "var(--hd-ink-60)", fontFamily: "var(--hd-sans)", margin: 0 }}>
                {ingredient.caution}
              </p>
            </div>
          )}

          {/* Products */}
          {containingProducts.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h2
                style={{
                  fontSize: 13, fontWeight: 700, marginBottom: 10,
                  display: "flex", alignItems: "center", gap: 8,
                  fontFamily: "var(--hd-sans)",
                }}
              >
                <span style={{ width: 4, height: 14, borderRadius: 999, background: "var(--hd-moss)" }} />
                この成分を含む保存済みコスメ
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {containingProducts.map((p) => (
                  <Link
                    key={p.id}
                    href={`/product/${p.id}`}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      background: "var(--hd-surface)", borderRadius: 12, padding: 12,
                      border: "1px solid var(--hd-hair)",
                      textDecoration: "none", color: "inherit",
                    }}
                  >
                    <PackageIcon size={16} color="var(--hd-moss)" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600, fontSize: 12,
                          fontFamily: "var(--hd-sans)",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}
                      >{p.name}</div>
                      <div style={{ fontSize: 10, color: "var(--hd-ink-60)", fontFamily: "var(--hd-sans)" }}>
                        {p.brand}
                      </div>
                    </div>
                    <ChevronRightIcon size={16} color="var(--hd-ink-40)" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          <Disclaimer />
        </div>
      </div>
    </div>
  );
}
