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
              background: "var(--hd-surface)",
              padding: "14px 16px",
              marginBottom: 10,
              border: "1px solid var(--hd-hair)",
            }}
          >
            <div
              className="hd-mono hd-caps"
              style={{
                color: "var(--hd-ink-40)",
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <InfoIcon size={11} color="currentColor" />
              Description · 解説
            </div>
            <p
              className="hd-serif"
              style={{
                fontSize: 14,
                lineHeight: 1.7,
                color: "var(--hd-ink)",
                margin: 0,
                letterSpacing: "-0.005em",
              }}
            >
              {ingredient.note}
            </p>
          </div>

          {/* Fun fact */}
          {ingredient.funFact && (
            <div
              style={{
                background: "var(--hd-surface)",
                padding: "14px 16px",
                marginBottom: 10,
                border: "1px solid var(--hd-hair)",
                borderLeft: "3px solid var(--hd-moss)",
              }}
            >
              <div
                className="hd-mono hd-caps"
                style={{
                  color: "var(--hd-moss)",
                  marginBottom: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <LightbulbIcon size={11} color="currentColor" />
                Trivia · 豆知識
              </div>
              <p
                className="hd-serif"
                style={{
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: "var(--hd-ink)",
                  margin: 0,
                  letterSpacing: "-0.005em",
                }}
              >
                {ingredient.funFact}
              </p>
            </div>
          )}

          {/* Caution */}
          {ingredient.caution && (
            <div
              style={{
                background: "var(--hd-surface)",
                padding: "14px 16px",
                marginBottom: 10,
                border: "1px solid var(--hd-hair)",
                borderLeft: "3px solid var(--hd-terra)",
              }}
            >
              <div
                className="hd-mono hd-caps"
                style={{
                  color: "var(--hd-terra)",
                  marginBottom: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <AlertIcon size={11} color="currentColor" />
                Caution · 注意事項
              </div>
              <p
                className="hd-serif"
                style={{
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: "var(--hd-ink)",
                  margin: 0,
                  letterSpacing: "-0.005em",
                }}
              >
                {ingredient.caution}
              </p>
            </div>
          )}

          {/* Products */}
          {containingProducts.length > 0 && (
            <div style={{ marginBottom: 16, marginTop: 24 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  paddingBottom: 10,
                  marginBottom: 12,
                  borderBottom: "1px solid var(--hd-ink)",
                }}
              >
                <div>
                  <div
                    className="hd-mono hd-caps"
                    style={{ color: "var(--hd-ink-40)" }}
                  >
                    Found In · 含有コスメ
                  </div>
                  <div
                    className="hd-serif"
                    style={{ fontSize: 16, marginTop: 3, letterSpacing: "-0.01em" }}
                  >
                    この成分を含む保存済みコスメ
                  </div>
                </div>
                <div
                  className="hd-mono"
                  style={{ fontSize: 11, color: "var(--hd-ink-60)" }}
                >
                  {String(containingProducts.length).padStart(2, "0")}
                </div>
              </div>
              <div>
                {containingProducts.map((p, i) => (
                  <Link
                    key={p.id}
                    href={`/product/${p.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 0",
                      borderBottom:
                        i < containingProducts.length - 1
                          ? "1px solid var(--hd-hair)"
                          : "none",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <div
                      className="hd-mono"
                      style={{
                        width: 22,
                        fontSize: 9,
                        color: "var(--hd-ink-40)",
                        flexShrink: 0,
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        className="hd-mono hd-caps"
                        style={{
                          color: "var(--hd-ink-40)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.brand}
                      </div>
                      <div
                        className="hd-serif"
                        style={{
                          fontSize: 14,
                          marginTop: 3,
                          letterSpacing: "-0.01em",
                          lineHeight: 1.3,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.name}
                      </div>
                    </div>
                    <ChevronRightIcon size={12} color="var(--hd-ink-40)" />
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
