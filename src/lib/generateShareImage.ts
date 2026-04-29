"use client";

import { Product, Ingredient } from "@/types";
import { getIngredientById, RARITY } from "./ingredients";
import { getGenreByKey } from "./productGenres";

// ── Softa palette (oklch を hex 近似に解いた値) ──
const SOFTA = {
  bg: "#f0eee9",
  surface: "#fbf8f1",
  surface2: "#e6e2d8",
  ink: "#231f17",
  ink60: "#5a544a",
  ink40: "#8c8678",
  hair: "#dcd6c8",
  line: "#cfc8b8",
  moss: "#3a5a3e",
} as const;

const SERIF_FONT_STACK =
  "'Shippori Mincho', 'Hiragino Mincho ProN', 'YuMincho', serif";
const MONO_FONT_STACK =
  "'JetBrains Mono', 'SF Mono', Menlo, ui-monospace, monospace";

function fontSerif(weight: number, sizePx: number, italic = false) {
  return `${italic ? "italic " : ""}${weight} ${sizePx}px ${SERIF_FONT_STACK}`;
}
function fontMono(weight: number, sizePx: number) {
  return `${weight} ${sizePx}px ${MONO_FONT_STACK}`;
}

/** 画像URLを読み込む（CORS回避のためfetch→ObjectURLを試みる） */
async function loadImage(src: string): Promise<HTMLImageElement> {
  try {
    const res = await fetch(src, { mode: "cors" });
    if (res.ok) {
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      return await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(img);
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject();
        };
        img.src = objectUrl;
      });
    }
  } catch {
    /* fallthrough */
  }

  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject();
    img.src = src;
  });
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: string,
  color: string,
  align: CanvasTextAlign = "left",
  letterSpacing = 0,
) {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textBaseline = "top";
  ctx.textAlign = align;
  if (!letterSpacing) {
    ctx.fillText(text, x, y);
  } else {
    // letter-spacing fallback: char-by-char
    let cx = x;
    if (align === "right") {
      // measure full width with spacing first
      let width = 0;
      for (let i = 0; i < text.length; i++) {
        width += ctx.measureText(text[i]).width;
        if (i < text.length - 1) width += letterSpacing;
      }
      cx = x - width;
    } else if (align === "center") {
      let width = 0;
      for (let i = 0; i < text.length; i++) {
        width += ctx.measureText(text[i]).width;
        if (i < text.length - 1) width += letterSpacing;
      }
      cx = x - width / 2;
    }
    ctx.textAlign = "left";
    for (const ch of text) {
      ctx.fillText(ch, cx, y);
      cx += ctx.measureText(ch).width + letterSpacing;
    }
  }
  ctx.restore();
}

function getInitials(productName: string, brand: string): string {
  const candidates = [brand, productName].filter(Boolean);
  for (const source of candidates) {
    const ascii = source.match(/[A-Za-z0-9]+/g);
    if (ascii && ascii.length > 0) {
      const tokens = ascii.filter(Boolean);
      if (tokens.length === 1) return tokens[0].slice(0, 3).toUpperCase();
      return tokens
        .slice(0, 2)
        .map((t) => t.charAt(0))
        .join("")
        .toUpperCase();
    }
  }
  const fallback = (brand || productName || "?").trim();
  return fallback.slice(0, 2);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  font: string,
): string[] {
  ctx.save();
  ctx.font = font;
  const lines: string[] = [];
  let current = "";
  for (const ch of text) {
    const next = current + ch;
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = ch;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  ctx.restore();
  return lines;
}

/** Apothecary 商品ポートレートをタイル状に描画 */
async function drawProductTile(
  ctx: CanvasRenderingContext2D,
  imageSrc: string | undefined,
  initials: string,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  // Tile base color (cream-ish neutral)
  ctx.fillStyle = SOFTA.surface2;
  ctx.fillRect(x, y, w, h);

  let drewImage = false;
  if (imageSrc) {
    try {
      const img = await loadImage(imageSrc);
      const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
      drewImage = true;
    } catch {
      /* fallback to initials */
    }
  }

  if (!drewImage) {
    // Linen texture
    ctx.save();
    ctx.globalAlpha = 0.8;
    const stripe = 8;
    for (let i = -h; i < w + h; i += stripe) {
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(x + i, y, 2, h);
    }
    ctx.restore();
    // Highlight
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, "rgba(255,255,255,0.25)");
    grad.addColorStop(0.5, "rgba(255,255,255,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.15)");
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    // Initials
    drawText(
      ctx,
      initials,
      x + w / 2,
      y + h / 2 - Math.round(w * 0.15),
      fontSerif(400, Math.round(w * 0.32), true),
      "rgba(255,255,255,0.85)",
      "center",
    );
  }

  ctx.restore();
}

/** Spec sheet 風のフッター */
function drawFooter(
  ctx: CanvasRenderingContext2D,
  W: number,
  topY: number,
  hashtags: string,
) {
  ctx.fillStyle = SOFTA.hair;
  ctx.fillRect(36, topY, W - 72, 1);

  drawText(
    ctx,
    hashtags,
    36,
    topY + 14,
    fontMono(400, 12),
    SOFTA.ink40,
    "left",
    0.4,
  );

  drawText(
    ctx,
    "HADAMI",
    W - 36,
    topY + 12,
    fontSerif(400, 26, true),
    SOFTA.moss,
    "right",
  );

  // Bottom frame
  ctx.fillStyle = SOFTA.ink;
  ctx.fillRect(0, topY + 50, W, 3);
}

/** A · Product Card 仕様の Canvas 描画
 *  720×900 縦長 — 上に商品ポートレート、下にデータシート */
async function renderProductCard(params: {
  productName: string;
  brand: string;
  productType: string;
  imageSrc?: string;
  ingredients: { nameJa: string; rarity: string }[];
  serial?: string;
}): Promise<string> {
  const { productName, brand, productType, imageSrc, ingredients, serial } =
    params;
  const genre = getGenreByKey(productType || "other");
  const initials = getInitials(productName, brand);

  const W = 720;
  const H = 900;
  const DPR = 2;
  const canvas = document.createElement("canvas");
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(DPR, DPR);

  // Background
  ctx.fillStyle = SOFTA.bg;
  ctx.fillRect(0, 0, W, H);

  // Top frame rule
  ctx.fillStyle = SOFTA.ink;
  ctx.fillRect(0, 0, W, 3);

  // Image area
  const IMG_TOP = 3;
  const IMG_H = 420;
  await drawProductTile(ctx, imageSrc, initials, 0, IMG_TOP, W, IMG_H);

  // Category badge top-left
  if (genre) {
    const label = genre.label.toUpperCase();
    ctx.save();
    ctx.font = fontMono(500, 12);
    const padX = 12;
    const padY = 8;
    const tw = ctx.measureText(label).width + label.length * 1.6;
    const bw = tw + padX * 2;
    const bh = 24;
    ctx.fillStyle = "rgba(252,250,243,0.92)";
    ctx.fillRect(28, IMG_TOP + 24, bw, bh);
    ctx.strokeStyle = SOFTA.hair;
    ctx.lineWidth = 1;
    ctx.strokeRect(28, IMG_TOP + 24, bw, bh);
    ctx.restore();
    drawText(
      ctx,
      label,
      28 + padX,
      IMG_TOP + 24 + padY,
      fontMono(500, 11),
      SOFTA.ink60,
      "left",
      1.6,
    );
  }

  // Vertical brand label on right side of image
  if (brand) {
    const label = `${brand.toUpperCase()}`;
    ctx.save();
    ctx.translate(W - 36, IMG_TOP + IMG_H - 32);
    ctx.rotate(-Math.PI / 2);
    drawText(ctx, label, 0, 0, fontMono(500, 11), "rgba(255,255,255,0.7)", "left", 2.2);
    ctx.restore();
  }

  // Data sheet top frame
  const SHEET_TOP = IMG_TOP + IMG_H;
  ctx.fillStyle = SOFTA.ink;
  ctx.fillRect(0, SHEET_TOP, W, 3);

  // No. label
  const PAD_X = 36;
  let cursorY = SHEET_TOP + 22;
  drawText(
    ctx,
    `No. ${serial ?? "001"}`,
    PAD_X,
    cursorY,
    fontMono(500, 12),
    SOFTA.ink40,
    "left",
    1.8,
  );

  cursorY += 24;
  drawText(
    ctx,
    (brand || "").toUpperCase(),
    PAD_X,
    cursorY,
    fontMono(500, 13),
    SOFTA.moss,
    "left",
    1.4,
  );

  // Product name (Mincho serif) — 2-line wrap
  cursorY += 24;
  const nameFont = fontSerif(400, 30);
  const nameLines = wrapText(ctx, productName, W - PAD_X * 2, nameFont).slice(0, 3);
  for (const line of nameLines) {
    drawText(ctx, line, PAD_X, cursorY, nameFont, SOFTA.ink, "left");
    cursorY += 36;
  }

  // Hairline divider
  cursorY += 8;
  ctx.fillStyle = SOFTA.ink;
  ctx.fillRect(PAD_X, cursorY, W - PAD_X * 2, 1);
  cursorY += 22;

  // Active Ingredients label
  drawText(
    ctx,
    "Active Ingredients · 注目成分",
    PAD_X,
    cursorY,
    fontMono(500, 11),
    SOFTA.ink40,
    "left",
    1.6,
  );
  cursorY += 24;

  // Ingredient list
  const itemH = 30;
  const maxIngs = 5;
  const list = ingredients.slice(0, maxIngs);
  if (list.length === 0) {
    drawText(
      ctx,
      "—",
      PAD_X,
      cursorY,
      fontSerif(400, 16),
      SOFTA.ink60,
      "left",
    );
    cursorY += itemH;
  } else {
    list.forEach((ing, i) => {
      const idx = String(i + 1).padStart(2, "0");
      drawText(
        ctx,
        idx,
        PAD_X,
        cursorY + 4,
        fontMono(500, 11),
        SOFTA.ink40,
        "left",
      );
      drawText(
        ctx,
        ing.nameJa,
        PAD_X + 36,
        cursorY,
        fontSerif(400, 18),
        SOFTA.ink,
        "left",
      );
      const rarityInfo = RARITY[ing.rarity as keyof typeof RARITY];
      const stars = rarityInfo
        ? "★".repeat(rarityInfo.star) + "☆".repeat(Math.max(0, 4 - rarityInfo.star))
        : "";
      drawText(
        ctx,
        stars,
        W - PAD_X,
        cursorY + 4,
        fontMono(400, 12),
        SOFTA.ink60,
        "right",
        1.2,
      );
      // hairline under each row except last
      if (i < list.length - 1) {
        ctx.fillStyle = SOFTA.hair;
        ctx.fillRect(PAD_X, cursorY + itemH - 2, W - PAD_X * 2, 1);
      }
      cursorY += itemH;
    });
  }

  // Footer
  const FOOTER_TOP = H - 72;
  drawFooter(ctx, W, FOOTER_TOP, "#マイコスメ · #スキンケア");

  return canvas.toDataURL("image/webp", 0.92);
}

export async function generateProductShareImage(product: Product): Promise<string> {
  const activeIngs = product.ingredients
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((pi) => getIngredientById(pi.ingredientId))
    .filter((ing): ing is NonNullable<typeof ing> => !!ing && !!ing.activeIngredient)
    .slice(0, 5);

  return renderProductCard({
    productName: product.name,
    brand: product.brand,
    productType: product.productType,
    // 高画質シェア用バリアントを優先し、未生成なら表示用にフォールバック
    imageSrc: product.packageImageShareUrl ?? product.packageImage,
    ingredients: activeIngs.map((ing) => ({
      nameJa: ing.nameJa,
      rarity: ing.rarity,
    })),
    serial: "001",
  });
}

/** スキャン結果からシェアカードを生成（Product型不要） */
export async function generateScanResultShareImage(params: {
  productName: string;
  brand: string;
  productType: string;
  imagePreview?: string;
  activeIngredients: Ingredient[];
}): Promise<string> {
  const { productName, brand, productType, imagePreview, activeIngredients } = params;
  return renderProductCard({
    productName,
    brand,
    productType,
    imageSrc: imagePreview,
    ingredients: activeIngredients.slice(0, 5).map((ing) => ({
      nameJa: ing.nameJa,
      rarity: ing.rarity,
    })),
    serial: "—",
  });
}
