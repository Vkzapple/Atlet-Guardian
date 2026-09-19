import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        "surface-raised": "rgb(var(--color-surface-raised) / <alpha-value>)",
        hairline: "rgb(var(--color-hairline) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        ivory: "rgb(var(--color-ivory) / <alpha-value>)",
        optimal: "rgb(var(--color-optimal) / <alpha-value>)",
        caution: "rgb(var(--color-caution) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)",
        critical: "rgb(var(--color-critical) / <alpha-value>)",
        brand: "rgb(var(--color-brand) / <alpha-value>)",
        pulse: "rgb(var(--color-pulse) / <alpha-value>)"
      },
      fontFamily: {
        display: ["var(--font-manrope)"],
        body: ["var(--font-manrope)"],
        mono: ["var(--font-jetbrains)"]
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.6)"
      }
    }
  },
  plugins: []
};

export default config;