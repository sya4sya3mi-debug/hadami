"use client";

const STEPS = [
  { label: "撮影", icon: "📷" },
  { label: "特定", icon: "🔍" },
  { label: "分類", icon: "🏷️" },
  { label: "結果", icon: "✨" },
];

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3 | 4;
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between mb-7 px-2">
      {STEPS.map((step, i) => {
        const stepNum = i + 1;
        const isCompleted = stepNum < currentStep;
        const isActive = stepNum === currentStep;

        return (
          <div key={i} className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
            <div className="flex flex-col items-center gap-1 min-w-[44px]">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-br from-bo-accent to-[#7DD3C8] text-white shadow-bo-accent"
                    : isCompleted
                    ? "bg-bo-accent text-white"
                    : "bg-bo-parchment text-bo-ink-faint"
                }`}
              >
                {isCompleted ? "✓" : step.icon}
              </div>
              <span
                className={`text-[9px] font-sans transition-colors duration-300 ${
                  isActive || isCompleted
                    ? "font-bold text-bo-accent"
                    : "font-normal text-bo-ink-faint"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 mx-1.5 mb-[18px]">
                <div
                  className={`h-[2px] rounded-full transition-all duration-500 ${
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
