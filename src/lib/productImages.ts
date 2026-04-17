export const PRODUCT_IMAGE_BUCKET = "product-images";
export const PRODUCT_IMAGE_THUMB_SIZE = 400;
export const PRODUCT_IMAGE_MAX_DIMENSION = 1200;

export function getProductImagePath(userId: string, productId: string) {
  return `${userId}/${productId}.avif`;
}

export function getProductImageThumbPath(userId: string, productId: string) {
  return `${userId}/${productId}-thumb.avif`;
}

export function getProductImageThumbPathFromStoredPath(storedPath: string) {
  const match = storedPath.match(/\.(avif|webp)$/);
  if (match) {
    const ext = match[1];
    return storedPath.replace(/\.(avif|webp)$/, `-thumb.${ext}`);
  }
  return `${storedPath}-thumb`;
}
