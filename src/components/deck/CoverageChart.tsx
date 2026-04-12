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

interface CoverageChartProps {
  categoryCounts: Record<CategoryKey, number>;
}

export default function CoverageChart({ categoryCounts }: CoverageChartProps) {
  const data = ACTIVE_CATEGORIES.map((category) => ({
    label: category.label,
    count: categoryCounts[category.key] || 0,
    fullMark: 5,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data}>
        <PolarGrid stroke="#E8E8E8" />
        <PolarAngleAxis dataKey="label" tick={{ fontSize: 11, fill: "#6E7C74" }} />
        <Radar dataKey="count" stroke="#3A8F7A" fill="#3A8F7A" fillOpacity={0.2} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
