"use client";

import "@/styles/hadami-tokens.css";
import type { RoutineCardMode } from "@/lib/routineCards";
import type { RoutineCardConfig } from "@/lib/routines";
import { resolveAccentVar } from "@/lib/routineCardStyle";
import EditorialTemplate from "./templates/EditorialTemplate";
import MinimalTemplate from "./templates/MinimalTemplate";
import MagazineTemplate from "./templates/MagazineTemplate";
import PolaroidTemplate from "./templates/PolaroidTemplate";
import type { TemplateStep } from "./templates/types";

type Props = {
  config: RoutineCardConfig;
  mode: RoutineCardMode;
  steps: TemplateStep[];
};

export default function RoutineShareCard({ config, mode, steps }: Props) {
  const accentVar = resolveAccentVar(config.accentColor);

  switch (config.template) {
    case "minimal":
      return <MinimalTemplate config={config} mode={mode} steps={steps} accentVar={accentVar} />;
    case "magazine":
      return <MagazineTemplate config={config} mode={mode} steps={steps} accentVar={accentVar} />;
    case "polaroid":
      return <PolaroidTemplate config={config} mode={mode} steps={steps} accentVar={accentVar} />;
    case "editorial":
    default:
      return <EditorialTemplate config={config} mode={mode} steps={steps} accentVar={accentVar} />;
  }
}
