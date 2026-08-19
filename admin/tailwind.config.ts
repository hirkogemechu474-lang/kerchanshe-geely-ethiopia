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
