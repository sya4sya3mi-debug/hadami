"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export interface SignupTrendDatum {
  date: string; // YYYY-MM-DD (JST)
  count: number;
}

export interface SignupTrendChartProps {
  data: SignupTrendDatum[];
}

function formatTickDate(value: string): string {
  // "YYYY-MM-DD" -> "MM/DD"
  const parts = value.split("-");
  if (parts.length !== 3) return value;
  return `${parts[1]}/${parts[2]}`;
}

interface TooltipPayloadEntry {
  value: number;
  payload: SignupTrendDatum;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0].payload;
  return (
    <div
      className="hd-mono"
      style={{
        background: "var(--hd-bg)",
        border: "1px solid var(--hd-line)",
        padding: "6px 10px",
        fontSize: 10,
        color: "var(--hd-ink)",
        letterSpacing: "0.1em",
        lineHeight: 1.5,
      }}
    >
      <div style={{ color: "var(--hd-ink-60)" }}>{formatTickDate(datum.date)}（JST）</div>
      <div>{datum.count}名</div>
    </div>
  );
}

export default function SignupTrendChart({ data }: SignupTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#E8E8E8" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatTickDate}
          interval={4}
          tick={{ fontSize: 11, fill: "#6E7C74" }}
          axisLine={{ stroke: "#E8E8E8" }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "#6E7C74" }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip cursor={{ fill: "rgba(58, 143, 122, 0.08)" }} content={<CustomTooltip />} />
        <Bar dataKey="count" fill="#3A8F7A" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
