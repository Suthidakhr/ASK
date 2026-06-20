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
        espresso: "#4A342A",
        cocoa: "#7D5A44",
        camel: "#B2967D",
        khaki: "#D7C9B8",
        linen: "#F5F1EA",
        "linen-deep": "#EDE8E0",
        positive: "#15803d",
        "positive-bg": "#dcfce7",
        "positive-border": "#86efac",
        negative: "#dc2626",
        "negative-bg": "#fee2e2",
        "negative-border": "#fca5a5",
        "neutral-text": "#6b6560",
        "neutral-bg": "#f5f5f4",
        "neutral-border": "#e7e5e4",
        staleness: "#d97706",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
