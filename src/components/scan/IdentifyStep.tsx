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
      const MAX_SIDE = 1600;
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
      resolve(canvas.toDataURL("image/jpeg", 0.90));
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
    <div>
      {!showFallback ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Hero image with progress overlay */}
          {displayImage && (
            <div
              style={{
                position: "relative",
                width: "100%",
                height: 200,
                overflow: "hidden",
                background: "var(--hd-surface-2, var(--hd-surface))",
                border: "1px solid var(--hd-hair)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayImage}
                alt="撮影した画像"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top, oklch(0.22 0.01 95 / 0.55), transparent 60%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 14,
                  left: 14,
                  right: 14,
                }}
              >
                <div
                  style={{
                    height: 2,
                    background: "oklch(0.99 0.005 85 / 0.30)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${progress}%`,
                      background: "var(--hd-bg)",
                      transition: "width 0.7s ease-out",
                    }}
                  />
                </div>
                <div
                  className="hd-mono"
                  style={{
                    marginTop: 6,
                    fontSize: 10,
                    color: "oklch(0.99 0.005 85 / 0.85)",
                    letterSpacing: "0.1em",
                  }}
                >
                  {progress}%
                </div>
              </div>
            </div>
          )}

          {/* Status card */}
          <div
            style={{
              background: "var(--hd-surface)",
              border: "1px solid var(--hd-hair)",
              padding: "28px 20px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                position: "relative",
                width: 56,
                height: 56,
                margin: "0 auto 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 999,
                  border: "1px solid var(--hd-line)",
                  animation: "ripple 2s ease-in-out infinite",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 8,
                  borderRadius: 999,
                  border: "1px solid var(--hd-line)",
                  animation: "ripple 2s ease-in-out 0.4s infinite",
                }}
              />
              <div
                style={{
                  position: "relative",
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  background: "var(--hd-ink)",
                  color: "var(--hd-bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  zIndex: 1,
                }}
              >
                ✦
              </div>
            </div>
            <p
              key={message}
              className="hd-serif"
              style={{
                fontSize: 17,
                color: "var(--hd-ink)",
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              {message}
            </p>
            <p
              className="hd-mono hd-caps"
              style={{
                marginTop: 10,
                fontSize: 10,
                color: "var(--hd-ink-40)",
              }}
            >
              AI is identifying the product
            </p>
          </div>
        </div>
      ) : (
        /* Fallback: capture ingredients photo */
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Notice */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              padding: "16px 18px",
              background: "var(--hd-surface)",
              border: "1px solid var(--hd-hair)",
              borderLeft: "2px solid var(--hd-ink)",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--hd-ink-60)",
                fontSize: 16,
              }}
              aria-hidden="true"
            >
              ⓘ
            </div>
            <div style={{ flex: 1 }}>
              <div
                className="hd-serif"
                style={{
                  fontSize: 16,
                  color: "var(--hd-ink)",
                  letterSpacing: "-0.01em",
                  marginBottom: 4,
                }}
              >
                成分情報が見つかりませんでした
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--hd-ink-60)",
                  fontFamily: "var(--hd-sans)",
                  lineHeight: 1.6,
                }}
              >
                パッケージから商品を特定できなかったため、裏面の成分表を撮影して読み取ります。
              </div>
            </div>
          </div>

          {/* Tip card */}
          <div
            style={{
              padding: "14px 18px",
              background: "var(--hd-surface)",
              border: "1px solid var(--hd-hair)",
            }}
          >
            <div
              className="hd-mono hd-caps"
              style={{
                fontSize: 9,
                color: "var(--hd-ink-40)",
                marginBottom: 8,
                letterSpacing: "0.12em",
              }}
            >
              Tips
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                fontSize: 12,
                color: "var(--hd-ink-60)",
                fontFamily: "var(--hd-sans)",
                lineHeight: 1.8,
              }}
            >
              <li>明るい場所で撮影してください</li>
              <li>成分表全体が画面に収まるように</li>
              <li>反射やボケを避けてピントを合わせて</li>
            </ul>
          </div>

          {/* Capture CTA */}
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: "100%",
              padding: "32px 20px",
              background: "var(--hd-surface)",
              border: "1px dashed var(--hd-line)",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 999,
                background: "var(--hd-ink)",
                color: "var(--hd-bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
              }}
              aria-hidden="true"
            >
              ⌘
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                className="hd-mono hd-caps"
                style={{
                  fontSize: 9,
                  color: "var(--hd-ink-40)",
                  letterSpacing: "0.14em",
                  marginBottom: 6,
                }}
              >
                Step 2 · Fallback
              </div>
              <div
                className="hd-serif"
                style={{
                  fontSize: 18,
                  color: "var(--hd-ink)",
                  letterSpacing: "-0.01em",
                  marginBottom: 4,
                }}
              >
                裏面の成分表を撮影
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--hd-ink-60)",
                  fontFamily: "var(--hd-sans)",
                  lineHeight: 1.6,
                }}
              >
                成分一覧が書いてある面を撮影します
              </div>
            </div>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFallbackFile}
            style={{ display: "none" }}
          />
        </div>
      )}

      {/* Multi-product bottom sheet */}
      {multiProducts && multiProducts.length > 0 && (
        <BottomSheet open={!!showMultiSheet} onClose={onCloseMultiSheet || (() => {})}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 8 }}>
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <div
                className="hd-mono hd-caps"
                style={{
                  fontSize: 9,
                  color: "var(--hd-ink-40)",
                  letterSpacing: "0.14em",
                  marginBottom: 8,
                }}
              >
                Detected · {multiProducts.length} items
              </div>
              <div
                className="hd-serif"
                style={{
                  fontSize: 20,
                  color: "var(--hd-ink)",
                  letterSpacing: "-0.01em",
                }}
              >
                コスメを選んでください
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  color: "var(--hd-ink-60)",
                  fontFamily: "var(--hd-sans)",
                }}
              >
                確認したいコスメを 1 つ選びます
              </div>
            </div>

            {multiProducts.map((p, i) => {
              const isSaved = multiSavedIndexes?.has(i);
              const isResolving = multiResolvingIndexes?.has(i);
              return (
                <div
                  key={i}
                  style={{
                    background: "var(--hd-surface)",
                    border: "1px solid var(--hd-hair)",
                    padding: "14px 16px",
                  }}
                >
                  <div
                    className="hd-serif"
                    style={{
                      fontSize: 15,
                      color: "var(--hd-ink)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {p.productName || "(商品名なし)"}
                  </div>
                  <div
                    className="hd-mono"
                    style={{
                      marginTop: 4,
                      fontSize: 10,
                      color: "var(--hd-ink-40)",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {(p.brand || "—")} · {p.productType}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                    <button
                      onClick={() => onSelectProduct?.(p, i)}
                      disabled={isResolving}
                      className="hd-cta"
                      style={{
                        flex: 1,
                        padding: "11px 14px",
                        fontSize: 12,
                        cursor: isResolving ? "not-allowed" : "pointer",
                        opacity: isResolving ? 0.5 : 1,
                      }}
                    >
                      {isResolving ? "検索中…" : "詳細を見る"}
                    </button>
                    <button
                      onClick={() => onSaveMulti?.(p, i)}
                      disabled={isSaved || isResolving}
                      style={{
                        flex: 1,
                        padding: "11px 14px",
                        fontSize: 12,
                        fontWeight: 500,
                        fontFamily: "var(--hd-sans)",
                        background: "transparent",
                        color: isSaved || isResolving ? "var(--hd-ink-40)" : "var(--hd-ink)",
                        border: "1px solid var(--hd-line)",
                        cursor: isSaved || isResolving ? "not-allowed" : "pointer",
                      }}
                    >
                      {isSaved ? "✓ 保存済み" : isResolving ? "検索中…" : "保存する"}
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
