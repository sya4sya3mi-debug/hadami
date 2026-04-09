"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useProductStore } from "@/stores/useProductStore";
import { useDeckStore } from "@/stores/useDeckStore";
import Disclaimer from "@/components/ui/Disclaimer";
import { useUser } from "@/lib/auth";
import PageLoading from "@/components/ui/PageLoading";
import AuthGuard from "@/components/ui/AuthGuard";
import Glass from "@/components/ui/Glass";
import ProductDetail from "@/components/ui/ProductDetail";
import { ProductGenreIcon } from "@/components/ui/CosmeticIcons";
import { deleteProductFromDb, updateProductImageInDb, deleteProductImageFromDb, updateProductTypeInDb, toggleFavoriteInDb, updateProductNameInDb } from "@/lib/db";
import { PRODUCT_GENRES, getGenreByKey } from "@/lib/productGenres";
import { ProductGenre, Product } from "@/types";

type ViewMode = "photo" | "list";

function Counter({ to, dur = 900 }: { to: number; dur?: number }) {
  const [v, setV] = useState(0);
  const ref = useRef<number>(0);
  const prev = useRef(0);

  useEffect(() => {
    if (to === prev.current) return;
    const from = prev.current;
    prev.current = to;
    cancelAnimationFrame(ref.current);
    let s: number | undefined;
    const step = (t: number) => {
      if (s === undefined) s = t;
      const p = Math.min((t - s) / dur, 1);
      setV(Math.round(from + (to - from) * p * p));
      if (p < 1) ref.current = requestAnimationFrame(step);
    };
    ref.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(ref.current);
  }, [to, dur]);

  return <>{v}</>;
}

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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editingGenreId, setEditingGenreId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState("");
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

  const DISPLAY_GENRES = ["toner", "serum", "emulsion", "cream", "sunscreen", "mask_pack"];

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

  const activeGenres = PRODUCT_GENRES.filter((g) => DISPLAY_GENRES.includes(g.key) && genreCounts[g.key]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-bo-cream">
        <div className="px-4 pt-4 pb-6">
          {/* Header */}
          <div className="px-1 mb-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-bo-ink-muted font-sans m-0">{products.length}品 スキャン済み</p>
              </div>
              <div className="flex items-center gap-2">
                {editMode && selectedIds.size > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="px-3 py-1.5 rounded-full text-[11px] font-bold border-none cursor-pointer font-sans bg-red-500 text-white"
                  >
                    {selectedIds.size}件削除
                  </button>
                )}
                {products.length > 0 && (
                  <button
                    onClick={() => { setEditMode(!editMode); setEditingGenreId(null); setSelectedIds(new Set()); setEditingNameId(null); }}
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
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
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
                  <span className="inline-flex items-center gap-1">
                    <ProductGenreIcon genre={g.key} size={12} />
                    {g.label}
                  </span>
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
                    const isSelected = selectedIds.has(p.id);
                    return (
                      <div
                        key={p.id}
                        className={`rounded-r2 overflow-hidden bg-white border shadow-bo1 cursor-pointer animate-fade-up transition-all duration-200 relative ${isSelected ? "border-bo-accent ring-2 ring-bo-accent/30" : "border-bo-parchment"}`}
                        style={{ animationDelay: i * 50 + "ms", opacity: deletingId === p.id ? 0.5 : undefined }}
                        onClick={() => editMode ? toggleSelect(p.id) : setSelectedProduct(p)}
                      >
                        {editMode && (
                          <div className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shadow-lg ${isSelected ? "bg-bo-accent border-bo-accent text-white" : "bg-white border-bo-parchment"}`}>
                            {isSelected && "✓"}
                          </div>
                        )}
                        <div>
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
                                onClick={(e) => { e.stopPropagation(); handleToggleFavorite(p.id, p.isFavorite); }}
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
                            {editMode && editingNameId === p.id ? (
                              <div className="flex gap-1 mb-1" onClick={(e) => e.stopPropagation()}>
                                <input
                                  autoFocus
                                  value={editNameValue}
                                  onChange={(e) => setEditNameValue(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === "Enter") handleNameSave(p.id); if (e.key === "Escape") setEditingNameId(null); }}
                                  className="flex-1 text-[11px] font-bold border border-bo-accent rounded-md px-2 py-0.5 font-sans text-bo-ink bg-white outline-none min-w-0"
                                />
                                <button onClick={() => handleNameSave(p.id)} className="text-[10px] px-2 py-0.5 rounded-md bg-bo-accent text-white border-none cursor-pointer font-sans shrink-0">保存</button>
                              </div>
                            ) : (
                              <div className="flex items-start gap-1 mb-1">
                                <div className="text-[11px] font-bold text-bo-ink font-sans leading-snug line-clamp-2 flex-1">{p.name}</div>
                                {editMode && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setEditNameValue(p.name); setEditingNameId(p.id); }}
                                    className="shrink-0 text-[9px] px-1.5 py-0.5 rounded border border-bo-parchment bg-bo-parchment text-bo-ink-muted cursor-pointer font-sans mt-0.5"
                                  >
                                    ✏️
                                  </button>
                                )}
                              </div>
                            )}
                            <div className="text-[10px] text-bo-ink-muted font-sans">{p.brand}</div>
                          </div>
                        </div>
                        {editMode && (
                          <div className="px-3 pb-2.5" onClick={(e) => e.stopPropagation()}>
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
                <div className="flex flex-col gap-2 px-1">
                  {filtered.length === 0 && (
                    <div className="py-10 px-5 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-bo-parchment mx-auto mb-3 flex items-center justify-center text-2xl">📸</div>
                      <div className="text-[13px] font-semibold text-bo-ink-muted font-sans mb-1">該当する製品がありません</div>
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
                          onClick={() => editMode ? toggleSelect(p.id) : setSelectedProduct(p)}
                          className={`flex items-center gap-3 py-1.5 px-2.5 bg-white rounded-r1 border shadow-bo1 cursor-pointer ${isSelected ? "border-bo-accent ring-2 ring-bo-accent/30" : "border-bo-parchment"}`}
                        >
                          {editMode && (
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 ${isSelected ? "bg-bo-accent border-bo-accent text-white" : "bg-white border-bo-parchment"}`}>
                              {isSelected && "✓"}
                            </div>
                          )}
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-bo-parchment shrink-0 relative">
                            {p.packageImage ? (
                              <Image src={p.packageImage} alt={p.name} fill className="object-cover" sizes="40px" loading="lazy" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-bo-accent-soft to-bo-parchment flex items-center justify-center text-base">
                                {genre?.icon || "📦"}
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
                                  className="flex-1 text-xs font-bold border border-bo-accent rounded-md px-2 py-0.5 font-sans text-bo-ink bg-white outline-none min-w-0"
                                />
                                <button onClick={() => handleNameSave(p.id)} className="text-[10px] px-2 rounded-md bg-bo-accent text-white border-none cursor-pointer font-sans shrink-0">保存</button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <div className="text-xs font-bold text-bo-ink font-sans leading-snug line-clamp-2 flex-1">{p.name}</div>
                                {editMode && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setEditNameValue(p.name); setEditingNameId(p.id); }}
                                    className="shrink-0 text-[9px] px-1.5 py-0.5 rounded border border-bo-parchment bg-bo-parchment text-bo-ink-muted cursor-pointer font-sans"
                                  >
                                    ✏️
                                  </button>
                                )}
                              </div>
                            )}
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
                                <span className="text-[9px] text-bo-ink-faint font-sans">
                                  {new Date(p.createdAt).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}
                                </span>
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

      {/* Product detail overlay */}
      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onToggleFavorite={() => {
            handleToggleFavorite(selectedProduct.id, selectedProduct.isFavorite);
            setSelectedProduct({ ...selectedProduct, isFavorite: !selectedProduct.isFavorite });
          }}
          onRescan={() => {
            setSelectedProduct(null);
            handleCameraCapture(selectedProduct.id);
          }}
        />
      )}

      {/* Share modal removed */}

      {/* Scroll to top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-28 right-4 z-[100] w-10 h-10 rounded-full bg-bo-accent text-white border-none shadow-lg flex items-center justify-center cursor-pointer"
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
