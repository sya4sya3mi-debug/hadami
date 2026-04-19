"use client";

import { Product, Ingredient } from "@/types";
import { getIngredientById, RARITY } from "./ingredients";
import { getGenreByKey } from "./productGenres";
import { buildCanvasFont } from "./shareCardFonts";

/** 画像URLを読み込む（CORS回避のためfetch→ObjectURLを試みる） */
async function loadImage(src: string): Promise<HTMLImageElement> {
  // まずfetch経由でBlob取得（CORSヘッダーが不要になる）
  try {
    const res = await fetch(src, { mode: "cors" });
    if (res.ok) {
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      return await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => { URL.revokeObjectURL(objectUrl); resolve(img); };
        img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(); };
        img.src = objectUrl;
      });
    }
  } catch { /* fallthrough to direct load */ }

  // フォールバック：直接読み込み
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject();
    img.src = src;
  });
}

/** 角丸矩形を塗りつぶす */
function fillRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

/** テキストバッジ（textBaseline=top で描画）。描画した幅を返す */
function drawBadge(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,          // バッジの上端Y
  bg: string,
  fg: string,
  fontSize: number
): number {
  const font = buildCanvasFont(700, fontSize);
  ctx.save();
  ctx.font = font;
  const tw = ctx.measureText(text).width;
  const PX = 18;          // 横パディング
  const PY = 10;          // 縦パディング
  const bw = tw + PX * 2;
  const bh = fontSize + PY * 2;

  fillRoundRect(ctx, x, y, bw, bh, bh / 2, bg);

  ctx.fillStyle = fg;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillText(text, x + PX, y + PY);

  ctx.restore();
  return bw;
}

/** ブランドフッターを描画（HADAMIロゴ + URL） */
function drawFooter(ctx: CanvasRenderingContext2D, W: number, footerTop: number) {
  const FOOTER_H = 72;

  // セパレータライン
  ctx.fillStyle = "#3A8F7A";
  ctx.fillRect(24, footerTop, W - 48, 2);

  // HADAMI ロゴテキスト（左）
  ctx.save();
  ctx.font = buildCanvasFont(800, 28);
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillStyle = "#3A8F7A";
  ctx.fillText("HADAMI", 24, footerTop + 20);
  ctx.restore();

  // キャッチコピー（ロゴ右）
  ctx.save();
  ctx.font = buildCanvasFont(500, 16);
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillStyle = "#AAAAAA";
  ctx.fillText("美容成分図鑑", 24, footerTop + 52);
  ctx.restore();

  // URL（右端）
  ctx.save();
  ctx.font = buildCanvasFont(500, 16);
  ctx.textBaseline = "top";
  ctx.textAlign = "right";
  ctx.fillStyle = "#BDBDBD";
  ctx.fillText("hadami.vercel.app", W - 24, footerTop + 36);
  ctx.restore();

  return FOOTER_H;
}

/** 成分タグ行を描画（レアリティ★付き） */
function drawIngredientTags(
  ctx: CanvasRenderingContext2D,
  ingredients: { nameJa: string; color: string; rarity: string }[],
  W: number,
  sectionTop: number,
): number {
  if (ingredients.length === 0) return 0;

  // 「注目成分」ラベル
  ctx.save();
  ctx.font = buildCanvasFont(600, 20);
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillStyle = "#AAAAAA";
  ctx.fillText("注目成分", 24, sectionTop);
  ctx.restore();

  // タグ
  const TAG_H = 38;
  const TAG_TOP = sectionTop + 32;
  let tagX = 24;

  for (const ing of ingredients) {
    const rarityInfo = RARITY[ing.rarity as keyof typeof RARITY];
    const stars = rarityInfo ? "★".repeat(rarityInfo.star) + " " : "";
    const label = stars + ing.nameJa;

    ctx.save();
    ctx.font = buildCanvasFont(700, 21);
    const tw = ctx.measureText(label).width;
    const PX = 16;
    const tagW = tw + PX * 2;

    if (tagX + tagW > W - 24) { ctx.restore(); break; }

    // 背景
    const r = parseInt(ing.color.slice(1, 3), 16);
    const g = parseInt(ing.color.slice(3, 5), 16);
    const b = parseInt(ing.color.slice(5, 7), 16);
    fillRoundRect(ctx, tagX, TAG_TOP, tagW, TAG_H, TAG_H / 2, `rgba(${r},${g},${b},0.14)`);

    // テキスト
    const textPY = (TAG_H - 21) / 2;
    ctx.fillStyle = ing.color;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillText(label, tagX + PX, TAG_TOP + textPY);

    ctx.restore();
    tagX += tagW + 10;
  }

  return 112; // TAG_AREA_H
}

/** 製品画像を描画（cover/contain） */
async function drawProductImage(
  ctx: CanvasRenderingContext2D,
  imageSrc: string | undefined,
  W: number,
  topPad: number,
  imgH: number,
): Promise<boolean> {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, topPad, W, imgH);
  ctx.clip();

  let photoLoaded = false;
  if (imageSrc) {
    try {
      const img = await loadImage(imageSrc);
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const areaRatio = W / imgH;

      if (imgRatio >= areaRatio * 0.8) {
        const scale = Math.max(W / img.naturalWidth, imgH / img.naturalHeight);
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        ctx.drawImage(img, (W - dw) / 2, topPad + (imgH - dh) / 2, dw, dh);
      } else {
        ctx.fillStyle = "#F5F5F5";
        ctx.fillRect(0, topPad, W, imgH);
        const scale = Math.min(W / img.naturalWidth, imgH / img.naturalHeight);
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        ctx.drawImage(img, (W - dw) / 2, topPad + (imgH - dh) / 2, dw, dh);
      }
      photoLoaded = true;
    } catch { /* fallback */ }
  }

  if (!photoLoaded) {
    const g = ctx.createLinearGradient(0, topPad, W, topPad + imgH);
    g.addColorStop(0, "#E8F5F0");
    g.addColorStop(1, "#D4F5EF");
    ctx.fillStyle = g;
    ctx.fillRect(0, topPad, W, imgH);
  }

  ctx.restore();
  return photoLoaded;
}

/** 製品名・ブランドを描画 */
function drawProductInfo(
  ctx: CanvasRenderingContext2D,
  productName: string,
  brandName: string,
  W: number,
  nameTop: number,
) {
  // 製品名
  ctx.save();
  ctx.font = buildCanvasFont(800, 36);
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillStyle = "#212121";
  let name = productName;
  const MAX_NAME_W = W - 48;
  while (name.length > 1 && ctx.measureText(name).width > MAX_NAME_W) {
    name = name.slice(0, -1);
  }
  if (name !== productName) name = name.slice(0, -1) + "…";
  ctx.fillText(name, 24, nameTop);
  ctx.restore();

  // ブランド
  ctx.save();
  ctx.font = buildCanvasFont(500, 24);
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillStyle = "#888888";
  ctx.fillText(brandName, 24, nameTop + 46);
  ctx.restore();
}

export async function generateProductShareImage(product: Product): Promise<string> {
  const genre = getGenreByKey(product.productType || "other");

  const activeIngs = product.ingredients
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((pi) => getIngredientById(pi.ingredientId))
    .filter((ing): ing is NonNullable<typeof ing> => !!ing && !!ing.activeIngredient)
    .slice(0, 5);

  // ── レイアウト（論理px） ──
  const W = 720;
  const TOP_PAD = 24;
  const IMG_H = 480;
  const NAME_AREA_H = 104;
  const TAG_AREA_H = activeIngs.length > 0 ? 112 : 0;
  const FOOTER_H = 72;
  const BOTTOM_PAD = 20;
  const H = TOP_PAD + IMG_H + NAME_AREA_H + TAG_AREA_H + FOOTER_H + BOTTOM_PAD;

  // ── Canvas: 2x 解像度 ──
  const DPR = 2;
  const canvas = document.createElement("canvas");
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(DPR, DPR);

  // ── 背景 ──
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, W, H);

  // ══ 製品画像 ══
  await drawProductImage(ctx, product.packageImage, W, TOP_PAD, IMG_H);

  // ── バッジ（左上: カテゴリ、右上: HADAMI）──
  const BADGE_TOP = TOP_PAD + 20;
  const BADGE_FONT_SIZE = 22;

  if (genre) {
    drawBadge(ctx, genre.label, 20, BADGE_TOP, "rgba(255,255,255,0.92)", genre.color, BADGE_FONT_SIZE);
  }

  {
    const text = "HADAMI";
    ctx.save();
    ctx.font = buildCanvasFont(700, BADGE_FONT_SIZE);
    const tw = ctx.measureText(text).width;
    const PX = 18;
    const bw = tw + PX * 2;
    ctx.restore();
    drawBadge(ctx, text, W - 20 - bw, BADGE_TOP, "#3A8F7A", "#FFFFFF", BADGE_FONT_SIZE);
  }

  // ── 製品名・ブランド ──
  drawProductInfo(ctx, product.name, product.brand, W, TOP_PAD + IMG_H + 28);

  // ══ 成分タグ（レアリティ★付き） ══
  if (activeIngs.length > 0) {
    const tagIngs = activeIngs.map((ing) => ({
      nameJa: ing.nameJa,
      color: ing.color,
      rarity: ing.rarity,
    }));
    drawIngredientTags(ctx, tagIngs, W, TOP_PAD + IMG_H + NAME_AREA_H + 16);
  }

  // ══ フッター ══
  drawFooter(ctx, W, TOP_PAD + IMG_H + NAME_AREA_H + TAG_AREA_H + 8);

  return canvas.toDataURL("image/png");
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
  const genre = getGenreByKey(productType || "other");

  const topIngs = activeIngredients.slice(0, 5);

  // ── レイアウト ──
  const W = 720;
  const TOP_PAD = 24;
  const IMG_H = 480;
  const NAME_AREA_H = 104;
  const TAG_AREA_H = topIngs.length > 0 ? 112 : 0;
  const FOOTER_H = 72;
  const BOTTOM_PAD = 20;
  const H = TOP_PAD + IMG_H + NAME_AREA_H + TAG_AREA_H + FOOTER_H + BOTTOM_PAD;

  const DPR = 2;
  const canvas = document.createElement("canvas");
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(DPR, DPR);

  // 背景
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, W, H);

  // 製品画像
  await drawProductImage(ctx, imagePreview, W, TOP_PAD, IMG_H);

  // バッジ
  const BADGE_TOP = TOP_PAD + 20;
  const BADGE_FONT_SIZE = 22;

  if (genre) {
    drawBadge(ctx, genre.label, 20, BADGE_TOP, "rgba(255,255,255,0.92)", genre.color, BADGE_FONT_SIZE);
  }

  {
    const text = "HADAMI";
    ctx.save();
    ctx.font = buildCanvasFont(700, BADGE_FONT_SIZE);
    const tw = ctx.measureText(text).width;
    const PX = 18;
    const bw = tw + PX * 2;
    ctx.restore();
    drawBadge(ctx, text, W - 20 - bw, BADGE_TOP, "#3A8F7A", "#FFFFFF", BADGE_FONT_SIZE);
  }

  // 製品名・ブランド
  drawProductInfo(ctx, productName, brand, W, TOP_PAD + IMG_H + 28);

  // 成分タグ
  if (topIngs.length > 0) {
    const tagIngs = topIngs.map((ing) => ({
      nameJa: ing.nameJa,
      color: ing.color,
      rarity: ing.rarity,
    }));
    drawIngredientTags(ctx, tagIngs, W, TOP_PAD + IMG_H + NAME_AREA_H + 16);
  }

  // フッター
  drawFooter(ctx, W, TOP_PAD + IMG_H + NAME_AREA_H + TAG_AREA_H + 8);

  return canvas.toDataURL("image/png");
}
