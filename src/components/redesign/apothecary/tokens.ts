export type Product = {
  brand: string;
  name: string;
  cat: string;
  color: string;
  initials: string;
};

export const PRODUCTS: Record<string, Product> = {
  heartleaf: { brand: "ANUA", name: "HEARTLEAF 77 + HYALURON", cat: "化粧水", color: "oklch(0.88 0.04 110)", initials: "AN" },
  cica: { brand: "AESTURA", name: "A-CICA 365 BLEMISH CALMING SERUM", cat: "美容液", color: "oklch(0.82 0.02 80)", initials: "AE" },
  madeca: { brand: "CENTELLIAN 24", name: "MADECA CREAM", cat: "クリーム", color: "oklch(0.75 0.03 60)", initials: "C24" },
  pcalm: { brand: "PCALM", name: "Water Barrier Sun Cream", cat: "日焼け止め", color: "oklch(0.92 0.015 220)", initials: "PC" },
  lano: { brand: "terce", name: "Lano-oil", cat: "美容液", color: "oklch(0.28 0.07 260)", initials: "tc" },
  toner: { brand: "Rafiel", name: "HYDRATING SKIN COMFORT TONER", cat: "化粧水", color: "oklch(0.78 0.01 200)", initials: "Rf" },
  verveine: { brand: "L'OCCITANE", name: "VERVEINE CEL MAINS PROPRES", cat: "化粧水", color: "oklch(0.85 0.08 110)", initials: "Lo" },
  dhc: { brand: "DHC", name: "薬用エイジングケア ホワイトエッセンス", cat: "美容液", color: "oklch(0.30 0.08 260)", initials: "DH" },
};

export type IcoName =
  | "sparkle" | "shield" | "refresh" | "sun" | "drop" | "wave"
  | "home" | "book" | "camera" | "notes" | "user" | "chev"
  | "plus" | "close" | "check" | "star" | "scan" | "sparkleSm";

export type Effect = {
  id: string;
  label: string;
  icon: IcoName;
  bg: string;
  count: string;
};

export const EFFECTS: Effect[] = [
  { id: "white",   label: "美白",       icon: "sparkle", bg: "var(--hd-eff-white)",   count: "9/30" },
  { id: "barrier", label: "肌荒れ防止", icon: "shield",  bg: "var(--hd-eff-barrier)", count: "11/29" },
  { id: "wrinkle", label: "シワ改善",   icon: "refresh", bg: "var(--hd-eff-wrinkle)", count: "4/21" },
  { id: "uv",      label: "紫外線防止", icon: "sun",     bg: "var(--hd-eff-uv)",      count: "9/14" },
  { id: "moist",   label: "保湿",       icon: "drop",    bg: "var(--hd-eff-moist)",   count: "12/30" },
  { id: "keratin", label: "角質ケア",   icon: "wave",    bg: "var(--hd-eff-keratin)", count: "2/18" },
];
