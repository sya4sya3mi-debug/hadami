"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useProductStore } from "@/stores/useProductStore";
import Disclaimer from "@/components/ui/Disclaimer";
import { useUser } from "@/lib/auth";
import PageLoading from "@/components/ui/PageLoading";
import AuthGuard from "@/components/ui/AuthGuard";
import Glass from "@/components/ui/Glass";
import ProductDetail from "@/components/ui/ProductDetail";
import { deleteProductFromDb, updateProductImageInDb, deleteProductImageFromDb, updateProductTypeInDb, toggleFavoriteInDb, updatePurchasedAtInDb } from "@/lib/db";
import { PRODUCT_GENRES, getGenreByKey } from "@/lib/productGenres";
import { ProductGenre, Product } from "@/types";

type ViewMode = "photo" | "list";

function Counter({ to, dur = 900 }: { to: number; dur?: number }) {
  const [v, setV] = useState(0);
  const ref = useRef<number>(0);
  const mounted = useRef(false);
  if (!mounted.current) {
    mounted.current = true;
    if (typeof window !== "undefined") {
      let s: number | undefined;
      const step = (t: number) => {
        if (s === undefined) s = t;
        const p = Math.min((t - s) / dur, 1);
        setV(Math.round(p * p * to));
        if (p < 1) ref.current = requestAnimationFrame(step);
      };
      ref.current = requestAnimationFrame(step);
    }
  }
  return <>{v}</>;
}

export default function HistoryPage() {
  const { user, supabase, loading } = useUser();
  const products = useProductStore((s) => s.products);
  const removeProduct = useProductStore((s) => s.removeProduct);
  const updateProductImage = useProductStore((s) => s.updateProductImage);
  const updateProductType = useProductStore((s) => s.updateProductType);
  const toggleFavorite = useProductStore((s) => s.toggleFavorite);
  const updatePurchasedAt = useProductStore((s) => s.updatePurchasedAt);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [updatingImageId, setUpdatingImageId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingProductIdRef = useRef<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | ProductGenre>("all");
  const [favOnly, setFavOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("photo");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editingGenreId, setEditingGenreId] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (loading) {
    return <PageLoading message="コスメ一覧を読み込んでいます..." />;
  }

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
      else if (imageUrl) { updateProductImage(productId, imageUrl); }
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
    else { updateProductImage(productId, ""); }
    setDeletingImageId(null);
  };

  const handleDelete = async (productId: string, productName: string) => {
    if (!user) return;
    if (!window.confirm(`「${productName}」を削除しますか？`)) return;
    setDeletingId(productId);
    const { error } = await deleteProductFromDb(supabase, user.id, productId);
    if (!error) { removeProduct(productId); }
    setDeletingId(null);
  };

  const handleToggleFavorite = async (productId: string, currentFav: boolean) => {
    if (!user) return;
    toggleFavorite(productId);
    try {
      await toggleFavoriteInDb(supabase, user.id, productId, !currentFav);
    } catch {
      toggleFavorite(productId); // rollback
    }
  };

  const handleUpdatePurchasedAt = async (productId: string, date: string | undefined) => {
    if (!user) return;
    const prev = products.find((p) => p.id === productId)?.purchasedAt;
    updatePurchasedAt(productId, date);
    if (selectedProduct?.id === productId) {
      setSelectedProduct({ ...selectedProduct, purchasedAt: date });
    }
    try {
      await updatePurchasedAtInDb(supabase, user.id, productId, date ?? null);
    } catch {
      updatePurchasedAt(productId, prev);
    }
  };

  const handleGenreChange = async (productId: string, newGenre: ProductGenre) => {
    if (!user) return;
    const prev = products.find((p) => p.id === productId)?.productType ?? "other";
    updateProductType(productId, newGenre);
    try {
      await updateProductTypeInDb(supabase, user.id, productId, newGenre);
    } catch {
      updateProductType(productId, prev); // rollback
    }
  };

  const favCount = products.filter((p) => p.isFavorite).length;
  const filtered = products
    .filter((p) => activeFilter === "all" || (p.productType || "other") === activeFilter)
    .filter((p) => !favOnly || p.isFavorite)
    .sort((a, b) => (a.isFavorite === b.isFavorite ? 0 : a.isFavorite ? -1 : 1));

  const genreCounts = products.reduce<Record<string, number>>((acc, p) => {
    const g = p.productType || "other";
    acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {});

  const activeGenres = PRODUCT_GENRES.filter((g) => genreCounts[g.key]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-bo-cream">
        <div className="px-4 pt-4 pb-6">
          {/* Header */}
          <div className="px-1 mb-5">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-extrabold font-serif text-bo-ink m-0 mb-1">マイコスメ</h1>
                <p className="text-xs text-bo-ink-muted font-sans m-0">{products.length}品 スキャン済み</p>
              </div>
              <div className="flex items-center gap-2">
                {products.length > 0 && (
                  <button
                    onClick={() => { setEditMode(!editMode); setEditingGenreId(null); }}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold border-none cursor-pointer font-sans ${editMode ? "bg-bo-accent text-white" : "bg-bo-parchment text-bo-ink-muted"}`}
                  >
                    {editMode ? "完了" : "編集"}
                  </button>
                )}
                <div className="flex bg-bo-parchment rounded-[10px] p-[3px] gap-0.5">
                  <button
                    onClick={() => setViewMode("photo")}
                    className={`w-8 h-7 rounded-lg border-none flex items-center justify-center cursor-pointer ${viewMode === "photo" ? "bg-white text-bo-ink shadow-bo1" : "bg-transparent text-bo-ink-faint"}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`w-8 h-7 rounded-lg border-none flex items-center justify-center cursor-pointer ${viewMode === "list" ? "bg-white text-bo-ink shadow-bo1" : "bg-transparent text-bo-ink-faint"}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                      <circle cx="3.5" cy="6" r="1.5" /><circle cx="3.5" cy="12" r="1.5" /><circle cx="3.5" cy="18" r="1.5" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2.5 mb-5 px-1">
            {[
              { n: products.length, label: "登録製品", icon: "📋" },
              { n: favCount, label: "お気に入り", icon: "❤️" },
              { n: activeGenres.length, label: "カテゴリ", icon: "📂" },
            ].map((s, i) => (
              <Glass key={i} className="py-3.5 px-2.5 text-center">
                <div className="text-[13px] mb-0.5">{s.icon}</div>
                <div className="text-xl font-black font-serif text-bo-accent leading-none">
                  <Counter to={s.n} />
                </div>
                <div className="text-[9px] text-bo-ink-muted font-sans mt-0.5">{s.label}</div>
              </Glass>
            ))}
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          {imageError && (
            <div className="mb-3 px-4 py-2 rounded-r1 text-xs text-center bg-bo-danger-bg text-bo-danger border border-bo-danger/20">
              {imageError}
            </div>
          )}

          {/* Filters */}
          <div className="flex items-center gap-2 mb-4 px-1">
            <button
              onClick={() => setFavOnly(!favOnly)}
              className={`flex items-center gap-1 py-[7px] px-3 rounded-full border-none text-[11px] font-semibold font-sans cursor-pointer shrink-0 ${favOnly ? "bg-bo-accent text-white shadow-bo2" : "bg-white text-bo-ink-muted shadow-bo1"}`}
            >
              {favOnly ? "❤️" : "🤍"} お気に入り
            </button>
            <div className="flex gap-1.5 overflow-x-auto hide-scrollbar flex-1">
              <button
                onClick={() => setActiveFilter("all")}
                className={`py-[7px] px-[11px] rounded-full border-none text-[10px] font-semibold font-sans cursor-pointer whitespace-nowrap shrink-0 ${activeFilter === "all" ? "bg-bo-ink text-white shadow-bo2" : "bg-white text-bo-ink-muted shadow-bo1"}`}
              >
                すべて
              </button>
              {activeGenres.map((g) => (
                <button
                  key={g.key}
                  onClick={() => setActiveFilter(g.key)}
                  className={`py-[7px] px-[11px] rounded-full border-none text-[10px] font-semibold font-sans cursor-pointer whitespace-nowrap shrink-0 ${activeFilter === g.key ? "bg-bo-ink text-white shadow-bo2" : "bg-white text-bo-ink-muted shadow-bo1"}`}
                >
                  {g.icon} {g.label}
                </button>
              ))}
            </div>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-14">
              <div className="w-14 h-14 rounded-2xl bg-bo-parchment mx-auto mb-3 flex items-center justify-center text-2xl">📸</div>
              <div className="text-[13px] font-semibold text-bo-ink-muted font-sans mb-1">まだ保存したコスメはありません</div>
              <div className="text-[11px] text-bo-ink-faint font-sans">コスメをスキャンして登録しましょう</div>
              <Link
                href="/scan"
                className="inline-block mt-4 px-6 py-2.5 rounded-full text-sm font-bold text-white bg-bo-accent no-underline shadow-bo-accent"
              >
                スキャンを始める →
              </Link>
            </div>
          ) : (
            <>
              {/* Photo Grid View */}
              {viewMode === "photo" && (
                <div className="grid grid-cols-2 gap-2.5 px-1">
                  {filtered.length === 0 && (
                    <div className="col-span-2 py-10 px-5 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-bo-parchment mx-auto mb-3 flex items-center justify-center text-2xl">📸</div>
                      <div className="text-[13px] font-semibold text-bo-ink-muted font-sans mb-1">該当する製品がありません</div>
                      <div className="text-[11px] text-bo-ink-faint font-sans">フィルターを変更してみましょう</div>
                    </div>
                  )}
                  {filtered.map((p, i) => {
                    const genre = getGenreByKey(p.productType || "other");
                    return (
                      <div
                        key={p.id}
                        className="rounded-r2 overflow-hidden bg-white border border-bo-parchment shadow-bo1 cursor-pointer animate-fade-up transition-transform duration-200 relative"
                        style={{ animationDelay: i * 50 + "ms", opacity: deletingId === p.id ? 0.5 : undefined }}
                      >
                        {editMode && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(p.id, p.name); }}
                            className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full bg-red-500 text-white border-none flex items-center justify-center text-xs font-bold cursor-pointer shadow-lg"
                          >
                            ✕
                          </button>
                        )}
                        <div onClick={() => !editMode && setSelectedProduct(p)}>
                          <div className="relative aspect-square bg-bo-parchment overflow-hidden">
                            {p.packageImage ? (
                              <Image src={p.packageImage} alt={p.name} fill className="object-cover" sizes="(max-width:430px) 50vw, 200px" loading="lazy" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-bo-accent-soft to-bo-parchment flex items-center justify-center text-3xl">
                                {genre?.icon || "📦"}
                              </div>
                            )}
                            {!editMode && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleFavorite(p.id, p.isFavorite);
                                }}
                                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/85 backdrop-blur-lg flex items-center justify-center text-[13px] border-none cursor-pointer p-0"
                              >
                                {p.isFavorite ? "❤️" : "🤍"}
                              </button>
                            )}
                            {genre && (
                              <div className="absolute bottom-2 left-2 bg-white/85 backdrop-blur-lg rounded-md py-0.5 px-2 text-[9px] font-bold text-bo-ink-soft font-sans">
                                {genre.label}
                              </div>
                            )}
                          </div>
                          <div className="py-2.5 px-3">
                            <div className="text-[11px] font-bold text-bo-ink font-sans leading-snug line-clamp-2 mb-1">
                              {p.name}
                            </div>
                            <div className="text-[10px] text-bo-ink-muted font-sans">{p.brand}</div>
                            {p.lastUsedAt && (
                              <div className="text-[9px] text-bo-accent font-sans mt-0.5">
                                {new Date(p.lastUsedAt).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })} 使用
                              </div>
                            )}
                          </div>
                        </div>
                        {editMode && (
                          <div className="px-3 pb-2.5">
                            <button
                              onClick={() => setEditingGenreId(editingGenreId === p.id ? null : p.id)}
                              className="w-full py-1.5 rounded-lg text-[10px] font-semibold border border-bo-parchment bg-bo-parchment text-bo-ink-muted cursor-pointer font-sans"
                            >
                              カテゴリ変更
                            </button>
                            {editingGenreId === p.id && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {PRODUCT_GENRES.filter((g) => g.key !== "other").map((g) => (
                                  <button
                                    key={g.key}
                                    onClick={() => { handleGenreChange(p.id, g.key); setEditingGenreId(null); }}
                                    className={`text-[9px] py-0.5 px-2 rounded-full border-none cursor-pointer font-sans ${p.productType === g.key ? "bg-bo-accent text-white" : "bg-white text-bo-ink-muted border border-bo-parchment"}`}
                                  >
                                    {g.icon} {g.label}
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
                <div className="flex flex-col gap-2 px-1">
                  {filtered.length === 0 && (
                    <div className="py-10 px-5 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-bo-parchment mx-auto mb-3 flex items-center justify-center text-2xl">📸</div>
                      <div className="text-[13px] font-semibold text-bo-ink-muted font-sans mb-1">該当する製品がありません</div>
                    </div>
                  )}
                  {filtered.map((p, i) => {
                    const genre = getGenreByKey(p.productType || "other");
                    return (
                      <div
                        key={p.id}
                        className="animate-fade-up"
                        style={{ animationDelay: i * 40 + "ms", opacity: deletingId === p.id ? 0.5 : undefined }}
                      >
                        <div
                          onClick={() => !editMode && setSelectedProduct(p)}
                          className="flex items-center gap-3 py-2.5 px-3 bg-white rounded-r1 border border-bo-parchment shadow-bo1 cursor-pointer"
                        >
                          {editMode && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(p.id, p.name); }}
                              className="w-6 h-6 rounded-full bg-red-500 text-white border-none flex items-center justify-center text-xs font-bold cursor-pointer shrink-0"
                            >
                              ✕
                            </button>
                          )}
                          <div className="w-14 h-14 rounded-[10px] overflow-hidden bg-bo-parchment shrink-0 relative">
                            {p.packageImage ? (
                              <Image src={p.packageImage} alt={p.name} fill className="object-cover" sizes="56px" loading="lazy" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-bo-accent-soft to-bo-parchment flex items-center justify-center text-xl">
                                {genre?.icon || "📦"}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-bo-ink font-sans leading-snug line-clamp-2">{p.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-bo-ink-muted font-sans">{p.brand}</span>
                              {genre && (
                                <span className="text-[9px] font-semibold text-bo-ink-muted bg-bo-parchment py-px px-[7px] rounded">
                                  {genre.label}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {editMode ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditingGenreId(editingGenreId === p.id ? null : p.id); }}
                                className="text-[10px] py-1 px-2 rounded-md border border-bo-parchment bg-bo-parchment text-bo-ink-muted cursor-pointer font-sans"
                              >
                                変更
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleFavorite(p.id, p.isFavorite);
                                  }}
                                  className="text-sm border-none bg-transparent cursor-pointer p-0"
                                >
                                  {p.isFavorite ? "❤️" : "🤍"}
                                </button>
                                {p.lastUsedAt ? (
                                  <span className="text-[9px] text-bo-accent font-sans">
                                    {new Date(p.lastUsedAt).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })} 使用
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-bo-ink-faint font-sans">
                                    {new Date(p.createdAt).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        {editMode && editingGenreId === p.id && (
                          <div className="flex flex-wrap gap-1 mt-1 mb-1 px-3">
                            {PRODUCT_GENRES.filter((g) => g.key !== "other").map((g) => (
                              <button
                                key={g.key}
                                onClick={() => { handleGenreChange(p.id, g.key); setEditingGenreId(null); }}
                                className={`text-[9px] py-0.5 px-2 rounded-full border-none cursor-pointer font-sans ${p.productType === g.key ? "bg-bo-accent text-white" : "bg-white text-bo-ink-muted"}`}
                              >
                                {g.icon} {g.label}
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

      {/* Product detail overlay */}
      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onToggleFavorite={() => {
            handleToggleFavorite(selectedProduct.id, selectedProduct.isFavorite);
            setSelectedProduct({ ...selectedProduct, isFavorite: !selectedProduct.isFavorite });
          }}
          onUpdatePurchasedAt={(date) => handleUpdatePurchasedAt(selectedProduct.id, date)}
        />
      )}

      {/* Share modal removed */}

      {/* Scroll to top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-20 right-4 z-[100] w-10 h-10 rounded-full bg-bo-accent text-white border-none shadow-lg flex items-center justify-center cursor-pointer"
          aria-label="上に戻る"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      )}
    </AuthGuard>
  );
}
