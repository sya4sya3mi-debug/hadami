"use client";

import "@/styles/hadami-tokens.css";
import { useState, useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import RoutineShareCard from "./RoutineShareCard";
import type { RoutineCardConfig } from "@/lib/routines";
import { downloadShareImage } from "@/lib/downloadImage";
import { useProductStore } from "@/stores/useProductStore";
import {
  getRoutineCardLabel,
  type RoutineCardMode,
} from "@/lib/routineCards";
import {
  ACCENT_COLORS,
  TEMPLATE_OPTIONS,
  getAccentLabel,
  getTemplateLabel,
} from "@/lib/routineCardStyle";

const STYLE_STORAGE_KEY = "hadami.routineCard.style";

const SKIN_TYPES = ["乾燥肌", "脂性肌", "混合肌", "敏感肌", "普通肌"];
const CONCERN_OPTIONS = [
  "毛穴", "ニキビ", "シミ", "くすみ", "シワ", "たるみ",
  "乾燥", "テカリ", "赤み", "肌荒れ", "美白", "エイジング",
];

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

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  background: "var(--hd-bg)",
  border: "1px solid var(--hd-line)",
  borderRadius: 0,
  fontFamily: "var(--hd-sans)",
  fontSize: 13,
  color: "var(--hd-ink)",
  outline: "none",
  boxSizing: "border-box",
};

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: "6px 12px",
    background: active ? "var(--hd-ink)" : "transparent",
    color: active ? "var(--hd-bg)" : "var(--hd-ink)",
    border: active ? "none" : "1px solid var(--hd-line)",
    fontFamily: "var(--hd-sans)",
    fontSize: 12,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
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
    // ルーティンカード（シェア用）では高画質な share バリアントを優先する
    return (
      product?.packageImageSharePath ??
      product?.packageImagePath ??
      product?.packageImageThumbPath ??
      product?.packageImageShareUrl ??
      product?.packageImage ??
      product?.packageImageThumb ??
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
    [],
  );

  // 選択中のスタイル（テンプレ・アクセント色）が変わったら localStorage に保存
  // ユーザーが一度でも選択した時点で「明示的な意図」とみなし、次回以降の初回オープン時に AM/PM 自動連動させない
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        STYLE_STORAGE_KEY,
        JSON.stringify({
          template: config.template,
          accentColor: config.accentColor,
        }),
      );
    } catch {
      // 容量超過などは無視（致命的ではない）
    }
  }, [config.template, config.accentColor]);

  const _addStep = () => {
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
      prev.map((step, currentIndex) => (currentIndex === index ? { ...step, ...patch } : step)),
    );
  };

  const copyShareText = () => {
    const stepCount = currentSteps.filter((step) => step.step_name.trim()).length;
    const concernsText = config.concerns.length > 0 ? config.concerns.join("・") : "お肌の悩みなし";
    const text = [
      `HADAMI · ${activeLabel}のスキンケア`,
      `${config.skinType} / ${concernsText}`,
      `${activeLabel} ${stepCount}ステップ`,
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
        }),
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
          type: "image/webp",
          quality: 0.92,
        }),
        new Promise<Blob | null>((_, reject) => {
          window.setTimeout(
            () => reject(new Error("Share image generation timed out")),
            15000,
          );
        }),
      ]);

      const ext = blob?.type === "image/webp" ? "webp" : "png";
      const filename = `hadami-routine-${activeTab}-${Date.now()}.${ext}`;
      const shareNavigator = navigator as ShareCapableNavigator;

      if (
        blob &&
        isMobileShareDevice() &&
        typeof File !== "undefined" &&
        typeof shareNavigator.share === "function"
      ) {
        const file = new File([blob], filename, { type: blob.type || "image/webp" });
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
      const saveResult = await downloadShareImage(dataUrl, {
        filename,
        allowNativeShareFallback: false,
      });

      if (saveResult === "downloaded" || saveResult === "shared") {
        setLastExportMode(saveResult === "shared" ? "shared" : "downloaded");
        setTimeout(() => setLastExportMode(null), 2500);
        return;
      }

      if (saveResult === "cancelled") return;

      throw new Error("Failed to save generated image");
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
    <div className="hd-root hd-softa" data-density="compact">
      <div
        className="hd"
        style={{
          minHeight: "100vh",
          background: "var(--hd-bg)",
          color: "var(--hd-ink)",
        }}
      >
        <div
          className="rsc-shell"
          style={{
            maxWidth: 980,
            margin: "0 auto",
            padding: "16px 16px 56px",
          }}
        ><style>{`
          @media (min-width: 640px) {
            .rsc-shell { padding: 20px 24px 64px; }
          }
        `}</style>
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: 14,
              borderBottom: "1px solid var(--hd-ink)",
              marginBottom: 26,
            }}
          >
            <button
              onClick={() => router.push("/deck")}
              className="hd-mono hd-caps"
              style={{
                background: "transparent",
                border: "none",
                color: "var(--hd-ink-60)",
                cursor: "pointer",
                padding: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              ← Back · スキンケア管理
            </button>
            <span
              className="hd-mono hd-caps"
              style={{ color: "var(--hd-ink-40)" }}
            >
              Share Card
            </span>
          </div>

          {/* Title */}
          <div style={{ marginBottom: 24 }}>
            <div
              className="hd-mono hd-caps"
              style={{ color: "var(--hd-ink-40)", marginBottom: 8 }}
            >
              Compose · ルーティンカード
            </div>
            <h1
              className="hd-serif"
              style={{
                fontSize: 32,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              ルーティンカードを
              <span style={{ fontStyle: "italic", color: "var(--hd-moss)" }}>
                作る。
              </span>
            </h1>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 24,
              alignItems: "start",
            }}
            className="rsc-grid"
          >
            <style>{`
              @media (min-width: 880px) {
                .rsc-grid {
                  grid-template-columns: 1fr ${ROUTINE_CARD_WIDTH + 20}px !important;
                  gap: 36px !important;
                }
                .rsc-editor { order: 1; }
                .rsc-preview { order: 2; position: sticky; top: 20px; }
              }
              @media (max-width: 879px) {
                .rsc-editor { order: 2; }
                .rsc-preview { order: 1; }
              }
            `}</style>

            {/* === Editor === */}
            <div className="rsc-editor" style={{ minWidth: 0 }}>
              {/* AM/PM tabs */}
              <Section no="01" title="編集対象 · AM / PM">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    border: "1px solid var(--hd-ink)",
                  }}
                >
                  {(["am", "pm"] as const).map((mode) => {
                    const on = activeTab === mode;
                    return (
                      <button
                        key={mode}
                        onClick={() => setActiveTab(mode)}
                        style={{
                          padding: "12px 0",
                          background: on ? "var(--hd-ink)" : "transparent",
                          color: on ? "var(--hd-bg)" : "var(--hd-ink)",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 10,
                        }}
                      >
                        <span
                          className="hd-serif"
                          style={{ fontSize: 15, letterSpacing: "-0.01em" }}
                        >
                          {mode === "am" ? "朝" : "夜"}
                        </span>
                        <span
                          className="hd-mono"
                          style={{
                            fontSize: 9,
                            letterSpacing: "0.18em",
                            opacity: 0.7,
                          }}
                        >
                          {mode === "am" ? "AM" : "PM"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Section>

              {/* Username */}
              <Section no="02" title="X アカウント名">
                <input
                  type="text"
                  value={config.username}
                  onChange={(event) => updateConfig({ username: event.target.value })}
                  style={inputStyle}
                  placeholder="@username（任意）"
                />
              </Section>

              {/* Skin type */}
              <Section no="03" title="肌タイプ">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {SKIN_TYPES.map((skinType) => (
                    <button
                      key={skinType}
                      onClick={() => updateConfig({ skinType })}
                      style={chipStyle(config.skinType === skinType)}
                    >
                      {skinType}
                    </button>
                  ))}
                </div>
              </Section>

              {/* Concerns */}
              <Section
                no="04"
                title="お肌の悩み"
                hint={`${config.concerns.length} 件選択中`}
              >
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {CONCERN_OPTIONS.map((concern) => (
                    <button
                      key={concern}
                      onClick={() => toggleConcern(concern)}
                      style={chipStyle(config.concerns.includes(concern))}
                    >
                      {concern}
                    </button>
                  ))}
                </div>
              </Section>

              {/* Steps */}
              <Section
                no="05"
                title="ステップ編集"
                hint={`${activeLabel} · ${currentSteps.filter((s) => s.step_name.trim()).length} ステップ`}
              >
                <div>
                  {currentSteps.length === 0 && (
                    <p
                      style={{
                        fontFamily: "var(--hd-sans)",
                        fontSize: 12,
                        color: "var(--hd-ink-40)",
                        textAlign: "center",
                        padding: "18px 0",
                        margin: 0,
                      }}
                    >
                      ステップがまだありません。下のボタンから追加してください。
                    </p>
                  )}
                  {currentSteps.map((step, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "stretch",
                        gap: 12,
                        padding: "12px 14px",
                        marginBottom: 8,
                        background: "var(--hd-surface)",
                        border: "1px solid var(--hd-hair)",
                      }}
                    >
                      <div
                        className="hd-mono"
                        style={{
                          width: 22,
                          fontSize: 11,
                          color: "var(--hd-ink-40)",
                          paddingTop: 8,
                          flexShrink: 0,
                        }}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <input
                          type="text"
                          value={step.step_name}
                          onChange={(event) =>
                            updateStep(index, { step_name: event.target.value })
                          }
                          style={{
                            ...inputStyle,
                            padding: "8px 10px",
                            fontSize: 13,
                            marginBottom: 6,
                          }}
                          placeholder="ステップ名（例：化粧水）"
                        />
                        <input
                          type="text"
                          value={step.product_name}
                          onChange={(event) =>
                            updateStep(index, { product_name: event.target.value })
                          }
                          style={{
                            ...inputStyle,
                            padding: "8px 10px",
                            fontSize: 12,
                            color: "var(--hd-ink-60)",
                          }}
                          placeholder="商品名（任意）"
                        />
                      </div>
                      <button
                        onClick={() => removeStep(index)}
                        aria-label="削除"
                        style={{
                          width: 26,
                          height: 26,
                          alignSelf: "flex-start",
                          marginTop: 4,
                          border: "1px solid var(--hd-hair)",
                          background: "transparent",
                          borderRadius: 999,
                          cursor: "pointer",
                          color: "var(--hd-ink-40)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          fontSize: 12,
                          fontFamily: "var(--hd-mono)",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Card style */}
              <Section
                no="06"
                title="カードスタイル"
                hint={`${getTemplateLabel(config.template)} · ${getAccentLabel(config.accentColor)}`}
              >
                <div style={{ marginBottom: 16 }}>
                  <div
                    className="hd-mono hd-caps"
                    style={{
                      color: "var(--hd-ink-40)",
                      marginBottom: 8,
                      fontSize: 9,
                      letterSpacing: "0.2em",
                    }}
                  >
                    Template
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {TEMPLATE_OPTIONS.map((opt) => {
                      const active = config.template === opt.key;
                      return (
                        <button
                          key={opt.key}
                          onClick={() => updateConfig({ template: opt.key })}
                          style={chipStyle(active)}
                          aria-pressed={active}
                          title={opt.description}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div
                    className="hd-mono hd-caps"
                    style={{
                      color: "var(--hd-ink-40)",
                      marginBottom: 8,
                      fontSize: 9,
                      letterSpacing: "0.2em",
                    }}
                  >
                    Accent Color
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {ACCENT_COLORS.map((c) => {
                      const active = config.accentColor === c.key;
                      return (
                        <button
                          key={c.key}
                          onClick={() => updateConfig({ accentColor: c.key })}
                          aria-label={c.label}
                          aria-pressed={active}
                          title={c.label}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 999,
                            background: c.swatchVar,
                            border: active
                              ? "2px solid var(--hd-ink)"
                              : "1px solid var(--hd-line)",
                            boxShadow: active
                              ? "inset 0 0 0 3px var(--hd-bg)"
                              : "none",
                            padding: 0,
                            cursor: "pointer",
                            transition: "transform 160ms ease",
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              </Section>

              {/* Actions */}
              <div style={{ marginTop: 32 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                  }}
                >
                  <button
                    onClick={handleDownloadImage}
                    disabled={isDownloading}
                    style={{
                      padding: "14px 0",
                      background: "var(--hd-ink)",
                      color: "var(--hd-bg)",
                      border: "none",
                      fontFamily: "var(--hd-sans)",
                      fontSize: 14,
                      cursor: isDownloading ? "default" : "pointer",
                      opacity: isDownloading ? 0.7 : 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 12,
                    }}
                  >
                    <span>
                      {isDownloading
                        ? "画像を作成中..."
                        : lastExportMode === "shared"
                          ? "保存メニューを開きました"
                          : lastExportMode === "downloaded"
                            ? "画像を保存しました"
                            : `${activeLabel}カードを保存`}
                    </span>
                    <span
                      className="hd-mono"
                      style={{
                        fontSize: 9,
                        letterSpacing: "0.2em",
                        opacity: 0.7,
                      }}
                    >
                      EXPORT →
                    </span>
                  </button>
                  <button
                    onClick={copyShareText}
                    style={{
                      padding: "14px 0",
                      background: "transparent",
                      color: "var(--hd-ink)",
                      border: "1px solid var(--hd-ink)",
                      fontFamily: "var(--hd-sans)",
                      fontSize: 14,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                    }}
                  >
                    <span>本文をコピー</span>
                    <span
                      className="hd-mono"
                      style={{
                        fontSize: 9,
                        letterSpacing: "0.2em",
                        color: "var(--hd-ink-60)",
                      }}
                    >
                      COPY
                    </span>
                  </button>
                </div>
                <p
                  style={{
                    fontFamily: "var(--hd-sans)",
                    fontSize: 11,
                    color: "var(--hd-ink-40)",
                    marginTop: 14,
                    lineHeight: 1.7,
                    margin: "14px 0 0",
                  }}
                >
                  ※ iPhoneやAndroidでは保存メニューから「画像を保存」を選ぶと写真に保存できます。
                  カードはデバイス上でのみ保持され、ページを離れるとリセットされます。
                </p>
              </div>
            </div>

            {/* === Preview === */}
            <div className="rsc-preview" style={{ alignSelf: "start", minWidth: 0 }}>
              <div
                className="hd-mono hd-caps"
                style={{ color: "var(--hd-ink-40)", marginBottom: 10 }}
              >
                Preview · {activeLabel}カード
              </div>
              <div
                ref={previewViewportRef}
                style={{ width: "100%", overflow: "hidden" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
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
        </div>

        <div
          aria-hidden="true"
          style={{
            pointerEvents: "none",
            position: "fixed",
            left: -10000,
            top: 0,
            opacity: 0,
          }}
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
    </div>
  );
}

function Section({
  no,
  title,
  hint,
  children,
}: {
  no: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ paddingTop: 18, paddingBottom: 18, borderTop: "1px solid var(--hd-hair)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span
            className="hd-mono hd-caps"
            style={{ color: "var(--hd-ink-40)" }}
          >
            No. {no}
          </span>
          <span
            className="hd-serif"
            style={{ fontSize: 16, letterSpacing: "-0.01em" }}
          >
            {title}
          </span>
        </div>
        {hint && (
          <span
            className="hd-mono"
            style={{
              fontSize: 10,
              color: "var(--hd-ink-40)",
              letterSpacing: "0.05em",
            }}
          >
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
