"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { INGREDIENT_GENRES } from "@/lib/ingredients";
import { IngredientGenre } from "@/types";

interface CoverageChartProps {
  genreCounts: Record<IngredientGenre, number>;
}

export default function CoverageChart({ genreCounts }: CoverageChartProps) {
  const data = INGREDIENT_GENRES.map((g) => ({
    category: g.label,
    count: genreCounts[g.key] || 0,
    fullMark: 5,
  }));

  return (
    <div className="bg-white rounded-xl p-4 border border-border">
      <h3 className="font-bold text-sm mb-2">ジャンルカバー率</h3>
      <ResponsiveContainer width="100%" height={250}>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="category" tick={{ fontSize: 10 }} />
          <Radar
            dataKey="count"
            stroke="#3A8F7A"
            fill="#3A8F7A"
            fillOpacity={0.2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
