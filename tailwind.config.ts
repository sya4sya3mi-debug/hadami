import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#5BBFAD",
          light: "#E8FAF8",
        },
        accent: {
          DEFAULT: "#F9A8C0",
          light: "#FFF0F5",
        },
        warning: {
          DEFAULT: "#F48C8C",
          light: "#FFF3F3",
        },
        info: "#7DB8E8",
        sub: "#9B9B9B",
        border: "#F2F2F2",
        card: "#FFFFFF",
        rarity: {
          common: "#A8C5DA",
          uncommon: "#7DB8E8",
          rare: "#B39DDB",
          legendary: "#FFD700",
        },
        category: {
          moisturizing: "#87CEEB",
          brightening: "#DDA0DD",
          turnover: "#FFD700",
          barrier: "#98D8C8",
          soothing: "#B8E0D2",
          keratin: "#C5CAE9",
        },
      },
    },
  },
  plugins: [],
};
export default config;
