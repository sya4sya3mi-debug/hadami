"use client";

import { useRef, useCallback, useState } from "react";
import BottomSheet from "./BottomSheet";

interface ScannedProduct {
  productName: string;
  brand: string;
  productType: string;
  found: boolean;
  ingredients: string;
  requiresResolve?: boolean;
}

interface IdentifyStepProps {
  progress: number;
  message: string;
  imagePreview?: string;
  showFallback?: boolean;
  onFallbackCapture?: (imageData: string) => void;
  multiProducts?: ScannedProduct[];
  onSelectProduct?: (product: ScannedProduct, index: number) => void;
  onSaveMulti?: (product: ScannedProduct, index: number) => void;
  multiSavedIndexes?: Set<number>;
  multiResolvingIndexes?: Set<number>;
  showMultiSheet?: boolean;
  onCloseMultiSheet?: () => void;
}

async function preprocessImage(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const MAX_SIDE = 1200;
      let { width, height } = img;
      if (width > MAX_SIDE || height > MAX_SIDE) {
        const scale = MAX_SIDE / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      const d = ctx.getImageData(0, 0, width, height);
      for (let i = 0; i < d.data.length; i += 4) {
        const gray = Math.round(0.299 * d.data[i] + 0.587 * d.data[i + 1] + 0.114 * d.data[i + 2]);
        const contrast = Math.min(255, Math.max(0, (gray - 128) * 1.5 + 128));
        d.data[i] = d.data[i + 1] = d.data[i + 2] = contrast;
      }
      ctx.putImageData(d, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", 0.80));
    };
    img.src = dataUrl;
  });
}

export default function IdentifyStep({
  progress,
  message,
  imagePreview,
  showFallback,
  onFallbackCapture,
  multiProducts,
  onSelectProduct,
  onSaveMulti,
  multiSavedIndexes,
  multiResolvingIndexes,
  showMultiSheet,
  onCloseMultiSheet,
}: IdentifyStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);

  const handleFallbackFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !onFallbackCapture) return;
      e.target.value = "";
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        setCapturedPreview(dataUrl);
        const processed = await preprocessImage(dataUrl);
        onFallbackCapture(processed);
      };
      reader.readAsDataURL(file);
    },
    [onFallbackCapture]
  );

  const displayImage = capturedPreview || imagePreview;

  return (
    <div className="animate-fade-up">
      {!showFallback ? (
        <div className="space-y-5">
          {/* Hero image with progress overlay */}
          {displayImage && (
            <div className="relative w-full h-[200px] rounded-r2 overflow-hidden shadow-bo2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={displayImage} alt="撮影した画像" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />

              {/* Progress bar on image */}
              <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
                <div className="h-1.5 rounded-full overflow-hidden bg-white/30 backdrop-blur-sm">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out bg-white"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-white/70 font-sans font-medium">{progress}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Status card */}
          <div className="bg-white rounded-r2 shadow-bo1 p-5 text-center">
            {/* Animated rings */}
            <div className="relative w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-bo-accent/30 animate-[ripple_2s_ease-in-out_infinite]" />
              <div className="absolute inset-[6px] rounded-full border-2 border-bo-accent/20 animate-[ripple_2s_ease-in-out_infinite_0.4s]" />
              <div className="absolute inset-3 rounded-full border-2 border-bo-accent/30 animate-[ripple_2s_ease-in-out_infinite_0.8s]" />
              <span className="text-2xl relative z-10">✨</span>
            </div>

            <p key={message} className="text-sm font-bold text-bo-accent font-sans animate-float-up">
              {message}
            </p>
            <p className="text-[10px] text-bo-ink-muted font-sans mt-1.5">
              AIがコスメと成分情報を特定しています
            </p>
          </div>
        </div>
      ) : (
        /* Fallback: capture ingredients photo */
        <div className="space-y-4">
          {/* Warning card */}
          <div className="flex items-start gap-3 w-full px-4 py-4 rounded-r2 bg-white shadow-bo1 border border-bo-caution/20">
            <div className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0
                            bg-bo-caution-bg text-lg">
              ⚠️
            </div>
            <div>
              <div className="font-bold text-sm text-bo-ink font-sans">成分情報が見つかりませんでした</div>
              <div className="text-xs mt-0.5 text-bo-ink-muted font-sans">
                裏面の成分表を撮影して読み取ります
              </div>
            </div>
          </div>

          {/* Fallback capture button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-r2 flex flex-col items-center justify-center gap-4 py-10
                       bg-white shadow-bo2 border-none pressable cursor-pointer"
          >
            <div className="w-16 h-16 rounded-[20px] flex items-center justify-center
                            bg-gradient-to-br from-bo-accent-soft to-[#C5E8D8]
                            shadow-[0_6px_20px_rgba(58,143,122,0.15)]">
              <span className="text-3xl">📋</span>
            </div>
            <div className="text-center">
              <div className="text-[10px] font-extrabold tracking-widest text-bo-accent font-sans mb-1 uppercase">
                STEP 2
              </div>
              <div className="font-bold text-sm text-bo-ink font-sans">裏面の成分表を撮影</div>
              <div className="text-xs mt-1.5 text-bo-ink-muted font-sans">
                成分一覧が書いてある面を撮影して読み取ります
              </div>
            </div>

            <div className="mt-1 px-6 py-2.5 rounded-full bg-bo-accent text-white text-xs font-bold font-sans
                            shadow-bo-accent inline-flex items-center gap-1.5">
              📷 撮影する
            </div>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFallbackFile}
            className="hidden"
          />
        </div>
      )}

      {/* Multi-product bottom sheet */}
      {multiProducts && multiProducts.length > 0 && (
        <BottomSheet open={!!showMultiSheet} onClose={onCloseMultiSheet || (() => {})}>
          <div className="space-y-3 pb-4">
            <div className="text-center mb-4">
              <div className="w-14 h-14 rounded-[18px] mx-auto mb-3 flex items-center justify-center
                              bg-gradient-to-br from-bo-accent-soft to-[#D4F5EF]">
                <span className="text-2xl">📦</span>
              </div>
              <div className="text-lg font-bold text-bo-ink font-sans">
                {multiProducts.length}つのコスメを検出
              </div>
              <div className="text-xs mt-1 text-bo-ink-muted font-sans">確認したいコスメを選んでください</div>
            </div>

            {multiProducts.map((p, i) => {
              const isSaved = multiSavedIndexes?.has(i);
              const isResolving = multiResolvingIndexes?.has(i);
              return (
                <div
                  key={i}
                  className="bg-white rounded-r2 p-4 shadow-bo1 animate-spring-in"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="font-bold text-sm text-bo-ink font-sans">{p.productName}</div>
                  <div className="text-xs mt-0.5 text-bo-ink-muted font-sans">{p.brand} · {p.productType}</div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => onSelectProduct?.(p, i)}
                      disabled={isResolving}
                      className="flex-1 py-3 rounded-r1 text-xs font-bold text-white font-sans
                                 bg-bo-accent shadow-bo-accent pressable border-none cursor-pointer"
                    >
                      {isResolving ? "検索中..." : "詳細を見る"}
                    </button>
                    <button
                      onClick={() => onSaveMulti?.(p, i)}
                      disabled={isSaved || isResolving}
                      className={`flex-1 py-3 rounded-r1 text-xs font-bold font-sans pressable border-none cursor-pointer ${
                        isSaved || isResolving
                          ? "bg-bo-parchment text-bo-ink-muted"
                          : "bg-white text-bo-accent border border-bo-accent/30 shadow-bo1"
                      }`}
                    >
                      {isSaved ? "✓ 保存済み" : isResolving ? "検索中..." : "保存する"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
