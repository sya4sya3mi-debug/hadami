"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { CATEGORIES } from "@/lib/categories";
import { CategoryKey } from "@/types";

interface CoverageChartProps {
  categoryCounts: Record<CategoryKey, number>;
}

export default function CoverageChart({ categoryCounts }: CoverageChartProps) {
  const data = CATEGORIES.map((cat) => ({
    category: cat.label,
    count: categoryCounts[cat.key] || 0,
    fullMark: 5,
  }));

  return (
    <div className="bg-white rounded-xl p-4 border border-border">
      <h3 className="font-bold text-sm mb-2">カテゴリカバー率</h3>
      <ResponsiveContainer width="100%" height={250}>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="category" tick={{ fontSize: 11 }} />
          <Radar
            dataKey="count"
            stroke="#1B6B4A"
            fill="#1B6B4A"
            fillOpacity={0.2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
