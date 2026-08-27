import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
    "./providers/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Geely Auto global digital palette: black, white, neutrals and
        // active blue. The legacy names remain available to avoid breaking
        // existing page components while bringing them onto the new system.
        navy: "#0A0B0D",
        "geely-blue": "#0066FF",
        gold: "#A9B0B8",
        ice: "#F7F8FA",
        steel: "#69717B",
        ink: "#111318",
        line: "#E2E5E9",
        // Dark-mode surfaces — not swaps of the tokens above (navy/ice are
        // also used as intentional foreground/background choices in light
        // mode), but a parallel set for `dark:` variants on the chrome.
        midnight: "#0A0B0D",
        "midnight-surface": "#141619",
        "midnight-line": "#30343A",
        "steel-light": "#AEB5BE",
        "blue-bright": "#66A3FF",
        "gold-bright": "#D8DCE1",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Segoe UI", "Arial", "sans-serif"],
        display: ["var(--font-display)", "var(--font-inter)", "Segoe UI", "Arial", "sans-serif"],
        serif: ["Georgia", "Times New Roman", "serif"],
        amharic: ["var(--font-amharic)", "Noto Sans Ethiopic", "sans-serif"],
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
