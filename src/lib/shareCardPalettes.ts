// HADAMI コスメシェアカード — 5色パレット
// design_handoff_girly_cards/share-cards-v2.jsx の COLOR_PALETTES を移植
// oklch値はモダンブラウザ対応。html2canvas での書き出しでも oklch は OK
//（ブラウザがレンダリング後の computed style を使うため）

export type SharePaletteKey =
  | "blossom"
  | "cream"
  | "sky"
  | "lavender"
  | "matcha";

export type SharePalette = {
  bg: string;
  ink: string;
  ink60: string;
  ink40: string;
  accent: string;
  accent2: string;
  hair: string;
  line: string;
};

export type SharePaletteOption = {
  key: SharePaletteKey;
  label: string;
  swatch: string; // 単色プレビュー用（accent）
  palette: SharePalette;
};

export const SHARE_PALETTES: readonly SharePaletteOption[] = [
  {
    key: "blossom",
    label: "ブロッサム",
    swatch: "#C4627A",
    palette: {
      bg: "#FAF4F4",
      ink: "#3D2E2E",
      ink60: "#7A6868",
      ink40: "#A89090",
      accent: "#C4627A",
      accent2: "#E8B97A",
      hair: "#EFE4E4",
      line: "#E5D6D6",
    },
  },
  {
    key: "cream",
    label: "クリーム",
    swatch: "#3D5C43",
    palette: {
      bg: "#F8F5EE",
      ink: "#2E2C29",
      ink60: "#6E6A60",
      ink40: "#9E9A8E",
      accent: "#3D5C43",
      accent2: "#B07848",
      hair: "#E9E3D4",
      line: "#DCD4C0",
    },
  },
  {
    key: "sky",
    label: "スカイ",
    swatch: "#4B6CB7",
    palette: {
      bg: "#EEF4FA",
      ink: "#252D3D",
      ink60: "#586478",
      ink40: "#8A95A8",
      accent: "#4B6CB7",
      accent2: "#62BDB0",
      hair: "#DEE8F2",
      line: "#CCDCEC",
    },
  },
  {
    key: "lavender",
    label: "ラベンダー",
    swatch: "#7B52C8",
    palette: {
      bg: "#F3EEF9",
      ink: "#2A2535",
      ink60: "#605870",
      ink40: "#9A91AB",
      accent: "#7B52C8",
      accent2: "#C47AAD",
      hair: "#E5DCF0",
      line: "#D5C8E5",
    },
  },
  {
    key: "matcha",
    label: "マッチャ",
    swatch: "#2E5C38",
    palette: {
      bg: "#EBF4EB",
      ink: "#253328",
      ink60: "#566858",
      ink40: "#8A9A8C",
      accent: "#2E5C38",
      accent2: "#A89040",
      hair: "#DCEBDC",
      line: "#C8DCC8",
    },
  },
] as const;

const PALETTE_KEYS = SHARE_PALETTES.map((p) => p.key) as readonly SharePaletteKey[];

export function isSharePaletteKey(value: unknown): value is SharePaletteKey {
  return typeof value === "string" && (PALETTE_KEYS as readonly string[]).includes(value);
}

export function getSharePalette(key: SharePaletteKey): SharePalette {
  return (SHARE_PALETTES.find((p) => p.key === key) ?? SHARE_PALETTES[0]).palette;
}

export function getSharePaletteLabel(key: SharePaletteKey): string {
  return SHARE_PALETTES.find((p) => p.key === key)?.label ?? "ブロッサム";
}
