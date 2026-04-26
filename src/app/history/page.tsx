"use client";

import "@/styles/hadami-tokens.css";
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useProductStore } from "@/stores/useProductStore";
import { useDeckStore } from "@/stores/useDeckStore";
import Disclaimer from "@/components/ui/Disclaimer";
import ScrollToTop from "@/components/ui/ScrollToTop";
import { useUser } from "@/lib/auth";

import AuthGuard from "@/components/ui/AuthGuard";
import { ProductGenreIcon, ActiveCategoryIcon } from "@/components/ui/CosmeticIcons";
import { getIngredientById, ACTIVE_CATEGORIES } from "@/lib/ingredients";
import { CategoryKey, Product } from "@/types";
import { StarIcon, CameraIcon } from "@/components/ui/Icons";
import { Ico } from "@/components/redesign/apothecary/Icons";
import { deleteProductFromDb, updateProductImageInDb, deleteProductImageFromDb, updateProductTypeInDb, toggleFavoriteInDb, updateProductNameInDb } from "@/lib/db";
import { PRODUCT_GENRES, getGenreByKey } from "@/lib/productGenres";
import ShareModal from "@/components/ui/ShareModal";
import { shareMyCosmetic } from "@/lib/share";
import { generateProductShareImage } from "@/lib/generateShareImage";
import { getSignedImageUrls } from "@/lib/storage";
import { getProductImagePath, getProductImageThumbPath } from "@/lib/productImages";
import { ProductGenre } from "@/types";

type ViewMode = "photo" | "list";

export default function HistoryPage() {
  const { user, supabase, loading } = useUser();
  const products = useProductStore((s) => s.products);
  const removeProduct = useProductStore((s) => s.removeProduct);
  const removeProductFromDeck = useDeckStore((s) => s.removeProduct);
  const updateProductImage = useProductStore((s) => s.updateProductImage);
  const updateProductType = useProductStore((s) => s.updateProductType);
  const toggleFavorite = useProductStore((s) => s.toggleFavorite);
  const updateProductName = useProductStore((s) => s.updateProductName);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [updatingImageId, setUpdatingImageId] = useState<string | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const pendingProductIdRef = useRef<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | ProductGenre>("all");
  const [favOnly, setFavOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("photo");
  const router = useRouter();
  const [editMode, setEditMode] = useState(false);
  const [editingGenreId, setEditingGenreId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState("");
  const captureRef = useRef<HTMLDivElement>(null);
  const [shareProduct, setShareProduct] = useState<Product | null>(null);
  const [shareImageBase64, setShareImageBase64] = useState<string | undefined>(undefined);
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());

  const { favCount, filtered, activeGenres } = useMemo(() => {
    const displayGenres = ["toner", "serum", "emulsion", "cream", "sunscreen", "mask_pack"];
    const favCount = products.filter((p) => p.isFavorite).length;
    const filtered = products
      .filter((p) => activeFilter === "all" || (p.productType || "other") === activeFilter)
      .filter((p) => !favOnly || p.isFavorite)
      .sort((a, b) => (a.isFavorite === b.isFavorite ? 0 : a.isFavorite ? -1 : 1));
    const genreCountsMap = products.reduce<Record<string, number>>((acc, p) => {
      const g = p.productType || "other";
      acc[g] = (acc[g] || 0) + 1;
      return acc;
    }, {});
    const activeGenres = PRODUCT_GENRES.filter((g) => displayGenres.includes(g.key) && genreCountsMap[g.key]);
    return { favCount, filtered, activeGenres };
  }, [products, activeFilter, favOnly]);

  if (loading) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const productId = pendingProductIdRef.current;
    if (!file || !productId || !user) return;
    setUpdatingImageId(productId);
    setImageError(null);
    e.target.value = "";
    const reader = new FileReader();
    reader.onerror = () => { setImageError("画像の読み込みに失敗しました。"); setUpdatingImageId(null); };
    reader.onload = async (ev) => {
      const imageBase64 = ev.target?.result as string;
      if (!imageBase64) { setImageError("画像データが取得できませんでした。"); setUpdatingImageId(null); return; }
      const { error, filePath } = await updateProductImageInDb(supabase, user.id, productId, imageBase64);
      if (error) { setImageError(`保存に失敗しました: ${error}`); }
      else if (filePath) {
        const imagePath = getProductImagePath(user.id, productId);
        const thumbPath = getProductImageThumbPath(user.id, productId);
        const signedImages = await getSignedImageUrls(supabase, [imagePath, thumbPath]);
        updateProductImage(
          productId,
          signedImages[imagePath] ?? undefined,
          imagePath,
          signedImages[thumbPath] ?? signedImages[imagePath] ?? undefined,
          thumbPath
        );
      }
      setUpdatingImageId(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteImage = async (productId: string) => {
    if (!user) return;
    if (!window.confirm("このコスメの写真を削除しますか？")) return;
    setDeletingImageId(productId);
    setImageError(null);
    const { error } = await deleteProductImageFromDb(supabase, user.id, productId);
    if (error) { setImageError(`写真の削除に失敗しました: ${error}`); }
    else { updateProductImage(productId, undefined, undefined, undefined, undefined); }
    setDeletingImageId(null);
  };

  const handleToggleFavorite = async (productId: string, currentFav: boolean) => {
    if (!user) return;
    toggleFavorite(productId);
    const { error } = await toggleFavoriteInDb(supabase, user.id, productId, !currentFav);
    if (error) {
      toggleFavorite(productId);
      setImageError(`お気に入りの更新に失敗しました: ${error}`);
    }
  };

  const handleGenreChange = async (productId: string, newGenre: ProductGenre) => {
    if (!user) return;
    const prev = products.find((p) => p.id === productId)?.productType ?? "other";
    updateProductType(productId, newGenre);
    const { error } = await updateProductTypeInDb(supabase, user.id, productId, newGenre);
    if (error) {
      updateProductType(productId, prev);
      setImageError(`カテゴリの更新に失敗しました: ${error}`);
    }
  };

  const handleNameSave = async (productId: string) => {
    const trimmed = editNameValue.trim();
    if (!trimmed || !user) { setEditingNameId(null); return; }
    const prev = products.find((p) => p.id === productId)?.name ?? "";
    updateProductName(productId, trimmed);
    setEditingNameId(null);
    const { error } = await updateProductNameInDb(supabase, user.id, productId, trimmed);
    if (error) {
      updateProductName(productId, prev);
      setImageError(`名前の更新に失敗しました: ${error}`);
    }
  };

  const handleBulkDelete = async () => {
    if (!user || selectedIds.size === 0) return;
    if (!window.confirm(`選択した${selectedIds.size}件を削除しますか？`)) return;
    const failedIds: string[] = [];
    for (const id of Array.from(selectedIds)) {
      setDeletingId(id);
      const { error } = await deleteProductFromDb(supabase, user.id, id);
      if (error) {
        failedIds.push(id);
      } else {
        const { error: deckError } = await supabase
          .from("deck_items")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", id);
        if (deckError) {
          console.error("Failed to remove deck items for deleted product:", deckError);
        }
        removeProduct(id);
        removeProductFromDeck(id);
      }
    }
    if (failedIds.length > 0) {
      setImageError(`${failedIds.length}件の削除に失敗しました。もう一度お試しください。`);
      setSelectedIds(new Set(failedIds));
    } else {
      setSelectedIds(new Set());
    }
    setDeletingId(null);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const chipStyle = (on: boolean): React.CSSProperties => ({
    display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
    padding: "8px 12px", cursor: "pointer",
    background: on ? "var(--hd-ink)" : "transparent",
    color: on ? "var(--hd-bg)" : "var(--hd-ink)",
    border: on ? "none" : "1px solid var(--hd-line)",
    fontFamily: "var(--hd-serif)", fontSize: 12,
    whiteSpace: "nowrap",
  });

  return (
    <AuthGuard>
      <div className="hd-root hd-softa" data-density="compact" data-card="default">
        <div
          className="hd hd-page"
          style={{ minHeight: "100vh", background: "var(--hd-bg)" }}
        >
          <div style={{ padding: "16px 20px 96px" }}>
            {/* Sticky Header */}
            <div
              style={{
                position: "sticky",
                top: "env(safe-area-inset-top, 0px)",
                zIndex: 30,
                background: "var(--hd-bg)",
                margin: "0 -20px 12px",
                padding: "8px 20px 16px",
                borderBottom: "1px solid var(--hd-hair)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
                <div>
                  <div className="hd-mono hd-caps" style={{ color: "var(--hd-ink-40)" }}>
                    My Cosmetics · {String(products.length).padStart(3, "0")}
                  </div>
                  <div className="hd-serif" style={{ fontSize: 24, letterSpacing: "-0.02em", lineHeight: 1.05, marginTop: 4 }}>
                    Personal<br /><span style={{ fontStyle: "italic" }}>collection.</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {editMode && selectedIds.size > 0 && (
                    <button
                      onClick={handleBulkDelete}
                      style={{
                        padding: "8px 14px", border: "none",
                        background: "var(--hd-terra)", color: "#fff",
                        fontSize: 11, fontWeight: 600, cursor: "pointer",
                        fontFamily: "var(--hd-sans)",
                      }}
                    >
                      {selectedIds.size}件削除
                    </button>
                  )}
                  {products.length > 0 && (
                    <button
                      onClick={() => { setEditMode(!editMode); setEditingGenreId(null); setSelectedIds(new Set()); setEditingNameId(null); }}
                      style={{
                        padding: "8px 14px",
                        background: editMode ? "var(--hd-ink)" : "transparent",
                        color: editMode ? "var(--hd-bg)" : "var(--hd-ink)",
                        border: editMode ? "none" : "1px solid var(--hd-ink)",
                        fontSize: 11, cursor: "pointer",
                        fontFamily: "var(--hd-mono)", letterSpacing: "0.18em",
                      }}
                    >
                      {editMode ? "DONE" : "EDIT"}
                    </button>
                  )}
                  {/* View mode toggle — A pure */}
                  <div style={{ display: "flex", border: "1px solid var(--hd-ink)" }}>
                    {(["photo", "list"] as const).map((m, idx) => {
                      const on = viewMode === m;
                      return (
                        <button
                          key={m}
                          onClick={() => setViewMode(m)}
                          style={{
                            padding: "8px 10px",
                            background: on ? "var(--hd-ink)" : "transparent",
                            color: on ? "var(--hd-bg)" : "var(--hd-ink)",
                            borderLeft: idx > 0 ? "1px solid var(--hd-ink)" : "none",
                            border: idx > 0 ? undefined : "none",
                            display: "flex", alignItems: "center", cursor: "pointer",
                          }}
                        >
                          {m === "photo" ? (
                            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <rect x="1" y="1" width="5" height="5" rx="1" />
                              <rect x="8" y="1" width="5" height="5" rx="1" />
                              <rect x="1" y="8" width="5" height="5" rx="1" />
                              <rect x="8" y="8" width="5" height="5" rx="1" />
                            </svg>
                          ) : (
                            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M1 3h12M1 7h12M1 11h12" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} style={{ display: "none" }} />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} style={{ display: "none" }} />

              {imageError && (
                <div
                  style={{
                    display: "flex", gap: 10, marginBottom: 14,
                    padding: "12px 14px", borderRadius: 12,
                    background: "var(--hd-surface)", border: "1px solid var(--hd-terra)",
                    fontSize: 12, color: "var(--hd-terra)",
                    fontFamily: "var(--hd-sans)",
                  }}
                >
                  ⚠️ {imageError}
                </div>
              )}

              {/* Filters */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() => setFavOnly(!favOnly)}
                  style={chipStyle(favOnly)}
                >
                  <StarIcon size={11} color={favOnly ? "#fff" : "#F59E0B"} filled={favOnly} />
                  お気に入り
                </button>
                <div
                  style={{
                    display: "flex", gap: 6, overflowX: "auto", flex: 1,
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  <button onClick={() => setActiveFilter("all")} style={chipStyle(activeFilter === "all")}>
                    すべて
                  </button>
                  {activeGenres.map((g) => (
                    <button key={g.key} onClick={() => setActiveFilter(g.key)} style={chipStyle(activeFilter === g.key)}>
                      <ProductGenreIcon genre={g.key} size={11} />
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {products.length === 0 ? (
              <div
                style={{
                  textAlign: "center", padding: "44px 24px",
                  background: "var(--hd-surface)", borderRadius: 18,
                  border: "1px solid var(--hd-hair)",
                }}
              >
                <div
                  style={{
                    width: 72, height: 72, borderRadius: 999,
                    background: "var(--hd-mint-bg)", color: "var(--hd-moss)",
                    margin: "0 auto 18px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >{Ico.camera({ width: 30, height: 30 })}</div>
                <div className="hd-serif" style={{ fontSize: 17, marginBottom: 6 }}>
                  まだ保存したコスメはありません
                </div>
                <p
                  style={{
                    fontSize: 12, color: "var(--hd-ink-60)",
                    marginTop: 0, marginBottom: 18,
                    fontFamily: "var(--hd-sans)",
                  }}
                >コスメをスキャンして登録しましょう</p>
                <Link
                  href="/scan"
                  className="hd-cta"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    textDecoration: "none", fontSize: 14,
                  }}
                >
                  <CameraIcon size={16} color="white" /> スキャンを始める
                </Link>
              </div>
            ) : (
              <>
                {/* Photo Grid View */}
                {viewMode === "photo" && (
                  <div className="hd-stagger" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {filtered.length === 0 && (
                      <div
                        style={{
                          gridColumn: "span 2",
                          padding: "44px 24px", textAlign: "center",
                          background: "var(--hd-surface)", borderRadius: 18,
                          border: "1px solid var(--hd-hair)",
                        }}
                      >
                        <div className="hd-serif" style={{ fontSize: 16, marginBottom: 4 }}>
                          該当する製品がありません
                        </div>
                        <div style={{ fontSize: 12, color: "var(--hd-ink-60)", fontFamily: "var(--hd-sans)" }}>
                          フィルターを変更してみましょう
                        </div>
                      </div>
                    )}
                    {filtered.map((p) => {
                      const genre = getGenreByKey(p.productType || "other");
                      const isSelected = selectedIds.has(p.id);
                      return (
                        <div
                          key={p.id}
                          style={{
                            background: "var(--hd-surface)",
                            overflow: "hidden",
                            border: isSelected ? "2px solid var(--hd-ink)" : "1px solid var(--hd-hair)",
                            cursor: "pointer", position: "relative",
                            opacity: deletingId === p.id ? 0.5 : 1,
                          }}
                          onClick={() => editMode ? toggleSelect(p.id) : router.push(`/product/${p.id}`)}
                        >
                          {editMode && (
                            <div
                              style={{
                                position: "absolute", top: 10, left: 10, zIndex: 10,
                                width: 26, height: 26, borderRadius: 999,
                                background: isSelected ? "var(--hd-moss)" : "rgba(255,255,255,0.95)",
                                color: isSelected ? "#fff" : "var(--hd-ink-40)",
                                border: isSelected ? "none" : "1.5px solid var(--hd-line)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                              }}
                            >
                              {isSelected && Ico.check({ width: 12, height: 12, strokeWidth: 2.5 })}
                            </div>
                          )}
                          <div style={{ position: "relative", aspectRatio: "1/1", overflow: "hidden" }}>
                            {p.packageImage && !failedImageIds.has(p.id) ? (
                              <Image
                                src={p.packageImageThumb ?? p.packageImage}
                                alt={p.name}
                                fill
                                style={{ objectFit: "cover" }}
                                sizes="(max-width:430px) 50vw, 200px"
                                loading="lazy"
                                onError={() => setFailedImageIds((prev) => new Set(prev).add(p.id))}
                              />
                            ) : (
                              <div
                                style={{
                                  width: "100%", height: "100%",
                                  background: "var(--hd-mint-bg)",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                }}
                              >
                                {genre ? <ProductGenreIcon genre={genre.key} size={36} /> : <span style={{ fontSize: 30 }}>📦</span>}
                              </div>
                            )}
                            {editMode && p.packageImage && !failedImageIds.has(p.id) && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteImage(p.id); }}
                                disabled={deletingImageId === p.id}
                                style={{
                                  position: "absolute", top: 10, right: 10,
                                  borderRadius: 999, padding: "5px 9px",
                                  background: "rgba(0,0,0,0.65)", color: "#fff",
                                  border: "none", cursor: "pointer",
                                  display: "flex", alignItems: "center", gap: 4,
                                  fontFamily: "var(--hd-sans)", fontSize: 10, fontWeight: 600,
                                }}
                                title="写真を削除"
                              >
                                {deletingImageId === p.id ? "..." : "写真削除"}
                              </button>
                            )}
                            {!editMode && (
                              <div style={{ position: "absolute", top: 8, right: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleToggleFavorite(p.id, p.isFavorite); }}
                                  aria-label={p.isFavorite ? "お気に入り解除" : "お気に入り追加"}
                                  style={{
                                    width: 28, height: 28,
                                    background: p.isFavorite ? "var(--hd-ink)" : "rgba(255,255,255,0.92)",
                                    color: p.isFavorite ? "var(--hd-bg)" : "var(--hd-ink)",
                                    border: p.isFavorite ? "none" : "1px solid var(--hd-ink)",
                                    cursor: "pointer", padding: 0,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                  }}
                                >
                                  <StarIcon size={11} color={p.isFavorite ? "currentColor" : "currentColor"} filled={p.isFavorite} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setShareImageBase64(undefined); setShareProduct(p); generateProductShareImage(p).then(setShareImageBase64).catch(() => {}); }}
                                  style={{
                                    width: 28, height: 28,
                                    background: "rgba(255,255,255,0.92)",
                                    border: "1px solid var(--hd-ink)",
                                    cursor: "pointer", padding: 0,
                                    color: "var(--hd-ink)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                  }}
                                  title="Xに投稿"
                                  aria-label="Xに投稿"
                                >
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                  </svg>
                                </button>
                              </div>
                            )}
                            {genre && (
                              <div
                                className="hd-mono hd-caps"
                                style={{
                                  position: "absolute", bottom: 8, left: 8,
                                  background: "rgba(255,255,255,0.92)",
                                  padding: "3px 8px",
                                  color: "var(--hd-ink)",
                                  border: "1px solid var(--hd-hair)",
                                }}
                              >
                                {genre.label}
                              </div>
                            )}
                          </div>
                          <div style={{ padding: "12px 12px 14px" }}>
                            {editMode && editingNameId === p.id ? (
                              <div style={{ display: "flex", gap: 4, marginBottom: 4 }} onClick={(e) => e.stopPropagation()}>
                                <input
                                  autoFocus
                                  value={editNameValue}
                                  onChange={(e) => setEditNameValue(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === "Enter") handleNameSave(p.id); if (e.key === "Escape") setEditingNameId(null); }}
                                  style={{
                                    flex: 1, fontSize: 12, fontWeight: 600,
                                    border: "1px solid var(--hd-line)", borderRadius: 8,
                                    padding: "4px 8px", fontFamily: "var(--hd-sans)",
                                    background: "var(--hd-bg)", outline: "none", minWidth: 0,
                                  }}
                                />
                                <button
                                  onClick={() => handleNameSave(p.id)}
                                  style={{
                                    fontSize: 10, padding: "4px 8px", borderRadius: 8,
                                    background: "var(--hd-moss)", color: "#fff",
                                    border: "none", cursor: "pointer", flexShrink: 0,
                                    fontFamily: "var(--hd-sans)",
                                  }}
                                >保存</button>
                              </div>
                            ) : (
                              <>
                                <div
                                  className="hd-mono hd-caps"
                                  style={{
                                    color: "var(--hd-ink-40)",
                                    marginBottom: 4,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {p.brand}
                                </div>
                                <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                                  <div
                                    className="hd-serif"
                                    style={{
                                      fontSize: 13,
                                      lineHeight: 1.3,
                                      letterSpacing: "-0.01em",
                                      flex: 1,
                                      display: "-webkit-box",
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: "vertical",
                                      overflow: "hidden",
                                    }}
                                  >
                                    {p.name}
                                  </div>
                                  {editMode && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setEditNameValue(p.name); setEditingNameId(p.id); }}
                                      aria-label="名前を編集"
                                      style={{
                                        flexShrink: 0, width: 22, height: 22,
                                        background: "var(--hd-surface-2)",
                                        border: "1px solid var(--hd-hair)",
                                        cursor: "pointer", fontSize: 10,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                      }}
                                    >✏️</button>
                                  )}
                                </div>
                              </>
                            )}
                            {!editMode && (() => {
                              const cats = new Set<CategoryKey>();
                              p.ingredients.forEach((pi) => {
                                const ing = getIngredientById(pi.ingredientId);
                                if (ing?.activeIngredient) ing.categories.forEach((c) => cats.add(c));
                              });
                              const catArr = Array.from(cats).slice(0, 4);
                              return catArr.length > 0 ? (
                                <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                                  {catArr.map((catKey) => {
                                    const info = ACTIVE_CATEGORIES.find((c) => c.key === catKey);
                                    return info ? (
                                      <span
                                        key={catKey}
                                        style={{
                                          width: 18, height: 18, borderRadius: 999,
                                          background: info.color + "20", color: info.color,
                                          display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                        }}
                                        title={info.label}
                                      >
                                        <ActiveCategoryIcon category={info.key} size={10} />
                                      </span>
                                    ) : null;
                                  })}
                                </div>
                              ) : null;
                            })()}
                          </div>
                          {editMode && (
                            <div style={{ padding: "0 12px 12px" }} onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setEditingGenreId(editingGenreId === p.id ? null : p.id)}
                                style={{
                                  width: "100%", padding: "8px 0", borderRadius: 8,
                                  fontSize: 10, fontWeight: 600, border: "none",
                                  background: "var(--hd-surface-2)", color: "var(--hd-ink-60)",
                                  cursor: "pointer", fontFamily: "var(--hd-sans)",
                                }}
                              >カテゴリ変更</button>
                              {editingGenreId === p.id && (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                                  {PRODUCT_GENRES.filter((g) => g.key !== "other").map((g) => (
                                    <button
                                      key={g.key}
                                      onClick={() => { handleGenreChange(p.id, g.key); setEditingGenreId(null); }}
                                      style={{
                                        fontSize: 9, padding: "4px 10px", borderRadius: 999,
                                        background: p.productType === g.key ? "var(--hd-moss)" : "transparent",
                                        color: p.productType === g.key ? "#fff" : "var(--hd-ink-60)",
                                        border: p.productType === g.key ? "none" : "1px solid var(--hd-hair)",
                                        cursor: "pointer", fontFamily: "var(--hd-sans)",
                                        display: "inline-flex", alignItems: "center", gap: 4,
                                      }}
                                    >
                                      <ProductGenreIcon genre={g.key} size={10} />
                                      {g.label}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* List View */}
                {viewMode === "list" && (
                  <div className="hd-stagger" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {filtered.length === 0 && (
                      <div
                        style={{
                          padding: "44px 24px", textAlign: "center",
                          background: "var(--hd-surface)", borderRadius: 18,
                          border: "1px solid var(--hd-hair)",
                        }}
                      >
                        <div className="hd-serif" style={{ fontSize: 16, marginBottom: 4 }}>
                          該当する製品がありません
                        </div>
                      </div>
                    )}
                    {filtered.map((p) => {
                      const genre = getGenreByKey(p.productType || "other");
                      const isSelected = selectedIds.has(p.id);
                      return (
                        <div key={p.id} style={{ opacity: deletingId === p.id ? 0.5 : 1 }}>
                          <div
                            onClick={() => editMode ? toggleSelect(p.id) : router.push(`/product/${p.id}`)}
                            style={{
                              display: "flex", alignItems: "center", gap: 12,
                              padding: "10px 12px",
                              background: "var(--hd-surface)", borderRadius: 14,
                              border: isSelected ? "2px solid var(--hd-moss)" : "1px solid var(--hd-hair)",
                              cursor: "pointer",
                            }}
                          >
                            {editMode && (
                              <div
                                style={{
                                  width: 22, height: 22, borderRadius: 999,
                                  background: isSelected ? "var(--hd-moss)" : "transparent",
                                  color: isSelected ? "#fff" : "var(--hd-ink-40)",
                                  border: isSelected ? "none" : "1.5px solid var(--hd-line)",
                                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                }}
                              >
                                {isSelected && Ico.check({ width: 11, height: 11, strokeWidth: 2.5 })}
                              </div>
                            )}
                            <div style={{ width: 50, height: 50, borderRadius: 10, overflow: "hidden", flexShrink: 0, position: "relative" }}>
                              {p.packageImage ? (
                                <Image src={p.packageImageThumb ?? p.packageImage} alt={p.name} fill style={{ objectFit: "cover" }} sizes="50px" loading="lazy" />
                              ) : (
                                <div
                                  style={{
                                    width: "100%", height: "100%",
                                    background: "var(--hd-mint-bg)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                  }}
                                >
                                  {genre ? <ProductGenreIcon genre={genre.key} size={20} /> : <span>📦</span>}
                                </div>
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              {editMode && editingNameId === p.id ? (
                                <div style={{ display: "flex", gap: 4 }} onClick={(e) => e.stopPropagation()}>
                                  <input
                                    autoFocus
                                    value={editNameValue}
                                    onChange={(e) => setEditNameValue(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") handleNameSave(p.id); if (e.key === "Escape") setEditingNameId(null); }}
                                    style={{
                                      flex: 1, fontSize: 12, fontWeight: 600,
                                      border: "1px solid var(--hd-line)", borderRadius: 8,
                                      padding: "4px 8px", fontFamily: "var(--hd-sans)",
                                      background: "var(--hd-bg)", outline: "none", minWidth: 0,
                                    }}
                                  />
                                  <button
                                    onClick={() => handleNameSave(p.id)}
                                    style={{
                                      fontSize: 10, padding: "4px 8px", borderRadius: 8,
                                      background: "var(--hd-moss)", color: "#fff",
                                      border: "none", cursor: "pointer", flexShrink: 0,
                                      fontFamily: "var(--hd-sans)",
                                    }}
                                  >保存</button>
                                </div>
                              ) : (
                                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                  <div
                                    style={{
                                      fontSize: 13, fontWeight: 500,
                                      fontFamily: "var(--hd-sans)", lineHeight: 1.35,
                                      flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                    }}
                                  >{p.name}</div>
                                  {editMode && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setEditNameValue(p.name); setEditingNameId(p.id); }}
                                      style={{
                                        flexShrink: 0, width: 22, height: 22, borderRadius: 6,
                                        background: "var(--hd-surface-2)",
                                        border: "none", cursor: "pointer", fontSize: 10,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                      }}
                                    >✏️</button>
                                  )}
                                </div>
                              )}
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                                <span style={{ fontSize: 11, color: "var(--hd-ink-60)", fontFamily: "var(--hd-sans)" }}>
                                  {p.brand}
                                </span>
                                {genre && (
                                  <span
                                    style={{
                                      fontSize: 10, fontWeight: 600,
                                      padding: "2px 8px", borderRadius: 999,
                                      background: `${genre.color}15`, color: genre.color,
                                      fontFamily: "var(--hd-sans)",
                                    }}
                                  >{genre.label}</span>
                                )}
                              </div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                              {editMode ? (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setEditingGenreId(editingGenreId === p.id ? null : p.id); }}
                                  style={{
                                    fontSize: 10, padding: "5px 10px", borderRadius: 999,
                                    border: "none", background: "var(--hd-surface-2)", color: "var(--hd-ink-60)",
                                    cursor: "pointer", fontFamily: "var(--hd-sans)",
                                  }}
                                >変更</button>
                              ) : (
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleToggleFavorite(p.id, p.isFavorite); }}
                                    style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0 }}
                                  >
                                    {p.isFavorite ? <StarIcon size={14} color="#F59E0B" filled /> : <StarIcon size={14} color="#BDBDBD" />}
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setShareImageBase64(undefined); setShareProduct(p); generateProductShareImage(p).then(setShareImageBase64).catch(() => {}); }}
                                    style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0 }}
                                    title="Xに投稿"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#1DA1F2">
                                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                    </svg>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          {editMode && editingGenreId === p.id && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6, padding: "0 12px" }}>
                              {PRODUCT_GENRES.filter((g) => g.key !== "other").map((g) => (
                                <button
                                  key={g.key}
                                  onClick={() => { handleGenreChange(p.id, g.key); setEditingGenreId(null); }}
                                  style={{
                                    fontSize: 9, padding: "4px 10px", borderRadius: 999,
                                    background: p.productType === g.key ? "var(--hd-moss)" : "transparent",
                                    color: p.productType === g.key ? "#fff" : "var(--hd-ink-60)",
                                    border: p.productType === g.key ? "none" : "1px solid var(--hd-hair)",
                                    cursor: "pointer", fontFamily: "var(--hd-sans)",
                                    display: "inline-flex", alignItems: "center", gap: 4,
                                  }}
                                >
                                  <ProductGenreIcon genre={g.key} size={10} />
                                  {g.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            <Disclaimer />

            {/* Off-screen capture area for sharing */}
            <div
              ref={captureRef}
              style={{
                position: "absolute", left: -9999, top: 0,
                width: 360, height: 360, overflow: "hidden",
                borderRadius: 20, padding: 16, background: "var(--hd-bg)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 16, fontWeight: 700 }}>⭐ お気に入りコスメ</span>
                <span
                  style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 999,
                    fontWeight: 600, background: "#FFF8E1", color: "#F59E0B",
                  }}
                >{favCount}件</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {products.filter((p) => p.isFavorite).slice(0, 4).map((p) => {
                  const genre = getGenreByKey(p.productType || "other");
                  return (
                    <div
                      key={p.id}
                      style={{
                        background: "#fff", border: "2px solid #F59E0B",
                        borderRadius: 14, overflow: "hidden",
                      }}
                    >
                      <div style={{ position: "relative", width: "100%", aspectRatio: "1/1" }}>
                        {p.packageImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.packageImage} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        ) : (
                          <div
                            style={{
                              width: "100%", height: "100%",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 30, background: "var(--hd-mint-bg)",
                            }}
                          >{genre?.icon || "📦"}</div>
                        )}
                      </div>
                      <div style={{ padding: "4px 8px" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: 9, color: "var(--hd-ink-60)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.brand}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {shareProduct && (
          <ShareModal
            text={shareMyCosmetic(
              shareProduct,
              shareProduct.ingredients
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((pi) => getIngredientById(pi.ingredientId)?.nameJa)
                .filter((n): n is string => !!n)
            )}
            onClose={() => { setShareProduct(null); setShareImageBase64(undefined); }}
            imageBase64={shareImageBase64}
          />
        )}

        <ScrollToTop />
      </div>
    </AuthGuard>
  );
}
