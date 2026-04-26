import * as React from "react";
import type { IcoName } from "./tokens";

type P = React.SVGProps<SVGSVGElement>;

const Common = (extra?: P) => ({
  fill: "none",
  stroke: "currentColor",
  ...extra,
});

export const Ico: Record<IcoName, (p?: P) => React.ReactElement> = {
  sparkle: (p = {}) => (
    <svg viewBox="0 0 20 20" width={14} height={14} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" {...Common(p)}>
      <path d="M10 2v5M10 13v5M2 10h5M13 10h5M4.5 4.5l3 3M12.5 12.5l3 3M15.5 4.5l-3 3M7.5 12.5l-3 3" />
    </svg>
  ),
  shield: (p = {}) => (
    <svg viewBox="0 0 20 20" width={14} height={14} strokeWidth={1.3} strokeLinejoin="round" {...Common(p)}>
      <path d="M10 2l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V5l7-3z" />
    </svg>
  ),
  refresh: (p = {}) => (
    <svg viewBox="0 0 20 20" width={14} height={14} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" {...Common(p)}>
      <path d="M3 10a7 7 0 0 1 12-4.9L17 7M17 3v4h-4M17 10a7 7 0 0 1-12 4.9L3 13M3 17v-4h4" />
    </svg>
  ),
  sun: (p = {}) => (
    <svg viewBox="0 0 20 20" width={14} height={14} strokeWidth={1.3} strokeLinecap="round" {...Common(p)}>
      <circle cx="10" cy="10" r="3.5" />
      <path d="M10 1.5v2M10 16.5v2M1.5 10h2M16.5 10h2M4 4l1.4 1.4M14.6 14.6 16 16M16 4l-1.4 1.4M5.4 14.6 4 16" />
    </svg>
  ),
  drop: (p = {}) => (
    <svg viewBox="0 0 20 20" width={14} height={14} strokeWidth={1.3} strokeLinejoin="round" {...Common(p)}>
      <path d="M10 2c-3 4-5 7-5 10a5 5 0 0 0 10 0c0-3-2-6-5-10z" />
    </svg>
  ),
  wave: (p = {}) => (
    <svg viewBox="0 0 20 20" width={14} height={14} strokeWidth={1.3} strokeLinecap="round" {...Common(p)}>
      <path d="M2 7c2-2 4-2 6 0s4 2 6 0 4-2 4-2M2 13c2-2 4-2 6 0s4 2 6 0 4-2 4-2" />
    </svg>
  ),
  home: (p = {}) => (
    <svg viewBox="0 0 22 22" width={18} height={18} strokeWidth={1.25} strokeLinejoin="round" {...Common(p)}>
      <path d="M11 3 20 11l-2 1v8h-5v-6H9v6H4v-8l-2-1 9-8z" />
    </svg>
  ),
  book: (p = {}) => (
    <svg viewBox="0 0 22 22" width={18} height={18} strokeWidth={1.25} strokeLinejoin="round" {...Common(p)}>
      <path d="M4 4h8a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4V4z" />
      <path d="M16 4h2v16" />
    </svg>
  ),
  camera: (p = {}) => (
    <svg viewBox="0 0 22 22" width={22} height={22} strokeWidth={1.4} strokeLinejoin="round" {...Common(p)}>
      <path d="M4 7h3l2-2h4l2 2h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z" />
      <circle cx="11" cy="12.5" r="3.2" />
    </svg>
  ),
  notes: (p = {}) => (
    <svg viewBox="0 0 22 22" width={18} height={18} strokeWidth={1.25} strokeLinejoin="round" {...Common(p)}>
      <rect x="4" y="3" width="14" height="16" rx="1" />
      <path d="M7 7h8M7 10h8M7 13h5" />
    </svg>
  ),
  user: (p = {}) => (
    <svg viewBox="0 0 22 22" width={18} height={18} strokeWidth={1.25} strokeLinecap="round" {...Common(p)}>
      <circle cx="11" cy="8" r="3.5" />
      <path d="M4 19c1.5-3.5 4-5 7-5s5.5 1.5 7 5" />
    </svg>
  ),
  chev: (p = {}) => (
    <svg viewBox="0 0 12 12" width={12} height={12} strokeWidth={1.4} strokeLinecap="round" {...Common(p)}>
      <path d="M4 2l4 4-4 4" />
    </svg>
  ),
  plus: (p = {}) => (
    <svg viewBox="0 0 16 16" width={14} height={14} strokeWidth={1.4} strokeLinecap="round" {...Common(p)}>
      <path d="M8 3v10M3 8h10" />
    </svg>
  ),
  close: (p = {}) => (
    <svg viewBox="0 0 16 16" width={12} height={12} strokeWidth={1.4} strokeLinecap="round" {...Common(p)}>
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  ),
  check: (p = {}) => (
    <svg viewBox="0 0 16 16" width={12} height={12} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...Common(p)}>
      <path d="M3 8.5l3.5 3.5L13 4.5" />
    </svg>
  ),
  star: (p = {}) => (
    <svg viewBox="0 0 16 16" width={12} height={12} fill="currentColor" {...p}>
      <path d="M8 1.5l1.9 4 4.4.5-3.3 3 .9 4.3L8 11.3 4.1 13.3l.9-4.3-3.3-3 4.4-.5z" />
    </svg>
  ),
  scan: (p = {}) => (
    <svg viewBox="0 0 22 22" width={14} height={14} strokeWidth={1.3} strokeLinecap="round" {...Common(p)}>
      <path d="M3 7V4h3M19 7V4h-3M3 15v3h3M19 15v3h-3" />
      <path d="M6 11h10" />
    </svg>
  ),
  sparkleSm: (p = {}) => (
    <svg viewBox="0 0 16 16" width={12} height={12} strokeWidth={1.3} strokeLinecap="round" {...Common(p)}>
      <path d="M8 2v3M8 11v3M2 8h3M11 8h3" />
    </svg>
  ),
};
