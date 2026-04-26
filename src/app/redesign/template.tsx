"use client";

import * as React from "react";

export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="hd-page">{children}</div>;
}
