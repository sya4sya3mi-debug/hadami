"use client";

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
import { StarIcon } from "@/components/ui/Icons";
import { deleteProductFromDb, updateProductImageInDb, deleteProductImageFromDb, updateProductTypeInDb, toggleFavoriteInDb, updateProductNameInDb } from "@/lib/db";
import { PRODUCT_GENRES, getGenreByKey } from "@/lib/productGenres";
import dynamic from "next/dynamic";
const ShareModal = dynamic(() => import("@/components/ui/ShareModal"), { ssr: false });
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  const DISPLAY_GENRES = ["toner", "serum", "emulsion", "cream", "sunscreen", "mask_pack"];

  const { favCount, filtered, activeGenres } = useMemo(() => {
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
    const activeGenres = PRODUCT_GENRES.filter((g) => DISPLAY_GENRES.includes(g.key) && genreCountsMap[g.key]);
    return { favCount, filtered, activeGenres };
  }, [products, activeFilter, favOnly, DISPLAY_GENRES]);

  if (loading) return null;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCameraCapture = (productId: string) => {
    pendingProductIdRef.current = productId;
    cameraInputRef.current?.click();
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handlePhotoUpdate = (productId: string) => {
    pendingProductIdRef.current = productId;
    fileInputRef.current?.click();
  };

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
      const { error, imageUrl } = await updateProductImageInDb(supabase, user.id, productId, imageBase64);
      if (error) { setImageError(`保存に失敗しました: ${error}`); }
      else if (imageUrl) {
        const imagePath = getProductImagePath(user.id, productId);
        const thumbPath = getProductImageThumbPath(user.id, productId);
        const signedImages = await getSignedImageUrls(supabase, [imagePath, thumbPath]);
        updateProductImage(
          productId,
          signedImages[imagePath] ?? imageUrl,
          imagePath,
          signedImages[thumbPath] ?? signedImages[imagePath] ?? imageUrl,
          thumbPath
        );
      }
      setUpdatingImageId(null);
    };
    reader.readAsDataURL(file);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  return (
    <AuthGuard>
      <div className="min-h-screen bg-bo-cream">
        <div className="px-5 pt-4 pb-6">
          {/* Header */}
          <div className="mb-5">
            <div className="flex justify-between items-center">
              <p className="text-xs text-bo-ink-muted font-sans m-0">
                スキャン済みコスメを管理
              </p>
              <div className="flex items-center gap-2">
                {editMode && selectedIds.size > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="px-3.5 py-2 rounded-r1 text-[11px] font-bold border-none cursor-pointer font-sans
                               bg-red-500 text-white shadow-bo1 pressable"
                  >
                    {selectedIds.size}件削除
                  </button>
                )}
                {products.length > 0 && (
                  <button
                    onClick={() => { setEditMode(!editMode); setEditingGenreId(null); setSelectedIds(new Set()); setEditingNameId(null); }}
                    className={`px-3.5 py-2 rounded-r1 text-[11px] font-bold border-none cursor-pointer font-sans pressable ${
                      editMode ? "bg-bo-accent text-white shadow-bo-accent" : "bg-white text-bo-ink-muted shadow-bo1"
                    }`}
                  >
                    {editMode ? "完了" : "編集"}
                  </button>
                )}
                {/* View mode toggle — Apple segmented control mini */}
                <div className="relative flex bg-white rounded-[10px] p-[3px] shadow-bo1">
                  <div
                    className="absolute top-[3px] bottom-[3px] w-[calc(50%-1.5px)] rounded-[8px] bg-bo-accent shadow-bo-accent transition-transform duration-200 ease-out"
                    style={{ transform: viewMode === "list" ? "translateX(100%)" : "translateX(0)" }}
                  />
                  <button
                    onClick={() => setViewMode("photo")}
                    className={`relative z-10 w-8 h-7 rounded-lg border-none flex items-center justify-center cursor-pointer transition-colors ${
                      viewMode === "photo" ? "text-white" : "text-bo-ink-faint"
                    }`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`relative z-10 w-8 h-7 rounded-lg border-none flex items-center justify-center cursor-pointer transition-colors ${
                      viewMode === "list" ? "text-white" : "text-bo-ink-faint"
                    }`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                      <circle cx="3.5" cy="6" r="1.5" /><circle cx="3.5" cy="12" r="1.5" /><circle cx="3.5" cy="18" r="1.5" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
          {imageError && (
            <div className="flex items-start gap-2.5 mb-4 px-4 py-3 rounded-r2 bg-white shadow-bo1 border border-red-100">
              <span className="text-base shrink-0">⚠️</span>
              <span className="text-xs text-red-500 font-sans">{imageError}</span>
            </div>
          )}

          {/* Filters */}
          <div className="flex items-center gap-2 mb-5">
            <button
              onClick={() => setFavOnly(!favOnly)}
              className={`flex items-center gap-1.5 py-2 px-3.5 rounded-r1 border-none text-xs font-semibold font-sans cursor-pointer shrink-0 pressable ${
                favOnly ? "bg-bo-accent text-white shadow-bo-accent" : "bg-white text-bo-ink-muted shadow-bo1"
              }`}
            >
              <StarIcon size={12} color={favOnly ? "#fff" : "#F59E0B"} filled={favOnly} /> お気に入り
            </button>
            <div className="flex gap-1.5 overflow-x-auto hide-scrollbar flex-1"
                 style={{ WebkitOverflowScrolling: "touch" }}>
              <button
                onClick={() => setActiveFilter("all")}
                className={`py-2 px-3 rounded-r1 border-none text-[11px] font-semibold font-sans cursor-pointer whitespace-nowrap shrink-0 pressable ${
                  activeFilter === "all" ? "bg-bo-accent text-white shadow-bo-accent" : "bg-white text-bo-ink-muted shadow-bo1"
                }`}
              >
                すべて
              </button>
              {activeGenres.map((g) => (
                <button
                  key={g.key}
                  onClick={() => setActiveFilter(g.key)}
                  className={`py-2 px-3 rounded-r1 border-none text-[11px] font-semibold font-sans cursor-pointer whitespace-nowrap shrink-0 pressable ${
                    activeFilter === g.key ? "bg-bo-accent text-white shadow-bo-accent" : "bg-white text-bo-ink-muted shadow-bo1"
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    <ProductGenreIcon genre={g.key} size={12} />
                    {g.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-14 rounded-r2 bg-white shadow-bo1">
              <div className="w-16 h-16 rounded-[20px] mx-auto mb-4 flex items-center justify-center text-3xl
                              bg-gradient-to-br from-bo-accent-soft to-[#D4F5EF]
                              shadow-[0_6px_20px_rgba(58,143,122,0.12)]">
                📸
              </div>
              <div className="text-sm font-bold text-bo-ink font-sans mb-1">まだ保存したコスメはありません</div>
              <div className="text-xs text-bo-ink-muted font-sans mb-5">コスメをスキャンして登録しましょう</div>
              <Link
                href="/scan"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-r2 text-sm font-bold text-white bg-bo-accent
                           no-underline shadow-bo-accent pressable font-sans"
              >
                📷 スキャンを始める
              </Link>
            </div>
          ) : (
            <>
              {/* Photo Grid View */}
              {viewMode === "photo" && (
                <div className="grid grid-cols-2 gap-3">
                  {filtered.length === 0 && (
                    <div className="col-span-2 py-12 px-5 text-center rounded-r2 bg-white shadow-bo1">
                      <div className="w-14 h-14 rounded-[18px] mx-auto mb-3 flex items-center justify-center text-2xl
                                      bg-gradient-to-br from-bo-accent-soft to-[#D4F5EF]">
                        🔍
                      </div>
                      <div className="text-sm font-bold text-bo-ink font-sans mb-1">該当する製品がありません</div>
                      <div className="text-xs text-bo-ink-muted font-sans">フィルターを変更してみましょう</div>
                    </div>
                  )}
                  {filtered.map((p, i) => {
                    const genre = getGenreByKey(p.productType || "other");
                    const isSelected = selectedIds.has(p.id);
                    return (
                      <div
                        key={p.id}
                        className={`rounded-r2 overflow-hidden bg-white shadow-bo1 cursor-pointer animate-fade-up
                                    transition-all duration-200 relative pressable ${
                          isSelected ? "ring-2 ring-bo-accent shadow-bo-accent" : ""
                        }`}
                        style={{ animationDelay: i * 50 + "ms", opacity: deletingId === p.id ? 0.5 : undefined }}
                        onClick={() => editMode ? toggleSelect(p.id) : router.push(`/product/${p.id}`)}
                      >
                        {editMode && (
                          <div className={`absolute top-2.5 left-2.5 z-10 w-6 h-6 rounded-[8px] border-2 flex items-center justify-center text-xs font-bold
                                          shadow-[0_2px_8px_rgba(0,0,0,0.15)] ${
                            isSelected ? "bg-bo-accent border-bo-accent text-white" : "bg-white/90 backdrop-blur-sm border-white/60"
                          }`}>
                            {isSelected && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
                                <path d="M20 6L9 17l-5-5"/>
                              </svg>
                            )}
                          </div>
                        )}
                        <div>
                          <div className="relative aspect-square overflow-hidden">
                            {p.packageImage ? (
                              <Image src={p.packageImageThumb ?? p.packageImage} alt={p.name} fill className="object-cover" sizes="(max-width:430px) 50vw, 200px" loading="lazy" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-bo-accent-soft to-bo-parchment flex items-center justify-center">
                                {genre ? <ProductGenreIcon genre={genre.key} size={36} /> : <span className="text-3xl">📦</span>}
                              </div>
                            )}
                            {!editMode && (
                              <div className="absolute top-2 right-2 flex flex-col gap-1.5">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleToggleFavorite(p.id, p.isFavorite); }}
                                  className="w-8 h-8 rounded-[10px] bg-white/80 backdrop-blur-lg flex items-center justify-center
                                             text-sm border-none cursor-pointer p-0 pressable shadow-bo1"
                                >
                                  {p.isFavorite ? <StarIcon size={14} color="#F59E0B" filled /> : <StarIcon size={14} color="#BDBDBD" />}
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setShareImageBase64(undefined); setShareProduct(p); generateProductShareImage(p).then(setShareImageBase64).catch(() => {}); }}
                                  className="w-8 h-8 rounded-[10px] bg-white/80 backdrop-blur-lg flex items-center justify-center
                                             border-none cursor-pointer p-0 pressable shadow-bo1"
                                  title="Xに投稿"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#1DA1F2">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                  </svg>
                                </button>
                              </div>
                            )}
                            {genre && (
                              <div className="absolute bottom-2 left-2 bg-white/85 backdrop-blur-lg rounded-[8px] py-1 px-2 text-[9px] font-bold font-sans
                                              inline-flex items-center gap-1"
                                   style={{ color: genre.color }}>
                                <ProductGenreIcon genre={genre.key} size={10} />
                                {genre.label}
                              </div>
                            )}
                          </div>
                          <div className="py-3 px-3">
                            {editMode && editingNameId === p.id ? (
                              <div className="flex gap-1 mb-1" onClick={(e) => e.stopPropagation()}>
                                <input
                                  autoFocus
                                  value={editNameValue}
                                  onChange={(e) => setEditNameValue(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === "Enter") handleNameSave(p.id); if (e.key === "Escape") setEditingNameId(null); }}
                                  className="flex-1 text-xs font-bold border-none rounded-r1 px-2 py-1 font-sans text-bo-ink bg-bo-cream outline-none min-w-0
                                             focus:ring-2 focus:ring-bo-accent/30"
                                />
                                <button onClick={() => handleNameSave(p.id)} className="text-[10px] px-2.5 py-1 rounded-r1 bg-bo-accent text-white border-none cursor-pointer font-sans shrink-0 pressable">保存</button>
                              </div>
                            ) : (
                              <div className="flex items-start gap-1 mb-1">
                                <div className="text-xs font-bold text-bo-ink font-sans leading-snug line-clamp-2 flex-1">{p.name}</div>
                                {editMode && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setEditNameValue(p.name); setEditingNameId(p.id); }}
                                    className="shrink-0 w-6 h-6 rounded-[8px] bg-bo-cream flex items-center justify-center border-none cursor-pointer text-[10px]"
                                  >
                                    ✏️
                                  </button>
                                )}
                              </div>
                            )}
                            <div className="text-[10px] text-bo-ink-muted font-sans">{p.brand}</div>
                            {/* Category icons */}
                            {!editMode && (() => {
                              const cats = new Set<CategoryKey>();
                              p.ingredients.forEach((pi) => {
                                const ing = getIngredientById(pi.ingredientId);
                                if (ing?.activeIngredient) ing.categories.forEach((c) => cats.add(c));
                              });
                              const catArr = Array.from(cats).slice(0, 4);
                              return catArr.length > 0 ? (
                                <div className="flex gap-1 mt-1.5 overflow-hidden">
                                  {catArr.map((catKey) => {
                                    const info = ACTIVE_CATEGORIES.find((c) => c.key === catKey);
                                    return info ? (
                                      <span
                                        key={catKey}
                                        className="w-5 h-5 rounded-full inline-flex items-center justify-center shrink-0"
                                        style={{ background: info.color + "20", color: info.color }}
                                        title={info.label}
                                      >
                                        <ActiveCategoryIcon category={info.key} size={11} />
                                      </span>
                                    ) : null;
                                  })}
                                </div>
                              ) : null;
                            })()}
                          </div>
                        </div>
                        {editMode && (
                          <div className="px-3 pb-3" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setEditingGenreId(editingGenreId === p.id ? null : p.id)}
                              className="w-full py-2 rounded-r1 text-[10px] font-semibold border-none bg-bo-cream text-bo-ink-muted cursor-pointer font-sans pressable"
                            >
                              カテゴリ変更
                            </button>
                            {editingGenreId === p.id && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {PRODUCT_GENRES.filter((g) => g.key !== "other").map((g) => (
                                  <button
                                    key={g.key}
                                    onClick={() => { handleGenreChange(p.id, g.key); setEditingGenreId(null); }}
                                    className={`text-[9px] py-1 px-2.5 rounded-r1 border-none cursor-pointer font-sans pressable ${
                                      p.productType === g.key ? "bg-bo-accent text-white shadow-bo-accent" : "bg-white text-bo-ink-muted shadow-bo1"
                                    }`}
                                  >
                                    <span className="inline-flex items-center gap-1">
                                      <ProductGenreIcon genre={g.key} size={11} />
                                      {g.label}
                                    </span>
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
                <div className="flex flex-col gap-2">
                  {filtered.length === 0 && (
                    <div className="py-12 px-5 text-center rounded-r2 bg-white shadow-bo1">
                      <div className="w-14 h-14 rounded-[18px] mx-auto mb-3 flex items-center justify-center text-2xl
                                      bg-gradient-to-br from-bo-accent-soft to-[#D4F5EF]">
                        🔍
                      </div>
                      <div className="text-sm font-bold text-bo-ink font-sans mb-1">該当する製品がありません</div>
                    </div>
                  )}
                  {filtered.map((p, i) => {
                    const genre = getGenreByKey(p.productType || "other");
                    const isSelected = selectedIds.has(p.id);
                    return (
                      <div
                        key={p.id}
                        className="animate-fade-up"
                        style={{ animationDelay: i * 40 + "ms", opacity: deletingId === p.id ? 0.5 : undefined }}
                      >
                        <div
                          onClick={() => editMode ? toggleSelect(p.id) : router.push(`/product/${p.id}`)}
                          className={`flex items-center gap-3 py-2.5 px-3 bg-white rounded-r2 shadow-bo1 cursor-pointer pressable ${
                            isSelected ? "ring-2 ring-bo-accent shadow-bo-accent" : ""
                          }`}
                        >
                          {editMode && (
                            <div className={`w-6 h-6 rounded-[8px] border-2 flex items-center justify-center text-xs font-bold shrink-0 ${
                              isSelected ? "bg-bo-accent border-bo-accent text-white" : "bg-white border-bo-ink-faint/40"
                            }`}>
                              {isSelected && (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
                                  <path d="M20 6L9 17l-5-5"/>
                                </svg>
                              )}
                            </div>
                          )}
                          <div className="w-11 h-11 rounded-r1 overflow-hidden shrink-0 relative shadow-bo1">
                            {p.packageImage ? (
                              <Image src={p.packageImageThumb ?? p.packageImage} alt={p.name} fill className="object-cover" sizes="44px" loading="lazy" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-bo-accent-soft to-bo-parchment flex items-center justify-center">
                                {genre ? <ProductGenreIcon genre={genre.key} size={18} /> : <span className="text-base">📦</span>}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            {editMode && editingNameId === p.id ? (
                              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                <input
                                  autoFocus
                                  value={editNameValue}
                                  onChange={(e) => setEditNameValue(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === "Enter") handleNameSave(p.id); if (e.key === "Escape") setEditingNameId(null); }}
                                  className="flex-1 text-xs font-bold border-none rounded-r1 px-2 py-1 font-sans text-bo-ink bg-bo-cream outline-none min-w-0
                                             focus:ring-2 focus:ring-bo-accent/30"
                                />
                                <button onClick={() => handleNameSave(p.id)} className="text-[10px] px-2.5 rounded-r1 bg-bo-accent text-white border-none cursor-pointer font-sans shrink-0 pressable">保存</button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <div className="text-sm font-bold text-bo-ink font-sans leading-snug line-clamp-1 flex-1">{p.name}</div>
                                {editMode && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setEditNameValue(p.name); setEditingNameId(p.id); }}
                                    className="shrink-0 w-6 h-6 rounded-[8px] bg-bo-cream flex items-center justify-center border-none cursor-pointer text-[10px]"
                                  >
                                    ✏️
                                  </button>
                                )}
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-bo-ink-muted font-sans">{p.brand}</span>
                              {genre && (
                                <span className="text-[9px] font-semibold py-0.5 px-2 rounded-md font-sans"
                                      style={{ background: `${genre.color}15`, color: genre.color }}>
                                  {genre.label}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            {editMode ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditingGenreId(editingGenreId === p.id ? null : p.id); }}
                                className="text-[10px] py-1.5 px-2.5 rounded-r1 border-none bg-bo-cream text-bo-ink-muted cursor-pointer font-sans pressable"
                              >
                                変更
                              </button>
                            ) : (
                              <>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleFavorite(p.id, p.isFavorite);
                                    }}
                                    className="text-sm border-none bg-transparent cursor-pointer p-0 pressable"
                                  >
                                    {p.isFavorite ? <StarIcon size={14} color="#F59E0B" filled /> : <StarIcon size={14} color="#BDBDBD" />}
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setShareImageBase64(undefined); setShareProduct(p); generateProductShareImage(p).then(setShareImageBase64).catch(() => {}); }}
                                    className="border-none bg-transparent cursor-pointer p-0 pressable"
                                    title="Xに投稿"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#1DA1F2">
                                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                    </svg>
                                  </button>
                                </div>
                                {/* Category icons */}
                                {(() => {
                                  const cats = new Set<CategoryKey>();
                                  p.ingredients.forEach((pi) => {
                                    const ing = getIngredientById(pi.ingredientId);
                                    if (ing?.activeIngredient) ing.categories.forEach((c) => cats.add(c));
                                  });
                                  const catArr = Array.from(cats).slice(0, 4);
                                  return catArr.length > 0 ? (
                                    <div className="flex gap-1">
                                      {catArr.map((catKey) => {
                                        const info = ACTIVE_CATEGORIES.find((c) => c.key === catKey);
                                        return info ? (
                                          <span
                                            key={catKey}
                                            className="w-5 h-5 rounded-full inline-flex items-center justify-center shrink-0"
                                            style={{ background: info.color + "20", color: info.color }}
                                            title={info.label}
                                          >
                                            <ActiveCategoryIcon category={info.key} size={11} />
                                          </span>
                                        ) : null;
                                      })}
                                    </div>
                                  ) : null;
                                })()}
                              </>
                            )}
                          </div>
                        </div>
                        {editMode && editingGenreId === p.id && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5 mb-1 px-3">
                            {PRODUCT_GENRES.filter((g) => g.key !== "other").map((g) => (
                              <button
                                key={g.key}
                                onClick={() => { handleGenreChange(p.id, g.key); setEditingGenreId(null); }}
                                className={`text-[9px] py-1 px-2.5 rounded-r1 border-none cursor-pointer font-sans pressable ${
                                  p.productType === g.key ? "bg-bo-accent text-white shadow-bo-accent" : "bg-white text-bo-ink-muted shadow-bo1"
                                }`}
                              >
                                <span className="inline-flex items-center gap-1">
                                  <ProductGenreIcon genre={g.key} size={11} />
                                  {g.label}
                                </span>
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

          {/* Capture area for sharing (off-screen) */}
          <div ref={captureRef} className="absolute -left-[9999px] top-0 w-[360px] h-[360px] overflow-hidden rounded-[20px] p-4 bg-bo-cream">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-base font-bold text-bo-ink">⭐ お気に入りコスメ</span>
              <span className="text-[11px] py-0.5 px-2 rounded-full font-semibold bg-[#FFF8E1] text-[#F59E0B]">{favCount}件</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {products.filter((p) => p.isFavorite).slice(0, 4).map((p) => {
                const genre = getGenreByKey(p.productType || "other");
                return (
                  <div key={p.id} className="bg-white border-2 border-[#F59E0B] rounded-[14px] overflow-hidden">
                    <div className="relative w-full aspect-square">
                      {p.packageImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.packageImage} alt={p.name} className="w-full h-full object-cover block" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-bo-accent-soft to-bo-parchment">
                          {genre?.icon || "📦"}
                        </div>
                      )}
                    </div>
                    <div className="py-1 px-2">
                      <div className="text-[10px] font-bold text-bo-ink leading-tight truncate">{p.name}</div>
                      <div className="text-[9px] text-bo-ink-muted mt-px truncate">{p.brand}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal（Canvas生成済み画像を直接渡す） */}
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
    </AuthGuard>
  );
}
