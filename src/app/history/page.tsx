"use client";

import "@/styles/hadami-tokens.css";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
import {
  deleteProductFromDb,
  updateProductImageInDb,
  deleteProductImageFromDb,
  updateProductTypeInDb,
  toggleFavoriteInDb,
  updateProductNameInDb,
} from "@/lib/db";
import { PRODUCT_GENRES, getGenreByKey } from "@/lib/productGenres";
import { getSignedImageUrls } from "@/lib/storage";
import {
  getProductImageDisplayPath,
  getProductImageSharePath,
} from "@/lib/productImages";
import { ProductGenre } from "@/types";
import EditorialCard from "@/components/mine/EditorialCard";
import SectionDivider from "@/components/mine/SectionDivider";
import {
  getCollectionSummary,
  getIssueLabel,
  pickHero,
  pickSatellites,
  pickStaffPicks,
} from "@/lib/mineLayout";

type LayoutMode = "magazine" | "mosaic" | "list";
type FilterKey = "all" | "fav" | ProductGenre;

// ────────────────────────────────────────────────────────────
// Layout toggle icons
// ────────────────────────────────────────────────────────────
function MagazineIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="7" height="12" rx="1" fill="currentColor" opacity="0.9" />
      <rect x="9.5" y="1" width="3.5" height="5.5" rx="1" fill="currentColor" opacity="0.5" />
      <rect x="9.5" y="7.5" width="3.5" height="5.5" rx="1" fill="currentColor" opacity="0.5" />
    </svg>
  );
}
function MosaicIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="5.5" height="12" rx="1" fill="currentColor" opacity="0.6" />
      <rect x="7.5" y="1" width="5.5" height="4" rx="1" fill="currentColor" opacity="0.9" />
      <rect x="7.5" y="6" width="5.5" height="3" rx="1" fill="currentColor" opacity="0.5" />
      <rect x="7.5" y="10" width="5.5" height="3" rx="1" fill="currentColor" opacity="0.5" />
    </svg>
  );
}
function ListIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <rect x="1" y="2" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" />
      <path d="M6 3.5h7" />
      <rect x="1" y="6" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" />
      <path d="M6 7.5h7" />
      <rect x="1" y="10" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" />
      <path d="M6 11.5h7" />
    </svg>
  );
}

// ────────────────────────────────────────────────────────────
// Cover card (used in Magazine + Mosaic)
// ────────────────────────────────────────────────────────────
interface CoverCardProps {
  p: Product;
  index: number;
  style?: React.CSSProperties;
  nameSize?: number;
  brandSize?: number;
  showFeatured?: boolean;
  favSize?: number;
  gradientStop?: string;
  priority?: boolean;
  editMode?: boolean;
  isSelected?: boolean;
  failedImageIds: Set<string>;
  onNavigate: () => void;
  onFav: (e: React.MouseEvent) => void;
  onSelect: () => void;
}

function CoverCard({
  p,
  index,
  style,
  nameSize = 11,
  brandSize = 7.5,
  showFeatured = false,
  favSize = 22,
  gradientStop = "oklch(0.18 0.02 90 / 0.55)",
  priority = false,
  editMode = false,
  isSelected = false,
  failedImageIds,
  onNavigate,
  onFav,
  onSelect,
}: CoverCardProps) {
  const genre = getGenreByKey(p.productType || "other");
  const hasImage = p.packageImage && !failedImageIds.has(p.id);

  return (
    <div
      className={editMode ? "hd-no-press" : undefined}
      style={{
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        WebkitTapHighlightColor: editMode ? "transparent" : undefined,
        ...style,
      }}
      onClick={() => (editMode ? onSelect() : onNavigate())}
    >
      {/* Image or placeholder */}
      {hasImage ? (
        <Image
          src={p.packageImageThumb ?? p.packageImage!}
          alt={p.name}
          fill
          style={{ objectFit: "cover" }}
          sizes="(max-width:430px) 55vw, 300px"
          priority={priority}
          loading={priority ? undefined : "lazy"}
        />
      ) : (
        <div
          style={{
            position: "absolute", inset: 0,
            background: genre
              ? `linear-gradient(135deg, ${genre.color}30 0%, ${genre.color}10 100%)`
              : "var(--hd-mint-bg)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {genre ? <ProductGenreIcon genre={genre.key} size={32} /> : <span style={{ fontSize: 28 }}>📦</span>}
        </div>
      )}

      {/* Gradient overlay */}
      <div
        style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(to bottom, transparent 35%, ${gradientStop})`,
          pointerEvents: "none",
        }}
      />

      {/* FEATURED badge */}
      {showFeatured && (
        <div
          style={{
            position: "absolute", top: 10, left: 10,
            background: "var(--hd-moss)", color: "#fff",
            fontFamily: "var(--hd-mono)", fontSize: 8,
            letterSpacing: "0.16em", padding: "3px 10px",
            borderRadius: 999,
          }}
        >
          FEATURED
        </div>
      )}

      {/* N° badge (non-featured cards) */}
      {!showFeatured && (
        <div
          style={{
            position: "absolute", top: 8, left: 8,
            background: "rgba(255,255,255,0.9)",
            fontFamily: "var(--hd-mono)", fontSize: 8,
            padding: "2px 8px", borderRadius: 999,
            color: "var(--hd-ink)",
          }}
        >
          N°{String(index + 1).padStart(3, "0")}
        </div>
      )}

      {/* Edit mode select overlay */}
      {editMode && (
        <div
          style={{
            position: "absolute", top: 8, left: showFeatured ? 8 : 8,
            width: 24, height: 24, borderRadius: 999,
            background: isSelected ? "var(--hd-moss)" : "rgba(255,255,255,0.9)",
            color: isSelected ? "#fff" : "var(--hd-ink-40)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 10,
          }}
        >
          {isSelected && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
        </div>
      )}

      {/* Favorite button */}
      {!editMode && (
        <button
          onClick={onFav}
          aria-label={p.isFavorite ? "お気に入り解除" : "お気に入り追加"}
          style={{
            position: "absolute", top: 8, right: 8,
            width: favSize, height: favSize, borderRadius: 999,
            background: p.isFavorite ? "var(--hd-moss)" : "rgba(255,255,255,0.15)",
            border: p.isFavorite ? "none" : "1px solid rgba(255,255,255,0.5)",
            color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <StarIcon size={favSize * 0.45} color="#fff" filled={p.isFavorite} />
        </button>
      )}

{/* Bottom text overlay */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "8px 10px" }}>
        {showFeatured && (
          <div
            style={{
              fontFamily: "var(--hd-mono)", fontSize: 8,
              color: "rgba(255,255,255,0.6)", letterSpacing: "0.16em",
              textTransform: "uppercase", marginBottom: 3,
            }}
          >
            {genre?.label ?? "COSMETIC"} · N°{String(index + 1).padStart(3, "0")}
          </div>
        )}
        <div
          style={{
            fontFamily: "var(--hd-serif)", fontSize: nameSize,
            fontStyle: "italic", color: "#fff", lineHeight: 1.25,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {p.name}
        </div>
        <div
          style={{
            fontFamily: "var(--hd-mono)", fontSize: brandSize,
            color: "rgba(255,255,255,0.55)", marginTop: 2,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}
        >
          {p.brand}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Empty state
// ────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div
      style={{
        textAlign: "center", padding: "44px 24px",
        background: "var(--hd-surface)", border: "1px solid var(--hd-hair)",
      }}
    >
      <div
        style={{
          width: 72, height: 72, borderRadius: 999,
          background: "var(--hd-mint-bg)", color: "var(--hd-moss)",
          margin: "0 auto 18px",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {Ico.camera({ width: 30, height: 30 })}
      </div>
      <div className="hd-serif" style={{ fontSize: 17, marginBottom: 6 }}>
        まだ保存したコスメはありません
      </div>
      <p style={{ fontSize: 12, color: "var(--hd-ink-60)", marginTop: 0, marginBottom: 18, fontFamily: "var(--hd-sans)" }}>
        コスメをスキャンして登録しましょう
      </p>
      <Link
        href="/scan"
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          textDecoration: "none", fontSize: 14,
          background: "var(--hd-ink)", color: "var(--hd-bg)",
          padding: "10px 20px", fontFamily: "var(--hd-sans)", fontWeight: 600,
        }}
      >
        <CameraIcon size={16} color="white" /> スキャンを始める
      </Link>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// No results
// ────────────────────────────────────────────────────────────
function NoResults() {
  return (
    <div style={{ padding: "44px 24px", textAlign: "center", background: "var(--hd-surface)", border: "1px solid var(--hd-hair)" }}>
      <div className="hd-serif" style={{ fontSize: 16, marginBottom: 4 }}>該当する製品がありません</div>
      <div style={{ fontSize: 12, color: "var(--hd-ink-60)", fontFamily: "var(--hd-sans)" }}>フィルターを変更してみましょう</div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────────────────
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

  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [layout, setLayout] = useState<LayoutMode>(() => {
    if (typeof window === "undefined") return "magazine";
    const saved = window.localStorage.getItem("hadami.mine.layout");
    return saved === "magazine" || saved === "mosaic" || saved === "list" ? saved : "magazine";
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("hadami.mine.layout", layout);
  }, [layout]);
  const router = useRouter();
  const [editMode, setEditMode] = useState(false);
  // シェア用: 4点まで選択する専用モード。editMode とは排他。
  const [shareSelectMode, setShareSelectMode] = useState(false);
  const [editingGenreId, setEditingGenreId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState("");
  const captureRef = useRef<HTMLDivElement>(null);
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());

  const { favCount, filtered, activeGenres } = useMemo(() => {
    const displayGenres = ["toner", "serum", "emulsion", "cream", "sunscreen", "mask_pack"];
    const favCount = products.filter((p) => p.isFavorite).length;
    const filtered = products
      .filter((p) => {
        if (activeFilter === "fav") return p.isFavorite;
        if (activeFilter === "all") return true;
        return (p.productType || "other") === activeFilter;
      })
      .sort((a, b) => (a.isFavorite === b.isFavorite ? 0 : a.isFavorite ? -1 : 1));
    const genreCountsMap = products.reduce<Record<string, number>>((acc, p) => {
      const g = p.productType || "other";
      acc[g] = (acc[g] || 0) + 1;
      return acc;
    }, {});
    const activeGenres = PRODUCT_GENRES.filter((g) => displayGenres.includes(g.key) && genreCountsMap[g.key]);
    return { favCount, filtered, activeGenres };
  }, [products, activeFilter]);

  if (loading) return null;

  // ── Handlers ──────────────────────────────────────────────
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
        const displayPath = getProductImageDisplayPath(user.id, productId);
        const sharePath = getProductImageSharePath(user.id, productId);
        const signedImages = await getSignedImageUrls(supabase, [displayPath, sharePath]);
        const displayUrl = signedImages[displayPath] ?? undefined;
        const shareUrl = signedImages[sharePath] ?? displayUrl;
        updateProductImage(
          productId,
          displayUrl,
          displayPath,
          displayUrl,
          displayPath,
          shareUrl,
          sharePath
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
    if (error) { toggleFavorite(productId); setImageError(`お気に入りの更新に失敗しました: ${error}`); }
  };

  const handleGenreChange = async (productId: string, newGenre: ProductGenre) => {
    if (!user) return;
    const prev = products.find((p) => p.id === productId)?.productType ?? "other";
    updateProductType(productId, newGenre);
    const { error } = await updateProductTypeInDb(supabase, user.id, productId, newGenre);
    if (error) { updateProductType(productId, prev); setImageError(`カテゴリの更新に失敗しました: ${error}`); }
  };

  const handleNameSave = async (productId: string) => {
    const trimmed = editNameValue.trim();
    if (!trimmed || !user) { setEditingNameId(null); return; }
    const prev = products.find((p) => p.id === productId)?.name ?? "";
    updateProductName(productId, trimmed);
    setEditingNameId(null);
    const { error } = await updateProductNameInDb(supabase, user.id, productId, trimmed);
    if (error) { updateProductName(productId, prev); setImageError(`名前の更新に失敗しました: ${error}`); }
  };

  const handleBulkDelete = async () => {
    if (!user || selectedIds.size === 0) return;
    if (!window.confirm(`選択した${selectedIds.size}件を削除しますか？`)) return;
    const failedIds: string[] = [];
    for (const id of Array.from(selectedIds)) {
      setDeletingId(id);
      const { error } = await deleteProductFromDb(supabase, user.id, id);
      if (error) { failedIds.push(id); }
      else {
        await supabase.from("deck_items").delete().eq("user_id", user.id).eq("product_id", id);
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
      if (next.has(id)) {
        next.delete(id);
      } else {
        // シェア選択モードでは 4 点上限。すでに 4 つ選んでいたら追加しない
        if (shareSelectMode && next.size >= 4) return prev;
        next.add(id);
      }
      return next;
    });
  };

  const layoutLabels: Record<LayoutMode, string> = { magazine: "Magazine", mosaic: "Mosaic", list: "List" };

  // 編集モード or シェア選択モードのいずれかなら「選択UI」を出す
  const selectionMode = editMode || shareSelectMode;

  // ── Shared cover card props helper ────────────────────────
  const coverCardProps = (p: Product, idx: number, pri = false) => ({
    p, index: idx,
    priority: pri,
    failedImageIds,
    editMode: selectionMode,
    isSelected: selectedIds.has(p.id),
    onNavigate: () => router.push(`/product/${p.id}`),
    onFav: (e: React.MouseEvent) => { e.stopPropagation(); handleToggleFavorite(p.id, p.isFavorite); },
    onSelect: () => toggleSelect(p.id),
  });

  // EditorialCard 用プロップ生成
  const editorialCardProps = (p: Product, idx: number, pri = false) => ({
    product: p,
    index: idx,
    hasImage: Boolean(p.packageImage) && !failedImageIds.has(p.id),
    priority: pri,
    onImageError: () => setFailedImageIds((s) => new Set(s).add(p.id)),
    editMode: selectionMode,
    selected: selectedIds.has(p.id),
    onSelect: () => toggleSelect(p.id),
    onToggleFavorite: () => handleToggleFavorite(p.id, p.isFavorite),
  });

  // ── Overflow section — cycles through layout patterns ─────

  const chunkPatterns: { count: number; render: (ps: Product[], base: number) => React.ReactNode }[] = [
    // A: 2-col equal portrait (2 items)
    {
      count: 2,
      render: (ps, base) => (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {ps.map((p, i) => (
            <div key={p.id} style={{ aspectRatio: "2/3", opacity: deletingId === p.id ? 0.5 : 1 }}>
              <CoverCard {...coverCardProps(p, base + i)} style={{ width: "100%", height: "100%", borderRadius: 0 }} nameSize={11} favSize={22} />
            </div>
          ))}
        </div>
      ),
    },
    // B: 3-col equal square-ish (3 items)
    {
      count: 3,
      render: (ps, base) => (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
          {ps.map((p, i) => (
            <div key={p.id} style={{ aspectRatio: "1/1.3", opacity: deletingId === p.id ? 0.5 : 1 }}>
              <CoverCard {...coverCardProps(p, base + i)} style={{ width: "100%", height: "100%", borderRadius: 0 }} nameSize={9} favSize={18} />
            </div>
          ))}
        </div>
      ),
    },
    // C: asymmetric 1.6fr + 1fr, both portrait (2 items)
    {
      count: 2,
      render: (ps, base) => (
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 8, alignItems: "start" }}>
          <div style={{ aspectRatio: "2/2.8", opacity: deletingId === ps[0]?.id ? 0.5 : 1 }}>
            <CoverCard {...coverCardProps(ps[0], base)} style={{ width: "100%", height: "100%", borderRadius: 0 }} nameSize={12} favSize={24} />
          </div>
          {ps[1] && (
            <div style={{ aspectRatio: "2/2.8", opacity: deletingId === ps[1].id ? 0.5 : 1 }}>
              <CoverCard {...coverCardProps(ps[1], base + 1)} style={{ width: "100%", height: "100%", borderRadius: 0 }} nameSize={10} favSize={20} />
            </div>
          )}
        </div>
      ),
    },
    // D: full-width wide banner (1 item)
    {
      count: 1,
      render: (ps, base) => (
        <div style={{ aspectRatio: "16/7", opacity: deletingId === ps[0]?.id ? 0.5 : 1 }}>
          <CoverCard {...coverCardProps(ps[0], base)} style={{ width: "100%", height: "100%", borderRadius: 0 }} nameSize={14} brandSize={8} favSize={26} gradientStop="oklch(0.18 0.02 90 / 0.65)" />
        </div>
      ),
    },
    // E: 1fr left tall + right 2-stack (3 items)
    {
      count: 3,
      render: (ps, base) => (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, alignItems: "start" }}>
          <div style={{ aspectRatio: "2/3", opacity: deletingId === ps[0]?.id ? 0.5 : 1 }}>
            <CoverCard {...coverCardProps(ps[0], base)} style={{ width: "100%", height: "100%", borderRadius: 0 }} nameSize={12} favSize={22} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignSelf: "stretch" }}>
            {ps.slice(1).map((p, i) => (
              <div key={p.id} style={{ flex: 1, minHeight: 0, overflow: "hidden", borderRadius: 0, opacity: deletingId === p.id ? 0.5 : 1 }}>
                <CoverCard {...coverCardProps(p, base + 1 + i)} style={{ width: "100%", height: "100%", borderRadius: 0 }} nameSize={10} favSize={19} />
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  // Cycle order (index into chunkPatterns)
  const PATTERN_CYCLE = [0, 1, 2, 4, 3, 1, 0, 2, 4, 1, 3, 0];

  function OverflowSection({ items, startIdx }: { items: Product[]; startIdx: number }) {
    if (items.length === 0) return null;
    const chunks: React.ReactNode[] = [];
    let pos = 0;
    let cycleIdx = 0;
    while (pos < items.length) {
      const pattern = chunkPatterns[PATTERN_CYCLE[cycleIdx % PATTERN_CYCLE.length]];
      const slice = items.slice(pos, pos + pattern.count);
      if (slice.length === 0) break;
      chunks.push(
        <React.Fragment key={startIdx + pos}>
          {pattern.render(slice, startIdx + pos)}
        </React.Fragment>
      );
      pos += pattern.count;
      cycleIdx++;
    }
    return <>{chunks}</>;
  }

  // Magazine ARCHIVE 用 — 既存パターンサイクルを EditorialCard で描画
  const editorialPatterns: { count: number; render: (ps: Product[], base: number) => React.ReactNode }[] = [
    {
      count: 2,
      render: (ps, base) => (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "start" }}>
          {ps.map((p, i) => (
            <div key={p.id} style={{ opacity: deletingId === p.id ? 0.5 : 1 }}>
              <EditorialCard {...editorialCardProps(p, base + i)} aspectRatio="2/3" />
            </div>
          ))}
        </div>
      ),
    },
    {
      count: 3,
      render: (ps, base) => (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, alignItems: "start" }}>
          {ps.map((p, i) => (
            <div key={p.id} style={{ opacity: deletingId === p.id ? 0.5 : 1 }}>
              <EditorialCard {...editorialCardProps(p, base + i)} aspectRatio="1/1.3" />
            </div>
          ))}
        </div>
      ),
    },
    {
      count: 2,
      render: (ps, base) => (
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 14, alignItems: "start" }}>
          {ps[0] && (
            <div style={{ opacity: deletingId === ps[0].id ? 0.5 : 1 }}>
              <EditorialCard {...editorialCardProps(ps[0], base)} aspectRatio="2/2.8" />
            </div>
          )}
          {ps[1] && (
            <div style={{ opacity: deletingId === ps[1].id ? 0.5 : 1 }}>
              <EditorialCard {...editorialCardProps(ps[1], base + 1)} aspectRatio="2/2.8" />
            </div>
          )}
        </div>
      ),
    },
    {
      count: 1,
      render: (ps, base) => (
        <div style={{ opacity: deletingId === ps[0]?.id ? 0.5 : 1 }}>
          <EditorialCard
            {...editorialCardProps(ps[0], base)}
            aspectRatio="16/7"
            forceVariant="clean"
            nameSize={14}
            brandSize={9}
            favSize={26}
          />
        </div>
      ),
    },
    {
      count: 3,
      render: (ps, base) => (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "stretch" }}>
          {ps[0] && (
            <div style={{ opacity: deletingId === ps[0].id ? 0.5 : 1 }}>
              <EditorialCard {...editorialCardProps(ps[0], base)} aspectRatio="2/3" />
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {ps.slice(1).map((p, i) => (
              <div key={p.id} style={{ flex: 1, opacity: deletingId === p.id ? 0.5 : 1 }}>
                <EditorialCard {...editorialCardProps(p, base + 1 + i)} aspectRatio="2/1.4" />
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  function EditorialOverflowSection({ items, startIdx }: { items: Product[]; startIdx: number }) {
    if (items.length === 0) return null;
    const chunks: React.ReactNode[] = [];
    let pos = 0;
    let cycleIdx = 0;
    while (pos < items.length) {
      const pattern = editorialPatterns[PATTERN_CYCLE[cycleIdx % PATTERN_CYCLE.length]];
      const slice = items.slice(pos, pos + pattern.count);
      if (slice.length === 0) break;
      chunks.push(
        <React.Fragment key={startIdx + pos}>
          {pattern.render(slice, startIdx + pos)}
        </React.Fragment>
      );
      pos += pattern.count;
      cycleIdx++;
    }
    return <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{chunks}</div>;
  }

  // ── Magazine grid (Beauty Editorial Anthology) ─────────────
  function MagazineGrid() {
    if (filtered.length === 0) return <NoResults />;

    const hero = pickHero(filtered);
    const heroExclude = hero ? [hero] : [];
    const satellites = pickSatellites(filtered, 2, heroExclude);
    const featuredItems = [...heroExclude, ...satellites];
    const staffPicks = pickStaffPicks(filtered, 3, featuredItems);
    const archiveExclude = new Set(
      [...featuredItems, ...staffPicks].map((p) => p.id)
    );
    const archive = filtered.filter((p) => !archiveExclude.has(p.id));
    const summary = getCollectionSummary(filtered);
    const issueLabel = getIssueLabel(undefined);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Issue masthead */}
        <div style={{ paddingBottom: 6 }}>
          <div
            className="hd-mono hd-caps"
            style={{
              fontSize: 10,
              letterSpacing: "0.24em",
              color: "var(--hd-ink-60)",
              marginBottom: 4,
            }}
          >
            {issueLabel}
          </div>
          <div
            className="hd-mono hd-caps"
            style={{
              fontSize: 9,
              letterSpacing: "0.18em",
              color: "var(--hd-ink-40)",
            }}
          >
            COLLECTED {String(summary.count).padStart(2, "0")}
            {" · "}
            {summary.genreCount} GENRES
            {" · "}
            {summary.brandCount} BRANDS
          </div>
        </div>

        {/* IN THIS EDITION — Hero + 2 satellites */}
        {hero && (
          <>
            <SectionDivider
              title="IN THIS EDITION"
              count={`${String(featuredItems.length).padStart(2, "0")} ITEMS`}
              marginTop={8}
              marginBottom={14}
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 1fr",
                gap: 14,
                alignItems: "stretch",
              }}
            >
              <div style={{ opacity: deletingId === hero.id ? 0.5 : 1 }}>
                <EditorialCard
                  {...editorialCardProps(hero, 0, true)}
                  aspectRatio="2/3"
                  forceVariant="polaroid"
                  showFeaturedBadge
                  favSize={26}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                {satellites.map((p, i) => (
                  <div
                    key={p.id}
                    style={{
                      flex: 1,
                      opacity: deletingId === p.id ? 0.5 : 1,
                    }}
                  >
                    <EditorialCard
                      {...editorialCardProps(p, i + 1, i === 0)}
                      aspectRatio="2/1.6"
                      forceVariant={i === 0 ? "clean" : "bordered"}
                      favSize={20}
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* STAFF PICKS — favorited */}
        {staffPicks.length > 0 && (
          <>
            <SectionDivider
              title="STAFF PICKS"
              count={String(staffPicks.length).padStart(2, "0")}
              marginTop={28}
              marginBottom={14}
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${Math.min(staffPicks.length, 3)},1fr)`,
                gap: 14,
              }}
            >
              {staffPicks.map((p, i) => (
                <div
                  key={p.id}
                  style={{ opacity: deletingId === p.id ? 0.5 : 1 }}
                >
                  <EditorialCard
                    {...editorialCardProps(p, featuredItems.length + i)}
                    aspectRatio="1/1.25"
                    favSize={20}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {/* ARCHIVE — rest */}
        {archive.length > 0 && (
          <>
            <SectionDivider
              title="ARCHIVE"
              count={`${String(archive.length).padStart(2, "0")} ITEMS`}
              marginTop={28}
              marginBottom={14}
            />
            {EditorialOverflowSection({
              items: archive,
              startIdx: featuredItems.length + staffPicks.length,
            })}
          </>
        )}

        {editMode && EditGenrePanels()}
      </div>
    );
  }

  // ── Mosaic grid ───────────────────────────────────────────
  function MosaicGrid() {
    if (filtered.length === 0) return <NoResults />;
    const left = filtered[0];
    const rightStack = filtered.slice(1, 4);
    const wide = filtered[4];
    const rest = filtered.slice(5);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {/* Top section — right column stretches to match left card height */}
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 8, alignItems: "start" }}>
          {left && (
            <div style={{ aspectRatio: "2/2.8", opacity: deletingId === left.id ? 0.5 : 1 }}>
              <CoverCard
                {...coverCardProps(left, 0, true)}
                style={{ width: "100%", height: "100%", borderRadius: 0 }}
                nameSize={12}
                favSize={24}
              />
            </div>
          )}
          {/* Right stack — flex:1 so 3 items share the left card's height */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignSelf: "stretch" }}>
            {rightStack.map((p, i) => (
              <div key={p.id} style={{ flex: 1, minHeight: 0, overflow: "hidden", borderRadius: 0, opacity: deletingId === p.id ? 0.5 : 1 }}>
                <CoverCard
                  {...coverCardProps(p, i + 1)}
                  style={{ width: "100%", height: "100%", borderRadius: 0 }}
                  nameSize={10}
                  favSize={20}
                />
              </div>
            ))}
          </div>
        </div>
        {/* Full-width bottom */}
        {wide && (
          <div style={{ aspectRatio: "16/6", opacity: deletingId === wide.id ? 0.5 : 1 }}>
            <CoverCard
              {...coverCardProps(wide, 4)}
              style={{ width: "100%", height: "100%", borderRadius: 0 }}
              nameSize={14}
              brandSize={7.5}
              favSize={24}
            />
          </div>
        )}
        {/* Remaining items */}
        {OverflowSection({ items: rest, startIdx: 5 })}
        {editMode && EditGenrePanels()}
      </div>
    );
  }

  // ── Edit genre panels (used in magazine/mosaic) ───────────
  function EditGenrePanels() {
    return (
      <>
        {filtered.map((p) =>
          editingGenreId === p.id ? (
            <div key={p.id} style={{ padding: "10px 0" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ fontFamily: "var(--hd-mono)", fontSize: 8, letterSpacing: "0.16em", color: "var(--hd-ink-40)", marginBottom: 8 }}>
                {p.name} のカテゴリ変更
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {PRODUCT_GENRES.filter((g) => g.key !== "other").map((g) => (
                  <button
                    key={g.key}
                    onClick={() => { handleGenreChange(p.id, g.key); setEditingGenreId(null); }}
                    style={{
                      fontSize: 9, padding: "4px 10px", borderRadius: 0,
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
            </div>
          ) : null
        )}
        {editMode && selectedIds.size > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Array.from(selectedIds).map((id) => {
              const p = products.find((pr) => pr.id === id);
              if (!p) return null;
              return (
                <button
                  key={id}
                  onClick={(e) => { e.stopPropagation(); setEditingGenreId(editingGenreId === id ? null : id); }}
                  style={{
                    fontSize: 9, padding: "5px 10px", borderRadius: 0,
                    border: "none", background: "var(--hd-surface-2)", color: "var(--hd-ink-60)",
                    cursor: "pointer", fontFamily: "var(--hd-sans)",
                  }}
                >
                  {p.name.slice(0, 10)} カテゴリ変更
                </button>
              );
            })}
          </div>
        )}
      </>
    );
  }

  // ── List layout ───────────────────────────────────────────
  function ListLayout() {
    if (filtered.length === 0) return <NoResults />;
    return (
      <div>
        {filtered.map((p, idx) => {
          const genre = getGenreByKey(p.productType || "other");
          const isSelected = selectedIds.has(p.id);
          const cats: CategoryKey[] = [];
          const seen = new Set<string>();
          p.ingredients.forEach((pi) => {
            const ing = getIngredientById(pi.ingredientId);
            if (ing?.activeIngredient) {
              ing.categories.forEach((c) => {
                if (!seen.has(c)) { seen.add(c); cats.push(c); }
              });
            }
          });
          const shownCats = cats.slice(0, 3);
          const extraCats = cats.length > 3 ? cats.length - 3 : 0;

          return (
            <div key={p.id} style={{ opacity: deletingId === p.id ? 0.5 : 1 }}>
              <div
                className={selectionMode ? "hd-no-press" : undefined}
                onClick={() => selectionMode ? toggleSelect(p.id) : router.push(`/product/${p.id}`)}
                style={{
                  display: "flex", alignItems: "stretch", gap: 14,
                  padding: "14px 0",
                  borderBottom: idx < filtered.length - 1 ? "1px solid var(--hd-hair)" : "none",
                  cursor: "pointer",
                  WebkitTapHighlightColor: selectionMode ? "transparent" : undefined,
                }}
              >
                {/* Edit/Share select */}
                {selectionMode && (
                  <div
                    style={{
                      alignSelf: "center",
                      width: 22, height: 22, borderRadius: 999, flexShrink: 0,
                      background: isSelected ? "var(--hd-moss)" : "transparent",
                      color: isSelected ? "#fff" : "var(--hd-ink-40)",
                      border: isSelected ? "none" : "1.5px solid var(--hd-hair)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    {isSelected && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
                  </div>
                )}

                {/* Thumbnail */}
                <div
                  style={{
                    width: 70, height: 86, borderRadius: 0,
                    overflow: "hidden", flexShrink: 0, position: "relative",
                  }}
                >
                  {p.packageImage && !failedImageIds.has(p.id) ? (
                    <Image
                      src={p.packageImageThumb ?? p.packageImage}
                      alt={p.name}
                      fill
                      style={{ objectFit: "cover" }}
                      sizes="70px"
                      priority={idx < 4}
                      loading={idx < 4 ? undefined : "lazy"}
                      onError={() => setFailedImageIds((prev) => new Set(prev).add(p.id))}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%", height: "100%",
                        background: genre ? `${genre.color}18` : "var(--hd-mint-bg)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      {genre ? <ProductGenreIcon genre={genre.key} size={24} /> : <span style={{ fontSize: 22 }}>📦</span>}
                    </div>
                  )}
                  {/* Texture overlay */}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)", pointerEvents: "none" }} />
                </div>

                {/* Info area */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  {/* Brand row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    {editMode && editingNameId === p.id ? (
                      <div style={{ display: "flex", gap: 4, flex: 1 }} onClick={(e) => e.stopPropagation()}>
                        <input
                          autoFocus
                          value={editNameValue}
                          onChange={(e) => setEditNameValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleNameSave(p.id); if (e.key === "Escape") setEditingNameId(null); }}
                          style={{
                            flex: 1, fontSize: 12, fontWeight: 600,
                            border: "1px solid var(--hd-hair)",
                            padding: "4px 8px", fontFamily: "var(--hd-sans)",
                            background: "var(--hd-bg)", outline: "none", minWidth: 0,
                          }}
                        />
                        <button
                          onClick={() => handleNameSave(p.id)}
                          style={{
                            fontSize: 10, padding: "4px 8px",
                            background: "var(--hd-moss)", color: "#fff",
                            border: "none", cursor: "pointer", flexShrink: 0,
                            fontFamily: "var(--hd-sans)",
                          }}
                        >保存</button>
                      </div>
                    ) : (
                      <>
                        <span
                          style={{
                            fontFamily: "var(--hd-mono)", fontSize: 8,
                            letterSpacing: "0.18em", textTransform: "uppercase",
                            color: "var(--hd-moss)",
                          }}
                        >
                          {p.brand || "BRAND"}
                        </span>
                        <span style={{ fontFamily: "var(--hd-mono)", fontSize: 8, color: "var(--hd-ink-40)" }}>
                          N°{String(idx + 1).padStart(3, "0")}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Product name */}
                  {!(editMode && editingNameId === p.id) && (
                    <div
                      style={{
                        fontFamily: "var(--hd-serif)", fontSize: 14,
                        fontStyle: "italic", lineHeight: 1.25, letterSpacing: "-0.01em",
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                        overflow: "hidden", marginTop: 4,
                      }}
                    >
                      {p.name}
                    </div>
                  )}

                  {/* Effect pills (category icons) */}
                  <div style={{ display: "flex", gap: 4, marginTop: 6, marginBottom: 4, alignItems: "center" }}>
                    {shownCats.map((catKey) => {
                      const info = ACTIVE_CATEGORIES.find((c) => c.key === catKey);
                      return info ? (
                        <span
                          key={catKey}
                          title={info.label}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 3,
                            padding: "2px 7px", borderRadius: 999,
                            background: info.color + "18", color: info.color,
                            fontFamily: "var(--hd-sans)", fontSize: 9, fontWeight: 600,
                          }}
                        >
                          <ActiveCategoryIcon category={info.key} size={9} />
                          {info.label}
                        </span>
                      ) : null;
                    })}
                    {extraCats > 0 && (
                      <span style={{ fontFamily: "var(--hd-mono)", fontSize: 8, color: "var(--hd-ink-40)" }}>
                        +{extraCats}
                      </span>
                    )}
                  </div>

                  {/* Meta row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {genre && (
                        <span
                          style={{
                            fontFamily: "var(--hd-mono)", fontSize: 8,
                            letterSpacing: "0.1em", textTransform: "uppercase",
                            color: "var(--hd-ink-40)",
                          }}
                        >
                          {genre.label}
                        </span>
                      )}
                      {editMode && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingGenreId(editingGenreId === p.id ? null : p.id); }}
                          style={{
                            fontSize: 8, padding: "2px 8px",
                            border: "1px solid var(--hd-hair)",
                            background: "transparent", color: "var(--hd-ink-60)",
                            cursor: "pointer", fontFamily: "var(--hd-sans)",
                          }}
                        >変更</button>
                      )}
                      {editMode && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditNameValue(p.name); setEditingNameId(p.id); }}
                          style={{
                            fontSize: 8, padding: "2px 8px",
                            border: "1px solid var(--hd-hair)",
                            background: "transparent", color: "var(--hd-ink-60)",
                            cursor: "pointer", fontFamily: "var(--hd-sans)",
                          }}
                        >名前変更</button>
                      )}
                    </div>

                    {/* Favorite button */}
                    {!editMode && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleFavorite(p.id, p.isFavorite); }}
                        aria-label={p.isFavorite ? "お気に入り解除" : "お気に入り追加"}
                        style={{
                          width: 24, height: 24, borderRadius: 999,
                          background: p.isFavorite ? "var(--hd-moss)" : "var(--hd-surface-2)",
                          color: p.isFavorite ? "#fff" : "var(--hd-ink-40)",
                          border: "none", cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}
                      >
                        <StarIcon size={10} color="currentColor" filled={p.isFavorite} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Genre picker (list mode) */}
              {editMode && editingGenreId === p.id && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingBottom: 10 }} onClick={(e) => e.stopPropagation()}>
                  {PRODUCT_GENRES.filter((g) => g.key !== "other").map((g) => (
                    <button
                      key={g.key}
                      onClick={() => { handleGenreChange(p.id, g.key); setEditingGenreId(null); }}
                      style={{
                        fontSize: 9, padding: "4px 10px", borderRadius: 0,
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
    );
  }

  // ── Filter pill style ──────────────────────────────────────
  const pillStyle = (on: boolean): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0,
    padding: "7px 13px", borderRadius: 0, cursor: "pointer", border: "none",
    background: on ? "var(--hd-ink)" : "var(--hd-surface-2)",
    color: on ? "var(--hd-bg)" : "var(--hd-ink-60)",
    fontFamily: "var(--hd-serif)", fontSize: 12,
    fontStyle: on ? "italic" : "normal",
  });

  // ── Layout icons map ───────────────────────────────────────
  const layoutIcons: Record<LayoutMode, React.ReactNode> = {
    magazine: <MagazineIcon />,
    mosaic: <MosaicIcon />,
    list: <ListIcon />,
  };

  return (
    <AuthGuard>
      <div className="hd-root hd-softa" data-density="compact" data-card="default">
        <div className="hd hd-page" style={{ minHeight: "100vh", background: "var(--hd-bg)" }}>
          <div style={{ padding: "16px 20px 96px" }}>

            {/* ── Sticky Header ── */}
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
              {/* Top row: title + controls */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div>
                  <div className="hd-mono hd-caps" style={{ color: "var(--hd-ink-40)", fontSize: 9 }}>
                    My Cosmetics · {String(products.length).padStart(3, "0")}
                  </div>
                  <div
                    className="hd-serif"
                    style={{ fontSize: 38, fontStyle: "italic", color: "var(--hd-ink)", lineHeight: 1, marginTop: 4 }}
                  >
                    My shelf.
                  </div>
                  {/* Layout name pill */}
                  <div
                    style={{
                      display: "inline-flex", alignItems: "center",
                      marginTop: 6, padding: "3px 10px", borderRadius: 0,
                      background: "var(--hd-mint-bg)", border: "1px solid var(--hd-mint-bg)",
                      fontFamily: "var(--hd-serif)", fontSize: 12,
                      fontStyle: "italic", color: "var(--hd-moss)",
                    }}
                  >
                    {layoutLabels[layout]} ▾
                  </div>
                </div>

                {/* Right controls */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                  {/* Layout toggle */}
                  <div
                    style={{
                      display: "flex", gap: 4, padding: 3,
                      background: "var(--hd-surface-2)", borderRadius: 0,
                    }}
                  >
                    {(["magazine", "mosaic", "list"] as LayoutMode[]).map((m) => {
                      const on = layout === m;
                      return (
                        <button
                          key={m}
                          onClick={() => setLayout(m)}
                          title={layoutLabels[m]}
                          style={{
                            padding: "6px 8px", borderRadius: 0, border: "none",
                            background: on ? "var(--hd-ink)" : "transparent",
                            color: on ? "var(--hd-bg)" : "var(--hd-ink-40)",
                            cursor: "pointer", display: "flex", alignItems: "center",
                          }}
                        >
                          {layoutIcons[m]}
                        </button>
                      );
                    })}
                  </div>

                  {/* Edit / Share controls */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {/* シェア選択モード時：n/4 表示 + 決定 */}
                    {shareSelectMode && (
                      <>
                        <span
                          style={{
                            fontFamily: "var(--hd-mono)",
                            fontSize: 11,
                            color: "var(--hd-ink-60)",
                            letterSpacing: "0.1em",
                          }}
                        >
                          {selectedIds.size} / 4
                        </span>
                        <button
                          onClick={() => {
                            if (selectedIds.size !== 4) return;
                            try {
                              sessionStorage.setItem(
                                "hadami.shareCosmetics.draft",
                                JSON.stringify({
                                  selectedProductIds: Array.from(selectedIds),
                                }),
                              );
                              router.push("/share/cosmetics");
                            } catch (err) {
                              console.error("Failed to start share flow:", err);
                            }
                          }}
                          disabled={selectedIds.size !== 4}
                          style={{
                            padding: "7px 12px",
                            border: "none",
                            background:
                              selectedIds.size === 4
                                ? "var(--hd-moss)"
                                : "var(--hd-surface-2)",
                            color:
                              selectedIds.size === 4 ? "#fff" : "var(--hd-ink-40)",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: selectedIds.size === 4 ? "pointer" : "default",
                            fontFamily: "var(--hd-sans)",
                          }}
                        >
                          決定
                        </button>
                      </>
                    )}

                    {/* 編集モード時：削除ボタン */}
                    {editMode && selectedIds.size > 0 && (
                      <button
                        onClick={handleBulkDelete}
                        style={{
                          padding: "7px 12px", border: "none",
                          background: "var(--hd-terra)", color: "#fff",
                          fontSize: 11, fontWeight: 600, cursor: "pointer",
                          fontFamily: "var(--hd-sans)",
                        }}
                      >
                        {selectedIds.size}件削除
                      </button>
                    )}

                    {/* シェアボタン（通常時） */}
                    {!editMode && !shareSelectMode && products.length > 0 && (
                      <button
                        onClick={() => {
                          setShareSelectMode(true);
                          setSelectedIds(new Set());
                        }}
                        style={{
                          padding: "7px 12px",
                          background: "transparent",
                          color: "var(--hd-ink)",
                          border: "1px solid var(--hd-ink)",
                          fontSize: 10,
                          cursor: "pointer",
                          fontFamily: "var(--hd-mono)",
                          letterSpacing: "0.18em",
                        }}
                      >
                        SHARE
                      </button>
                    )}

                    {/* EDIT/DONE ボタン（シェア選択モード時は非表示） */}
                    {!shareSelectMode && products.length > 0 && (
                      <button
                        onClick={() => { setEditMode(!editMode); setEditingGenreId(null); setSelectedIds(new Set()); setEditingNameId(null); }}
                        style={{
                          padding: "7px 12px",
                          background: editMode ? "var(--hd-ink)" : "transparent",
                          color: editMode ? "var(--hd-bg)" : "var(--hd-ink)",
                          border: editMode ? "none" : "1px solid var(--hd-ink)",
                          fontSize: 10, cursor: "pointer",
                          fontFamily: "var(--hd-mono)", letterSpacing: "0.18em",
                        }}
                      >
                        {editMode ? "DONE" : "EDIT"}
                      </button>
                    )}

                    {/* シェア選択モード時のキャンセル */}
                    {shareSelectMode && (
                      <button
                        onClick={() => {
                          setShareSelectMode(false);
                          setSelectedIds(new Set());
                        }}
                        style={{
                          padding: "7px 12px",
                          background: "transparent",
                          color: "var(--hd-ink-60)",
                          border: "1px solid var(--hd-line)",
                          fontSize: 10, cursor: "pointer",
                          fontFamily: "var(--hd-mono)", letterSpacing: "0.18em",
                        }}
                      >
                        CANCEL
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: "none" }} />

              {imageError && (
                <div
                  style={{
                    display: "flex", gap: 10, marginBottom: 14,
                    padding: "12px 14px",
                    background: "var(--hd-surface)", border: "1px solid var(--hd-terra)",
                    fontSize: 12, color: "var(--hd-terra)", fontFamily: "var(--hd-sans)",
                  }}
                >
                  ⚠️ {imageError}
                </div>
              )}

              {/* シェア選択モードのヒントバー */}
              {shareSelectMode && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    marginBottom: 14,
                    padding: "10px 14px",
                    background: "var(--hd-mint-bg)",
                    border: "1px solid var(--hd-moss)",
                    fontSize: 12,
                    color: "var(--hd-moss-deep)",
                    fontFamily: "var(--hd-sans)",
                  }}
                >
                  <span>
                    シェアするコスメを <strong>4点</strong> タップしてください。決定で編集画面に進みます。
                  </span>
                  <span
                    className="hd-mono"
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.1em",
                      flexShrink: 0,
                    }}
                  >
                    {selectedIds.size} / 4
                  </span>
                </div>
              )}

              {/* Filter bar */}
              <div
                style={{
                  display: "flex", gap: 6,
                  overflowX: "auto", WebkitOverflowScrolling: "touch",
                  paddingBottom: 2,
                }}
              >
                <button onClick={() => setActiveFilter("all")} style={pillStyle(activeFilter === "all")}>
                  すべて
                </button>
                <button onClick={() => setActiveFilter("fav")} style={pillStyle(activeFilter === "fav")}>
                  <StarIcon size={10} color={activeFilter === "fav" ? "currentColor" : "#F59E0B"} filled={activeFilter === "fav"} />
                  お気に入り
                </button>
                {activeGenres.map((g) => (
                  <button key={g.key} onClick={() => setActiveFilter(g.key)} style={pillStyle(activeFilter === g.key)}>
                    <ProductGenreIcon genre={g.key} size={10} />
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Content ── */}
            {products.length === 0 ? (
              <EmptyState />
            ) : (
              <div>
                {layout === "magazine" && MagazineGrid()}
                {layout === "mosaic" && MosaicGrid()}
                {layout === "list" && ListLayout()}
              </div>
            )}

            <Disclaimer />

            {/* Off-screen capture area */}
            <div
              ref={captureRef}
              style={{
                position: "absolute", left: -9999, top: 0,
                width: 360, height: 360, overflow: "hidden",
                padding: 16, background: "var(--hd-bg)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 16, fontWeight: 700 }}>⭐ お気に入りコスメ</span>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, fontWeight: 600, background: "#FFF8E1", color: "#F59E0B" }}>
                  {favCount}件
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {products.filter((p) => p.isFavorite).slice(0, 4).map((p) => {
                  const genre = getGenreByKey(p.productType || "other");
                  return (
                    <div key={p.id} style={{ background: "#fff", border: "2px solid #F59E0B", overflow: "hidden" }}>
                      <div style={{ position: "relative", width: "100%", aspectRatio: "1/1" }}>
                        {p.packageImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.packageImage} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, background: "var(--hd-mint-bg)" }}>
                            {genre?.icon || "📦"}
                          </div>
                        )}
                      </div>
                      <div style={{ padding: "4px 8px" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                        <div style={{ fontSize: 9, color: "var(--hd-ink-60)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.brand}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <ScrollToTop />
      </div>
    </AuthGuard>
  );
}
