"use client";

// シェアカードのキャンバス。設定に応じてテンプレを切り替えてレンダリングする。

import "@/styles/hadami-tokens.css";
import * as React from "react";
import type { Product } from "@/types";
import { getSharePalette } from "@/lib/shareCardPalettes";
import H4HeroLeft from "@/components/share/templates/H4HeroLeft";
import S5Grid2x2 from "@/components/share/templates/S5Grid2x2";
import M4Cover from "@/components/share/templates/M4Cover";
import type { ShareCardConfig } from "@/components/share/templates/types";

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
    case "S5":
      return <S5Grid2x2 {...common} />;
    case "M4":
      return <M4Cover {...common} />;
    case "H4":
    default:
      return <H4HeroLeft {...common} />;
  }
}

export const SHARE_TEMPLATE_OPTIONS: {
  key: "H4" | "S5" | "M4";
  label: string;
  description: string;
}[] = [
  { key: "H4", label: "ヒーロー左", description: "1点を主役・縦3点で補強" },
  { key: "S5", label: "2×2グリッド", description: "4点を均等にステッカー風" },
  { key: "M4", label: "雑誌表紙", description: "全面ヒーロー＋下サブ3点" },
];
