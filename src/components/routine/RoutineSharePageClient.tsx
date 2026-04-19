"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import RoutineShareCard from "./RoutineShareCard";
import type { RoutineCardConfig } from "@/lib/routines";
import { downloadShareImage } from "@/lib/downloadImage";
import { useProductStore } from "@/stores/useProductStore";
import {
  getRoutineCardEmoji,
  getRoutineCardLabel,
  type RoutineCardMode,
} from "@/lib/routineCards";

const SKIN_TYPES = ["乾燥肌", "脂性肌", "混合肌", "敏感肌", "普通肌"];
const CONCERN_OPTIONS = [
  "毛穴", "ニキビ", "シミ", "くすみ", "シワ", "たるみ",
  "乾燥", "テカリ", "赤み", "肌荒れ", "美白", "エイジング",
];
const ACCENT_COLORS = [
  { label: "グリーン", value: "#3A8F7A" },
  { label: "テラコッタ", value: "#C47D5E" },
  { label: "モーブ", value: "#8B7BA8" },
  { label: "ネイビー", value: "#4A6FA5" },
  { label: "ゴールド", value: "#B8962A" },
];
const STEP_ICONS = ["🌿", "💧", "✨", "🧴", "🌸", "🫧", "☁️", "🍃", "💎", "🌊"];

export type StepDraft = {
  icon: string;
  step_name: string;
  product_name: string;
  brand: string;
  product_id: string;
  product_image_url: string;
};

const ROUTINE_CARD_WIDTH = 560;

type ShareCapableNavigator = Navigator & {
  canShare?: (data: ShareData) => boolean;
};

function isDirectImageUrl(value: string) {
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("/") ||
    value.startsWith("data:")
  );
}

function isMobileShareDevice() {
  const ua = navigator.userAgent;
  return (
    /Android|iPhone|iPad|iPod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export default function RoutineSharePageClient({
  initialConfig,
  initialAmSteps,
  initialPmSteps,
  initialCardMode,
}: {
  initialConfig: RoutineCardConfig;
  initialAmSteps: StepDraft[];
  initialPmSteps: StepDraft[];
  initialCardMode: RoutineCardMode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isDownloading, setIsDownloading] = useState(false);
  const [lastExportMode, setLastExportMode] = useState<"shared" | "downloaded" | null>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const [previewHeight, setPreviewHeight] = useState<number | null>(null);
  const [captureSteps, setCaptureSteps] = useState<StepDraft[] | null>(null);
  const captureRef = useRef<HTMLDivElement | null>(null);
  const previewViewportRef = useRef<HTMLDivElement | null>(null);
  const allProducts = useProductStore((state) => state.products);

  const [config, setConfig] = useState<RoutineCardConfig>(initialConfig);
  const [amSteps, setAmSteps] = useState<StepDraft[]>(initialAmSteps);
  const [pmSteps, setPmSteps] = useState<StepDraft[]>(initialPmSteps);
  const [activeTab, setActiveTab] = useState<RoutineCardMode>(initialCardMode);

  const currentSteps = activeTab === "am" ? amSteps : pmSteps;
  const setCurrentSteps = activeTab === "am" ? setAmSteps : setPmSteps;
  const activeLabel = getRoutineCardLabel(activeTab);
  const activeEmoji = getRoutineCardEmoji(activeTab);

  useEffect(() => {
    const currentCard = searchParams.get("card");
    if (currentCard === activeTab) return;
    if (!currentCard && activeTab === "am") return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("card", activeTab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [activeTab, pathname, router, searchParams]);

  useEffect(() => {
    const node = previewViewportRef.current;
    if (!node) return;

    const updateScale = () => {
      const nextWidth = node.clientWidth;
      if (!nextWidth) return;
      setPreviewScale(Math.min(1, nextWidth / ROUTINE_CARD_WIDTH));
    };

    updateScale();

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(updateScale);
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const node = captureRef.current;
    if (!node) return;

    const updateHeight = () => {
      const nextHeight = node.getBoundingClientRect().height;
      if (!nextHeight) return;
      setPreviewHeight(nextHeight);
    };

    updateHeight();

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);

    return () => observer.disconnect();
  }, [config, activeTab, amSteps, pmSteps]);

  function buildRoutineStepImageUrl(imagePath: string) {
    if (isDirectImageUrl(imagePath)) return imagePath;
    return `/api/product-image?key=${encodeURIComponent(imagePath)}`;
  }

  function resolveStepImageSource(step: StepDraft) {
    if (step.product_image_url) return step.product_image_url;
    if (!step.product_id) return "";

    const product = allProducts.find((item) => item.id === step.product_id);
    return (
      product?.packageImageThumbPath ??
      product?.packageImagePath ??
      product?.packageImageThumb ??
      product?.packageImage ??
      ""
    );
  }

  function resolveSteps(steps: StepDraft[]) {
    return steps.map((step) => ({
      ...step,
      product_image_url: resolveStepImageSource(step)
        ? buildRoutineStepImageUrl(resolveStepImageSource(step))
        : "",
    }));
  }

  const updateConfig = useCallback(
    (patch: Partial<RoutineCardConfig>) => setConfig((current) => ({ ...current, ...patch })),
    []
  );

  const addStep = () => {
    setCurrentSteps((prev) => [
      ...prev,
      {
        icon: "🌿",
        step_name: "",
        product_name: "",
        brand: "",
        product_id: "",
        product_image_url: "",
      },
    ]);
  };

  const removeStep = (index: number) => {
    setCurrentSteps((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const updateStep = (index: number, patch: Partial<StepDraft>) => {
    setCurrentSteps((prev) =>
      prev.map((step, currentIndex) => (currentIndex === index ? { ...step, ...patch } : step))
    );
  };

  const copyShareText = () => {
    const stepCount = currentSteps.filter((step) => step.step_name.trim()).length;

    const concernsText = config.concerns.length > 0 ? config.concerns.join("・") : "お肌の悩みなし";
    const text = [
      `${activeEmoji} ${config.title} ${activeLabel}カード`,
      `${config.skinType} / ${concernsText}`,
      `${activeEmoji} ${activeLabel} ${stepCount}ステップ`,
      config.note ? `💬 ${config.note}` : "",
      "#HADAMI #スキンケア",
    ]
      .filter(Boolean)
      .join("\n");

    navigator.clipboard.writeText(text);
  };

  const handleDownloadImage = async () => {
    if (!captureRef.current || isDownloading) return;

    setIsDownloading(true);
    setLastExportMode(null);

    try {
      const fontSet = document.fonts;
      if (fontSet?.ready) {
        await fontSet.ready;
      }
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });

      const inlinedSteps = await Promise.all(
        currentSteps.map(async (step) => {
          const raw = step.product_image_url;
          if (!raw) return step;
          if (raw.startsWith("data:")) return step;
          const url = isDirectImageUrl(raw) ? raw : buildRoutineStepImageUrl(raw);
          try {
            const response = await fetch(url, { credentials: "same-origin" });
            if (!response.ok) return { ...step, product_image_url: url };
            const blob = await response.blob();
            const dataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = () => reject(reader.error);
              reader.readAsDataURL(blob);
            });
            return { ...step, product_image_url: dataUrl };
          } catch {
            return { ...step, product_image_url: url };
          }
        })
      );
      setCaptureSteps(inlinedSteps);
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });

      const { toBlob } = await import("html-to-image");
      const blob = await Promise.race([
        toBlob(captureRef.current, {
          pixelRatio: 2,
          cacheBust: false,
          backgroundColor: undefined,
          skipFonts: true,
        }),
        new Promise<Blob | null>((_, reject) => {
          window.setTimeout(() => reject(new Error("Share image generation timed out")), 15000);
        }),
      ]);

      const filename = `hadami-routine-${activeTab}-${Date.now()}.png`;
      const shareNavigator = navigator as ShareCapableNavigator;

      if (
        blob &&
        isMobileShareDevice() &&
        typeof File !== "undefined" &&
        typeof shareNavigator.share === "function"
      ) {
        const file = new File([blob], filename, { type: blob.type || "image/png" });
        const shareData: ShareData = {
          files: [file],
          title: `${activeLabel}カード画像`,
        };

        if (!shareNavigator.canShare || shareNavigator.canShare(shareData)) {
          try {
            await shareNavigator.share(shareData);
            setLastExportMode("shared");
            setTimeout(() => setLastExportMode(null), 2500);
            return;
          } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") return;
          }
        }
      }

      if (!blob) throw new Error("Failed to generate image");
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
      downloadShareImage(dataUrl, filename);
      setLastExportMode("downloaded");
      setTimeout(() => setLastExportMode(null), 2500);
    } catch (error) {
      console.error("Failed to save routine share image:", error);
      alert("画像の保存に失敗しました。時間をおいてもう一度お試しください。");
    } finally {
      setCaptureSteps(null);
      setIsDownloading(false);
    }
  };

  const toggleConcern = (concern: string) => {
    updateConfig({
      concerns: config.concerns.includes(concern)
        ? config.concerns.filter((item) => item !== concern)
        : [...config.concerns, concern],
    });
  };

  const previewSteps = resolveSteps(currentSteps.filter((step) => step.step_name.trim()));

  return (
    <div className="min-h-screen px-4 pt-4 pb-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/deck")}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <span className="text-lg leading-none">‹</span>
          <span>スキンケア管理</span>
        </button>
        <span className="text-gray-300 dark:text-gray-600">/</span>
        <span className="text-sm font-semibold truncate">{config.title}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6 order-2 lg:order-1">
          <Section title="タイトル">
            <input
              type="text"
              value={config.title}
              onChange={(event) => updateConfig({ title: event.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3A8F7A]/30"
              placeholder="ルーティン名"
            />
          </Section>

          <Section title="Xアカウント名（任意）">
            <input
              type="text"
              value={config.username}
              onChange={(event) => updateConfig({ username: event.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3A8F7A]/30"
              placeholder="@username"
            />
          </Section>

          <Section title="肌タイプ">
            <div className="flex flex-wrap gap-2">
              {SKIN_TYPES.map((skinType) => (
                <button
                  key={skinType}
                  onClick={() => updateConfig({ skinType })}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                    config.skinType === skinType
                      ? "text-white"
                      : "bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300"
                  }`}
                  style={config.skinType === skinType ? { backgroundColor: config.accentColor } : {}}
                >
                  {skinType}
                </button>
              ))}
            </div>
          </Section>

          <Section title="お肌の悩み">
            <div className="flex flex-wrap gap-2">
              {CONCERN_OPTIONS.map((concern) => (
                <button
                  key={concern}
                  onClick={() => toggleConcern(concern)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                    config.concerns.includes(concern)
                      ? "text-white"
                      : "bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300"
                  }`}
                  style={config.concerns.includes(concern) ? { backgroundColor: config.accentColor } : {}}
                >
                  {concern}
                </button>
              ))}
            </div>
          </Section>

          <Section title="ひとことメモ">
            <textarea
              value={config.note}
              onChange={(event) => updateConfig({ note: event.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3A8F7A]/30 resize-none"
              rows={2}
              placeholder="スキンケアのこだわりポイントなど..."
            />
          </Section>

          <Section title="テーマ">
            <div className="flex gap-2">
              {(["light", "dark"] as const).map((theme) => (
                <button
                  key={theme}
                  onClick={() => updateConfig({ theme })}
                  className={`text-xs px-4 py-1.5 rounded-full font-medium transition-colors ${
                    config.theme === theme
                      ? "text-white"
                      : "bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300"
                  }`}
                  style={config.theme === theme ? { backgroundColor: config.accentColor } : {}}
                >
                  {theme === "light" ? "ライト" : "ダーク"}
                </button>
              ))}
            </div>
          </Section>

          <Section title="アクセントカラー">
            <div className="flex gap-3">
              {ACCENT_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => updateConfig({ accentColor: color.value })}
                  className="flex flex-col items-center gap-1"
                >
                  <div
                    className="w-8 h-8 rounded-full transition-transform"
                    style={{
                      backgroundColor: color.value,
                      transform: config.accentColor === color.value ? "scale(1.2)" : "scale(1)",
                      boxShadow:
                        config.accentColor === color.value ? `0 0 0 3px ${color.value}40` : "none",
                    }}
                  />
                  <span className="text-[10px] text-gray-500">{color.label}</span>
                </button>
              ))}
            </div>
          </Section>

          <Section title="ステップ編集">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab("am")}
                className={`flex-1 text-center py-2 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "am" ? "text-white" : "bg-black/5 dark:bg-white/10"
                }`}
                style={activeTab === "am" ? { backgroundColor: config.accentColor } : {}}
              >
                ☀️ 朝カード
              </button>
              <button
                onClick={() => setActiveTab("pm")}
                className={`flex-1 text-center py-2 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "pm" ? "text-white" : "bg-black/5 dark:bg-white/10"
                }`}
                style={activeTab === "pm" ? { backgroundColor: config.accentColor } : {}}
              >
                🌙 夜カード
              </button>
            </div>

            <div className="space-y-3">
              {currentSteps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-3 rounded-xl border border-black/5 dark:border-white/10 bg-white/50 dark:bg-white/5"
                >
                  <select
                    value={step.icon}
                    onChange={(event) => updateStep(index, { icon: event.target.value })}
                    className="text-lg bg-transparent cursor-pointer"
                  >
                    {STEP_ICONS.map((icon) => (
                      <option key={icon} value={icon}>
                        {icon}
                      </option>
                    ))}
                  </select>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      value={step.step_name}
                      onChange={(event) => updateStep(index, { step_name: event.target.value })}
                      className="w-full text-sm px-2 py-1 rounded-lg border border-black/5 dark:border-white/10 bg-transparent focus:outline-none focus:ring-1 focus:ring-[#3A8F7A]/30"
                      placeholder="ステップ名（例：化粧水）"
                    />
                    <input
                      type="text"
                      value={step.product_name}
                      onChange={(event) => updateStep(index, { product_name: event.target.value })}
                      className="w-full text-xs px-2 py-1 rounded-lg border border-black/5 dark:border-white/10 bg-transparent focus:outline-none focus:ring-1 focus:ring-[#3A8F7A]/30 text-gray-500"
                      placeholder="商品名（任意）"
                    />
                  </div>
                  <button
                    onClick={() => removeStep(index)}
                    className="text-red-400 hover:text-red-500 text-sm mt-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addStep}
              className="mt-3 w-full py-2 rounded-xl border-2 border-dashed border-black/10 dark:border-white/10 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              ＋ ステップを追加
            </button>
          </Section>

          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={handleDownloadImage}
                disabled={isDownloading}
                className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60"
                style={{ backgroundColor: config.accentColor }}
              >
                {isDownloading
                  ? "画像を作成中..."
                  : lastExportMode === "shared"
                    ? "保存メニューを開きました"
                    : lastExportMode === "downloaded"
                      ? "画像を保存しました"
                      : `${activeLabel}カード画像を保存`}
              </button>
              <button
                onClick={copyShareText}
                className="px-6 py-3 rounded-xl text-sm font-semibold border border-black/10 dark:border-white/10 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              >
                本文をコピー
              </button>
            </div>

            <p className="text-xs text-gray-400">
              iPhoneやAndroidでは保存メニューから「画像を保存」を選ぶと写真に入れやすくなります。このカードはデバイス上でのみ保持され、ページを離れるとリセットされます。
            </p>
          </div>
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start order-1 lg:order-2">
          <div className="text-xs text-gray-400 mb-2 text-center lg:text-left">
            {activeEmoji} {activeLabel}カードのプレビュー
          </div>
          <div ref={previewViewportRef} className="w-full overflow-hidden">
            <div
              className="flex justify-center"
              style={{
                height: previewHeight ? previewHeight * previewScale : undefined,
              }}
            >
              <div
                style={{
                  width: ROUTINE_CARD_WIDTH,
                  transform: `scale(${previewScale})`,
                  transformOrigin: "top center",
                }}
              >
                <RoutineShareCard
                  config={config}
                  mode={activeTab}
                  steps={previewSteps}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-[-10000px] top-0 opacity-0"
      >
        <div ref={captureRef}>
          <RoutineShareCard
            config={config}
            mode={activeTab}
            steps={
              captureSteps
                ? resolveSteps(captureSteps.filter((step) => step.step_name.trim()))
                : previewSteps
            }
          />
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
        {title}
      </label>
      {children}
    </div>
  );
}
