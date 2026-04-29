// ルーティンカード用の純粋な型とヘルパー。
// シェアカードはDBに保存しないため、データ層関数は持たない。

import {
  coerceAccentColor,
  coerceRoutineTemplate,
  type AccentColorKey,
  type RoutineTemplateKey,
} from "@/lib/routineCardStyle";

export type RoutineStepDraft = {
  icon: string;
  step_name: string;
  product_name?: string | null;
  product_id?: string | null;
  brand?: string | null;
  product_image_url?: string | null;
};

export type RoutineCardConfig = {
  title: string;
  skinType: string;
  concerns: string[];
  note: string;
  username: string;
  theme: "light" | "dark";
  accentColor: AccentColorKey;
  template: RoutineTemplateKey;
};

export function defaultRoutineCardConfig(): RoutineCardConfig {
  return {
    title: "私のスキンケアルーティン",
    skinType: "乾燥肌",
    concerns: [],
    note: "",
    username: "",
    theme: "light",
    accentColor: "moss",
    template: "editorial",
  };
}

// 古い sessionStorage draft（HEX値の accentColor、template欠損など）を
// 現行の型に正規化する。読み込み時のマイグレーション用。
export function coerceRoutineCardConfig(raw: unknown): RoutineCardConfig {
  const base = defaultRoutineCardConfig();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Record<string, unknown>;
  return {
    title: typeof r.title === "string" ? r.title : base.title,
    skinType: typeof r.skinType === "string" ? r.skinType : base.skinType,
    concerns: Array.isArray(r.concerns)
      ? r.concerns.filter((item): item is string => typeof item === "string")
      : base.concerns,
    note: typeof r.note === "string" ? r.note : base.note,
    username: typeof r.username === "string" ? r.username : base.username,
    theme: r.theme === "dark" ? "dark" : "light",
    accentColor: coerceAccentColor(r.accentColor),
    template: coerceRoutineTemplate(r.template),
  };
}
