import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    // Bootstrap-style breakpoints, as requested: Mobile <576, Tablet 768-992,
    // Desktop 992-1200, Extra Large 1200+. Replaces Tailwind's defaults (not
    // theme.extend) — every existing sm:/md:/lg:/xl: class in the app
    // retargets to these values app-wide.
    screens: {
      sm: '576px',
      md: '768px',
      lg: '992px',
      xl: '1200px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // Synced with web/tailwind.config.ts's Geely Auto global digital
        // palette so the admin panel and the public site read as one brand
        // instead of drifting apart — legacy token names kept unchanged.
        navy: "#0A0B0D",
        "geely-blue": "#0066FF",
        gold: "#A9B0B8",
        ice: "#F7F8FA",
        steel: "#69717B",
        ink: "#111318",
        line: "#E2E5E9",
        midnight: "#0A0B0D",
        "midnight-surface": "#141619",
        "midnight-line": "#30343A",
        "steel-light": "#AEB5BE",
        "blue-bright": "#66A3FF",
      },
      fontFamily: {
        sans: ["Segoe UI", "Arial", "sans-serif"],
        serif: ["Georgia", "Times New Roman", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
