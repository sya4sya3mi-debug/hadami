"use client";

import { CameraIcon, ScanIcon, BookIcon, SparkleIcon } from "@/components/ui/Icons";

const STEPS = [
  { label: "撮影", Icon: CameraIcon },
  { label: "特定", Icon: ScanIcon },
  { label: "分類", Icon: BookIcon },
  { label: "結果", Icon: SparkleIcon },
];

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3 | 4;
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between mb-5 px-1">
      {STEPS.map((step, i) => {
        const stepNum = i + 1;
        const isCompleted = stepNum < currentStep;
        const isActive = stepNum === currentStep;

        return (
          <div key={i} className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
            <div className="flex flex-col items-center gap-1.5 min-w-[48px]">
              <div
                className={`w-10 h-10 rounded-[14px] flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-br from-bo-accent to-[#7DD3C8] text-white shadow-bo-accent scale-110"
                    : isCompleted
                    ? "bg-bo-accent text-white shadow-bo1"
                    : "bg-white text-bo-ink-faint shadow-bo1"
                }`}
              >
                {isCompleted ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  <step.Icon size={18} color="currentColor" />
                )}
              </div>
              <span
                className={`text-[10px] font-sans transition-colors duration-300 ${
                  isActive
                    ? "font-bold text-bo-accent"
                    : isCompleted
                    ? "font-semibold text-bo-accent"
                    : "font-medium text-bo-ink-faint"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 mx-2 mb-5">
                <div
                  className={`h-[2.5px] rounded-full transition-all duration-500 ${
                    isCompleted
                      ? "bg-bo-accent"
                      : isActive
                      ? "bg-gradient-to-r from-bo-accent to-bo-parchment"
                      : "bg-bo-parchment"
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
