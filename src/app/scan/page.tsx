"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import StepIndicator from "@/components/scan/StepIndicator";
import CaptureStep from "@/components/scan/CaptureStep";
import IdentifyStep from "@/components/scan/IdentifyStep";
import ClassifyStep from "@/components/scan/ClassifyStep";
import ScanResult from "@/components/scan/ScanResult";
import ScanDiscoveryAd from "@/components/recommendations/ScanDiscoveryAd";
import ManualInputSheet from "@/components/scan/ManualInputSheet";
import DiscoveryModal from "@/components/ui/DiscoveryModal";
import AuthGuard from "@/components/ui/AuthGuard";
import Disclaimer from "@/components/ui/Disclaimer";
import { extractIngredients } from "@/lib/ocr";
import { findCombinations } from "@/lib/combinations";
import { getIngredientById, getIngredientByInci, getIngredientByName, isActiveIngredient } from "@/lib/ingredients";
import { resolveActiveIngredient } from "@/lib/mhlwActiveIngredients";
import { resolveActiveIngredients, type ResolvedActiveIngredient } from "@/lib/activeIngredientResolver";
import { useProductStore } from "@/stores/useProductStore";
import { useZukanStore } from "@/stores/useZukanStore";
import { useUser } from "@/lib/auth";
import {
  saveProductToDb,
  saveDiscoveriesToDb,
  saveScanHistory,
  getUserLimit,
  getMonthlyScanLimit,
  getScanCountByEmail,
  getProductCount,
} from "@/lib/db";
import { getSignedImageUrls } from "@/lib/storage";
import {
  getProductImagePath,
  getProductImageThumbPath,
} from "@/lib/productImages";
import { Ingredient, Combination, ProductGenre } from "@/types";
import { normalizeGenreFromScan } from "@/lib/productGenres";

type WizardStep = 1 | 2 | 3 | 4;

interface ScannedProduct {
  productName: string;
  brand: string;
  productType: string;
  found: boolean;
  ingredients: string;
  isQuasiDrug?: boolean;
  activeIngredients?: string[];
}

export default function ScanPage() {
  return (
    <Suspense fallback={null}>
      <ScanPageInner />
    </Suspense>
  );
}

function ScanPageInner() {
  const { user, supabase } = useUser();

  // Wizard step
  const [step, setStep] = useState<WizardStep>(1);
  // Image data
  const [packageImage, setPackageImage] = useState("");
  const [packageImageColor, setPackageImageColor] = useState("");

  // Progress (Step 2)
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState("");
  const [showFallback, setShowFallback] = useState(false);

  // Multi-product (Step 2)
  const [multiProducts, setMultiProducts] = useState<ScannedProduct[]>([]);
  const [multiSavedIndexes, setMultiSavedIndexes] = useState<Set<number>>(new Set());
  const [showMultiSheet, setShowMultiSheet] = useState(false);

  // Product info (Step 3)
  const [productName, setProductName] = useState("");
  const [brand, setBrand] = useState("");
  const [productType, setProductType] = useState<ProductGenre>("other");

  // Results (Step 4)
  const [foundIngredients, setFoundIngredients] = useState<{ ingredient: Ingredient; orderIndex: number }[]>([]);
  const [unknownIngredients, setUnknownIngredients] = useState<string[]>([]);
  const [combinations, setCombinations] = useState<Combination[]>([]);
  const [newDiscoveries, setNewDiscoveries] = useState<Ingredient[]>([]);
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const isSavingRef = useRef(false);
  const [isQuasiDrug, setIsQuasiDrug] = useState(false);
  const [resolvedActiveIngredients, setResolvedActiveIngredients] = useState<ResolvedActiveIngredient[]>([]);
  const [, setScanEvidenceMap] = useState<
    Record<string, { isQuasiDrug?: boolean; activeIngredients?: string[] }>
  >({});
  const scanEvidenceRef = useRef<Record<string, { isQuasiDrug?: boolean; activeIngredients?: string[] }>>({});

  const addProduct = useProductStore((s) => s.addProduct);
  const getProduct = useProductStore((s) => s.getProduct);
  const discover = useZukanStore((s) => s.discover);
  const setRecentlyFound = useZukanStore((s) => s.setRecentlyFound);
  const setUnsavedScan = useZukanStore((s) => s.setUnsavedScan);
  const searchParams = useSearchParams();
  const router = useRouter();

  // 再スキャン: 履歴からの遷移時
  useEffect(() => {
    const rescanId = searchParams.get("rescan");
    if (!rescanId) return;
    const product = getProduct(rescanId);
    if (product) {
      setProductName(product.name);
      setBrand(product.brand);
      if (product.packageImage) setPackageImage(product.packageImage);
    }
    router.replace("/scan", { scroll: false });
  }, [searchParams, getProduct, router]);

  // 未保存時の離脱アラート（ステップ2以降〜保存完了まで）
  const isUnsaved = step >= 2 && !saved;
  useEffect(() => {
    setUnsavedScan(isUnsaved);
    if (!isUnsaved) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => {
      window.removeEventListener("beforeunload", handler);
      setUnsavedScan(false);
    };
  }, [isUnsaved, setUnsavedScan]);

  const userLimit = getUserLimit();
  const monthlyScanLimit = getMonthlyScanLimit();
  const [scanLimitReached, setScanLimitReached] = useState(false);
  const [showManualSheet, setShowManualSheet] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    getScanCountByEmail(supabase, user.email).then((count) => {
      if (count >= monthlyScanLimit) setScanLimitReached(true);
    });
  }, [user, supabase, monthlyScanLimit]);

  const resolveActiveIngredientIds = useCallback((names?: string[]) => {
    if (!names?.length) return [] as string[];

    return Array.from(
      new Set(
        names
          .map((name) => {
            const mhlw = resolveActiveIngredient(name);
            if (mhlw) return mhlw.masterDbId;

            const ingredient = getIngredientByName(name) || getIngredientByInci(name);
            return ingredient?.id;
          })
          .filter((id): id is string => Boolean(id))
      )
    );
  }, []);

  const resolveUploadedImage = useCallback(
    async (productId: string, fallbackUrl: string | null) => {
      if (!user || !fallbackUrl) {
        return {
          packageImage: fallbackUrl ?? undefined,
          packageImagePath: undefined,
          packageImageThumb: fallbackUrl ?? undefined,
          packageImageThumbPath: undefined,
        };
      }

      const packageImagePath = getProductImagePath(user.id, productId);
      const packageImageThumbPath = getProductImageThumbPath(user.id, productId);
      const signedImages = await getSignedImageUrls(supabase, [
        packageImagePath,
        packageImageThumbPath,
      ]);
      const signedImageUrl = signedImages[packageImagePath];
      const signedThumbUrl = signedImages[packageImageThumbPath];

      return {
        packageImage: signedImageUrl ?? fallbackUrl,
        packageImagePath,
        packageImageThumb: signedThumbUrl ?? signedImageUrl ?? fallbackUrl,
        packageImageThumbPath,
      };
    },
    [supabase, user]
  );

  const buildScanEvidenceKey = useCallback(
    (name: string, brandName: string) =>
      `${brandName.trim().toLowerCase()}::${name.trim().toLowerCase()}`,
    []
  );

  // 成分データ処理（有効成分リゾルバー統合）
  const processIngredients = useCallback(
    async (
      ingredientText: string,
      name: string,
      brandName: string,
      opts?: {
        isQuasiDrugOcr?: boolean;
        ocrActiveNames?: string[];
        isQuasiDrugWeb?: boolean;
        webActiveNames?: string[];
      },
    ) => {
      const derivedEvidence =
        scanEvidenceRef.current[buildScanEvidenceKey(name, brandName)] ||
        (Object.keys(scanEvidenceRef.current).length === 1
          ? Object.values(scanEvidenceRef.current)[0]
          : undefined);
      const isQuasiDrugWeb = opts?.isQuasiDrugWeb ?? derivedEvidence?.isQuasiDrug;
      const webActiveNames = opts?.webActiveNames ?? derivedEvidence?.activeIngredients;

      const result = await extractIngredients(ingredientText, {
        isQuasiDrug: opts?.isQuasiDrugOcr || isQuasiDrugWeb,
        ocrActiveNames: opts?.ocrActiveNames,
      });
      const foundIngs = result.found
        .map((f) => {
          const ingredient = getIngredientById(f.ingredientId);
          return ingredient ? { ingredient, orderIndex: f.orderIndex } : null;
        })
        .filter((f): f is { ingredient: Ingredient; orderIndex: number } => f !== null);

      const ingredientNames = foundIngs.map((f) => f.ingredient.nameJa);
      const combos = findCombinations(ingredientNames);
      // 図鑑登録は有効成分のみ
      const activeFoundIds = foundIngs
        .filter((f) => isActiveIngredient(f.ingredient.id))
        .map((f) => f.ingredient.id);
      const newIds = discover(activeFoundIds);
      const discoveries = newIds
        .map((id) => getIngredientById(id))
        .filter((i): i is Ingredient => i !== null);

      // 有効成分リゾルバー: 3層統合
      const qd = result.isQuasiDrug || isQuasiDrugWeb || false;
      const resolved = resolveActiveIngredients({
        ocrActiveNames: opts?.ocrActiveNames ?? [],
        webActiveNames: webActiveNames ?? [],
        allFoundIds: foundIngs.map((f) => f.ingredient.id),
        isQuasiDrugOcr: result.isQuasiDrug,
        isQuasiDrugWeb: isQuasiDrugWeb ?? false,
      });

      setProductName(name);
      setBrand(brandName);
      setFoundIngredients(foundIngs);
      setUnknownIngredients(result.unknown);
      setCombinations(combos);
      setNewDiscoveries(discoveries);
      setIsQuasiDrug(qd);
      setResolvedActiveIngredients(resolved);

      return discoveries;
    },
    [buildScanEvidenceKey, discover]
  );

  // 手動入力: スキャン回数を消費せず成分を解析
  const handleManualSubmit = useCallback(
    async (text: string, name: string, brandName: string) => {
      setShowManualSheet(false);
      setStep(2);
      setProgress(50);
      setProgressMsg("成分を照合しています...");

      const discoveries = await processIngredients(text, name, brandName);

      setProgress(100);
      setProgressMsg("完了！");

      setTimeout(() => {
        setStep(3);
        if (discoveries.length > 0) setShowDiscovery(true);
      }, 500);
    },
    [processIngredients]
  );

  const checkScanLimit = useCallback(async (): Promise<boolean> => {
    if (!user?.email) return false;
    const count = await getScanCountByEmail(supabase, user.email);
    if (count >= monthlyScanLimit) {
      setScanLimitReached(true);
      return false;
    }
    return true;
  }, [user, supabase, monthlyScanLimit]);

  // Step 1 → Step 2: パッケージ撮影 → ネット検索
  const handlePackageCapture = useCallback(
    async (imageData: string, colorImage?: string) => {
      const allowed = await checkScanLimit();
      if (!allowed) return;

      // マイコスメ保存枠チェック
      if (user) {
        const count = await getProductCount(supabase, user.id);
        if (count >= userLimit) {
          const proceed = window.confirm(
            `マイコスメの保存枠（${userLimit}件）がいっぱいです。\nスキャンはできますが、保存するには古いコスメを削除してください。\n\nスキャンを続けますか？`
          );
          if (!proceed) return;
        }
      }

      setPackageImage(imageData);
      setPackageImageColor(colorImage || imageData);
      setStep(2);
      setProgress(10);
      setProgressMsg("コスメを特定しています...");
      setShowFallback(false);

      try {
        setProgress(30);
        setProgressMsg("ネットで成分情報を検索中...");

        const res = await fetch("/api/scan-product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: colorImage || imageData,
            enhancedBase64: imageData,
          }),
        });

        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        const products: ScannedProduct[] = data.products || [data];
        const nextEvidenceMap = Object.fromEntries(
          products.map((product) => [
            buildScanEvidenceKey(product.productName || "", product.brand || ""),
            {
              isQuasiDrug: product.isQuasiDrug,
              activeIngredients: product.activeIngredients,
            },
          ])
        );
        scanEvidenceRef.current = nextEvidenceMap;
        setScanEvidenceMap(nextEvidenceMap);
        const foundProducts = products.filter((p: ScannedProduct) => p.found && p.ingredients);

        if (foundProducts.length > 1) {
          setMultiProducts(foundProducts);
          setProgress(100);
          setProgressMsg("複数のコスメを検出しました！");
          setTimeout(() => setShowMultiSheet(true), 500);
        } else if (foundProducts.length === 1) {
          const p = foundProducts[0];
          setProgress(80);
          setProgressMsg("成分を照合しています...");
          setProductType(normalizeGenreFromScan(p.productType || ""));

          const discoveries = await processIngredients(
            p.ingredients,
            p.productName || "スキャンしたコスメ",
            p.brand || "ブランド不明"
          );

          setProgress(100);
          setProgressMsg("完了！");

          setTimeout(() => {
            setStep(3);
            if (discoveries.length > 0) setShowDiscovery(true);
          }, 500);
        } else {
          const first = products[0] || data;
          setProductName(first.productName || "スキャンしたコスメ");
          setBrand(first.brand || "ブランド不明");
          setProductType(normalizeGenreFromScan(first.productType || ""));
          setShowFallback(true);
        }
      } catch (error) {
        console.error("Product search error:", error);
        // フロント側エラー時もスキャン枠を返却
        fetch("/api/rollback-scan", { method: "POST" }).catch(() => {});
        setProgressMsg("検索に失敗しました");
        setTimeout(() => setShowFallback(true), 1000);
      }
    },
    [buildScanEvidenceKey, processIngredients, checkScanLimit, user, supabase, userLimit]
  );

  // Step 2 fallback: 成分表直接撮影 → OCR
  const handleFallbackCapture = useCallback(
    async (imageData: string) => {
      setShowFallback(false);
      setProgress(10);
      setProgressMsg("画像を解析しています...");

      try {
        setProgress(30);
        const ocrRes = await fetch("/api/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: imageData }),
        });
        if (!ocrRes.ok) throw new Error("OCR API error");
        const {
          text,
          isQuasiDrug: ocrIsQuasiDrug,
          activeIngredients: ocrActiveIngredients,
        } = await ocrRes.json();
        const fallbackName = productName || "スキャンしたコスメ";
        const fallbackBrand = brand || "ブランド不明";
        const fallbackEvidenceKey = buildScanEvidenceKey(fallbackName, fallbackBrand);
        const nextEvidenceMap = {
          ...scanEvidenceRef.current,
          [fallbackEvidenceKey]: {
            isQuasiDrug: ocrIsQuasiDrug,
            activeIngredients: ocrActiveIngredients,
          },
        };
        scanEvidenceRef.current = nextEvidenceMap;
        setScanEvidenceMap(nextEvidenceMap);

        // OCRでテキストが取れなかった場合、スキャン枠を消費しない
        if (!text || !text.trim()) {
          setProgressMsg("成分を読み取れませんでした。もう一度お試しください。");
          setTimeout(() => setShowFallback(true), 1500);
          return;
        }

        setProgress(60);
        setProgressMsg("成分を照合しています...");

        const discoveries = await processIngredients(
          text,
          productName || "スキャンしたコスメ",
          brand || "ブランド不明"
        );

        setProgress(100);
        setProgressMsg("完了！");

        setTimeout(() => {
          setStep(3);
          if (discoveries.length > 0) setShowDiscovery(true);
        }, 500);
      } catch (error) {
        console.error("OCR error:", error);
        // エラー時もスキャン枠を返却
        fetch("/api/rollback-scan", { method: "POST" }).catch(() => {});
        setProgressMsg("エラーが発生しました。もう一度お試しください。");
        setTimeout(() => setShowFallback(true), 2000);
      }
    },
    [buildScanEvidenceKey, processIngredients, productName, brand]
  );

  // 複数コスメから1つ選択
  const handleSelectProduct = useCallback(
    async (product: ScannedProduct) => {
      setShowMultiSheet(false);
      setProgress(50);
      setProgressMsg("成分を照合しています...");
      setProductType(normalizeGenreFromScan(product.productType || ""));

      const discoveries = await processIngredients(
        product.ingredients,
        product.productName || "スキャンしたコスメ",
        product.brand || "ブランド不明"
      );

      setProgress(100);
      setProgressMsg("完了！");

      setTimeout(() => {
        setStep(3);
        if (discoveries.length > 0) setShowDiscovery(true);
      }, 300);
    },
    [processIngredients]
  );

  // 複数コスメを一括保存
  const handleSaveMulti = useCallback(
    async (product: ScannedProduct, index: number) => {
      if (!user || multiSavedIndexes.has(index)) return;

      const result0 = await extractIngredients(product.ingredients, {
        isQuasiDrug: product.isQuasiDrug,
        ocrActiveNames: product.activeIngredients,
      });
      const foundIngs = result0.found
        .map((f) => {
          const ingredient = getIngredientById(f.ingredientId);
          return ingredient ? { ingredient, orderIndex: f.orderIndex } : null;
        })
        .filter((f): f is { ingredient: Ingredient; orderIndex: number } => f !== null);
      const activeIngredientIds = resolveActiveIngredientIds(product.activeIngredients);

      const result = await saveProductToDb(supabase, user.id, {
        name: product.productName,
        brand: product.brand,
        productType: normalizeGenreFromScan(product.productType || ""),
        ingredientIds: foundIngs.map((f) => f.ingredient.id),
        unknownIngredients: result0.unknown,
        packageImageBase64: packageImageColor || packageImage || undefined,
        isQuasiDrug: product.isQuasiDrug,
        activeIngredientIds,
      });

      if (result.error) return;

      const savedImage = await resolveUploadedImage(
        result.productId!,
        result.imageUrl
      );

      const activeIds = foundIngs.filter((f) => isActiveIngredient(f.ingredient.id)).map((f) => f.ingredient.id);
      discover(activeIds);
      await saveDiscoveriesToDb(supabase, user.id, activeIds);

      // スキャン履歴保存（レコメンド用）
      saveScanHistory(
        supabase,
        user.id,
        product.productName,
        product.brand,
        foundIngs.map((f) => f.ingredient.id)
      ).catch((e) => console.error("scan history save error:", e));

      addProduct({
        id: result.productId!,
        name: product.productName,
        brand: product.brand,
        productType: normalizeGenreFromScan(product.productType || ""),
        packageImagePath: savedImage.packageImagePath,
        packageImage: savedImage.packageImage,
        packageImageThumbPath: savedImage.packageImageThumbPath,
        packageImageThumb: savedImage.packageImageThumb,
        isFavorite: false,
        createdAt: new Date().toISOString(),
        ingredients: foundIngs.map((f) => ({ ingredientId: f.ingredient.id, orderIndex: f.orderIndex })),
        isQuasiDrug: product.isQuasiDrug,
        activeIngredientIds,
      });

      setMultiSavedIndexes((prev) => new Set(prev).add(index));
    },
    [user, supabase, addProduct, discover, packageImage, packageImageColor, multiSavedIndexes, resolveActiveIngredientIds, resolveUploadedImage]
  );

  // Step 3 → Step 4
  const handleClassifyContinue = useCallback(() => {
    setStep(4);
  }, []);

  // Save
  const handleSave = useCallback(async () => {
    if (!user || saved || isSavingRef.current) return;
    isSavingRef.current = true;
    setSaveError("");

    try {
      const result = await saveProductToDb(supabase, user.id, {
        name: productName,
        brand,
        productType,
        ingredientIds: foundIngredients.map((f) => f.ingredient.id),
        unknownIngredients,
        packageImageBase64: packageImageColor || packageImage || undefined,
        isQuasiDrug,
        activeIngredientIds: resolvedActiveIngredients.map((ingredient) => ingredient.ingredientId),
      });

      if (result.error === "limit_reached") {
        isSavingRef.current = false;
        setSaveError(`保存上限（${userLimit}件）に達しています。古いコスメを削除してください。`);
        fetch("/api/rollback-scan", { method: "POST" }).catch(() => {});
        return;
      }
      if (result.error) {
        isSavingRef.current = false;
        setSaveError("保存に失敗しました。もう一度お試しください。");
        fetch("/api/rollback-scan", { method: "POST" }).catch(() => {});
        return;
      }

      const savedImage = await resolveUploadedImage(
        result.productId!,
        result.imageUrl
      );

      const activeDiscoveryIds = foundIngredients
        .filter((f) => isActiveIngredient(f.ingredient.id))
        .map((f) => f.ingredient.id);
      await saveDiscoveriesToDb(supabase, user.id, activeDiscoveryIds);

      // スキャン履歴保存（レコメンド用）
      saveScanHistory(
        supabase,
        user.id,
        productName,
        brand,
        foundIngredients.map((f) => f.ingredient.id)
      ).catch((e) => console.error("scan history save error:", e));

      addProduct({
        id: result.productId!,
        name: productName,
        brand,
        productType,
        packageImagePath: savedImage.packageImagePath,
        packageImage: savedImage.packageImage,
        packageImageThumbPath: savedImage.packageImageThumbPath,
        packageImageThumb: savedImage.packageImageThumb,
        isFavorite: false,
        createdAt: new Date().toISOString(),
        ingredients: foundIngredients.map((f) => ({ ingredientId: f.ingredient.id, orderIndex: f.orderIndex })),
        isQuasiDrug,
        activeIngredientIds: resolvedActiveIngredients.map((ingredient) => ingredient.ingredientId),
      });

      setSaved(true);
      setRecentlyFound(foundIngredients.map((f) => f.ingredient.id));
    } catch (e) {
      console.error("Save error:", e);
      isSavingRef.current = false;
      setSaveError("保存に失敗しました。もう一度お試しください。");
    }
  }, [user, supabase, addProduct, productName, brand, productType, packageImage, packageImageColor, foundIngredients, unknownIngredients, userLimit, saved, setRecentlyFound, isQuasiDrug, resolvedActiveIngredients, resolveUploadedImage]);

  const doReset = useCallback(() => {
    setStep(1);
    setPackageImage("");
    setPackageImageColor("");
    setProgress(0);
    setProgressMsg("");
    setProductName("");
    setBrand("");
    setProductType("other");
    setFoundIngredients([]);
    setUnknownIngredients([]);
    setCombinations([]);
    setNewDiscoveries([]);
    setSaved(false);
    setSaveError("");
    setIsQuasiDrug(false);
    setResolvedActiveIngredients([]);
    setScanLimitReached(false);
    setScanEvidenceMap({});
    scanEvidenceRef.current = {};
    setMultiProducts([]);
    setMultiSavedIndexes(new Set());
    setShowFallback(false);
    setShowMultiSheet(false);
    setShowManualSheet(false);
  }, []);

  const handleReset = useCallback(() => {
    if (step >= 2 && !saved) {
      if (!window.confirm("スキャン結果がまだ保存されていません。破棄しますか？")) return;
    }
    doReset();
  }, [step, saved, doReset]);

  // No event listener needed — TabBar directly calls triggerCameraOpen() via global ref

  return (
    <AuthGuard>
      <div className="min-h-screen bg-bo-cream animate-fade-in">
        {/* Sticky header — only show when step > 1 */}
        {step > 1 && (
          <div className="sticky top-0 z-50 flex items-center px-4 py-2.5
                          bg-bo-cream/90 backdrop-blur-xl border-b border-bo-parchment/40">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-r1 bg-white text-sm font-semibold text-bo-ink-muted
                         cursor-pointer font-sans pressable border-none shadow-bo1"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              最初から
            </button>
          </div>
        )}

        <div className="px-5 pt-4 pb-6">
          {/* Step indicator */}
          <StepIndicator currentStep={step} />

          {/* Scan limit warning */}
          {scanLimitReached && step === 1 && (
            <div className="rounded-r2 p-5 mb-5 text-center bg-white shadow-bo2">
              <div className="w-14 h-14 rounded-[18px] mx-auto mb-3 flex items-center justify-center
                              bg-red-50">
                <span className="text-2xl">🚫</span>
              </div>
              <div className="font-bold text-sm mb-1 text-bo-ink font-sans">
                無料スキャン上限（{monthlyScanLimit}回）に達しました
              </div>
              <div className="text-xs text-bo-ink-muted mb-4 font-sans">
                ベータ版では1アカウントにつき{monthlyScanLimit}回まで無料です
              </div>
              <button
                onClick={() => setShowManualSheet(true)}
                className="px-6 py-3 rounded-r2 text-sm font-bold text-white bg-bo-accent shadow-bo-accent
                           border-none cursor-pointer pressable font-sans"
              >
                成分を手動入力する
              </button>
              <div className="text-[10px] text-bo-ink-faint mt-2.5 font-sans">
                手動入力はスキャン回数にカウントされません
              </div>
            </div>
          )}

          {/* Step 1: Capture — hidden file input + guide to bottom scan button */}
          {step === 1 && (
            <>
              <CaptureStep
                onCapture={handlePackageCapture}
                disabled={scanLimitReached}
                hidden
              />
              <div className="flex flex-col items-center pt-10 pb-6 animate-fade-in">
                {/* Pulsing ring around camera icon */}
                <div className="relative w-24 h-24 flex items-center justify-center mb-6">
                  <div className="absolute inset-0 rounded-full bg-bo-accent/10 animate-[scan-ring_2s_ease-in-out_infinite]" />
                  <div className="absolute inset-2 rounded-full bg-bo-accent/15 animate-[scan-ring_2s_ease-in-out_infinite_0.4s]" />
                  <div className="absolute inset-4 rounded-full bg-bo-accent/10 animate-[scan-ring_2s_ease-in-out_infinite_0.8s]" />
                  <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-bo-accent to-[#2D7A66] flex items-center justify-center shadow-lg">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4z" fill="white"/>
                      <path d="M9 2L7.17 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2h-3.17L15 2H9zm3 15a5 5 0 110-10 5 5 0 010 10z" fill="white"/>
                    </svg>
                  </div>
                </div>

                <h2 className="text-base font-bold text-bo-ink font-sans mb-2">
                  パッケージを撮影してスキャン
                </h2>
                <p className="text-xs text-bo-ink-muted font-sans leading-relaxed text-center mb-6">
                  下のスキャンボタンを押して<br/>化粧品のパッケージを撮影してください
                </p>

                {/* Bouncing arrow pointing to bottom tab */}
                <div className="animate-bounce text-bo-accent">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 5v14M5 12l7 7 7-7"/>
                  </svg>
                </div>
              </div>

              <div className="mt-2">
                <ScanDiscoveryAd />
              </div>
              <div className="mt-4">
                <Disclaimer />
              </div>
            </>
          )}

          {/* Step 2: Identify */}
          {step === 2 && (
            <IdentifyStep
              progress={progress}
              message={progressMsg}
              imagePreview={packageImageColor || packageImage}
              showFallback={showFallback}
              onFallbackCapture={handleFallbackCapture}
              multiProducts={multiProducts}
              onSelectProduct={handleSelectProduct}
              onSaveMulti={handleSaveMulti}
              multiSavedIndexes={multiSavedIndexes}
              showMultiSheet={showMultiSheet}
              onCloseMultiSheet={() => setShowMultiSheet(false)}
            />
          )}

          {/* Step 3: Classify */}
          {step === 3 && (
            <ClassifyStep
              productName={productName}
              brand={brand}
              productType={productType}
              imagePreview={packageImageColor || packageImage}
              onProductNameChange={setProductName}
              onBrandChange={setBrand}
              onProductTypeChange={setProductType}
              onContinue={handleClassifyContinue}
              onBack={() => setStep(2)}
            />
          )}

          {/* Step 4: Results */}
          {step === 4 && (
            <>
              {!saved && (
                <button
                  onClick={() => setStep(3)}
                  className="flex items-center gap-1.5 text-sm text-bo-ink-muted font-sans font-bold mb-3
                             bg-white rounded-r2 px-3 py-2 shadow-bo1 border-none cursor-pointer pressable"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                  分類に戻る
                </button>
              )}
              {saveError && (
                <div className="flex items-start gap-3 bg-white rounded-r2 py-3.5 px-4 mb-4 shadow-bo1 border border-red-100">
                  <span className="text-base shrink-0">⚠️</span>
                  <span className="text-sm text-red-500 font-sans">{saveError}</span>
                </div>
              )}
              <ScanResult
                productName={productName}
                brand={brand}
                productType={productType}
                foundIngredients={foundIngredients}
                unknownIngredients={unknownIngredients}
                combinations={combinations}
                onSave={handleSave}
                onScanAnother={handleReset}
                saved={saved}
                imagePreview={packageImageColor || packageImage}
                newDiscoveryIds={new Set(newDiscoveries.map((i) => i.id))}
              />
            </>
          )}
        </div>

        {/* Discovery modal */}
        {showDiscovery && (
          <DiscoveryModal ingredients={newDiscoveries} onClose={() => setShowDiscovery(false)} />
        )}
      </div>
      <ManualInputSheet
        open={showManualSheet}
        onClose={() => setShowManualSheet(false)}
        onSubmit={handleManualSubmit}
      />
    </AuthGuard>
  );
}
