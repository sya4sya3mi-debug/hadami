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
        // Legacy colors (kept for backward compat during migration)
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
        // Botanical green palette (v2)
        bo: {
          ink: "#1B2620",
          "ink-soft": "#3D4F45",
          "ink-muted": "#7E9389",
          "ink-faint": "#B5C7BE",
          cream: "#F4F9F6",
          parchment: "#E8F0EC",
          card: "#FFFFFF",
          accent: "#3A8F7A",
          "accent-dark": "#2B7464",
          "accent-soft": "#D6EDE6",
          "accent-glow": "rgba(58,143,122,0.14)",
          safe: "#4A9B7F",
          "safe-bg": "#E8F5EE",
          caution: "#C49032",
          "caution-bg": "#FFF5E0",
          danger: "#C05050",
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
        r1: "12px",
        r2: "18px",
        r3: "28px",
      },
      boxShadow: {
        bo1: "0 1px 3px rgba(26,23,20,0.04)",
        bo2: "0 4px 20px rgba(26,23,20,0.06)",
        "bo-accent": "0 4px 16px rgba(58,143,122,0.25)",
      },
      fontFamily: {
        serif: ["'Shippori Mincho'", "serif"],
        sans: ["'Zen Kaku Gothic New'", "-apple-system", "BlinkMacSystemFont", "'Hiragino Sans'", "'Noto Sans JP'", "sans-serif"],
      },
      animation: {
        "particle-fly": "particleFly 1.3s cubic-bezier(0.16,1,0.3,1) forwards",
        "avatar-absorb": "avatarAbsorb 0.8s ease",
        "gauge-glow": "gaugeGlow 2s ease infinite",
        "fade-up": "fadeUp 0.35s ease forwards",
        "pop-in": "popIn 0.3s ease forwards",
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
      },
    },
  },
  plugins: [],
};
export default config;
