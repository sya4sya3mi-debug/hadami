// ルーティンカード用の純粋な型とヘルパー。
// シェアカードはDBに保存しないため、データ層関数は持たない。

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
  accentColor: string;
};

export function defaultRoutineCardConfig(): RoutineCardConfig {
  return {
    title: "私のスキンケアルーティン",
    skinType: "乾燥肌",
    concerns: [],
    note: "",
    username: "",
    theme: "light",
    accentColor: "#3A8F7A",
  };
}
