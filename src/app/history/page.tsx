"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useProductStore } from "@/stores/useProductStore";
import Disclaimer from "@/components/ui/Disclaimer";
import { useUser } from "@/lib/auth";
import PageLoading from "@/components/ui/PageLoading";
import AuthGuard from "@/components/ui/AuthGuard";
import { deleteProductFromDb, updateProductImageInDb, deleteProductImageFromDb, updateProductTypeInDb } from "@/lib/db";
import { PRODUCT_GENRES, getGenreByKey } from "@/lib/productGenres";
import { ProductGenre } from "@/types";

export default function HistoryPage() {
  const { user, supabase, loading } = useUser();
  const products = useProductStore((s) => s.products);
  const removeProduct = useProductStore((s) => s.removeProduct);
  const updateProductImage = useProductStore((s) => s.updateProductImage);
  const updateProductType = useProductStore((s) => s.updateProductType);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingImageId, setUpdatingImageId] = useState<string | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingProductIdRef = useRef<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<"all" | ProductGenre>("all");
  const [editingGenreId, setEditingGenreId] = useState<string | null>(null);

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
    const confirmed = window.confirm("この製品の写真を削除しますか？");
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

  const handleGenreChange = async (productId: string, newGenre: ProductGenre) => {
    if (!user) return;
    updateProductType(productId, newGenre);
    setEditingGenreId(null);
    await updateProductTypeInDb(supabase, user.id, productId, newGenre);
  };

  // ジャンル別の製品数を計算
  const genreCounts = products.reduce<Record<string, number>>((acc, p) => {
    const genre = p.productType || "other";
    acc[genre] = (acc[genre] || 0) + 1;
    return acc;
  }, {});

  // フィルタリング
  const filteredProducts = selectedGenre === "all"
    ? products
    : products.filter((p) => (p.productType || "other") === selectedGenre);

  // 製品があるジャンルのみ表示
  const activeGenres = PRODUCT_GENRES.filter((g) => genreCounts[g.key]);

  return (
    <AuthGuard>
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #F0FDFA 0%, #FFF0F5 100%)" }}>
      <div className="px-5 pt-8 pb-6">
        <h1 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: "#2D2D2D" }}>
          My コスメ
        </h1>
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

            <div className="space-y-2.5">
              {filteredProducts.map((p) => {
                const genre = getGenreByKey(p.productType || "other");
                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl shadow-sm overflow-hidden"
                    style={{
                      border: "1px solid #F5E6EF",
                      opacity: deletingId === p.id ? 0.5 : 1,
                    }}
                  >
                    <Link
                      href={`/product/${p.id}`}
                      className="flex items-center gap-3 p-4"
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
                          {genre?.icon || "����"}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-medium truncate text-sm" style={{ color: "#2D2D2D" }}>{p.name}</div>
                        </div>
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
          </>
        )}

        <Disclaimer />
      </div>
    </div>
    </AuthGuard>
  );
}
