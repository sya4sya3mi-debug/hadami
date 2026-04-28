interface ScanProgressProps {
  progress: number;
  message: string;
}

export default function ScanProgress({ progress, message }: ScanProgressProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
        padding: "56px 0",
      }}
    >
      <div style={{ position: "relative", width: 56, height: 56 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 999,
            border: "1px solid var(--hd-line)",
            animation: "ripple 2s ease-in-out infinite",
          }}
          aria-hidden="true"
        />
        <div
          style={{
            position: "absolute",
            inset: 8,
            borderRadius: 999,
            border: "1px solid var(--hd-line)",
            animation: "ripple 2s ease-in-out 0.4s infinite",
          }}
          aria-hidden="true"
        />
        <div
          style={{
            position: "relative",
            width: 28,
            height: 28,
            margin: "14px auto",
            borderRadius: 999,
            background: "var(--hd-ink)",
            color: "var(--hd-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
          }}
          aria-hidden="true"
        >
          ✦
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: 240 }}>
        <div style={{ height: 2, background: "var(--hd-hair)", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "var(--hd-ink)",
              transition: "width 0.5s ease",
            }}
          />
        </div>
        <div
          className="hd-mono"
          style={{
            marginTop: 8,
            fontSize: 10,
            letterSpacing: "0.1em",
            color: "var(--hd-ink-40)",
            textAlign: "center",
          }}
        >
          {progress}%
        </div>
        <p
          className="hd-serif"
          style={{
            textAlign: "center",
            fontSize: 14,
            marginTop: 6,
            color: "var(--hd-ink)",
            letterSpacing: "-0.01em",
          }}
        >
          {message}
        </p>
      </div>
    </div>
  );
}
