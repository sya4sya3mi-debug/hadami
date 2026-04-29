export const PRODUCT_IMAGE_BUCKET = "product-images";
export const PRODUCT_IMAGE_DISPLAY_SIZE = 800;
export const PRODUCT_IMAGE_SHARE_SIZE = 1200;
export const PRODUCT_IMAGE_BACKFILL_BATCH_SIZE = 10;

export function getProductImageDisplayPath(userId: string, productId: string) {
  return `${userId}/${productId}-display.webp`;
}

export function getProductImageSharePath(userId: string, productId: string) {
  return `${userId}/${productId}-share.webp`;
}

export function getProductImageSharePathFromStoredPath(storedPath: string) {
  // 表示用パス（DB保存値）からシェア用パスを導出する
  if (storedPath.endsWith("-display.webp")) {
    return storedPath.replace(/-display\.webp$/, "-share.webp");
  }
  // 旧フォーマット（.avif / -thumb.avif / .webp / -thumb.webp）からの導出
  const avifMatch = storedPath.match(/^(.+?)(?:-thumb)?\.avif$/);
  if (avifMatch) return `${avifMatch[1]}-share.webp`;
  const webpMatch = storedPath.match(/^(.+?)(?:-thumb)?\.webp$/);
  if (webpMatch && !storedPath.endsWith("-display.webp")) {
    return `${webpMatch[1]}-share.webp`;
  }
  return storedPath;
}

export function getProductImageDisplayPathFromStoredPath(storedPath: string) {
  // 旧パスを新表示用パスに正規化する
  if (storedPath.endsWith("-display.webp")) return storedPath;
  const avifMatch = storedPath.match(/^(.+?)(?:-thumb)?\.avif$/);
  if (avifMatch) return `${avifMatch[1]}-display.webp`;
  const webpMatch = storedPath.match(/^(.+?)(?:-thumb)?\.webp$/);
  if (webpMatch) return `${webpMatch[1]}-display.webp`;
  return storedPath;
}

/**
 * @deprecated display画像が表示用兼サムネとなったため、新規コードでは
 * getProductImageDisplayPathFromStoredPath を使用してください。
 * 既存呼び出し箇所の後方互換のため残してあります。
 */
export function getProductImageThumbPathFromStoredPath(storedPath: string) {
  return getProductImageDisplayPathFromStoredPath(storedPath);
}
