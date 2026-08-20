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
        navy: "#0B2545",
        "geely-blue": "#0057B8",
        gold: "#C8A15A",
        ice: "#EAF1FB",
        steel: "#5B6B79",
        ink: "#1B1F24",
        line: "#E1E7EF",
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
