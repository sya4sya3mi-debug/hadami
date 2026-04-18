function isIOSSafari() {
  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);

  return isIOS && isSafari;
}

/**
 * ブラウザでbase64画像をPNGとしてダウンロードする。
 * iOS Safari は <a download> が不安定なため、新しいタブで画像を開く。
 */
export function downloadShareImage(
  base64DataUrl: string,
  filename?: string,
): void {
  const name = filename ?? `hadami-share-${Date.now()}.png`;

  if (isIOSSafari()) {
    const target = window.open("", "_blank");
    if (target) {
      target.document.write(
        `<html><head><title>${name}</title><meta name="viewport" content="width=device-width,initial-scale=1"></head>` +
          `<body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f5f5f5">` +
          `<div style="text-align:center;padding:16px">` +
          `<p style="font-size:14px;color:#666;margin-bottom:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">画像を長押しして保存してください</p>` +
          `<img src="${base64DataUrl}" style="max-width:100%;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.1)" />` +
          `</div></body></html>`,
      );
      target.document.close();
    }
    return;
  }

  const a = document.createElement("a");
  a.href = base64DataUrl;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
