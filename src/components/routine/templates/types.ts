import type { RoutineCardConfig } from "@/lib/routines";
import type { RoutineCardMode } from "@/lib/routineCards";

export type TemplateStep = {
  icon: string;
  step_name: string;
  product_name?: string | null;
  brand?: string | null;
  product_image_url?: string | null;
};

export type TemplateProps = {
  config: RoutineCardConfig;
  mode: RoutineCardMode;
  steps: TemplateStep[];
  accentVar: string;
};

export const TEMPLATE_CARD_WIDTH = 560;
export const TEMPLATE_CARD_HEIGHT = 720;

export function todayJP() {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export function getInitials(name: string): string {
  if (!name) return "—";
  const trimmed = name.trim();
  const ascii = trimmed.match(/[A-Za-z]+/g)?.join(" ") ?? "";
  if (ascii) {
    return ascii
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join("");
  }
  return trimmed.charAt(0);
}
