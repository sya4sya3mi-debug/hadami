"use client";

import "@/styles/hadami-tokens.css";
import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/types";
import ShareCardCanvas, {
  SHARE_TEMPLATE_GROUPS,
  SHARE_TEMPLATE_OPTIONS,
} from "@/components/share/ShareCardCanvas";
import {
  ASPECT_DIMENSIONS,
  ASPECT_EXPORT_SCALE,
  type ShareCardConfig,
  type ShareTemplateKey,
} from "@/components/share/templates/types";
import {
  SHARE_PALETTES,
  getSharePalette,
} from "@/lib/shareCardPalettes";
import {
  SHARE_DECOS,
  getShareDecoLabel,
  type ShareDecoKey,
} from "@/lib/shareCardDeco";
import { downloadShareImage } from "@/lib/downloadImage";
import type { SharePaletteKey } from "@/lib/shareCardPalettes";

const STYLE_STORAGE_KEY = "hadami.shareCosmetics.style";

const SKIN_TYPES = ["乾燥肌", "脂性肌", "混合肌", "敏感肌", "普通肌"];

type ShareCapableNavigator = Navigator & {
  canShare?: (data: ShareData) => boolean;
};

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
    borderRadius: 0,
  };
}

type Props = {
  initialProducts: Product[];
  initialUsername: string;
  initialSkinType: string;
};

export default function ShareCosmeticsClient({
  initialProducts,
  initialUsername,
  initialSkinType,
}: Props) {
  const router = useRouter();
  const previewCardRef = useRef<HTMLDivElement | null>(null);
  const previewViewportRef = useRef<HTMLDivElement | null>(null);

  // 商品の並び順はローカルで変更可能（最初の1点が「メイン」になる）
  const [products, setProducts] = useState<Product[]>(initialProducts);

  const [config, setConfig] = useState<ShareCardConfig>(() => {
    // localStorage に前回スタイルがあれば復元
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem(STYLE_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<ShareCardConfig>;
          return {
            template: (parsed.template ?? "H4") as ShareTemplateKey,
            palette: (parsed.palette ?? "blossom") as SharePaletteKey,
            deco: (parsed.deco ?? "hearts") as ShareDecoKey,
            // Phase 1 では 1:1 固定。9:16 は Phase 2 で再開放予定。
            aspect: "1:1",
            username: initialUsername,
            skinType: initialSkinType,
          };
        }
      } catch {
        // ignore
      }
    }
    return {
      template: "H4",
      palette: "blossom",
      deco: "hearts",
      aspect: "1:1",
      username: initialUsername,
      skinType: initialSkinType,
    };
  });

  const [previewScale, setPreviewScale] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);
  const [lastExportMode, setLastExportMode] = useState<"shared" | "downloaded" | null>(null);

  const dim = ASPECT_DIMENSIONS[config.aspect];

  // スタイル設定を localStorage に保存
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        STYLE_STORAGE_KEY,
        JSON.stringify({
          template: config.template,
          palette: config.palette,
          deco: config.deco,
          aspect: config.aspect,
        }),
      );
    } catch {
      // 容量超過などは無視
    }
  }, [config.template, config.palette, config.deco, config.aspect]);

  // プレビュースケール
  useEffect(() => {
    const node = previewViewportRef.current;
    if (!node) return;

    const updateScale = () => {
      const nextWidth = node.clientWidth;
      if (!nextWidth) return;
      // プレビュー領域より少し小さく余白を確保
      setPreviewScale(Math.min(1, (nextWidth - 16) / dim.width));
    };

    updateScale();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateScale);
    observer.observe(node);
    return () => observer.disconnect();
  }, [dim.width]);

  const updateConfig = useCallback(
    (patch: Partial<ShareCardConfig>) => setConfig((cur) => ({ ...cur, ...patch })),
    [],
  );

  const moveProduct = useCallback((from: number, to: number) => {
    setProducts((cur) => {
      if (to < 0 || to >= cur.length || from === to) return cur;
      const next = cur.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const handleDownloadImage = async () => {
    if (!previewCardRef.current || isDownloading) return;
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

      // 画像 <img> をすべて decode 完了させる
      const captureNode = previewCardRef.current;
      if (captureNode) {
        const imgs = Array.from(captureNode.querySelectorAll("img"));
        await Promise.all(
          imgs.map((img) => {
            if (img.complete && img.naturalWidth > 0) return Promise.resolve();
            const decodePromise = (img as HTMLImageElement).decode?.();
            if (decodePromise) return decodePromise.catch(() => undefined);
            return new Promise<void>((resolve) => {
              const finish = () => resolve();
              img.addEventListener("load", finish, { once: true });
              img.addEventListener("error", finish, { once: true });
              window.setTimeout(finish, 3000);
            });
          }),
        );
      }

      let blob: Blob | null = null;
      const exportScale = ASPECT_EXPORT_SCALE[config.aspect];

      try {
        const { default: html2canvas } = await import("html2canvas");
        const canvas = await Promise.race([
          html2canvas(previewCardRef.current, {
            scale: exportScale,
            backgroundColor: "#ffffff",
            useCORS: true,
            allowTaint: false,
            logging: false,
            imageTimeout: 15000,
          }),
          new Promise<never>((_, reject) => {
            window.setTimeout(
              () => reject(new Error("Share image generation timed out")),
              15000,
            );
          }),
        ]);
        blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, "image/jpeg", 0.92);
        });
      } catch (captureError) {
        console.warn("Cosmetics share html2canvas failed, falling back:", captureError);
      }

      if (!blob) {
        const { toBlob } = await import("html-to-image");
        blob = await toBlob(previewCardRef.current, {
          pixelRatio: exportScale,
          cacheBust: false,
          backgroundColor: "#ffffff",
          skipFonts: true,
          type: "image/jpeg",
          quality: 0.92,
        });
      }

      if (!blob) throw new Error("画像の生成に失敗しました（capture）");

      const mime = blob.type || "image/jpeg";
      const ext = mime === "image/png" ? "png" : "jpg";
      const filename = `hadami-share-${config.template}-${config.aspect.replace(":", "x")}-${Date.now()}.${ext}`;
      const shareNavigator = navigator as ShareCapableNavigator;

      // モバイル: Web Share API を直接試す
      if (
        isMobileShareDevice() &&
        typeof File !== "undefined" &&
        typeof shareNavigator.share === "function"
      ) {
        const file = new File([blob], filename, { type: mime });
        try {
          await shareNavigator.share({ files: [file] });
          setLastExportMode("shared");
          setTimeout(() => setLastExportMode(null), 2500);
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
          console.warn("navigator.share failed, falling back to download:", error);
        }
      }

      // フォールバック: dataURL → 保存処理
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob!);
      });
      const saveResult = await downloadShareImage(dataUrl, { filename });

      if (saveResult === "downloaded" || saveResult === "shared") {
        setLastExportMode(saveResult === "shared" ? "shared" : "downloaded");
        setTimeout(() => setLastExportMode(null), 2500);
        return;
      }
      if (saveResult === "cancelled") return;

      throw new Error("ブラウザの保存処理が完了しませんでした");
    } catch (error) {
      console.error("Failed to save share image:", error);
      const detail = error instanceof Error ? error.message : String(error);
      alert(`画像の保存に失敗しました。\n${detail}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const accentColor = getSharePalette(config.palette).accent;

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
          style={{
            maxWidth: 980,
            margin: "0 auto",
            padding: "16px 16px 56px",
          }}
        >
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
              onClick={() => router.push("/history")}
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
                fontSize: 11,
              }}
            >
              ← Back · MINE
            </button>
            <span
              className="hd-mono hd-caps"
              style={{ color: "var(--hd-ink-40)", fontSize: 11 }}
            >
              Share Card · COSMETICS
            </span>
          </div>

          {/* Title */}
          <div style={{ marginBottom: 24 }}>
            <div
              className="hd-mono hd-caps"
              style={{ color: "var(--hd-ink-40)", marginBottom: 8, fontSize: 10 }}
            >
              Compose · コスメシェアカード
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
              4点を選んで
              <span style={{ fontStyle: "italic", color: accentColor }}>シェア。</span>
            </h1>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 24,
              alignItems: "start",
            }}
            className="scc-grid"
          >
            <style>{`
              @media (min-width: 880px) {
                .scc-grid {
                  grid-template-columns: 1fr 420px !important;
                  gap: 36px !important;
                }
                .scc-editor { order: 1; }
                .scc-preview { order: 2; position: sticky; top: 20px; }
              }
              @media (max-width: 879px) {
                .scc-editor { order: 2; }
                .scc-preview { order: 1; }
              }
            `}</style>

            {/* === Editor === */}
            <div className="scc-editor" style={{ minWidth: 0 }}>
              {/* Username */}
              <Section no="01" title="X アカウント名">
                <input
                  type="text"
                  value={config.username}
                  onChange={(event) => updateConfig({ username: event.target.value })}
                  style={inputStyle}
                  placeholder="@username（任意）"
                />
              </Section>

              {/* Skin type */}
              <Section no="02" title="肌タイプ（任意）">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  <button
                    onClick={() => updateConfig({ skinType: "" })}
                    style={chipStyle(config.skinType === "")}
                  >
                    指定しない
                  </button>
                  {SKIN_TYPES.map((s) => (
                    <button
                      key={s}
                      onClick={() => updateConfig({ skinType: s })}
                      style={chipStyle(config.skinType === s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </Section>

              {/* Template */}
              <Section
                no="03"
                title="テンプレート"
                hint={SHARE_TEMPLATE_OPTIONS.find((t) => t.key === config.template)?.label}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {SHARE_TEMPLATE_GROUPS.map((group) => {
                    const opts = SHARE_TEMPLATE_OPTIONS.filter((o) => o.group === group.key);
                    return (
                      <div key={group.key}>
                        <div
                          className="hd-mono hd-caps"
                          style={{
                            color: "var(--hd-ink-40)",
                            fontSize: 9,
                            letterSpacing: "0.2em",
                            marginBottom: 6,
                          }}
                        >
                          {group.label}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {opts.map((opt) => (
                            <button
                              key={opt.key}
                              onClick={() => updateConfig({ template: opt.key })}
                              style={chipStyle(config.template === opt.key)}
                              aria-pressed={config.template === opt.key}
                              title={opt.description}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>

              {/* Color palette */}
              <Section
                no="04"
                title="カラーパレット"
                hint={SHARE_PALETTES.find((p) => p.key === config.palette)?.label}
              >
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {SHARE_PALETTES.map((opt) => {
                    const active = config.palette === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => updateConfig({ palette: opt.key })}
                        aria-label={opt.label}
                        aria-pressed={active}
                        title={opt.label}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 999,
                          background: opt.swatch,
                          border: active
                            ? "2px solid var(--hd-ink)"
                            : "1px solid var(--hd-line)",
                          boxShadow: active ? "inset 0 0 0 3px var(--hd-bg)" : "none",
                          padding: 0,
                          cursor: "pointer",
                          transition: "transform 160ms ease",
                        }}
                      />
                    );
                  })}
                </div>
              </Section>

              {/* Deco */}
              <Section
                no="05"
                title="デコパーツ"
                hint={getShareDecoLabel(config.deco)}
              >
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {SHARE_DECOS.map((opt) => {
                    const active = config.deco === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => updateConfig({ deco: opt.key })}
                        aria-pressed={active}
                        style={{
                          ...chipStyle(active),
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 16,
                            height: 16,
                          }}
                        >
                          {opt.preview(active ? "var(--hd-bg)" : accentColor)}
                        </span>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </Section>

              {/* Selected products with reorder */}
              <Section
                no="06"
                title="選択中のコスメ"
                hint={`${products.length} / 4 点 · ①がメイン`}
              >
                <p
                  style={{
                    fontFamily: "var(--hd-sans)",
                    fontSize: 11,
                    color: "var(--hd-ink-40)",
                    margin: "0 0 10px",
                    lineHeight: 1.6,
                  }}
                >
                  矢印で並び替え。①が大きく表示される「メイン」、②③④はサブとして配置されます。
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 8,
                  }}
                >
                  {products.map((p, i) => (
                    <div key={p.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div
                        style={{
                          aspectRatio: "1 / 1",
                          background: "var(--hd-surface-2)",
                          border: i === 0 ? "2px solid var(--hd-ink)" : "1px solid var(--hd-hair)",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        {p.packageImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.packageImageThumb ?? p.packageImage}
                            alt={p.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontFamily: "var(--hd-mono)",
                              fontSize: 9,
                              color: "var(--hd-ink-40)",
                              textAlign: "center",
                              padding: 4,
                            }}
                          >
                            {p.brand}
                          </div>
                        )}
                        {/* index badge */}
                        <div
                          style={{
                            position: "absolute",
                            top: 4,
                            left: 4,
                            width: 22,
                            height: 22,
                            borderRadius: 999,
                            background: i === 0 ? accentColor : "rgba(255,255,255,0.92)",
                            color: i === 0 ? "#fff" : "var(--hd-ink)",
                            fontFamily: "var(--hd-serif)",
                            fontStyle: "italic",
                            fontSize: 12,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {i + 1}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          type="button"
                          onClick={() => moveProduct(i, i - 1)}
                          disabled={i === 0}
                          aria-label="左へ"
                          style={{
                            flex: 1,
                            padding: "4px 0",
                            background: "transparent",
                            border: "1px solid var(--hd-line)",
                            borderRadius: 0,
                            color: i === 0 ? "var(--hd-ink-20)" : "var(--hd-ink)",
                            cursor: i === 0 ? "default" : "pointer",
                            fontFamily: "var(--hd-mono)",
                            fontSize: 12,
                            lineHeight: 1,
                          }}
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          onClick={() => moveProduct(i, i + 1)}
                          disabled={i === products.length - 1}
                          aria-label="右へ"
                          style={{
                            flex: 1,
                            padding: "4px 0",
                            background: "transparent",
                            border: "1px solid var(--hd-line)",
                            borderRadius: 0,
                            color:
                              i === products.length - 1
                                ? "var(--hd-ink-20)"
                                : "var(--hd-ink)",
                            cursor:
                              i === products.length - 1 ? "default" : "pointer",
                            fontFamily: "var(--hd-mono)",
                            fontSize: 12,
                            lineHeight: 1,
                          }}
                        >
                          →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Actions */}
              <div style={{ marginTop: 32 }}>
                <button
                  onClick={handleDownloadImage}
                  disabled={isDownloading}
                  style={{
                    width: "100%",
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
                          : "シェアカードを書き出す"}
                  </span>
                  <span
                    className="hd-mono"
                    style={{ fontSize: 9, letterSpacing: "0.2em", opacity: 0.7 }}
                  >
                    EXPORT →
                  </span>
                </button>
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
            <div className="scc-preview" style={{ alignSelf: "start", minWidth: 0 }}>
              <div
                className="hd-mono hd-caps"
                style={{ color: "var(--hd-ink-40)", marginBottom: 10, fontSize: 10 }}
              >
                Preview · {config.aspect} · {config.template}
              </div>
              <div
                ref={previewViewportRef}
                style={{ width: "100%", overflow: "hidden" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    height: dim.height * previewScale,
                  }}
                >
                  <div
                    style={{
                      width: dim.width,
                      transform: `scale(${previewScale})`,
                      transformOrigin: "top center",
                    }}
                  >
                    <div ref={previewCardRef}>
                      <ShareCardCanvas config={config} products={products} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
    <div
      style={{
        paddingTop: 18,
        paddingBottom: 18,
        borderTop: "1px solid var(--hd-hair)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span className="hd-mono hd-caps" style={{ color: "var(--hd-ink-40)", fontSize: 10 }}>
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
