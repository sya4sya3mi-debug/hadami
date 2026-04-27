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
    <div style={{ display: "flex", alignItems: "center", marginBottom: 20, padding: "0 4px" }}>
      {STEPS.map((step, i) => {
        const stepNum = i + 1;
        const isCompleted = stepNum < currentStep;
        const isActive = stepNum === currentStep;

        return (
          <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : undefined }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, minWidth: 44 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: isActive || isCompleted ? "var(--hd-ink)" : "transparent",
                  border: "1px solid var(--hd-ink)",
                  color: isActive || isCompleted ? "var(--hd-bg)" : "var(--hd-ink-40)",
                  transition: "background 0.2s, color 0.2s",
                }}
              >
                {isCompleted ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  <step.Icon size={16} color="currentColor" />
                )}
              </div>
              <span
                style={{
                  fontFamily: "var(--hd-mono)",
                  fontSize: 9,
                  letterSpacing: "0.1em",
                  color: isActive ? "var(--hd-ink)" : isCompleted ? "var(--hd-ink-60)" : "var(--hd-ink-40)",
                  fontWeight: isActive ? 700 : 400,
                }}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, margin: "0 6px", marginBottom: 20 }}>
                <div
                  style={{
                    height: 1,
                    background: isCompleted ? "var(--hd-ink)" : "var(--hd-hair)",
                    transition: "background 0.3s",
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
