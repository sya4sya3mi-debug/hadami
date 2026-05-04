"use client";

// シェアカードのキャンバス。設定に応じてテンプレを切り替えてレンダリングする。

import "@/styles/hadami-tokens.css";
import * as React from "react";
import type { Product } from "@/types";
import { getSharePalette } from "@/lib/shareCardPalettes";
import H4HeroLeft from "@/components/share/templates/H4HeroLeft";
import H5HeroCircle from "@/components/share/templates/H5HeroCircle";
import H6HeroTop from "@/components/share/templates/H6HeroTop";
import S4Scatter from "@/components/share/templates/S4Scatter";
import S5Grid2x2 from "@/components/share/templates/S5Grid2x2";
import S6CircleGrid from "@/components/share/templates/S6CircleGrid";
import M4Cover from "@/components/share/templates/M4Cover";
import M5Split from "@/components/share/templates/M5Split";
import M6Frame from "@/components/share/templates/M6Frame";
import type {
  ShareCardConfig,
  ShareTemplateKey,
} from "@/components/share/templates/types";

type Props = {
  config: ShareCardConfig;
  products: Product[];
};

export default function ShareCardCanvas({ config, products }: Props) {
  const palette = getSharePalette(config.palette);

  const common = {
    products,
    palette,
    deco: config.deco,
    aspect: config.aspect,
    username: config.username,
    skinType: config.skinType,
  };

  switch (config.template) {
    case "H5":
      return <H5HeroCircle {...common} />;
    case "H6":
      return <H6HeroTop {...common} />;
    case "S4":
      return <S4Scatter {...common} />;
    case "S5":
      return <S5Grid2x2 {...common} />;
    case "S6":
      return <S6CircleGrid {...common} />;
    case "M4":
      return <M4Cover {...common} />;
    case "M5":
      return <M5Split {...common} />;
    case "M6":
      return <M6Frame {...common} />;
    case "H4":
    default:
      return <H4HeroLeft {...common} />;
  }
}

export type ShareTemplateOption = {
  key: ShareTemplateKey;
  label: string;
  description: string;
  group: "hero" | "sticker" | "magazine";
};

export const SHARE_TEMPLATE_OPTIONS: readonly ShareTemplateOption[] = [
  // ヒーロー系
  { key: "H4", label: "ヒーロー左", description: "1点を主役・縦3点で補強", group: "hero" },
  { key: "H5", label: "円形ヒーロー", description: "中央大円＋下に3小円", group: "hero" },
  { key: "H6", label: "上ヒーロー", description: "上に大画像＋下に3点", group: "hero" },
  // ステッカー系
  { key: "S4", label: "ステッカー散らし", description: "4点を傾けて散らす", group: "sticker" },
  { key: "S5", label: "2×2グリッド", description: "4点を均等にステッカー風", group: "sticker" },
  { key: "S6", label: "円形ステッカー", description: "4つの円を田の字に配置", group: "sticker" },
  // 雑誌系
  { key: "M4", label: "雑誌表紙", description: "全面ヒーロー＋下サブ3点", group: "magazine" },
  { key: "M5", label: "雑誌スプリット", description: "上下分割＋情報パネル", group: "magazine" },
  { key: "M6", label: "額装フレーム", description: "白額縁＋サブ3点グリッド", group: "magazine" },
] as const;

export const SHARE_TEMPLATE_GROUPS: { key: "hero" | "sticker" | "magazine"; label: string }[] = [
  { key: "hero", label: "ヒーロー系" },
  { key: "sticker", label: "ステッカー系" },
  { key: "magazine", label: "雑誌系" },
];
