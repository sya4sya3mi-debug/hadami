export const APP_FONT_STACK =
  "'YakuHanJPs', -apple-system, system-ui, 'Segoe UI', 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif";

export const SHARE_CARD_BODY_FONT_STACK = APP_FONT_STACK;
export const SHARE_CARD_DISPLAY_FONT_STACK = APP_FONT_STACK;

export function buildCanvasFont(weight: number, sizePx: number) {
  return `${weight} ${sizePx}px ${SHARE_CARD_BODY_FONT_STACK}`;
}
