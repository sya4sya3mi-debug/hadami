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
    <div className="flex items-center justify-between mb-6" style={{ padding: "0 8px" }}>
      {STEPS.map((step, i) => {
        const stepNum = i + 1;
        const isCompleted = stepNum < currentStep;
        const isActive = stepNum === currentStep;

        return (
          <div key={i} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? 1 : "none" }}>
            {/* Dot + label */}
            <div className="flex flex-col items-center gap-1" style={{ minWidth: 44 }}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                style={
                  isActive
                    ? { background: "linear-gradient(135deg, #5BBFAD, #7DD3C8)", color: "#fff", boxShadow: "0 2px 8px rgba(91,191,173,0.4)" }
                    : isCompleted
                    ? { background: "#5BBFAD", color: "#fff" }
                    : { background: "#F2F2F2", color: "#BDBDBD" }
                }
              >
                {isCompleted ? "✓" : step.icon}
              </div>
              <span
                className="text-[10px] font-medium transition-colors duration-300"
                style={{ color: isActive ? "#5BBFAD" : isCompleted ? "#5BBFAD" : "#BDBDBD" }}
              >
                {step.label}
              </span>
            </div>
            {/* Connecting line */}
            {i < STEPS.length - 1 && (
              <div className="flex-1 mx-1.5" style={{ height: 2, marginBottom: 18 }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    background: isCompleted ? "#5BBFAD" : isActive ? "linear-gradient(90deg, #5BBFAD, #F2F2F2)" : "#F2F2F2",
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
