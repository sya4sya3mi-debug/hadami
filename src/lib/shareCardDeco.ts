// HADAMI シェアカード — デコパーツ 5テーマ
// 各テーマは badge / cornerTop / accent / scatter を持つ。
// scatter は ScatterDeco に渡す配列。同一 seed で再現性あり。

import * as React from "react";
import {
  HeartIcon,
  HeartOutlineIcon,
  Star4Icon,
  SparkleIcon,
  FlowerIcon,
  RibbonIcon,
  BowIcon,
  DotIcon,
} from "@/components/share/DecoIcons";

export type ShareDecoKey =
  | "hearts"
  | "stars"
  | "flowers"
  | "ribbons"
  | "minimal";

export type ScatterItem = {
  el: React.ReactElement;
  count: number;
  opacity?: number;
};

export type ShareDecoTheme = {
  name: string;
  badge: React.ReactElement;
  cornerTop: React.ReactElement;
  accent: React.ReactElement;
  scatter: ScatterItem[];
};

export type ShareDecoOption = {
  key: ShareDecoKey;
  label: string;
  // プレビューチップ用の単一アイコン（accent 色は呼び出し側で）
  preview: (color: string, size?: number) => React.ReactElement;
};

export const SHARE_DECOS: readonly ShareDecoOption[] = [
  {
    key: "hearts",
    label: "ハート",
    preview: (color, size = 14) => React.createElement(HeartIcon, { size, color }),
  },
  {
    key: "stars",
    label: "星・スパークル",
    preview: (color, size = 14) => React.createElement(Star4Icon, { size, color }),
  },
  {
    key: "flowers",
    label: "フラワー",
    preview: (color, size = 14) => React.createElement(FlowerIcon, { size, color }),
  },
  {
    key: "ribbons",
    label: "リボン",
    preview: (color, size = 18) => React.createElement(BowIcon, { size, color }),
  },
  {
    key: "minimal",
    label: "ミニマル",
    preview: (color, size = 8) => React.createElement(DotIcon, { size, color }),
  },
] as const;

const DECO_KEYS = SHARE_DECOS.map((d) => d.key) as readonly ShareDecoKey[];

export function isShareDecoKey(value: unknown): value is ShareDecoKey {
  return typeof value === "string" && (DECO_KEYS as readonly string[]).includes(value);
}

export function getShareDecoLabel(key: ShareDecoKey): string {
  return SHARE_DECOS.find((d) => d.key === key)?.label ?? "ハート";
}

export function buildShareDecoTheme(key: ShareDecoKey, color: string): ShareDecoTheme {
  switch (key) {
    case "hearts":
      return {
        name: "ハート",
        badge: React.createElement(HeartIcon, { size: 14, color }),
        cornerTop: React.createElement(HeartIcon, { size: 20, color }),
        accent: React.createElement(HeartOutlineIcon, { size: 18, color }),
        scatter: [
          { el: React.createElement(HeartIcon, { size: 10, color }), count: 12, opacity: 0.18 },
        ],
      };
    case "stars":
      return {
        name: "星・スパークル",
        badge: React.createElement(Star4Icon, { size: 14, color }),
        cornerTop: React.createElement(Star4Icon, { size: 22, color }),
        accent: React.createElement(SparkleIcon, { size: 18, color }),
        scatter: [
          { el: React.createElement(Star4Icon, { size: 10, color }), count: 8, opacity: 0.22 },
          { el: React.createElement(DotIcon, { size: 4, color }), count: 14, opacity: 0.3 },
        ],
      };
    case "flowers":
      return {
        name: "フラワー",
        badge: React.createElement(FlowerIcon, { size: 14, color }),
        cornerTop: React.createElement(FlowerIcon, { size: 22, color }),
        accent: React.createElement(FlowerIcon, { size: 18, color }),
        scatter: [
          { el: React.createElement(FlowerIcon, { size: 12, color }), count: 8, opacity: 0.18 },
          { el: React.createElement(DotIcon, { size: 4, color }), count: 10, opacity: 0.25 },
        ],
      };
    case "ribbons":
      return {
        name: "リボン",
        badge: React.createElement(BowIcon, { size: 18, color }),
        cornerTop: React.createElement(RibbonIcon, { size: 26, color }),
        accent: React.createElement(BowIcon, { size: 20, color }),
        scatter: [
          { el: React.createElement(BowIcon, { size: 14, color }), count: 5, opacity: 0.18 },
          { el: React.createElement(DotIcon, { size: 4, color }), count: 12, opacity: 0.25 },
        ],
      };
    case "minimal":
    default:
      return {
        name: "ミニマル",
        badge: React.createElement(DotIcon, { size: 6, color }),
        cornerTop: React.createElement(SparkleIcon, { size: 16, color }),
        accent: React.createElement(DotIcon, { size: 8, color }),
        scatter: [
          { el: React.createElement(DotIcon, { size: 3, color }), count: 16, opacity: 0.22 },
        ],
      };
  }
}
