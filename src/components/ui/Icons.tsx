// シンプルなSVGアイコンコンポーネント集
// Apple HIG準拠の線幅・スタイル

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

export function CameraIcon({ size = 20, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="4" stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

export function PackageIcon({ size = 20, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <rect x="2" y="7" width="20" height="14" rx="2" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="12" y1="12" x2="12" y2="17" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="9" y1="14.5" x2="15" y2="14.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function BookIcon({ size = 20, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SparkleIcon({ size = 20, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LightbulbIcon({ size = 20, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M9 21h6M12 3a6 6 0 016 6c0 2.4-1.4 4.5-3 5.7V17H9v-2.3C7.4 13.5 6 11.4 6 9a6 6 0 016-6z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChartIcon({ size = 20, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <rect x="3" y="12" width="4" height="9" rx="1" stroke={color} strokeWidth="1.8" />
      <rect x="10" y="7" width="4" height="14" rx="1" stroke={color} strokeWidth="1.8" />
      <rect x="17" y="3" width="4" height="18" rx="1" stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

export function LeafIcon({ size = 20, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M17 8C8 10 5.9 16.17 3.82 21c4.34-2.66 8.52-3.28 12-3a9 9 0 009-9 13.65 13.65 0 00-7-5z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.82 21c1.18-4 4-7 7-9" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function SunIcon({ size = 20, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="5" stroke={color} strokeWidth="1.8" />
      <line x1="12" y1="1" x2="12" y2="3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="12" y1="21" x2="12" y2="23" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="1" y1="12" x2="3" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="21" y1="12" x2="23" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function MoonIcon({ size = 20, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CheckCircleIcon({ size = 20, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8" />
      <path d="M8 12l3 3 5-5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ScanIcon({ size = 20, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="3" y1="12" x2="21" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function StarIcon({ size = 20, color = "currentColor", className, filled }: IconProps & { filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : "none"} aria-hidden="true" className={className}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function UserIcon({ size = 20, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="7" r="4" stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

export function InfoIcon({ size = 20, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8" />
      <line x1="12" y1="8" x2="12" y2="8.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="12" y1="12" x2="12" y2="16" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
