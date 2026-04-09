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
        // Legacy colors
        primary: {
          DEFAULT: "#3A8F7A",
          light: "#e6f7d9",
        },
        accent: {
          DEFAULT: "#3A8F7A",
          light: "#e6f7d9",
        },
        warning: {
          DEFAULT: "#F48C8C",
          light: "#FFF3F3",
        },
        info: "#7DB8E8",
        sub: "#9E9E9E",
        border: "#e0e0e0",
        card: "#FFFFFF",
        // Qiita-style flat palette
        bo: {
          ink: "#212121",
          "ink-soft": "#666666",
          "ink-muted": "#9E9E9E",
          "ink-faint": "#BDBDBD",
          cream: "#f5f6f6",
          parchment: "#e0e0e0",
          card: "#FFFFFF",
          accent: "#3A8F7A",
          "accent-dark": "#2B7464",
          "accent-soft": "#D6EDE6",
          "accent-pale": "#EAF5F1",
          "accent-glow": "rgba(58,143,122,0.14)",
          safe: "#4A9B7F",
          "safe-bg": "#E8F5EE",
          caution: "#f5a623",
          "caution-bg": "#FFF5E0",
          danger: "#e8453c",
          "danger-bg": "#FCEAEA",
        },
        // Card texture colors
        tex: {
          "moist-from": "#E3F4EE",
          "moist-to": "#C5E8D8",
          "moist-label": "#3A7D65",
          "soothe-from": "#E8EFE3",
          "soothe-to": "#C8DEC0",
          "soothe-label": "#5A7A4A",
          "repair-from": "#EDE3F0",
          "repair-to": "#D5C8E2",
          "repair-label": "#6B4A8A",
          "bright-from": "#FFF5E5",
          "bright-to": "#FBE3B0",
          "bright-label": "#A07A30",
          "base-from": "#FDE8E0",
          "base-to": "#EECABC",
          "base-label": "#A05A40",
        },
        rarity: {
          common: "#A8C5DA",
          uncommon: "#6B8E7B",
          rare: "#D4A853",
          legendary: "#C77DBA",
          mythic: "#E8A04C",
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
      borderRadius: {
        r1: "4px",
        r2: "4px",
        r3: "8px",
      },
      boxShadow: {
        bo1: "0 1px 2px rgba(0,0,0,0.04)",
        bo2: "0 2px 4px rgba(0,0,0,0.1)",
        "bo-accent": "none",
      },
      fontFamily: {
        serif: ["'YakuHanJPs'", "-apple-system", "system-ui", "'Segoe UI'", "'Hiragino Kaku Gothic ProN'", "'Hiragino Sans'", "Meiryo", "sans-serif"],
        sans: ["'YakuHanJPs'", "-apple-system", "system-ui", "'Segoe UI'", "'Hiragino Kaku Gothic ProN'", "'Hiragino Sans'", "Meiryo", "sans-serif"],
      },
      animation: {
        "particle-fly": "particleFly 1.3s cubic-bezier(0.16,1,0.3,1) forwards",
        "avatar-absorb": "avatarAbsorb 0.8s ease",
        "gauge-glow": "gaugeGlow 2s ease infinite",
        "fade-up": "fadeUp 0.35s ease forwards",
        "shimmer-legend": "shimmerLegend 3.5s infinite",
        "pop-in": "popIn 0.3s ease forwards",
        "landing-float": "landingFloat 4s ease-in-out infinite",
      },
      keyframes: {
        particleFly: {
          "0%": { opacity: "1", transform: "translate(0, 0) scale(1)" },
          "25%": { opacity: "1", transform: "translate(30px, -60px) scale(0.85)" },
          "60%": { opacity: "0.7", transform: "translate(120px, -200px) scale(0.45)" },
          "85%": { opacity: "0.4", transform: "translate(180px, -280px) scale(0.2)" },
          "100%": { opacity: "0", transform: "translate(200px, -300px) scale(0)" },
        },
        avatarAbsorb: {
          "0%": { transform: "scale(1)", boxShadow: "0 6px 20px rgba(58,143,122,0.15)" },
          "40%": { transform: "scale(1.15)", boxShadow: "0 0 24px rgba(58,143,122,0.5)" },
          "70%": { transform: "scale(0.95)" },
          "100%": { transform: "scale(1)", boxShadow: "0 6px 20px rgba(58,143,122,0.15)" },
        },
        gaugeGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(58,143,122,0)" },
          "50%": { boxShadow: "0 0 12px 2px rgba(58,143,122,0.3)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        popIn: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "50%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shimmerLegend: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
        landingFloat: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
