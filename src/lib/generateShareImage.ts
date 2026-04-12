"use client";

import { Product } from "@/types";
import { getIngredientById } from "./ingredients";
import { getGenreByKey } from "./productGenres";

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
  const font = `700 ${fontSize}px -apple-system, 'Helvetica Neue', Arial, sans-serif`;
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

export async function generateProductShareImage(product: Product): Promise<string> {
  const genre = getGenreByKey(product.productType || "other");

  const activeIngs = product.ingredients
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((pi) => getIngredientById(pi.ingredientId))
    .filter((ing): ing is NonNullable<typeof ing> => !!ing && !!ing.activeIngredient)
    .slice(0, 5);

  // ── レイアウト（論理px） ──
  const W = 720;
  const IMG_H = 480;
  const NAME_AREA_H = 104;
  const TAG_AREA_H = activeIngs.length > 0 ? 112 : 0;
  const BOTTOM_PAD = 20;
  const H = IMG_H + NAME_AREA_H + TAG_AREA_H + BOTTOM_PAD;

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
  ctx.save();
  // クリップ
  ctx.beginPath();
  ctx.rect(0, 0, W, IMG_H);
  ctx.clip();

  let photoLoaded = false;
  if (product.packageImage) {
    try {
      const img = await loadImage(product.packageImage);
      // object-fit: cover — 隙間なく画像エリアを埋める
      const scale = Math.max(W / img.naturalWidth, IMG_H / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.drawImage(img, (W - dw) / 2, (IMG_H - dh) / 2, dw, dh);
      photoLoaded = true;
    } catch { /* fallback */ }
  }

  if (!photoLoaded) {
    // グラデーション背景
    const g = ctx.createLinearGradient(0, 0, W, IMG_H);
    g.addColorStop(0, "#E8F5F0");
    g.addColorStop(1, "#D4F5EF");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, IMG_H);
  }

  ctx.restore();

  // ── バッジ（左上: カテゴリ、右上: HADAMI）──
  const BADGE_TOP = 20;
  const BADGE_FONT_SIZE = 22;

  // カテゴリ（絵文字なし、テキストのみ）
  if (genre) {
    drawBadge(ctx, genre.label, 20, BADGE_TOP, "rgba(255,255,255,0.92)", genre.color, BADGE_FONT_SIZE);
  }

  // HADAMI バッジ（右端）
  {
    const text = "HADAMI";
    ctx.save();
    ctx.font = `700 ${BADGE_FONT_SIZE}px -apple-system, 'Helvetica Neue', Arial, sans-serif`;
    const tw = ctx.measureText(text).width;
    const PX = 18;
    const bw = tw + PX * 2;
    ctx.restore();
    drawBadge(ctx, text, W - 20 - bw, BADGE_TOP, "#3A8F7A", "#FFFFFF", BADGE_FONT_SIZE);
  }

  // ── 製品名・ブランド（画像エリアの下に表示）──
  const NAME_TOP = IMG_H + 28;

  // 製品名
  ctx.save();
  ctx.font = `800 36px -apple-system, 'Helvetica Neue', Arial, sans-serif`;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillStyle = "#212121";
  let name = product.name;
  const MAX_NAME_W = W - 48;
  while (name.length > 1 && ctx.measureText(name).width > MAX_NAME_W) {
    name = name.slice(0, -1);
  }
  if (name !== product.name) name = name.slice(0, -1) + "…";
  ctx.fillText(name, 24, NAME_TOP);
  ctx.restore();

  // ブランド
  ctx.save();
  ctx.font = `500 24px -apple-system, 'Helvetica Neue', Arial, sans-serif`;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillStyle = "#888888";
  ctx.fillText(product.brand, 24, NAME_TOP + 46);
  ctx.restore();

  // ══ 下部：成分タグ ══
  if (activeIngs.length > 0) {
    const SECTION_TOP = IMG_H + NAME_AREA_H + 16;

    // 「注目成分」ラベル
    ctx.save();
    ctx.font = `600 20px -apple-system, 'Helvetica Neue', Arial, sans-serif`;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillStyle = "#AAAAAA";
    ctx.fillText("注目成分", 24, SECTION_TOP);
    ctx.restore();

    // タグ
    const TAG_H = 38;
    const TAG_TOP = SECTION_TOP + 32;
    let tagX = 24;

    for (const ing of activeIngs) {
      ctx.save();
      ctx.font = `700 21px -apple-system, 'Helvetica Neue', Arial, sans-serif`;
      const tw = ctx.measureText(ing.nameJa).width;
      const PX = 16;
      const tagW = tw + PX * 2;

      if (tagX + tagW > W - 24) { ctx.restore(); break; }

      // 背景
      const r = parseInt(ing.color.slice(1, 3), 16);
      const g = parseInt(ing.color.slice(3, 5), 16);
      const b = parseInt(ing.color.slice(5, 7), 16);
      fillRoundRect(ctx, tagX, TAG_TOP, tagW, TAG_H, TAG_H / 2, `rgba(${r},${g},${b},0.14)`);

      // テキスト（textBaseline=top, y = TAG_TOP + padding）
      const textPY = (TAG_H - 21) / 2;  // 上下余白を均等に
      ctx.fillStyle = ing.color;
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      ctx.fillText(ing.nameJa, tagX + PX, TAG_TOP + textPY);

      ctx.restore();
      tagX += tagW + 10;
    }
  }

  return canvas.toDataURL("image/png");
}
