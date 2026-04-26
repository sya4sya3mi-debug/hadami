type DownloadCapableNavigator = Navigator & {
  canShare?: (data: ShareData) => boolean;
  share?: (data?: ShareData) => Promise<void>;
  standalone?: boolean;
};

export type DownloadShareImageResult =
  | "downloaded"
  | "shared"
  | "cancelled"
  | "failed";

export type DownloadShareImageOptions = {
  filename?: string;
  allowNativeShareFallback?: boolean;
};

function extensionForMimeType(mimeType: string) {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/gif") return "gif";
  return "png";
}

function normalizeFilename(filename: string | undefined, mimeType: string) {
  const extension = extensionForMimeType(mimeType);

  if (!filename) {
    return `hadami-share-${Date.now()}.${extension}`;
  }

  const lastDotIndex = filename.lastIndexOf(".");
  if (lastDotIndex === -1) {
    return `${filename}.${extension}`;
  }

  const basename = filename.slice(0, lastDotIndex);
  return `${basename}.${extension}`;
}

function isIOSDevice() {
  const ua = navigator.userAgent;

  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isIOSSafari() {
  const ua = navigator.userAgent;
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);

  return isIOSDevice() && isSafari;
}

function isStandaloneMode() {
  const standaloneNavigator = navigator as DownloadCapableNavigator;
  const displayModeStandalone =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(display-mode: standalone)").matches
      : false;

  return (
    displayModeStandalone ||
    standaloneNavigator.standalone === true
  );
}

function shouldPreferNativeShareFallback() {
  return isIOSDevice() && (isIOSSafari() || isStandaloneMode());
}

async function dataUrlToBlob(dataUrl: string) {
  const matches = dataUrl.match(/^data:([^;,]+)?(?:;charset=[^;,]+)?(;base64)?,(.*)$/);

  if (!matches) {
    throw new Error("Invalid data URL");
  }

  const mimeType = matches[1] || "application/octet-stream";
  const isBase64 = Boolean(matches[2]);
  const body = matches[3] || "";
  const normalizedBody = body.replace(/\s/g, "");
  const base64Body = normalizedBody
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const paddedBase64 =
    base64Body + "=".repeat((4 - (base64Body.length % 4)) % 4);
  const decoded = isBase64 ? atob(paddedBase64) : decodeURIComponent(body);
  const bytes = new Uint8Array(decoded.length);

  for (let index = 0; index < decoded.length; index += 1) {
    bytes[index] = decoded.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

async function shareImageFile(blob: Blob, filename: string): Promise<DownloadShareImageResult> {
  const shareNavigator = navigator as DownloadCapableNavigator;

  if (typeof File === "undefined" || typeof shareNavigator.share !== "function") {
    return "failed";
  }

  const file = new File([blob], filename, { type: blob.type || "image/png" });
  const shareData: ShareData = { files: [file] };

  try {
    await shareNavigator.share(shareData);
    return "shared";
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return "cancelled";
    }

    return "failed";
  }
}

function triggerBrowserDownload(blob: Blob, filename: string): DownloadShareImageResult {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);

  return "downloaded";
}

function triggerDataUrlDownload(
  dataUrl: string,
  filename: string,
): DownloadShareImageResult {
  const link = document.createElement("a");

  link.href = dataUrl;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return "downloaded";
}

/**
 * base64 画像を保存する。iPhone Safari / standalone PWA では
 * 別画面へ遷移せずに共有シートへフォールバックする。
 */
export async function downloadShareImage(
  base64DataUrl: string,
  options?: string | DownloadShareImageOptions,
): Promise<DownloadShareImageResult> {
  const resolvedOptions =
    typeof options === "string" ? { filename: options } : options ?? {};
  const allowNativeShareFallback =
    resolvedOptions.allowNativeShareFallback ?? true;

  try {
    const blob = await dataUrlToBlob(base64DataUrl);
    const filename = normalizeFilename(resolvedOptions.filename, blob.type);

    if (allowNativeShareFallback && shouldPreferNativeShareFallback()) {
      const shareResult = await shareImageFile(blob, filename);

      if (shareResult === "shared" || shareResult === "cancelled") {
        return shareResult;
      }

      try {
        return triggerBrowserDownload(blob, filename);
      } catch (error) {
        console.error("Failed to fall back to browser download:", error);
        return "failed";
      }
    }

    try {
      return triggerBrowserDownload(blob, filename);
    } catch (error) {
      console.error("Failed to trigger browser download:", error);
      return "failed";
    }
  } catch (error) {
    console.error("Failed to save share image:", error);
    try {
      const fallbackName = normalizeFilename(
        resolvedOptions.filename,
        "image/png",
      );
      return triggerDataUrlDownload(base64DataUrl, fallbackName);
    } catch (fallbackError) {
      console.error("Failed to trigger data URL fallback download:", fallbackError);
      return "failed";
    }
  }
}
