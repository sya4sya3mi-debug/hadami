interface ScanProgressProps {
  progress: number;
  message: string;
}

export default function ScanProgress({ progress, message }: ScanProgressProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-16">
      {/* Spinner */}
      <div className="relative">
        <div
          className="w-20 h-20 rounded-full animate-spin"
          style={{
            border: "3px solid #D6EDE6",
            borderTop: "3px solid #3A8F7A",
            borderRight: "3px solid #7DD3C8",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">
          ✨
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <div className="h-2 rounded-full overflow-hidden bg-bo-parchment">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #3A8F7A, #7DD3C8)",
            }}
          />
        </div>
        <p className="text-center text-sm mt-2.5 font-medium text-bo-ink-muted">
          {message}
        </p>
      </div>
    </div>
  );
}
