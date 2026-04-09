"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { ACTIVE_CATEGORIES } from "@/lib/ingredients";
import { CategoryKey } from "@/types";

export interface CoverageChartProps {
  categoryCounts: Record<CategoryKey, number>;
}

export default function CoverageChart({ categoryCounts }: CoverageChartProps) {
  const data = ACTIVE_CATEGORIES.map((category) => ({
    label: category.label,
    count: categoryCounts[category.key] || 0,
    fullMark: 5,
  }));

  return (
    <div className="bg-white rounded-xl p-4 border border-border">
      <h3 className="font-bold text-sm mb-2">有効成分カバー率</h3>
      <ResponsiveContainer width="100%" height={250}>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="label" tick={{ fontSize: 10, fill: "#6E7C74" }} />
          <Radar dataKey="count" stroke="#3A8F7A" fill="#3A8F7A" fillOpacity={0.2} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
