// HADAMI シェアカード — デコ用 SVG アイコン
// design_handoff_girly_cards/share-cards-deco.jsx の Deco オブジェクトを TS 化

import * as React from "react";

type IconProps = {
  size?: number;
  color?: string;
  stroke?: number;
};

export const HeartIcon = ({ size = 16, color = "currentColor" }: IconProps) => (
  <svg width={size} height={(size * 14) / 16} viewBox="0 0 16 14" fill={color} aria-hidden="true">
    <path d="M8 13C8 13 1 8.5 1 4.5C1 2.5 2.5 1 4.5 1C5.8 1 7 1.7 7.8 2.8L8 3.1L8.2 2.8C9 1.7 10.2 1 11.5 1C13.5 1 15 2.5 15 4.5C15 8.5 8 13 8 13Z" />
  </svg>
);

export const HeartOutlineIcon = ({ size = 16, color = "currentColor", stroke = 1.4 }: IconProps) => (
  <svg width={size} height={(size * 14) / 16} viewBox="0 0 16 14" fill="none" stroke={color} strokeWidth={stroke} strokeLinejoin="round" aria-hidden="true">
    <path d="M8 13C8 13 1 8.5 1 4.5C1 2.5 2.5 1 4.5 1C5.8 1 7 1.7 7.8 2.8L8 3.1L8.2 2.8C9 1.7 10.2 1 11.5 1C13.5 1 15 2.5 15 4.5C15 8.5 8 13 8 13Z" />
  </svg>
);

export const Star4Icon = ({ size = 16, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill={color} aria-hidden="true">
    <path d="M8 0 L9.5 6.5 L16 8 L9.5 9.5 L8 16 L6.5 9.5 L0 8 L6.5 6.5 Z" />
  </svg>
);

export const SparkleIcon = ({ size = 16, color = "currentColor", stroke = 1.4 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" aria-hidden="true">
    <path d="M10 2v5M10 13v5M2 10h5M13 10h5" />
  </svg>
);

export const FlowerIcon = ({ size = 16, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill={color} aria-hidden="true">
    <circle cx="10" cy="5" r="3.5" />
    <circle cx="10" cy="15" r="3.5" />
    <circle cx="5" cy="10" r="3.5" />
    <circle cx="15" cy="10" r="3.5" />
    <circle cx="10" cy="10" r="2" fill="#fff" />
  </svg>
);

export const RibbonIcon = ({ size = 22, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size * 0.7} viewBox="0 0 22 16" fill={color} aria-hidden="true">
    <path d="M11 8 L4 1 L4 6 L8 8 L4 10 L4 15 Z" />
    <path d="M11 8 L18 1 L18 6 L14 8 L18 10 L18 15 Z" />
    <circle cx="11" cy="8" r="2.2" />
  </svg>
);

export const BowIcon = ({ size = 22, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size * 0.7} viewBox="0 0 22 16" fill={color} aria-hidden="true">
    <path d="M11 8 Q4 3 4 8 Q4 13 11 8 Z" />
    <path d="M11 8 Q18 3 18 8 Q18 13 11 8 Z" />
    <rect x="9.5" y="6" width="3" height="4" rx="0.5" />
  </svg>
);

export const DotIcon = ({ size = 6, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 6 6" fill={color} aria-hidden="true">
    <circle cx="3" cy="3" r="3" />
  </svg>
);
