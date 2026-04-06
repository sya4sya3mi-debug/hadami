"use client";

import { ReactNode } from "react";

export default function Glass({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-bo-cream/60 backdrop-blur-[24px] backdrop-saturate-[1.6] border border-white/40 rounded-r2 shadow-bo2 ${className}`}
    >
      {children}
    </div>
  );
}
