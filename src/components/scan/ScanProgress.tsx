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
            border: "3px solid #F0FDFA",
            borderTop: "3px solid #5BBFAD",
            borderRight: "3px solid #F9A8C0",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">
          ✨
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "#F2F2F2" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #F9A8C0, #5BBFAD)",
            }}
          />
        </div>
        <p className="text-center text-sm mt-2.5 font-medium" style={{ color: "#9B9B9B" }}>
          {message}
        </p>
      </div>
    </div>
  );
}
