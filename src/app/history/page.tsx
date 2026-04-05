"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useProductStore } from "@/stores/useProductStore";
import Disclaimer from "@/components/ui/Disclaimer";
import { useUser } from "@/lib/auth";
import PageLoading from "@/components/ui/PageLoading";
import AuthGuard from "@/components/ui/AuthGuard";
import ShareModal from "@/components/ui/ShareModal";
import { deleteProductFromDb, updateProductImageInDb, deleteProductImageFromDb, updateProductTypeInDb, toggleFavoriteInDb } from "@/lib/db";
import { PRODUCT_GENRES, getGenreByKey } from "@/lib/productGenres";
import { ProductGenre } from "@/types";
import { shareFavoriteCosmetics } from "@/lib/share";

type ViewMode = "list" | "grid";

export default function HistoryPage() {
  const { user, supabase, loading } = useUser();
  const products = useProductStore((s) => s.products);
  const removeProduct = useProductStore((s) => s.removeProduct);
  const updateProductImage = useProductStore((s) => s.updateProductImage);
  const updateProductType = useProductStore((s) => s.updateProductType);
  const toggleFavorite = useProductStore((s) => s.toggleFavorite);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingImageId, setUpdatingImageId] = useState<string | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingProductIdRef = useRef<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<"all" | ProductGenre>("all");
  const [editingGenreId, setEditingGenreId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showShare, setShowShare] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  if (loading) {
    return <PageLoading message="コスメ一覧を読み込んでいます..." />;
  }

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
    reader.onerror = () => {
      setImageError("画像の読み込みに失敗しました。");
      setUpdatingImageId(null);
    };
    reader.onload = async (ev) => {
      const imageBase64 = ev.target?.result as string;
      if (!imageBase64) {
        setImageError("画像データが取得できませんでした。");
        setUpdatingImageId(null);
        return;
      }
      const { error, imageUrl } = await updateProductImageInDb(supabase, user.id, productId, imageBase64);
      if (error) {
        setImageError(`保存に失敗しました: ${error}`);
      } else if (imageUrl) {
        updateProductImage(productId, imageUrl);
      }
      setUpdatingImageId(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteImage = async (productId: string) => {
    if (!user) return;
    const confirmed = window.confirm("このコスメの写真を削除しますか？");
    if (!confirmed) return;

    setDeletingImageId(productId);
    setImageError(null);
    const { error } = await deleteProductImageFromDb(supabase, user.id, productId);
    if (error) {
      setImageError(`写真の削除に失敗しました: ${error}`);
    } else {
      updateProductImage(productId, "");
    }
    setDeletingImageId(null);
  };

  const handleDelete = async (productId: string, productName: string) => {
    if (!user) return;
    const confirmed = window.confirm(`「${productName}」を削除しますか？`);
    if (!confirmed) return;

    setDeletingId(productId);
    const { error } = await deleteProductFromDb(supabase, user.id, productId);
    if (!error) {
      removeProduct(productId);
    }
    setDeletingId(null);
  };

  const handleToggleFavorite = async (productId: string, currentFav: boolean) => {
    if (!user) return;
    toggleFavorite(productId);
    await toggleFavoriteInDb(supabase, user.id, productId, !currentFav);
  };

  const handleGenreChange = async (productId: string, newGenre: ProductGenre) => {
    if (!user) return;
    updateProductType(productId, newGenre);
    setEditingGenreId(null);
    await updateProductTypeInDb(supabase, user.id, productId, newGenre);
  };

  // ジャンル別のコスメ数を計算
  const genreCounts = products.reduce<Record<string, number>>((acc, p) => {
    const genre = p.productType || "other";
    acc[genre] = (acc[genre] || 0) + 1;
    return acc;
  }, {});

  // フィルタリング
  const filteredProducts = selectedGenre === "all"
    ? products
    : products.filter((p) => (p.productType || "other") === selectedGenre);

  // お気に入りを先頭にソート
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return 0;
  });

  // コスメがあるジャンルのみ表示
  const activeGenres = PRODUCT_GENRES.filter((g) => genreCounts[g.key]);
  const favCount = products.filter((p) => p.isFavorite).length;

  return (
    <AuthGuard>
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #F0FDFA 0%, #FFF0F5 100%)" }}>
      <div className="px-5 pt-8 pb-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-bold text-lg flex items-center gap-2" style={{ color: "#2D2D2D" }}>
            My コスメ
            <span className="text-xs font-normal px-2 py-0.5 rounded-full" style={{ background: "#E8FAF8", color: "#5BBFAD" }}>
              {products.length}件
            </span>
          </h1>
          <div className="flex items-center gap-2">
            {favCount > 0 && (
              <button
                onClick={() => setShowShare(true)}
                className="px-3 py-1.5 rounded-full text-sm font-medium"
                style={{ background: "#5BBFAD", color: "#fff" }}
              >
                Xに投稿
              </button>
            )}
            <button
              onClick={() => setViewMode("grid")}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{
                background: viewMode === "grid" ? "#5BBFAD" : "rgba(255,255,255,0.7)",
                color: viewMode === "grid" ? "#fff" : "#9B9B9B",
              }}
              title="グリッド表示"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <rect x="1" y="1" width="6" height="6" rx="1" />
                <rect x="9" y="1" width="6" height="6" rx="1" />
                <rect x="1" y="9" width="6" height="6" rx="1" />
                <rect x="9" y="9" width="6" height="6" rx="1" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{
                background: viewMode === "list" ? "#5BBFAD" : "rgba(255,255,255,0.7)",
                color: viewMode === "list" ? "#fff" : "#9B9B9B",
              }}
              title="リスト表示"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <rect x="1" y="2" width="14" height="3" rx="1" />
                <rect x="1" y="7" width="14" height="3" rx="1" />
                <rect x="1" y="12" width="14" height="3" rx="1" />
              </svg>
            </button>
          </div>
        </div>

        <div
          className="rounded-2xl p-3 mb-4 text-xs"
          style={{ background: "#E8FAF8", border: "1px solid rgba(91,191,173,0.15)", color: "#6B9E95" }}
        >
          💡 ベータ版では、最大30件までのコスメを登録できます
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        {imageError && (
          <div
            className="mb-3 px-4 py-2 rounded-xl text-xs text-center"
            style={{ background: "#FFF3F3", color: "#E57373", border: "1px solid #F9C8C8" }}
          >
            {imageError}
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center py-14">
            <div className="text-5xl mb-3">🌸</div>
            <p className="font-medium text-sm" style={{ color: "#2D2D2D" }}>まだ保存したコスメはありません</p>
            <Link
              href="/scan"
              className="inline-block mt-4 px-6 py-2.5 rounded-full text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #5BBFAD, #7DD3C8)" }}
            >
              スキャンを始める →
            </Link>
          </div>
        ) : (
          <>
            {/* ジャンルフィルタータブ */}
            <div
              className="flex gap-2 mb-4 pb-2 overflow-x-auto"
              style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
            >
              <button
                onClick={() => setSelectedGenre("all")}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                style={
                  selectedGenre === "all"
                    ? { background: "linear-gradient(135deg, #5BBFAD, #7DD3C8)", color: "#fff" }
                    : { background: "rgba(255,255,255,0.7)", color: "#9B9B9B", border: "1px solid #F0F0F0" }
                }
              >
                すべて ({products.length})
              </button>
              {favCount > 0 && (
                <button
                  onClick={() => setSelectedGenre("all")}
                  className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ background: "#FFF8E1", color: "#F59E0B", border: "1px solid #FBBF2420" }}
                >
                  ★ {favCount}
                </button>
              )}
              {activeGenres.map((g) => (
                <button
                  key={g.key}
                  onClick={() => setSelectedGenre(g.key)}
                  className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap"
                  style={
                    selectedGenre === g.key
                      ? { background: g.color, color: "#fff" }
                      : { background: "rgba(255,255,255,0.7)", color: "#9B9B9B", border: "1px solid #F0F0F0" }
                  }
                >
                  {g.icon} {g.label} ({genreCounts[g.key]})
                </button>
              ))}
            </div>

            {/* ===== グリッド表示 ===== */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-3 gap-2">
                {sortedProducts.map((p) => {
                  const genre = getGenreByKey(p.productType || "other");
                  return (
                    <div
                      key={p.id}
                      className="relative rounded-2xl overflow-hidden bg-white shadow-sm"
                      style={{
                        border: p.isFavorite ? "2px solid #F59E0B" : "1px solid #F5E6EF",
                        opacity: deletingId === p.id ? 0.5 : 1,
                        aspectRatio: "1",
                      }}
                    >
                      <Link href={`/product/${p.id}`} className="block w-full h-full">
                        {p.packageImage ? (
                          <Image
                            src={p.packageImage}
                            alt={p.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 430px) 33vw, 140px"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center text-3xl"
                            style={{ background: "linear-gradient(135deg, #E8FAF8, #FFF0F5)" }}
                          >
                            {genre?.icon || "📦"}
                          </div>
                        )}

                        {/* ジャンルバッジ */}
                        {genre && (
                          <div
                            className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full"
                            style={{
                              background: "rgba(255,255,255,0.9)",
                              backdropFilter: "blur(4px)",
                              fontSize: "9px",
                              color: genre.color,
                              fontWeight: 700,
                            }}
                          >
                            {genre.label}
                          </div>
                        )}

                        {/* コスメ名オーバーレイ */}
                        <div
                          className="absolute bottom-0 left-0 right-0 px-1.5 py-1.5"
                          style={{
                            background: "linear-gradient(transparent, rgba(0,0,0,0.55))",
                          }}
                        >
                          <div className="text-white font-bold truncate" style={{ fontSize: "10px", lineHeight: 1.2 }}>
                            {p.name}
                          </div>
                          <div className="text-white truncate" style={{ fontSize: "8px", opacity: 0.8 }}>
                            {p.brand}
                          </div>
                        </div>
                      </Link>

                      {/* お気に入りボタン */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleToggleFavorite(p.id, p.isFavorite);
                        }}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                        style={{
                          background: "rgba(255,255,255,0.9)",
                          backdropFilter: "blur(4px)",
                          fontSize: "12px",
                        }}
                      >
                        {p.isFavorite ? "★" : "☆"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ===== リスト表示 ===== */}
            {viewMode === "list" && (
              <div className="space-y-2.5">
                {sortedProducts.map((p) => {
                  const genre = getGenreByKey(p.productType || "other");
                  return (
                    <div
                      key={p.id}
                      className="bg-white rounded-2xl shadow-sm overflow-hidden"
                      style={{
                        border: p.isFavorite ? "2px solid #F59E0B" : "1px solid #F5E6EF",
                        opacity: deletingId === p.id ? 0.5 : 1,
                      }}
                    >
                      <div className="flex items-center gap-3 p-4">
                        {/* お気に入りボタン */}
                        <button
                          onClick={() => handleToggleFavorite(p.id, p.isFavorite)}
                          className="shrink-0 text-lg"
                          style={{ color: p.isFavorite ? "#F59E0B" : "#D4D4D4" }}
                        >
                          {p.isFavorite ? "★" : "☆"}
                        </button>

                        <Link
                          href={`/product/${p.id}`}
                          className="flex items-center gap-3 flex-1 min-w-0"
                        >
                          {p.packageImage ? (
                            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 relative">
                              <Image
                                src={p.packageImage}
                                alt={p.name}
                                fill
                                className="object-cover"
                                sizes="64px"
                                loading="lazy"
                              />
                            </div>
                          ) : (
                            <div
                              className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl shrink-0"
                              style={{ background: "linear-gradient(135deg, #E8FAF8, #FFF0F5)" }}
                            >
                              {genre?.icon || "📦"}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate text-sm" style={{ color: "#2D2D2D" }}>{p.name}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="text-xs" style={{ color: "#9B9B9B" }}>{p.brand}</div>
                              {genre && (
                                <span
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs"
                                  style={{ background: `${genre.color}18`, color: genre.color, fontSize: "10px" }}
                                >
                                  {genre.icon} {genre.label}
                                </span>
                              )}
                            </div>
                            <div className="text-xs mt-0.5" style={{ color: "#C5C5C5" }}>
                              {p.ingredients.length}成分 · {new Date(p.createdAt).toLocaleDateString("ja-JP")}
                            </div>
                          </div>
                          <span className="text-lg" style={{ color: "#5BBFAD" }}>›</span>
                        </Link>
                      </div>

                      {/* ジャンル編集モーダル */}
                      {editingGenreId === p.id && (
                        <div
                          className="px-4 py-3 border-t"
                          style={{ borderColor: "#F5E6EF", background: "#FAFAFA" }}
                        >
                          <div className="text-xs font-medium mb-2" style={{ color: "#9B9B9B" }}>
                            ジャンルを選択
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {PRODUCT_GENRES.map((g) => (
                              <button
                                key={g.key}
                                onClick={() => handleGenreChange(p.id, g.key)}
                                className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                                style={
                                  (p.productType || "other") === g.key
                                    ? { background: g.color, color: "#fff" }
                                    : { background: `${g.color}18`, color: g.color }
                                }
                              >
                                {g.icon} {g.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div
                        className="flex border-t px-2 py-1.5"
                        style={{ borderColor: "#F5E6EF" }}
                      >
                        <button
                          onClick={() => setEditingGenreId(editingGenreId === p.id ? null : p.id)}
                          className="flex-1 text-xs font-medium py-1.5 rounded-lg"
                          style={{ color: "#5BBFAD" }}
                        >
                          {editingGenreId === p.id ? "✕ 閉じる" : "🏷 ジャンル"}
                        </button>
                        <button
                          onClick={() => handlePhotoUpdate(p.id)}
                          disabled={updatingImageId === p.id || deletingImageId === p.id}
                          className="flex-1 text-xs font-medium py-1.5 rounded-lg"
                          style={{ color: "#5BBFAD" }}
                        >
                          {updatingImageId === p.id ? "更新中..." : "📷 写真"}
                        </button>
                        {p.packageImage && (
                          <button
                            onClick={() => handleDeleteImage(p.id)}
                            disabled={deletingImageId === p.id || updatingImageId === p.id}
                            className="flex-1 text-xs font-medium py-1.5 rounded-lg"
                            style={{ color: "#9B9B9B" }}
                          >
                            {deletingImageId === p.id ? "削除中..." : "🗑 写真削除"}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          disabled={deletingId === p.id}
                          className="flex-1 text-xs font-medium py-1.5 rounded-lg"
                          style={{ color: "#E57373" }}
                        >
                          🗑 削除
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        <Disclaimer />

        {/* お気に入りキャプチャ用（画面外に配置） */}
        <div
          ref={captureRef}
          style={{
            position: "absolute",
            left: "-9999px",
            top: 0,
            width: "360px",
            background: "linear-gradient(160deg, #F0FDFA 0%, #FFF0F5 100%)",
            borderRadius: 20,
            padding: "16px",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base font-bold" style={{ color: "#2D2D2D" }}>⭐ お気に入りコスメ</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#FFF8E1", color: "#F59E0B" }}>
              {favCount}件
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {products.filter((p) => p.isFavorite).map((p) => {
              const genre = getGenreByKey(p.productType || "other");
              return (
                <div
                  key={p.id}
                  className="bg-white"
                  style={{ border: "2px solid #F59E0B", borderRadius: 14, overflow: "hidden" }}
                >
                  <div style={{ position: "relative", aspectRatio: "1" }}>
                    {p.packageImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.packageImage} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    ) : (
                      <div
                        style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", background: "linear-gradient(135deg, #E8FAF8, #FFF0F5)" }}
                      >
                        {genre?.icon || "📦"}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "8px 10px 10px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#2D2D2D", lineHeight: 1.3, wordBreak: "break-all" }}>{p.name}</div>
                    <div style={{ fontSize: "10px", color: "#9B9B9B", marginTop: 2, wordBreak: "break-all" }}>{p.brand}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 text-center text-xs font-medium" style={{ color: "#9B9B9B" }}>
            #HADAMI #お気に入りコスメ #スキンケア
          </div>
        </div>
      </div>
    </div>

    {showShare && (
      <ShareModal
        text={shareFavoriteCosmetics(products.filter((p) => p.isFavorite).map((p) => ({ name: p.name, brand: p.brand })))}
        onClose={() => setShowShare(false)}
        captureRef={captureRef}
      />
    )}
    </AuthGuard>
  );
}
