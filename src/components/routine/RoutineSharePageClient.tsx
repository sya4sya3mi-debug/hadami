"use client";

import { useState, useTransition, useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import RoutineShareCard from "./RoutineShareCard";
import { saveRoutineAction, deleteRoutineAction } from "@/app/actions/routineActions";
import {
  routineToCardConfig,
  getAmSteps,
  getPmSteps,
  type Routine,
  type RoutineCardConfig,
} from "@/lib/routines";
import { downloadShareImage } from "@/lib/downloadImage";
import { getProductImageThumbPathFromStoredPath } from "@/lib/productImages";
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

type StepDraft = {
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
  routine,
  initialCardMode,
}: {
  routine: Routine;
  initialCardMode: RoutineCardMode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [lastExportMode, setLastExportMode] = useState<"shared" | "downloaded" | null>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const [previewHeight, setPreviewHeight] = useState<number | null>(null);
  const captureRef = useRef<HTMLDivElement | null>(null);
  const previewViewportRef = useRef<HTMLDivElement | null>(null);

  const [config, setConfig] = useState<RoutineCardConfig>(() => routineToCardConfig(routine));
  const [amSteps, setAmSteps] = useState<StepDraft[]>(() =>
    getAmSteps(routine).map((step) => ({
      icon: step.icon,
      step_name: step.step_name,
      product_name: step.product_name ?? "",
      brand: step.product?.brand ?? "",
      product_id: step.product_id ?? step.product?.id ?? "",
      product_image_url: step.product?.package_image_url ?? "",
    }))
  );
  const [pmSteps, setPmSteps] = useState<StepDraft[]>(() =>
    getPmSteps(routine).map((step) => ({
      icon: step.icon,
      step_name: step.step_name,
      product_name: step.product_name ?? "",
      brand: step.product?.brand ?? "",
      product_id: step.product_id ?? step.product?.id ?? "",
      product_image_url: step.product?.package_image_url ?? "",
    }))
  );
  const [activeTab, setActiveTab] = useState<RoutineCardMode>(initialCardMode);
  const [resolvedImages, setResolvedImages] = useState<Record<string, string>>({});

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
    const allSteps = [...amSteps, ...pmSteps];
    const paths = Array.from(
      new Set(
        allSteps.flatMap((step) => {
          const imagePath = step.product_image_url;
          if (!imagePath || isDirectImageUrl(imagePath)) return [];

          const thumbPath = getProductImageThumbPathFromStoredPath(imagePath);
          return [thumbPath, imagePath].filter((key) => !resolvedImages[key]);
        })
      )
    );

    if (paths.length === 0) return;

    fetch("/api/signed-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keys: paths }),
    })
      .then((response) => (response.ok ? response.json() : { urls: {} }))
      .then((data) => {
        if (data.urls) setResolvedImages((prev) => ({ ...prev, ...data.urls }));
      })
      .catch(() => {});
  }, [amSteps, pmSteps, resolvedImages]);

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
  }, [config, activeTab, amSteps, pmSteps, resolvedImages]);

  function resolveSteps(steps: StepDraft[]) {
    return steps.map((step) => ({
      ...step,
      product_image_url: step.product_image_url
        ? isDirectImageUrl(step.product_image_url)
          ? step.product_image_url
          : resolvedImages[getProductImageThumbPathFromStoredPath(step.product_image_url)] ??
            resolvedImages[step.product_image_url] ??
            ""
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

  const handleSave = () => {
    startTransition(async () => {
      await saveRoutineAction(
        routine.id,
        {
          name: config.title,
          skin_type: config.skinType,
          concerns: config.concerns,
          note: config.note,
          is_public: true,
        },
        amSteps.filter((step) => step.step_name.trim()).map((step) => ({
          step_name: step.step_name,
          product_name: step.product_name || undefined,
          product_id: step.product_id || undefined,
          icon: step.icon,
        })),
        pmSteps.filter((step) => step.step_name.trim()).map((step) => ({
          step_name: step.step_name,
          product_name: step.product_name || undefined,
          product_id: step.product_id || undefined,
          icon: step.icon,
        }))
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const handleDelete = () => {
    if (!confirm("このルーティンを削除しますか？")) return;
    startTransition(() => deleteRoutineAction(routine.id));
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

      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(captureRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        logging: false,
      });

      const filename = `hadami-routine-${activeTab}-${Date.now()}.png`;
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/png");
      });
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

      downloadShareImage(canvas.toDataURL("image/png"), filename);
      setLastExportMode("downloaded");
      setTimeout(() => setLastExportMode(null), 2500);
    } catch {
      alert("画像の保存に失敗しました。時間をおいてもう一度お試しください。");
    } finally {
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
          onClick={() => router.push("/routine")}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <span className="text-lg leading-none">‹</span>
          <span>シェアカード一覧</span>
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
            <button
              onClick={handleSave}
              disabled={isPending}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-colors disabled:opacity-50"
              style={{ backgroundColor: config.accentColor }}
            >
              {saved ? "✓ 保存しました" : isPending ? "保存中..." : "保存する"}
            </button>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={handleDownloadImage}
                disabled={isDownloading}
                className="px-6 py-3 rounded-xl text-sm font-semibold border border-black/10 dark:border-white/10 transition-colors hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-60"
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
              iPhoneやAndroidでは保存メニューから「画像を保存」を選ぶと写真に入れやすくなります。
            </p>
          </div>

          <button
            onClick={handleDelete}
            className="w-full text-center text-xs text-red-400 hover:text-red-500 py-2"
          >
            このルーティンを削除
          </button>
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
            steps={previewSteps}
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
