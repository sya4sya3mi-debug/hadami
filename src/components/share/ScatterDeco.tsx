"use client";

// 背景に擬似乱数で散りばめるデコレイヤー。
// 同一 seed で再現性あり（シェア画像が毎回同じ配置になる）。

import * as React from "react";
import type { ScatterItem } from "@/lib/shareCardDeco";

type Props = {
  items: ScatterItem[];
  seed?: number;
};

export default function ScatterDeco({ items, seed = 7 }: Props) {
  const rand = (i: number) => {
    const x = Math.sin(i * seed * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  };

  const elements: React.ReactNode[] = [];
  let i = 0;
  items.forEach((item, ii) => {
    for (let n = 0; n < item.count; n++) {
      i++;
      elements.push(
        <div
          key={`${ii}-${n}`}
          style={{
            position: "absolute",
            left: `${rand(i) * 96 + 2}%`,
            top: `${rand(i + 1000) * 96 + 2}%`,
            opacity: item.opacity ?? 0.25,
            transform: `rotate(${rand(i + 2000) * 60 - 30}deg)`,
            pointerEvents: "none",
          }}
        >
          {item.el}
        </div>,
      );
    }
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 1,
      }}
    >
      {elements}
    </div>
  );
}
