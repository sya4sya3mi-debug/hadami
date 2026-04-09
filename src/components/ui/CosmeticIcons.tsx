import type { ReactNode } from "react";
import type { CategoryKey, ProductGenre } from "@/types";

interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

interface IconBaseProps extends IconProps {
  children: ReactNode;
  viewBox?: string;
}

function IconBase({
  size = 20,
  className,
  strokeWidth = 1.85,
  viewBox = "0 0 24 24",
  children,
}: IconBaseProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

function IngredientGlyph(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="3.25" />
      <path d="M12 5V3.5" />
      <path d="M12 20.5V19" />
      <path d="M19 12h1.5" />
      <path d="M3.5 12H5" />
      <path d="M17 7l1-1" />
      <path d="M6 18l1-1" />
      <path d="M17 17l1 1" />
      <path d="M6 6l1 1" />
    </IconBase>
  );
}

function BrighteningGlyph(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 4.25l1.7 4.05 4.05 1.7-4.05 1.7L12 15.75l-1.7-4.05-4.05-1.7 4.05-1.7L12 4.25z" />
      <path d="M18.25 4.75v2.5" />
      <path d="M19.5 6h-2.5" />
      <circle cx="6.25" cy="17.75" r="1.25" fill="currentColor" stroke="none" />
      <path d="M15.75 17.25l.75 1.75 1.75.75-1.75.75-.75 1.75-.75-1.75-1.75-.75 1.75-.75.75-1.75z" />
    </IconBase>
  );
}

function SoothingGlyph(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3.5l6 2.5v4.9c0 3.9-2.3 7.4-6 9.2-3.7-1.8-6-5.3-6-9.2V6l6-2.5z" />
      <path d="M9.2 12.8c1.6-2.8 4.5-4.1 6.8-4.4-.3 2.6-1.9 5.4-5.2 6.8" />
      <path d="M11.5 12.3c-.1 1.5.2 2.9 1 4.1" />
    </IconBase>
  );
}

function TurnoverGlyph(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7.25 8.5A6 6 0 0117 7" />
      <path d="M17 7h-3" />
      <path d="M17 7v3" />
      <path d="M16.75 15.5A6 6 0 017 17" />
      <path d="M7 17h3" />
      <path d="M7 17v-3" />
    </IconBase>
  );
}

function BarrierGlyph(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="7.5" cy="7.5" r="2.25" />
      <path d="M7.5 2.75v1.5" />
      <path d="M7.5 11.25v1.5" />
      <path d="M2.75 7.5h1.5" />
      <path d="M10.75 7.5h1.5" />
      <path d="M4.4 4.4l1.05 1.05" />
      <path d="M9.55 9.55l1.05 1.05" />
      <path d="M15.5 10.25l4 1.75v3.2c0 2.5-1.5 4.7-4 6-2.5-1.3-4-3.5-4-6V12l4-1.75z" />
    </IconBase>
  );
}

function MoisturizingGlyph(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 4.25c2.8 3.55 4.5 6.05 4.5 8.4a4.5 4.5 0 11-9 0c0-2.35 1.7-4.85 4.5-8.4z" />
      <path d="M10.2 13.1c.35 1.35 1.45 2.35 2.85 2.65" />
    </IconBase>
  );
}

function KeratinGlyph(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 9.25c1.55-1 3.5-1.5 6-1.5s4.45.5 6 1.5" />
      <path d="M5 12.75c1.85-1.2 4.2-1.8 7-1.8s5.15.6 7 1.8" />
      <path d="M6.5 16c1.5-.8 3.3-1.2 5.5-1.2" />
      <path d="M16 15.25l.7 1.65 1.65.7-1.65.7-.7 1.65-.7-1.65-1.65-.7 1.65-.7.7-1.65z" />
    </IconBase>
  );
}

function FirmnessGlyph(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 15.5c1.7-2.7 4-4 7-4s5.3 1.3 7 4" />
      <path d="M7 18c1.3-1.7 3-2.5 5-2.5s3.7.8 5 2.5" />
      <path d="M9 9.5l3-3 3 3" />
    </IconBase>
  );
}

function PoreGlyph(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="10" cy="10" r="5.25" />
      <path d="M13.75 13.75L19 19" />
      <circle cx="9" cy="8.5" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="11.75" cy="10.25" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="8.75" cy="12" r="0.6" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

function CleansingGlyph(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M10 4h4" />
      <path d="M13 4h4" />
      <path d="M17 4v2.5" />
      <path d="M10 6.5h4a1 1 0 011 1v10.25A2.25 2.25 0 0112.75 20h-1.5A2.25 2.25 0 019 17.75V7.5a1 1 0 011-1z" />
    </IconBase>
  );
}

function FaceWashGlyph(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M9.5 4h5l-.75 3.5h-3.5L9.5 4z" />
      <path d="M10.5 7.5h3A1.25 1.25 0 0114.75 8.75V18A2 2 0 0112.75 20h-1.5A2 2 0 019 18V8.75a1.25 1.25 0 011.5-1.25z" />
      <circle cx="18.2" cy="9.2" r="1.2" />
      <circle cx="19.7" cy="11.7" r="0.85" />
    </IconBase>
  );
}

function TonerGlyph(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M10.5 4h3" />
      <path d="M11 4v2.5" />
      <path d="M9.5 6.5h5A1.25 1.25 0 0115.75 7.75v10A2.25 2.25 0 0113.5 20h-3A2.25 2.25 0 018.25 17.75v-10A1.25 1.25 0 019.5 6.5z" />
      <path d="M12 10.5c1.2 1.45 1.9 2.55 1.9 3.45a1.9 1.9 0 11-3.8 0c0-.9.7-2 1.9-3.45z" />
    </IconBase>
  );
}

function SerumGlyph(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M11 3.75h2" />
      <path d="M12 3.75v3.5" />
      <path d="M10 7.5h4" />
      <path d="M9.5 8.5h5A1.25 1.25 0 0115.75 9.75V18A2 2 0 0113.75 20h-3.5A2 2 0 018.25 18V9.75A1.25 1.25 0 019.5 8.5z" />
      <path d="M17.25 6.75c.9 1.1 1.4 1.9 1.4 2.65a1.4 1.4 0 11-2.8 0c0-.75.5-1.55 1.4-2.65z" />
    </IconBase>
  );
}

function EmulsionGlyph(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M10.75 4h2.5" />
      <path d="M11 4v2" />
      <path d="M9 6.25h6l1 2.5v9A2.25 2.25 0 0113.75 20h-3.5A2.25 2.25 0 018 17.75v-9l1-2.5z" />
    </IconBase>
  );
}

function CreamGlyph(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M8.5 6.5h7a2 2 0 012 2V9h-11v-.5a2 2 0 012-2z" />
      <rect x="5.5" y="9" width="13" height="8.75" rx="2.75" />
    </IconBase>
  );
}

function SunscreenGlyph(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="18.5" cy="6" r="1.75" />
      <path d="M18.5 2.75v1" />
      <path d="M18.5 8.25v1" />
      <path d="M15.25 6h1" />
      <path d="M20.75 6h1" />
      <path d="M9.5 4h5l-.75 3.5h-3.5L9.5 4z" />
      <path d="M10.5 7.5h3A1.25 1.25 0 0114.75 8.75V18A2 2 0 0112.75 20h-1.5A2 2 0 019 18V8.75a1.25 1.25 0 011.5-1.25z" />
    </IconBase>
  );
}

function MaskPackGlyph(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M8.5 4h7l1.5 2v11.75A2.25 2.25 0 0114.75 20h-5.5A2.25 2.25 0 017 17.75V6l1.5-2z" />
      <circle cx="10.25" cy="11" r="0.4" fill="currentColor" stroke="none" />
      <circle cx="13.75" cy="11" r="0.4" fill="currentColor" stroke="none" />
      <path d="M10.25 14.25c.8.7 2.7.7 3.5 0" />
    </IconBase>
  );
}

function EyeCareGlyph(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3.5 12s3.2-4.5 8.5-4.5 8.5 4.5 8.5 4.5-3.2 4.5-8.5 4.5S3.5 12 3.5 12z" />
      <circle cx="12" cy="12" r="2" />
      <path d="M18 17.25c.8 1 1.25 1.75 1.25 2.4a1.25 1.25 0 11-2.5 0c0-.65.45-1.4 1.25-2.4z" />
    </IconBase>
  );
}

function OilGlyph(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M11.5 4.25c2.4 3 3.75 5.15 3.75 7.15a3.75 3.75 0 11-7.5 0c0-2 1.35-4.15 3.75-7.15z" />
      <path d="M15.75 8.5c2 .1 3.6.85 4.75 2.25-1.15 1-2.75 1.55-4.75 1.45" />
      <path d="M17.6 9.65c-.1 1 .2 1.85.75 2.7" />
    </IconBase>
  );
}

function MistGlyph(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M10 4.5h4" />
      <path d="M13 4.5h3.5" />
      <path d="M16.5 4.5v2" />
      <path d="M9.25 6.5h5.25A1.5 1.5 0 0116 8v9.75A2.25 2.25 0 0113.75 20h-3.5A2.25 2.25 0 018 17.75V8a1.5 1.5 0 011.25-1.5z" />
      <path d="M18 9.5h2.5" />
      <path d="M17.5 12h3" />
      <path d="M18 14.5h2.5" />
    </IconBase>
  );
}

function OtherGlyph(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4.5 8.5L12 4l7.5 4.5v7L12 20l-7.5-4.5v-7z" />
      <path d="M12 20v-7.5" />
      <path d="M4.5 8.5L12 13l7.5-4.5" />
    </IconBase>
  );
}

export function ActiveCategoryIcon({
  category,
  ...props
}: IconProps & { category?: CategoryKey | null }) {
  switch (category) {
    case "brightening":
      return <BrighteningGlyph {...props} />;
    case "soothing":
      return <SoothingGlyph {...props} />;
    case "turnover":
      return <TurnoverGlyph {...props} />;
    case "barrier":
      return <BarrierGlyph {...props} />;
    case "moisturizing":
      return <MoisturizingGlyph {...props} />;
    case "keratin":
      return <KeratinGlyph {...props} />;
    default:
      return <IngredientGlyph {...props} />;
  }
}

export function SkinConcernIcon({
  concern,
  ...props
}: IconProps & { concern?: string | null }) {
  switch (concern) {
    case "乾燥":
      return <MoisturizingGlyph {...props} />;
    case "くすみ":
      return <BrighteningGlyph {...props} />;
    case "ハリ":
      return <FirmnessGlyph {...props} />;
    case "毛穴":
      return <PoreGlyph {...props} />;
    case "敏感":
      return <SoothingGlyph {...props} />;
    default:
      return <IngredientGlyph {...props} />;
  }
}

export function ProductGenreIcon({
  genre = "other",
  ...props
}: IconProps & { genre?: ProductGenre | null }) {
  switch (genre) {
    case "cleansing":
      return <CleansingGlyph {...props} />;
    case "face_wash":
      return <FaceWashGlyph {...props} />;
    case "toner":
      return <TonerGlyph {...props} />;
    case "serum":
      return <SerumGlyph {...props} />;
    case "emulsion":
      return <EmulsionGlyph {...props} />;
    case "cream":
      return <CreamGlyph {...props} />;
    case "sunscreen":
      return <SunscreenGlyph {...props} />;
    case "mask_pack":
      return <MaskPackGlyph {...props} />;
    case "eye_care":
      return <EyeCareGlyph {...props} />;
    case "oil":
      return <OilGlyph {...props} />;
    case "mist":
      return <MistGlyph {...props} />;
    default:
      return <OtherGlyph {...props} />;
  }
}
