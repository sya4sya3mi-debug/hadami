"use client";

import { useState, useCallback } from "react";
import { createWorker } from "tesseract.js";
import CameraView from "@/components/scan/CameraView";
import ScanProgress from "@/components/scan/ScanProgress";
import ScanResult from "@/components/scan/ScanResult";
import DiscoveryModal from "@/components/ui/DiscoveryModal";
import SignUpBanner from "@/components/ui/SignUpBanner";
import { extractIngredients } from "@/lib/ocr";
import { findCombinations } from "@/lib/combinations";
import { getIngredientById } from "@/lib/ingredients";
import { useProductStore } from "@/stores/useProductStore";
import { useZukanStore } from "@/stores/useZukanStore";
import { useUser } from "@/lib/auth";
import { saveProductToDb, saveDiscoveriesToDb, getGuestLimit, getUserLimit } from "@/lib/db";
import { Ingredient, Combination } from "@/types";

type ScanPhase = "package" | "ingredients" | "processing" | "result";

export default function ScanPage() {
  const { user, supabase } = useUser();

  const [phase, setPhase] = useState<ScanPhase>("package");
  const [packageImage, setPackageImage] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState("");

  const [productName, setProductName] = useState("");
  const [brand, setBrand] = useState("");
  const [foundIngredients, setFoundIngredients] = useState<{ ingredient: Ingredient; orderIndex: number }[]>([]);
  const [unknownIngredients, setUnknownIngredients] = useState<string[]>([]);
  const [combinations, setCombinations] = useState<Combination[]>([]);
  const [newDiscoveries, setNewDiscoveries] = useState<Ingredient[]>([]);
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const addProduct = useProductStore((s) => s.addProduct);
  const localProducts = useProductStore((s) => s.products);
  const discover = useZukanStore((s) => s.discover);

  const guestLimit = getGuestLimit();
  const userLimit = getUserLimit();
  const isGuest = !user;
  const localCount = localProducts.length;

  const handlePackageCapture = useCallback((imageData: string) => {
    setPackageImage(imageData);
    setPhase("ingredients");
  }, []);

  const handleIngredientsCapture = useCallback(
    async (imageData: string) => {
      setPhase("processing");
      setProgress(10);
      setProgressMsg("画像を読み込んでいます...");

      try {
        const worker = await createWorker("jpn+eng");

        setProgress(30);
        setProgressMsg("文字を認識しています...");
        const { data } = await worker.recognize(imageData);

        setProgress(60);
        setProgressMsg("成分を照合しています...");
        const result = await extractIngredients(data.text);

        setProgress(80);
        setProgressMsg("組み合わせ情報を確認中...");

        const foundIngs = result.found
          .map((f) => {
            const ingredient = getIngredientById(f.ingredientId);
            return ingredient ? { ingredient, orderIndex: f.orderIndex } : null;
          })
          .filter((f): f is { ingredient: Ingredient; orderIndex: number } => f !== null);

        const ingredientNames = foundIngs.map((f) => f.ingredient.nameJa);
        const combos = findCombinations(ingredientNames);

        const newIds = user ? discover(foundIngs.map((f) => f.ingredient.id)) : [];
        const discoveries = newIds
          .map((id) => getIngredientById(id))
          .filter((i): i is Ingredient => i !== null);

        setProgress(100);
        setProgressMsg("完了！");

        setProductName("スキャンした製品");
        setBrand("ブランド不明");
        setFoundIngredients(foundIngs);
        setUnknownIngredients(result.unknown);
        setCombinations(combos);
        setNewDiscoveries(discoveries);

        await worker.terminate();

        setTimeout(() => {
          setPhase("result");
          if (discoveries.length > 0) setShowDiscovery(true);
        }, 500);
      } catch (error) {
        console.error("OCR error:", error);
        setProgressMsg("エラーが発生しました。もう一度お試しください。");
        setTimeout(() => setPhase("ingredients"), 2000);
      }
    },
    [discover]
  );

  const handleSave = useCallback(async () => {
    setSaveError("");

    if (user) {
      // ログイン済み → Supabaseに保存
      const result = await saveProductToDb(supabase, user.id, {
        name: productName,
        brand: brand,
        ingredientIds: foundIngredients.map((f) => f.ingredient.id),
        unknownIngredients: unknownIngredients,
        packageImageBase64: packageImage || undefined,
      });

      if (result.error === "limit_reached") {
        setSaveError(`保存上限（${userLimit}件）に達しています。古い製品を削除してください。`);
        return;
      }
      if (result.error) {
        setSaveError("保存に失敗しました。もう一度お試しください。");
        return;
      }

      // 図鑑発見もSupabaseに保存
      await saveDiscoveriesToDb(
        supabase,
        user.id,
        foundIngredients.map((f) => f.ingredient.id)
      );

      // localStorageにも保存（オフライン表示用）
      addProduct({
        id: result.productId!,
        name: productName,
        brand: brand,
        productType: "スキンケア",
        packageImage: result.imageUrl || packageImage || undefined,
        createdAt: new Date().toISOString(),
        ingredients: foundIngredients.map((f) => ({
          ingredientId: f.ingredient.id,
          orderIndex: f.orderIndex,
        })),
      });
    } else {
      // 未ログイン → localStorageのみ（3件制限）
      if (localCount >= guestLimit) {
        setSaveError("");
        return;
      }

      const productId = `product-${Date.now()}`;
      addProduct({
        id: productId,
        name: productName,
        brand: brand,
        productType: "スキンケア",
        packageImage: packageImage || undefined,
        createdAt: new Date().toISOString(),
        ingredients: foundIngredients.map((f) => ({
          ingredientId: f.ingredient.id,
          orderIndex: f.orderIndex,
        })),
      });
    }

    setSaved(true);
  }, [user, supabase, addProduct, productName, brand, packageImage, foundIngredients, unknownIngredients, localCount, guestLimit, userLimit]);

  const handleReset = useCallback(() => {
    setPhase("package");
    setPackageImage("");
    setProgress(0);
    setFoundIngredients([]);
    setUnknownIngredients([]);
    setCombinations([]);
    setNewDiscoveries([]);
    setSaved(false);
    setSaveError("");
  }, []);

  // 未ログインで上限到達時は保存不可
  const guestAtLimit = isGuest && localCount >= guestLimit;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #F0FDFA 0%, #FFF0F5 100%)" }}>
      <div className="px-5 pt-8 pb-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-bold text-lg" style={{ color: "#2D2D2D" }}>📷 成分スキャン</h1>
          {phase === "result" && (
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-full text-sm font-medium"
              style={{ background: "#F0FDFA", color: "#5BBFAD" }}
            >
              新しくスキャン
            </button>
          )}
        </div>

        {/* 未ログインバナー */}
        {isGuest && phase !== "processing" && (
          <SignUpBanner currentCount={localCount} limit={guestLimit} />
        )}

        {phase === "package" && (
          <CameraView step={1} onCapture={handlePackageCapture} />
        )}

        {phase === "ingredients" && (
          <CameraView step={2} onCapture={handleIngredientsCapture} packagePreview={packageImage} />
        )}

        {phase === "processing" && (
          <ScanProgress progress={progress} message={progressMsg} />
        )}

        {phase === "result" && (
          <>
            {/* Editable product info */}
            <div
              className="bg-white rounded-2xl p-4 mb-4 shadow-sm"
              style={{ border: "1px solid #F5E6EF" }}
            >
              <label className="block text-xs font-medium mb-1" style={{ color: "#9B9B9B" }}>製品名</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full text-base font-bold pb-1 mb-3 outline-none border-b"
                style={{ borderColor: "#F2F2F2", color: "#2D2D2D" }}
              />
              <label className="block text-xs font-medium mb-1" style={{ color: "#9B9B9B" }}>ブランド</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full text-sm pb-1 outline-none border-b"
                style={{ borderColor: "#F2F2F2", color: "#2D2D2D" }}
              />
            </div>

            {saveError && (
              <div style={{
                background: "#FFF3F3",
                border: "1px solid #F9A8C0",
                borderRadius: "12px",
                padding: "12px 16px",
                marginBottom: "12px",
                fontSize: "13px",
                color: "#E57373",
              }}>
                {saveError}
              </div>
            )}

            <ScanResult
              productName={productName}
              brand={brand}
              productType="スキンケア"
              foundIngredients={foundIngredients}
              unknownIngredients={unknownIngredients}
              combinations={combinations}
              onSave={guestAtLimit ? undefined : handleSave}
              saved={saved}
            />

            {guestAtLimit && !saved && (
              <SignUpBanner currentCount={localCount} limit={guestLimit} />
            )}
          </>
        )}
      </div>

      {showDiscovery && (
        <DiscoveryModal ingredients={newDiscoveries} onClose={() => setShowDiscovery(false)} />
      )}
    </div>
  );
}
