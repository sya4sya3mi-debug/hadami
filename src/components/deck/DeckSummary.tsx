"use client";

import { CategoryKey } from "@/types";
import { ACTIVE_CATEGORIES } from "@/lib/ingredients";
import { LightbulbIcon } from "@/components/ui/Icons";

interface DeckSummaryProps {
  stepCount: number;
  coveragePercent: number;
  categoryCounts: Record<CategoryKey, number>;
  onTapUncovered?: () => void;
}

export default function DeckSummary({
  stepCount,
  coveragePercent,
  categoryCounts,
  onTapUncovered,
}: DeckSummaryProps) {
  const uncovered = ACTIVE_CATEGORIES.find(
    (c) => (categoryCounts[c.key] ?? 0) === 0
  );
  const circumference = 2 * Math.PI * 34;
  const dashLength = (coveragePercent / 100) * circumference;

  return (
    <div className="rounded-r3 p-5 bg-white/70 backdrop-blur-xl border border-white/50 shadow-bo2 animate-spring-in">
      <div className="flex items-center gap-5">
        {/* Ring chart */}
        <div className="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="#E8F5EE"
              strokeWidth="6"
            />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="#3A8F7A"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${dashLength} ${circumference}`}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-black text-bo-accent font-serif">
              {coveragePercent}%
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-bo-ink font-sans">
            {stepCount} ステップ
          </div>
          <div className="text-xs text-bo-ink-muted font-sans mt-0.5">
            美容成分カバー率
          </div>

          {/* Category badges */}
          <div className="flex gap-1 flex-wrap mt-2.5">
            {ACTIVE_CATEGORIES.map((cat) => {
              const covered = (categoryCounts[cat.key] ?? 0) > 0;
              return (
                <span
                  key={cat.key}
                  className={`text-[9px] font-semibold font-sans py-0.5 px-2 rounded-md ${
                    covered
                      ? "bg-bo-safe-bg text-bo-accent"
                      : "bg-bo-parchment/60 text-bo-ink-faint"
                  }`}
                >
                  {covered ? "✓ " : ""}
                  {cat.icon} {cat.label}
                </span>
              );
            })}
          </div>

          {/* Hint for uncovered */}
          {uncovered && (
            <button
              onClick={onTapUncovered}
              className="mt-2 text-[11px] text-bo-caution font-sans font-medium border-none bg-transparent cursor-pointer p-0 text-left"
            >
              <LightbulbIcon size={12} color="#F5A623" className="inline mr-1" /> {uncovered.label}が不足しています
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
