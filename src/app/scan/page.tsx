"use client";

import "@/styles/hadami-tokens.css";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Ico } from "@/components/redesign/apothecary/Icons";
import { useSearchParams, useRouter } from "next/navigation";
import StepIndicator from "@/components/scan/StepIndicator";
import CaptureStep from "@/components/scan/CaptureStep";
import IdentifyStep from "@/components/scan/IdentifyStep";
import ClassifyStep from "@/components/scan/ClassifyStep";
import ScanResult from "@/components/scan/ScanResult";
import ScanDiscoveryAd from "@/components/recommendations/ScanDiscoveryAd";
import ManualInputSheet from "@/components/scan/ManualInputSheet";
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
  getAccountScanLimit,
  getLegacyUserMonthlyScanLimit,
  getMonthlyScanCount,
  getProductCount,
} from "@/lib/db";
import { getSignedImageUrls } from "@/lib/storage";
import {
  getProductImageDisplayPath,
  getProductImageSharePath,
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
  resolveToken?: string;
  requiresResolve?: boolean;
}

interface ScanProductResponse {
  needsSelection?: boolean;
  products?: ScannedProduct[];
  productName?: string;
  brand?: string;
  productType?: string;
  found?: boolean;
  ingredients?: string;
  isQuasiDrug?: boolean;
  activeIngredients?: string[];
}

interface ApiErrorPayload {
  error?: string;
  count?: number;
  limit?: number;
}

type ApiResponseError = Error & { status?: number };

async function parseApiResponse<T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> {
  const payload = (await response.json().catch(() => null)) as (T & ApiErrorPayload) | null;

  if (!response.ok) {
    const error = new Error(
      payload?.error
        ? response.status === 429 &&
          typeof payload.count === "number" &&
          typeof payload.limit === "number"
          ? `${payload.error}（${payload.count}/${payload.limit}）`
          : payload.error
        : fallbackMessage,
    ) as ApiResponseError;
    error.status = response.status;
    throw error;
  }

  return payload as T;
}

function getApiErrorStatus(error: unknown): number | null {
  return typeof (error as ApiResponseError | null)?.status === "number"
    ? (error as ApiResponseError).status!
    : null;
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

  // Progress (Step 2)
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState("");
  const [showFallback, setShowFallback] = useState(false);

  // Multi-product (Step 2)
  const [multiProducts, setMultiProducts] = useState<ScannedProduct[]>([]);
  const [multiSavedIndexes, setMultiSavedIndexes] = useState<Set<number>>(new Set());
  const [multiResolvingIndexes, setMultiResolvingIndexes] = useState<Set<number>>(new Set());
  const [showMultiSheet, setShowMultiSheet] = useState(false);

  // Product info (Step 3)
  const [productName, setProductName] = useState("");
  const [brand, setBrand] = useState("");
  const [productType, setProductType] = useState<ProductGenre>("other");

  // Results (Step 4)
  const [foundIngredients, setFoundIngredients] = useState<{ ingredient: Ingredient; orderIndex: number }[]>([]);
  const [unknownIngredients, setUnknownIngredients] = useState<string[]>([]);
  const [combinations, setCombinations] = useState<Combination[]>([]);
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
  const [monthlyScanLimit, setMonthlyScanLimit] = useState(getAccountScanLimit());
  const [scanLimitReached, setScanLimitReached] = useState(false);
  const [showManualSheet, setShowManualSheet] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    const loadScanLimit = async () => {
      const legacyOverride = await getLegacyUserMonthlyScanLimit(supabase, user.id).catch(
        () => null
      );
      try {
        const res = await fetch(`/api/scan-limit?ts=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) throw new Error("scan-limit fetch failed");
        const data = (await res.json()) as { count?: number; limit?: number };

        const apiLimit =
          typeof data.limit === "number" && data.limit > 0 ? data.limit : getAccountScanLimit();
        const limit =
          typeof legacyOverride === "number" && legacyOverride > apiLimit
            ? legacyOverride
            : apiLimit;
        const count = typeof data.count === "number" ? data.count : 0;

        if (cancelled) return;
        setMonthlyScanLimit(limit);
        setScanLimitReached(count >= limit);
      } catch {
        if (cancelled) return;
        // If scan-limit API is temporarily unavailable, avoid false blocking in UI.
        setScanLimitReached(false);
      }
    };

    loadScanLimit();
    return () => {
      cancelled = true;
    };
  }, [user, supabase]);

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
    async (productId: string, savedFilePath: string | null) => {
      if (!user || !savedFilePath) {
        return {
          packageImage: undefined,
          packageImagePath: undefined,
          packageImageThumb: undefined,
          packageImageThumbPath: undefined,
          packageImageShareUrl: undefined,
          packageImageSharePath: undefined,
        };
      }

      const displayPath = getProductImageDisplayPath(user.id, productId);
      const sharePath = getProductImageSharePath(user.id, productId);
      const signedImages = await getSignedImageUrls(supabase, [
        displayPath,
        sharePath,
      ]);
      const displayUrl = signedImages[displayPath] ?? undefined;
      const shareUrl = signedImages[sharePath] ?? displayUrl;

      return {
        packageImage: displayUrl,
        packageImagePath: displayPath,
        packageImageThumb: displayUrl,
        packageImageThumbPath: displayPath,
        packageImageShareUrl: shareUrl,
        packageImageSharePath: sharePath,
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

      const _discoveries = await processIngredients(text, name, brandName);

      setProgress(100);
      setProgressMsg("完了！");

      setTimeout(() => {
        setStep(3);
      }, 500);
    },
    [processIngredients]
  );

  const checkScanLimit = useCallback(async (): Promise<boolean> => {
    if (!user?.email) return false;
    try {
      const [res, legacyOverride] = await Promise.all([
        fetch(`/api/scan-limit?ts=${Date.now()}`, { cache: "no-store" }),
        getLegacyUserMonthlyScanLimit(supabase, user.id),
      ]);
      if (!res.ok) throw new Error("scan-limit fetch failed");
      const data = (await res.json()) as { count?: number; limit?: number };
      const apiLimit =
        typeof data.limit === "number" && data.limit > 0 ? data.limit : getAccountScanLimit();
      const latestLimit =
        typeof legacyOverride === "number" && legacyOverride > apiLimit
          ? legacyOverride
          : apiLimit;
      const count = typeof data.count === "number" ? data.count : 0;
      setMonthlyScanLimit(latestLimit);
      const reached = count >= latestLimit;
      setScanLimitReached(reached);
      return !reached;
    } catch {
      try {
        const count = await getMonthlyScanCount(supabase, user.id);
        const reached = count >= monthlyScanLimit;
        setScanLimitReached(reached);
        return !reached;
      } catch {
        // If lookup fails, do not block here; backend still has authoritative limit checks.
        return true;
      }
    }
  }, [user, supabase, monthlyScanLimit]);

  const buildEvidenceMap = useCallback(
    (products: ScannedProduct[]) =>
      Object.fromEntries(
        products.map((product) => [
          buildScanEvidenceKey(product.productName || "", product.brand || ""),
          {
            isQuasiDrug: product.isQuasiDrug,
            activeIngredients: product.activeIngredients,
          },
        ])
      ),
    [buildScanEvidenceKey]
  );

  const resolveSelectedProduct = useCallback(
    async (product: ScannedProduct, index?: number) => {
      if (!product.requiresResolve || product.ingredients) {
        return product;
      }

      if (!product.resolveToken) {
        throw new Error("Missing resolve token");
      }

      if (typeof index === "number") {
        setMultiResolvingIndexes((prev) => new Set(prev).add(index));
      }

      try {
        const res = await fetch("/api/scan-product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productName: product.productName,
            brand: product.brand,
            productType: product.productType,
            resolveToken: product.resolveToken,
          }),
        });

        const resolved = await parseApiResponse<ScannedProduct>(
          res,
          "成分検索に失敗しました。"
        );
        const nextProduct: ScannedProduct = {
          ...product,
          ...resolved,
          requiresResolve: false,
        };

        if (typeof index === "number") {
          setMultiProducts((prev) =>
            prev.map((item, itemIndex) =>
              itemIndex === index ? nextProduct : item
            )
          );
        }

        const nextEvidenceMap = {
          ...scanEvidenceRef.current,
          ...buildEvidenceMap([nextProduct]),
        };
        scanEvidenceRef.current = nextEvidenceMap;
        setScanEvidenceMap(nextEvidenceMap);

        return nextProduct;
      } finally {
        if (typeof index === "number") {
          setMultiResolvingIndexes((prev) => {
            const next = new Set(prev);
            next.delete(index);
            return next;
          });
        }
      }
    },
    [buildEvidenceMap]
  );

  // Step 1 → Step 2: パッケージ撮影 → ネット検索
  const handlePackageCapture = useCallback(
    async (imageData: string) => {
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
            imageBase64: imageData,
          }),
        });

        const data = await parseApiResponse<ScanProductResponse>(
          res,
          "検索に失敗しました。"
        );
        const products: ScannedProduct[] = data.products || [{
          productName: data.productName || "",
          brand: data.brand || "",
          productType: data.productType || "other",
          found: data.found === true,
          ingredients: data.ingredients || "",
          isQuasiDrug: data.isQuasiDrug,
          activeIngredients: data.activeIngredients,
        }];
        const nextEvidenceMap = buildEvidenceMap(products);
        scanEvidenceRef.current = nextEvidenceMap;
        setScanEvidenceMap(nextEvidenceMap);

        if (data.needsSelection) {
          setMultiProducts(products);
          setProgress(100);
          setProgressMsg("見つかったコスメを選んでください");
          setTimeout(() => setShowMultiSheet(true), 300);
          return;
        }

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

          const _discoveries = await processIngredients(
            p.ingredients,
            p.productName || "スキャンしたコスメ",
            p.brand || "ブランド不明"
          );

          setProgress(100);
          setProgressMsg("完了！");

          setTimeout(() => {
            setStep(3);
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
        const status = getApiErrorStatus(error);
        if (status === 429) {
          setScanLimitReached(true);
        }

        setProgressMsg(
          error instanceof Error ? error.message : "検索に失敗しました"
        );

        if (status !== 401 && status !== 429 && status !== 503) {
          setTimeout(() => setShowFallback(true), 1000);
        }
      }
    },
    [buildEvidenceMap, processIngredients, checkScanLimit, user, supabase, userLimit]
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
        const {
          text,
          isQuasiDrug: ocrIsQuasiDrug,
          activeIngredients: ocrActiveIngredients,
        } = await parseApiResponse<{
          text: string;
          isQuasiDrug: boolean;
          activeIngredients: string[];
        }>(ocrRes, "OCR処理に失敗しました。");
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

        const _discoveries = await processIngredients(
          text,
          productName || "スキャンしたコスメ",
          brand || "ブランド不明"
        );

        setProgress(100);
        setProgressMsg("完了！");

        setTimeout(() => {
          setStep(3);
        }, 500);
      } catch (error) {
        console.error("OCR error:", error);
        if (getApiErrorStatus(error) === 429) {
          setScanLimitReached(true);
        }
        setProgressMsg(
          error instanceof Error
            ? error.message
            : "エラーが発生しました。もう一度お試しください。"
        );
        setTimeout(() => setShowFallback(true), 2000);
      }
    },
    [buildScanEvidenceKey, processIngredients, productName, brand]
  );

  // 複数コスメから1つ選択
  const handleSelectProduct = useCallback(
    async (product: ScannedProduct, index: number) => {
      try {
        setShowMultiSheet(false);
        setProgress(50);
        setProgressMsg("成分を照合しています...");
        const resolvedProduct = await resolveSelectedProduct(product, index);
        setProductType(normalizeGenreFromScan(resolvedProduct.productType || ""));

        if (!resolvedProduct.ingredients?.trim()) {
          setProductName(resolvedProduct.productName || "スキャンしたコスメ");
          setBrand(resolvedProduct.brand || "ブランド不明");
          setShowFallback(true);
          return;
        }

        const _discoveries = await processIngredients(
          resolvedProduct.ingredients,
          resolvedProduct.productName || "スキャンしたコスメ",
          resolvedProduct.brand || "ブランド不明"
        );

        setProgress(100);
        setProgressMsg("完了！");

        setTimeout(() => {
          setStep(3);
        }, 300);
      } catch (error) {
        console.error("Multi-product resolve error:", error);
        if (getApiErrorStatus(error) === 429) {
          setScanLimitReached(true);
        }
        setProgressMsg(
          error instanceof Error ? error.message : "成分検索に失敗しました"
        );
        setTimeout(() => setShowMultiSheet(true), 500);
      }
    },
    [processIngredients, resolveSelectedProduct]
  );

  // 複数コスメを一括保存
  const handleSaveMulti = useCallback(
    async (product: ScannedProduct, index: number) => {
      if (!user || multiSavedIndexes.has(index)) return;

      const resolvedProduct = await resolveSelectedProduct(product, index);
      if (!resolvedProduct.ingredients?.trim()) return;

      const result0 = await extractIngredients(resolvedProduct.ingredients, {
        isQuasiDrug: resolvedProduct.isQuasiDrug,
        ocrActiveNames: resolvedProduct.activeIngredients,
      });
      const foundIngs = result0.found
        .map((f) => {
          const ingredient = getIngredientById(f.ingredientId);
          return ingredient ? { ingredient, orderIndex: f.orderIndex } : null;
        })
        .filter((f): f is { ingredient: Ingredient; orderIndex: number } => f !== null);
      const activeIngredientIds = resolveActiveIngredientIds(resolvedProduct.activeIngredients);

      const result = await saveProductToDb(supabase, user.id, {
        name: resolvedProduct.productName,
        brand: resolvedProduct.brand,
        productType: normalizeGenreFromScan(resolvedProduct.productType || ""),
        ingredientIds: foundIngs.map((f) => f.ingredient.id),
        unknownIngredients: result0.unknown,
        packageImageBase64: packageImage || undefined,
        isQuasiDrug: resolvedProduct.isQuasiDrug,
        activeIngredientIds,
      });

      if (result.error) return;

      const savedImage = await resolveUploadedImage(
        result.productId!,
        result.filePath
      );

      const activeIds = foundIngs.filter((f) => isActiveIngredient(f.ingredient.id)).map((f) => f.ingredient.id);
      discover(activeIds);
      await saveDiscoveriesToDb(supabase, user.id, activeIds);

      // スキャン履歴保存（レコメンド用）
      saveScanHistory(
        supabase,
        user.id,
        resolvedProduct.productName,
        resolvedProduct.brand,
        foundIngs.map((f) => f.ingredient.id)
      ).catch((e) => console.error("scan history save error:", e));

      addProduct({
        id: result.productId!,
        name: resolvedProduct.productName,
        brand: resolvedProduct.brand,
        productType: normalizeGenreFromScan(resolvedProduct.productType || ""),
        packageImagePath: savedImage.packageImagePath,
        packageImage: savedImage.packageImage,
        packageImageThumbPath: savedImage.packageImageThumbPath,
        packageImageThumb: savedImage.packageImageThumb,
        packageImageSharePath: savedImage.packageImageSharePath,
        packageImageShareUrl: savedImage.packageImageShareUrl,
        isFavorite: false,
        createdAt: new Date().toISOString(),
        ingredients: foundIngs.map((f) => ({ ingredientId: f.ingredient.id, orderIndex: f.orderIndex })),
        isQuasiDrug: resolvedProduct.isQuasiDrug,
        activeIngredientIds,
      });

      setMultiSavedIndexes((prev) => new Set(prev).add(index));
    },
    [user, supabase, addProduct, discover, packageImage, multiSavedIndexes, resolveActiveIngredientIds, resolveSelectedProduct, resolveUploadedImage]
  );

  // Step 3 → Step 4
  const handleClassifyContinue = useCallback(() => {
    setStep(4);
  }, []);

  // Save
  const handleSave = useCallback(async () => {
    if (saved) {
      console.warn("[handleSave] already saved, ignoring click");
      return;
    }
    if (isSavingRef.current) {
      console.warn("[handleSave] save already in progress, ignoring click");
      return;
    }
    if (!user) {
      console.error("[handleSave] user is not loaded yet", { user });
      setSaveError("ログイン状態の読み込み中です。数秒後に再度お試しください。");
      return;
    }
    isSavingRef.current = true;
    setSaveError("");

    try {
      const result = await saveProductToDb(supabase, user.id, {
        name: productName,
        brand,
        productType,
        ingredientIds: foundIngredients.map((f) => f.ingredient.id),
        unknownIngredients,
        packageImageBase64: packageImage || undefined,
        isQuasiDrug,
        activeIngredientIds: resolvedActiveIngredients.map((ingredient) => ingredient.ingredientId),
      });

      if (result.error === "limit_reached") {
        isSavingRef.current = false;
        setSaveError(`保存上限（${userLimit}件）に達しています。古いコスメを削除してください。`);
        return;
      }
      if (result.error) {
        console.error("[handleSave] saveProductToDb error:", result.error);
        isSavingRef.current = false;
        setSaveError(`保存に失敗しました: ${result.error}`);
        return;
      }

      const savedImage = await resolveUploadedImage(
        result.productId!,
        result.filePath
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
        packageImageSharePath: savedImage.packageImageSharePath,
        packageImageShareUrl: savedImage.packageImageShareUrl,
        isFavorite: false,
        createdAt: new Date().toISOString(),
        ingredients: foundIngredients.map((f) => ({ ingredientId: f.ingredient.id, orderIndex: f.orderIndex })),
        isQuasiDrug,
        activeIngredientIds: resolvedActiveIngredients.map((ingredient) => ingredient.ingredientId),
      });

      setSaved(true);
      setRecentlyFound(foundIngredients.map((f) => f.ingredient.id));
      isSavingRef.current = false;
    } catch (e) {
      console.error("Save error:", e);
      isSavingRef.current = false;
      setSaveError("保存に失敗しました。もう一度お試しください。");
    }
  }, [user, supabase, addProduct, productName, brand, productType, packageImage, foundIngredients, unknownIngredients, userLimit, saved, setRecentlyFound, isQuasiDrug, resolvedActiveIngredients, resolveUploadedImage]);

  const doReset = useCallback(() => {
    isSavingRef.current = false;
    setStep(1);
    setPackageImage("");
    setProgress(0);
    setProgressMsg("");
    setProductName("");
    setBrand("");
    setProductType("other");
    setFoundIngredients([]);
    setUnknownIngredients([]);
    setCombinations([]);
      setSaved(false);
    setSaveError("");
    setIsQuasiDrug(false);
    setResolvedActiveIngredients([]);
    setScanLimitReached(false);
    setScanEvidenceMap({});
    scanEvidenceRef.current = {};
    setMultiProducts([]);
    setMultiSavedIndexes(new Set());
    setMultiResolvingIndexes(new Set());
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

  useEffect(() => {
    const handleScanTabPressed = () => {
      if (typeof document !== "undefined" && document.body.dataset.modalOpen) {
        return;
      }

      if (saved) {
        doReset();
        return;
      }

      if (step >= 2) {
        handleReset();
        return;
      }
    };

    window.addEventListener("hadami:scan-tab-pressed", handleScanTabPressed);
    return () => {
      window.removeEventListener("hadami:scan-tab-pressed", handleScanTabPressed);
    };
  }, [doReset, handleReset, saved, step]);

  return (
    <AuthGuard>
      <div className="hd-root hd-softa" data-density="compact" data-card="default">
        <div
          className="hd hd-page"
          style={{ minHeight: "100vh", background: "var(--hd-bg)" }}
        >
          {/* Sticky header — only show when step > 1 */}
          {step > 1 && (
            <div
              style={{
                position: "sticky", top: 0, zIndex: 50,
                display: "flex", alignItems: "center",
                padding: "10px 16px",
                background: "var(--hd-bg)",
                borderBottom: "1px solid var(--hd-hair)",
              }}
            >
              <button
                onClick={handleReset}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 14px", borderRadius: 999,
                  background: "transparent",
                  border: "1px solid var(--hd-line)",
                  color: "var(--hd-ink-60)",
                  fontSize: 12, fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "var(--hd-sans)",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                最初から
              </button>
            </div>
          )}

          <div style={{ padding: "16px 20px 96px" }}>
            <StepIndicator currentStep={step} />

            {scanLimitReached && step === 1 && (
              <div
                style={{
                  borderRadius: 18, padding: 24, marginBottom: 20,
                  textAlign: "center",
                  background: "var(--hd-surface)",
                  border: "1px solid var(--hd-hair)",
                }}
              >
                <div
                  style={{
                    width: 60, height: 60, borderRadius: 999,
                    background: "var(--hd-surface-2)",
                    margin: "0 auto 14px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 28,
                  }}
                >🚫</div>
                <div className="hd-serif" style={{ fontSize: 16, marginBottom: 6 }}>
                  今月のスキャン上限（{monthlyScanLimit}回）に達しました
                </div>
                <div
                  style={{
                    fontSize: 12, color: "var(--hd-ink-60)",
                    marginBottom: 18, fontFamily: "var(--hd-sans)",
                    lineHeight: 1.6,
                  }}
                >
                  ベータ版では月{monthlyScanLimit}回まで無料です。翌月1日にリセットされます
                </div>
                <button
                  onClick={() => setShowManualSheet(true)}
                  className="hd-cta"
                  style={{
                    padding: "12px 24px", cursor: "pointer", fontSize: 14,
                    display: "inline-flex", alignItems: "center", gap: 6,
                  }}
                >
                  成分を手動入力する
                </button>
                <div
                  style={{
                    fontSize: 10, color: "var(--hd-ink-40)", marginTop: 10,
                    fontFamily: "var(--hd-sans)",
                  }}
                >
                  手動入力はスキャン回数にカウントされません
                </div>
              </div>
            )}

            {/* Step 1: Capture */}
            {step === 1 && (
              <>
                <CaptureStep
                  onCapture={handlePackageCapture}
                  disabled={scanLimitReached}
                  hidden
                />
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 0 20px" }}>
                  {/* Pulsing ring around camera icon */}
                  <div style={{ position: "relative", width: 110, height: 110, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                    <div
                      style={{
                        position: "absolute", inset: 0, borderRadius: 999,
                        background: "oklch(0.22 0.01 95 / 0.08)",
                        animation: "scan-ring 2s ease-in-out infinite",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute", inset: 8, borderRadius: 999,
                        background: "oklch(0.22 0.01 95 / 0.10)",
                        animation: "scan-ring 2s ease-in-out 0.4s infinite",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute", inset: 16, borderRadius: 999,
                        background: "oklch(0.22 0.01 95 / 0.08)",
                        animation: "scan-ring 2s ease-in-out 0.8s infinite",
                      }}
                    />
                    <div
                      style={{
                        position: "relative", width: 76, height: 76, borderRadius: 999,
                        background: "var(--hd-ink)",
                        color: "var(--hd-bg)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 10px 28px oklch(0.22 0.01 95 / 0.30)",
                      }}
                    >
                      {Ico.camera({ width: 30, height: 30 })}
                    </div>
                  </div>

                  <div className="hd-mono hd-caps" style={{ color: "var(--hd-ink-40)", marginBottom: 10 }}>
                    Tap to scan
                  </div>
                  <div className="hd-serif" style={{ fontSize: 22, marginBottom: 10, letterSpacing: "-0.01em", textAlign: "center" }}>
                    パッケージを撮影してスキャン
                  </div>
                  <p
                    style={{
                      fontSize: 12, color: "var(--hd-ink-60)",
                      fontFamily: "var(--hd-sans)", lineHeight: 1.65,
                      textAlign: "center", marginTop: 0, marginBottom: 24,
                    }}
                  >
                    下のスキャンボタンを押して<br />化粧品のパッケージを撮影してください
                  </p>

                  <div style={{ animation: "bounce 1.2s ease-in-out infinite", color: "var(--hd-ink-40)" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <path d="M12 5v14M5 12l7 7 7-7" />
                    </svg>
                  </div>
                </div>

                <div style={{ marginTop: 8 }}>
                  <ScanDiscoveryAd />
                </div>
                <div style={{ marginTop: 16 }}>
                  <Disclaimer />
                </div>
              </>
            )}

            {step === 2 && (
              <IdentifyStep
                progress={progress}
                message={progressMsg}
                imagePreview={packageImage}
                showFallback={showFallback}
                onFallbackCapture={handleFallbackCapture}
                multiProducts={multiProducts}
                onSelectProduct={handleSelectProduct}
                onSaveMulti={handleSaveMulti}
                multiSavedIndexes={multiSavedIndexes}
                multiResolvingIndexes={multiResolvingIndexes}
                showMultiSheet={showMultiSheet}
                onCloseMultiSheet={() => setShowMultiSheet(false)}
              />
            )}

            {step === 3 && (
              <ClassifyStep
                productName={productName}
                brand={brand}
                productType={productType}
                imagePreview={packageImage}
                onProductNameChange={setProductName}
                onBrandChange={setBrand}
                onProductTypeChange={setProductType}
                onContinue={handleClassifyContinue}
              />
            )}

            {step === 4 && (
              <>
                {!saved && (
                  <button
                    onClick={() => setStep(3)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      fontSize: 12, fontWeight: 600,
                      color: "var(--hd-ink-60)",
                      background: "transparent",
                      border: "1px solid var(--hd-line)",
                      borderRadius: 999, padding: "8px 14px",
                      cursor: "pointer", marginBottom: 14,
                      fontFamily: "var(--hd-sans)",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                    分類に戻る
                  </button>
                )}
                {saveError && (
                  <div
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 10,
                      padding: "12px 14px", borderRadius: 12,
                      background: "var(--hd-surface)",
                      border: "1px solid var(--hd-terra)",
                      marginBottom: 14,
                      fontSize: 12, color: "var(--hd-terra)",
                      fontFamily: "var(--hd-sans)",
                    }}
                  >
                    ⚠️ {saveError}
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
                  imagePreview={packageImage}
                />
              </>
            )}
          </div>

        </div>
        <ManualInputSheet
          open={showManualSheet}
          onClose={() => setShowManualSheet(false)}
          onSubmit={handleManualSubmit}
        />
      </div>
    </AuthGuard>
  );
}
