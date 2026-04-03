"use client";

import { useState, useCallback } from "react";
import { createWorker } from "tesseract.js";
import CameraView from "@/components/scan/CameraView";
import ScanProgress from "@/components/scan/ScanProgress";
import ScanResult from "@/components/scan/ScanResult";
import DiscoveryModal from "@/components/ui/DiscoveryModal";
import { extractIngredients } from "@/lib/ocr";
import { findCombinations } from "@/lib/combinations";
import { getIngredientById } from "@/lib/ingredients";
import { useProductStore } from "@/stores/useProductStore";
import { useZukanStore } from "@/stores/useZukanStore";
import { Ingredient, Combination } from "@/types";

type ScanPhase = "package" | "ingredients" | "processing" | "result";

export default function ScanPage() {
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

  const addProduct = useProductStore((s) => s.addProduct);
  const discover = useZukanStore((s) => s.discover);

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

        const newIds = discover(foundIngs.map((f) => f.ingredient.id));
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
      }
    },
    [discover]
  );

  const handleSave = useCallback(() => {
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
    setSaved(true);
  }, [addProduct, productName, brand, packageImage, foundIngredients]);

  const handleReset = useCallback(() => {
    setPhase("package");
    setPackageImage("");
    setProgress(0);
    setFoundIngredients([]);
    setUnknownIngredients([]);
    setCombinations([]);
    setNewDiscoveries([]);
    setSaved(false);
  }, []);

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

            <ScanResult
              productName={productName}
              brand={brand}
              productType="スキンケア"
              foundIngredients={foundIngredients}
              unknownIngredients={unknownIngredients}
              combinations={combinations}
              onSave={handleSave}
              saved={saved}
            />
          </>
        )}
      </div>

      {showDiscovery && (
        <DiscoveryModal ingredients={newDiscoveries} onClose={() => setShowDiscovery(false)} />
      )}
    </div>
  );
}
