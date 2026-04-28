"use client";

import "@/styles/hadami-tokens.css";
import { useParams, useRouter } from "next/navigation";
import { type ChangeEvent, useRef, useState } from "react";
import Image from "next/image";

import { useProductStore } from "@/stores/useProductStore";
import { getIngredientById, getIngredientCategoryInfo } from "@/lib/ingredients";
import { findCombinations } from "@/lib/combinations";
import { getGenreByKey } from "@/lib/productGenres";
import Disclaimer from "@/components/ui/Disclaimer";
import { useUser } from "@/lib/auth";

import AuthGuard from "@/components/ui/AuthGuard";
import { toggleFavoriteInDb, updateProductImageInDb } from "@/lib/db";
import { getProductImagePath, getProductImageThumbPath } from "@/lib/productImages";
import { getSignedImageUrls } from "@/lib/storage";
import { ActiveCategoryIcon, ProductGenreIcon } from "@/components/ui/CosmeticIcons";
import { StarIcon } from "@/components/ui/Icons";
import { ACTIVE_CATEGORIES } from "@/lib/ingredients";
import ProductShareCardSheet from "@/components/product/ProductShareCardSheet";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Failed to read image file"));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}

const backBtnStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 6,
  padding: "8px 14px", borderRadius: 999,
  background: "transparent", border: "1px solid var(--hd-line)",
  color: "var(--hd-ink-60)", fontSize: 12, fontWeight: 600,
  cursor: "pointer", fontFamily: "var(--hd-sans)",
};

export default function ProductDetailPage() {
  const { user, supabase, loading } = useUser();
  const { id } = useParams<{ id: string }>();
  const product = useProductStore((s) => s.getProduct(id));
  const toggleFavorite = useProductStore((s) => s.toggleFavorite);
  const updateProductImage = useProductStore((s) => s.updateProductImage);
  const updatePurchasedAt = useProductStore((s) => s.updatePurchasedAt);
  const [editingPurchasedAt, setEditingPurchasedAt] = useState(false);
  const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoMessage, setPhotoMessage] = useState<string | null>(null);
  const [shareCardOpen, setShareCardOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  if (loading) return null;

  if (!product) {
    return (
      <div className="hd-root hd-softa" data-density="compact">
        <div className="hd hd-page" style={{ minHeight: "100vh", background: "var(--hd-bg)" }}>
          <div style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
              <button onClick={() => router.back()} style={backBtnStyle}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                戻る
              </button>
              <div className="hd-serif" style={{ fontSize: 18 }}>コスメ詳細</div>
            </div>
            <div style={{ textAlign: "center", padding: "44px 20px" }}>
              <div
                style={{
                  width: 60, height: 60, borderRadius: 999, background: "var(--hd-mint-bg)",
                  margin: "0 auto 14px",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
                }}
              >📦</div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--hd-ink-60)", marginBottom: 12, fontFamily: "var(--hd-sans)" }}>
                コスメが見つかりません
              </p>
              <button onClick={() => router.back()} className="hd-cta" style={{ padding: "10px 20px", fontSize: 13, cursor: "pointer" }}>
                戻る
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const genre = getGenreByKey(product.productType || "other");

  const allIngredients = [...product.ingredients]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((pi) => getIngredientById(pi.ingredientId))
    .filter((i) => i !== undefined);

  const activeIngredients = allIngredients.filter((i) => i.activeIngredient);

  // For share card
  const shareCardInitials = (() => {
    const words = product.name.replace(/[^\w\s]/g, " ").split(/\s+/).filter(Boolean);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return product.name.slice(0, 2).toUpperCase();
  })();
  const shareCardEffects = ACTIVE_CATEGORIES
    .map((cat) => ({
      label: cat.label,
      score: Math.min(
        allIngredients.filter(
          (ing) => ing.activeIngredient && ing.categories.includes(cat.key)
        ).length * 2,
        10
      ),
    }))
    .filter((e) => e.score > 0)
    .slice(0, 4);
  const ingredientNames = allIngredients.map((i) => i.nameJa);
  const combinations = findCombinations(ingredientNames);

  const handleToggleFavorite = async () => {
    const prevFav = product.isFavorite;
    toggleFavorite(product.id);
    if (user) {
      const { error } = await toggleFavoriteInDb(supabase, user.id, product.id, !prevFav);
      if (error) toggleFavorite(product.id);
    }
  };

  const openPhotoCapture = () => {
    setPhotoError(null);
    setPhotoMessage(null);
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || isUpdatingPhoto) return;
    if (!user) {
      setPhotoError("ログイン状態を確認してからもう一度お試しください");
      return;
    }
    setIsUpdatingPhoto(true);
    setPhotoError(null);
    setPhotoMessage(null);
    try {
      const imageBase64 = await readFileAsDataUrl(file);
      const result = await updateProductImageInDb(supabase, user.id, product.id, imageBase64);
      if (result.error) { setPhotoError(result.error); return; }
      const packageImagePath = result.filePath ?? getProductImagePath(user.id, product.id);
      const packageImageThumbPath = getProductImageThumbPath(user.id, product.id);
      const signedImages = await getSignedImageUrls(supabase, [packageImagePath, packageImageThumbPath]);
      const packageImage = signedImages[packageImagePath] ?? undefined;
      const packageImageThumb = signedImages[packageImageThumbPath] ?? packageImage;
      updateProductImage(product.id, packageImage, packageImagePath, packageImageThumb, packageImageThumbPath);
      setPhotoMessage("写真を更新しました");
    } catch (error) {
      console.error("Failed to update product photo:", error);
      setPhotoError("写真の更新に失敗しました。もう一度お試しください");
    } finally {
      setIsUpdatingPhoto(false);
    }
  };

  return (
    <AuthGuard>
      <div className="hd-root hd-softa" data-density="compact">
        <div className="hd hd-page" style={{ minHeight: "100vh", background: "var(--hd-bg)" }}>
          {/* Sticky header */}
          <div
            style={{
              position: "sticky", top: 0, zIndex: 310,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 16px",
              background: "var(--hd-bg)",
              borderBottom: "1px solid var(--hd-hair)",
            }}
          >
            <button onClick={() => router.back()} style={backBtnStyle}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              戻る
            </button>
            <button
              onClick={handleToggleFavorite}
              style={{
                width: 38, height: 38, borderRadius: 999,
                background: product.isFavorite ? "var(--hd-moss)" : "var(--hd-surface)",
                color: product.isFavorite ? "#fff" : "var(--hd-ink-40)",
                border: product.isFavorite ? "none" : "1px solid var(--hd-line)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              {product.isFavorite ? <StarIcon size={16} color="#fff" filled /> : <StarIcon size={16} color="#BDBDBD" />}
            </button>
          </div>

          {/* Hero image */}
          <div style={{ position: "relative", height: 280, overflow: "hidden" }}>
            {product.packageImage ? (
              <Image
                src={product.packageImage}
                alt={product.name}
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 430px) 100vw, 430px"
                priority
              />
            ) : (
              <div
                style={{
                  width: "100%", height: "100%",
                  background: "var(--hd-mint-bg)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {genre ? <ProductGenreIcon genre={genre.key} size={64} /> : <span style={{ fontSize: 48 }}>📦</span>}
              </div>
            )}
            <div
              style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to top, rgba(27,38,32,0.78), transparent 60%)",
                pointerEvents: "none",
              }}
            />

            <div style={{ position: "absolute", bottom: 24, left: 20, right: 20 }}>
              <div
                style={{
                  fontSize: 11, color: "rgba(255,255,255,0.8)",
                  fontFamily: "var(--hd-sans)",
                  letterSpacing: "0.04em", fontWeight: 600,
                }}
              >
                {product.brand}
              </div>
              <div
                className="hd-serif"
                style={{
                  fontSize: 22, color: "#fff",
                  lineHeight: 1.2, marginTop: 6, letterSpacing: "-0.01em",
                }}
              >
                {product.name}
              </div>
              {genre && (
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  <span
                    style={{
                      fontSize: 11, fontWeight: 600, color: "#fff",
                      background: "rgba(255,255,255,0.2)",
                      padding: "4px 10px", borderRadius: 999,
                      fontFamily: "var(--hd-sans)",
                      display: "inline-flex", alignItems: "center", gap: 6,
                    }}
                  >
                    <ProductGenreIcon genre={genre.key} size={12} />
                    {genre.label}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div
            style={{
              padding: "20px 20px 32px",
              marginTop: -16,
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              background: "var(--hd-bg)", position: "relative",
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              style={{ position: "absolute", left: -9999 }}
            />

            {(photoMessage || photoError) && (
              <div
                style={{
                  marginBottom: 14, padding: "10px 14px", borderRadius: 12,
                  fontSize: 12, fontWeight: 600, fontFamily: "var(--hd-sans)",
                  background: photoError ? "var(--hd-surface)" : "var(--hd-mint-bg)",
                  border: photoError ? "1px solid var(--hd-terra)" : "none",
                  color: photoError ? "var(--hd-terra)" : "var(--hd-moss-deep)",
                }}
              >
                {photoError ?? photoMessage}
              </div>
            )}

            {/* Active ingredients */}
            {activeIngredients.length > 0 && (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    paddingBottom: 10,
                    marginBottom: 14,
                    borderBottom: "1px solid var(--hd-ink)",
                  }}
                >
                  <div>
                    <div className="hd-mono hd-caps" style={{ color: "var(--hd-ink-40)" }}>
                      Active Ingredients
                    </div>
                    <div className="hd-serif" style={{ fontSize: 18, marginTop: 3, letterSpacing: "-0.01em" }}>
                      美容成分
                    </div>
                  </div>
                  <div className="hd-mono" style={{ fontSize: 12, color: "var(--hd-ink-60)" }}>
                    {String(activeIngredients.length).padStart(2, "0")} 種
                  </div>
                </div>

                <div className="hd-stagger" style={{ marginBottom: 24 }}>
                  {activeIngredients.map((ing, i) => {
                    const catInfo = getIngredientCategoryInfo(ing);
                    const rarity = ing.rarity === "legendary" ? 4 : ing.rarity === "rare" ? 3 : ing.rarity === "uncommon" ? 2 : 1;
                    return (
                      <button
                        key={ing.id}
                        onClick={() => router.push(`/ingredient/${encodeURIComponent(ing.id)}`)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          padding: "14px 4px",
                          background: "transparent",
                          border: "none",
                          borderBottom:
                            i < activeIngredients.length - 1
                              ? "1px solid var(--hd-hair)"
                              : "1px solid var(--hd-hair)",
                          cursor: "pointer",
                          textAlign: "left",
                          width: "100%",
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
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 999,
                            flexShrink: 0,
                            background: (catInfo?.color ?? "#9E9E9E") + "1F",
                            color: catInfo?.color ?? "#9E9E9E",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <ActiveCategoryIcon category={catInfo?.key ?? null} size={13} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            className="hd-serif"
                            style={{
                              fontSize: 15,
                              letterSpacing: "-0.01em",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {ing.nameJa}
                          </div>
                          {catInfo && (
                            <div
                              className="hd-mono hd-caps"
                              style={{ color: "var(--hd-ink-40)", marginTop: 2 }}
                            >
                              {catInfo.label}
                            </div>
                          )}
                        </div>
                        <span
                          className="hd-mono"
                          style={{
                            fontSize: 11,
                            color: "var(--hd-ink-60)",
                            flexShrink: 0,
                            letterSpacing: "0.05em",
                          }}
                        >
                          {"★".repeat(rarity)}
                          <span style={{ opacity: 0.3 }}>{"★".repeat(5 - rarity)}</span>
                        </span>
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--hd-ink-40)"
                          strokeWidth="2"
                          strokeLinecap="round"
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {activeIngredients.length === 0 && (
              <div style={{ marginBottom: 24, padding: "32px 0", textAlign: "center" }}>
                <p
                  className="hd-mono hd-caps"
                  style={{ color: "var(--hd-ink-40)" }}
                >
                  No Active Ingredients
                </p>
                <p
                  className="hd-serif"
                  style={{
                    fontSize: 14,
                    color: "var(--hd-ink-60)",
                    marginTop: 8,
                    letterSpacing: "-0.01em",
                  }}
                >
                  美容成分は検出されませんでした
                </p>
              </div>
            )}

            <p
              className="hd-mono"
              style={{
                fontSize: 10,
                color: "var(--hd-ink-40)",
                lineHeight: 1.6,
                letterSpacing: "0.04em",
                marginTop: 12,
              }}
            >
              ※ 成分をタップすると図鑑で詳細を確認できます
            </p>

            {/* Combinations */}
            {combinations.length > 0 && (
              <div style={{ marginTop: 28, marginBottom: 24 }}>
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
                    <div className="hd-mono hd-caps" style={{ color: "var(--hd-ink-40)" }}>
                      Combinations · 組み合わせ
                    </div>
                    <div className="hd-serif" style={{ fontSize: 18, marginTop: 3, letterSpacing: "-0.01em" }}>
                      組み合わせ情報
                    </div>
                  </div>
                  <div className="hd-mono" style={{ fontSize: 12, color: "var(--hd-ink-60)" }}>
                    {String(combinations.length).padStart(2, "0")}
                  </div>
                </div>
                <div>
                  {combinations.map((combo, i) => {
                    const isGood = combo.type === "recommended";
                    const accent = isGood ? "var(--hd-moss)" : "var(--hd-terra)";
                    return (
                      <div
                        key={i}
                        style={{
                          padding: "14px 14px",
                          marginBottom: 8,
                          background: "var(--hd-surface)",
                          border: "1px solid var(--hd-hair)",
                          borderLeft: `3px solid ${accent}`,
                        }}
                      >
                        <div
                          className="hd-mono hd-caps"
                          style={{ color: accent, marginBottom: 4 }}
                        >
                          {isGood ? "Recommended · 推奨" : "Note · 注意"}
                        </div>
                        <div
                          className="hd-serif"
                          style={{
                            fontSize: 14,
                            letterSpacing: "-0.01em",
                            lineHeight: 1.4,
                          }}
                        >
                          {combo.label}
                        </div>
                        <p
                          style={{
                            fontFamily: "var(--hd-sans)",
                            fontSize: 12,
                            marginTop: 6,
                            marginBottom: 0,
                            color: "var(--hd-ink-60)",
                            lineHeight: 1.6,
                          }}
                        >
                          {combo.desc}
                        </p>
                        <p
                          className="hd-mono"
                          style={{
                            fontSize: 9,
                            marginTop: 6,
                            marginBottom: 0,
                            color: "var(--hd-ink-40)",
                            letterSpacing: "0.05em",
                          }}
                        >
                          SOURCE · {combo.source}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dates */}
            <div
              style={{
                marginTop: 24, marginBottom: 24,
                background: "var(--hd-surface)", borderRadius: 14,
                border: "1px solid var(--hd-hair)", overflow: "hidden",
              }}
            >
              {product.lastUsedAt && (
                <div
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "12px 16px", borderBottom: "1px solid var(--hd-hair)",
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--hd-ink-60)", fontFamily: "var(--hd-sans)" }}>
                    最終使用日
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "var(--hd-sans)" }}>
                    {new Date(product.lastUsedAt).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}
                  </span>
                </div>
              )}
              <div
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 16px",
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--hd-ink-60)", fontFamily: "var(--hd-sans)" }}>
                  購入日
                </span>
                {editingPurchasedAt ? (
                  <input
                    type="date"
                    defaultValue={product.purchasedAt ? product.purchasedAt.slice(0, 10) : ""}
                    style={{
                      fontSize: 12, fontWeight: 600,
                      border: "1px solid var(--hd-moss)", borderRadius: 8,
                      padding: "4px 8px", outline: "none",
                      fontFamily: "var(--hd-sans)",
                    }}
                    onBlur={(e) => {
                      updatePurchasedAt(product.id, e.target.value || undefined);
                      setEditingPurchasedAt(false);
                    }}
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => setEditingPurchasedAt(true)}
                    style={{
                      fontSize: 12, fontWeight: 600,
                      border: "none", background: "transparent",
                      cursor: "pointer", color: "var(--hd-moss)",
                      textDecorationLine: "underline", textDecorationStyle: "dotted",
                      fontFamily: "var(--hd-sans)",
                    }}
                  >
                    {product.purchasedAt
                      ? new Date(product.purchasedAt).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })
                      : "タップして入力"}
                  </button>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button
                onClick={() => router.push("/deck")}
                style={{
                  flex: 1, padding: "13px 0",
                  borderRadius: 999,
                  background: "transparent",
                  border: "1px solid var(--hd-moss)",
                  color: "var(--hd-moss)",
                  fontSize: 13, fontWeight: 600, fontFamily: "var(--hd-sans)",
                  cursor: "pointer",
                }}
              >
                ルーティンに追加
              </button>
              <button
                type="button"
                onClick={openPhotoCapture}
                disabled={isUpdatingPhoto}
                aria-label={isUpdatingPhoto ? "写真を更新中" : product.packageImage ? "写真を変更" : "写真を追加"}
                className="hd-cta"
                style={{
                  flex: 1, fontSize: 13,
                  cursor: isUpdatingPhoto ? "default" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  opacity: isUpdatingPhoto ? 0.6 : 1,
                  padding: "13px 0",
                }}
              >
                <span>📷</span>
                <span>
                  {isUpdatingPhoto ? "写真を更新中..." : product.packageImage ? "写真を変更" : "写真を追加"}
                </span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShareCardOpen(true)}
              style={{
                width: "100%", marginTop: 10, padding: "13px 0",
                background: "transparent",
                border: "1px solid var(--hd-ink)",
                color: "var(--hd-ink)",
                fontSize: 13, fontWeight: 600, fontFamily: "var(--hd-sans)",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <span>シェアカード</span>
              <span style={{ fontFamily: "var(--hd-mono)", fontSize: 9, letterSpacing: "0.2em", opacity: 0.5 }}>SHARE →</span>
            </button>

            <div style={{ marginTop: 24 }}>
              <Disclaimer />
            </div>
          </div>
        </div>
      </div>

      <ProductShareCardSheet
        open={shareCardOpen}
        onClose={() => setShareCardOpen(false)}
        name={product.name}
        brand={product.brand}
        productType={getGenreByKey(product.productType)?.label ?? product.productType}
        initials={shareCardInitials}
        effects={shareCardEffects}
      />
    </AuthGuard>
  );
}
