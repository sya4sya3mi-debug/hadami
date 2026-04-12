export const PRODUCT_IMAGE_BUCKET = "product-images";
export const PRODUCT_IMAGE_THUMB_SIZE = 400;

export function getProductImagePath(userId: string, productId: string) {
  return `${userId}/${productId}.webp`;
}

export function getProductImageThumbPath(userId: string, productId: string) {
  return `${userId}/${productId}-thumb.webp`;
}

export function getProductImageThumbPathFromStoredPath(storedPath: string) {
  return storedPath.endsWith(".webp")
    ? storedPath.replace(/\.webp$/, "-thumb.webp")
    : `${storedPath}-thumb`;
}
