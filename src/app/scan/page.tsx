"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import StepIndicator from "@/components/scan/StepIndicator";
import CaptureStep from "@/components/scan/CaptureStep";
import ManualInputSheet from "@/components/scan/ManualInputSheet";
import IdentifyStep from "@/components/scan/IdentifyStep";
import ClassifyStep from "@/components/scan/ClassifyStep";
import ScanResult from "@/components/scan/ScanResult";
import RecommendSection from "@/components/recommendations/RecommendSection";
import DiscoveryModal from "@/components/ui/DiscoveryModal";
import AuthGuard from "@/components/ui/AuthGuard";
import { extractIngredients } from "@/lib/ocr";
import { findCombinations } from "@/lib/combinations";
import { getIngredientById } from "@/lib/ingredients";
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
import { Ingredient, Combination, ProductGenre } from "@/types";
import { normalizeGenreFromScan } from "@/lib/productGenres";

type WizardStep = 1 | 2 | 3 | 4;

interface ScannedProduct {
  productName: string;
  brand: string;
  productType: string;
  found: boolean;
  ingredients: string;
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
  const [showManualSheet, setShowManualSheet] = useState(false);

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

  useEffect(() => {
    if (!user?.email) return;
    getScanCountByEmail(supabase, user.email).then((count) => {
      if (count >= monthlyScanLimit) setScanLimitReached(true);
    });
  }, [user, supabase, monthlyScanLimit]);

  // 成分データ処理
  const processIngredients = useCallback(
    async (ingredientText: string, name: string, brandName: string) => {
      const result = await extractIngredients(ingredientText);
      const foundIngs = result.found
        .map((f) => {
          const ingredient = getIngredientById(f.ingredientId);
          return ingredient ? { ingredient, orderIndex: f.orderIndex } : null;
        })
        .filter((f): f is { ingredient: Ingredient; orderIndex: number } => f !== null);

      const ingredientNames = foundIngs.map((f) => f.ingredient.nameJa);
      const combos = findCombinations(ingredientNames);
      const newIds = discover(foundIngs.map((f) => f.ingredient.id));
      const discoveries = newIds
        .map((id) => getIngredientById(id))
        .filter((i): i is Ingredient => i !== null);

      setProductName(name);
      setBrand(brandName);
      setFoundIngredients(foundIngs);
      setUnknownIngredients(result.unknown);
      setCombinations(combos);
      setNewDiscoveries(discoveries);

      return discoveries;
    },
    [discover]
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
          body: JSON.stringify({ imageBase64: imageData }),
        });

        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        const products: ScannedProduct[] = data.products || [data];
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
    [processIngredients, checkScanLimit, user, supabase, userLimit]
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
        const { text } = await ocrRes.json();

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
    [processIngredients, productName, brand]
  );

  // 手動入力 → 成分マッチング
  const handleManualSubmit = useCallback(
    async (ingredientText: string, name: string, brandName: string) => {
      setStep(2);
      setProgress(50);
      setProgressMsg("成分を照合しています...");

      const discoveries = await processIngredients(ingredientText, name, brandName);

      setProgress(100);
      setProgressMsg("完了！");

      setTimeout(() => {
        setStep(3);
        if (discoveries.length > 0) setShowDiscovery(true);
      }, 300);
    },
    [processIngredients]
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

      const result0 = await extractIngredients(product.ingredients);
      const foundIngs = result0.found
        .map((f) => {
          const ingredient = getIngredientById(f.ingredientId);
          return ingredient ? { ingredient, orderIndex: f.orderIndex } : null;
        })
        .filter((f): f is { ingredient: Ingredient; orderIndex: number } => f !== null);

      const result = await saveProductToDb(supabase, user.id, {
        name: product.productName,
        brand: product.brand,
        productType: normalizeGenreFromScan(product.productType || ""),
        ingredientIds: foundIngs.map((f) => f.ingredient.id),
        unknownIngredients: result0.unknown,
        packageImageBase64: packageImageColor || packageImage || undefined,
      });

      if (result.error) return;

      discover(foundIngs.map((f) => f.ingredient.id));
      await saveDiscoveriesToDb(supabase, user.id, foundIngs.map((f) => f.ingredient.id));

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
        packageImage: result.imageUrl ?? undefined,
        isFavorite: false,
        createdAt: new Date().toISOString(),
        ingredients: foundIngs.map((f) => ({ ingredientId: f.ingredient.id, orderIndex: f.orderIndex })),
      });

      setMultiSavedIndexes((prev) => new Set(prev).add(index));
    },
    [user, supabase, addProduct, discover, packageImage, packageImageColor, multiSavedIndexes]
  );

  // Step 3 → Step 4
  const handleClassifyContinue = useCallback(() => {
    setStep(4);
  }, []);

  // Save
  const handleSave = useCallback(async () => {
    if (!user || saved) return;
    setSaveError("");

    const result = await saveProductToDb(supabase, user.id, {
      name: productName,
      brand,
      productType,
      ingredientIds: foundIngredients.map((f) => f.ingredient.id),
      unknownIngredients,
      packageImageBase64: packageImageColor || packageImage || undefined,
    });

    if (result.error === "limit_reached") {
      setSaveError(`保存上限（${userLimit}件）に達しています。古いコスメを削除してください。`);
      fetch("/api/rollback-scan", { method: "POST" }).catch(() => {});
      return;
    }
    if (result.error) {
      setSaveError("保存に失敗しました。もう一度お試しください。");
      fetch("/api/rollback-scan", { method: "POST" }).catch(() => {});
      return;
    }

    await saveDiscoveriesToDb(supabase, user.id, foundIngredients.map((f) => f.ingredient.id));

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
      packageImage: result.imageUrl ?? undefined,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      ingredients: foundIngredients.map((f) => ({ ingredientId: f.ingredient.id, orderIndex: f.orderIndex })),
    });

    setSaved(true);
    setRecentlyFound(foundIngredients.map((f) => f.ingredient.id));
    setTimeout(() => router.push("/zukan"), 1500);
  }, [user, supabase, addProduct, productName, brand, productType, packageImage, packageImageColor, foundIngredients, unknownIngredients, userLimit, saved, setRecentlyFound, router]);

  const handleReset = useCallback(() => {
    if (step >= 2 && !saved) {
      if (!window.confirm("スキャン結果がまだ保存されていません。破棄しますか？")) return;
    }
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
    setScanLimitReached(false);
    setMultiProducts([]);
    setMultiSavedIndexes(new Set());
    setShowFallback(false);
    setShowMultiSheet(false);
  }, [step, saved]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-bo-cream">
        <div className="px-5 pt-4 pb-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-2xl font-extrabold font-serif text-bo-ink m-0">
              成分スキャン
            </h1>
            {step > 1 && (
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-bo-accent-soft text-bo-accent"
              >
                最初から
              </button>
            )}
          </div>

          {/* Step indicator */}
          <StepIndicator currentStep={step} />

          {/* Scan limit warning */}
          {scanLimitReached && step === 1 && (
            <div className="rounded-r2 p-4 mb-4 text-center bg-red-50 border border-red-200">
              <div className="text-2xl mb-2">🚫</div>
              <div className="font-bold text-sm mb-1 text-red-400">
                無料スキャン上限（{monthlyScanLimit}回）に達しました
              </div>
              <div className="text-xs text-bo-ink-muted">
                ベータ版では1アカウントにつき{monthlyScanLimit}回まで無料です
              </div>
            </div>
          )}

          {/* Step 1: Capture */}
          {step === 1 && (
            <>
              <CaptureStep
                onCapture={handlePackageCapture}
                onManualInput={() => setShowManualSheet(true)}
                disabled={scanLimitReached}
              />
              <div className="mt-6">
                <RecommendSection enabled={true} hideIfEmpty />
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
            />
          )}

          {/* Step 4: Results */}
          {step === 4 && (
            <>
              {saveError && (
                <div className="bg-red-50 border border-red-200 rounded-r1 py-3 px-4 mb-3 text-[13px] text-red-400">
                  {saveError}
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
                saved={saved}
                imagePreview={packageImageColor || packageImage}
                newDiscoveryIds={new Set(newDiscoveries.map((i) => i.id))}
              />
            </>
          )}
        </div>

        {/* Manual input bottom sheet */}
        <ManualInputSheet
          open={showManualSheet}
          onClose={() => setShowManualSheet(false)}
          onSubmit={handleManualSubmit}
        />

        {/* Discovery modal */}
        {showDiscovery && (
          <DiscoveryModal ingredients={newDiscoveries} onClose={() => setShowDiscovery(false)} />
        )}
      </div>
    </AuthGuard>
  );
}
