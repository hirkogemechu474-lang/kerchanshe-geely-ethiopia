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
        // Geely Auto Global brand palette (per the official Website
        // Guidelines): black, white, neutrals and Active Blue.
        navy: "#000000",
        "geely-blue": "#194BFF",
        // `gold`/`gold-bright` are retired names — the guideline has no gold
        // accent. They're kept only so the ~56 existing call sites across
        // the site keep compiling with the *correct* brand color instead of
        // breaking; do not use `gold`/`gold-bright` in new code, use
        // `active-blue` / `active-blue-80` instead.
        gold: "#194BFF",
        ice: "#F6F3F5",
        // Darkened from the guideline's literal #69717B — that value is a
        // 4.48:1 contrast on the `ice` background, just under WCAG AA's
        // 4.5:1, and failed Lighthouse's color-contrast audit as body text.
        // #626A74 reads as the same steel gray but clears 4.5:1.
        steel: "#626A74",
        ink: "#111318",
        line: "#E8E7E7",
        // Dark-mode surfaces — not swaps of the tokens above (navy/ice are
        // also used as intentional foreground/background choices in light
        // mode), but a parallel set for `dark:` variants on the chrome.
        midnight: "#000000",
        "midnight-surface": "#141619",
        "midnight-line": "#30343A",
        "steel-light": "#AEB5BE",
        "blue-bright": "#476FFF",
        "gold-bright": "#476FFF",
        // Canonical brand tokens for new/rewritten components — prefer these
        // over the legacy names above in any new code.
        "active-blue": {
          DEFAULT: "#194BFF",
          80: "#476FFF",
          60: "#7593FF",
          40: "#A3B7FF",
          20: "#D1DBFF",
          10: "#E8EDFF",
        },
        "brand-neutral-1": "#E8E7E7",
        "brand-neutral-2": "#E6E0DB",
        "brand-neutral-3": "#F6F3F5",
        "brand-neutral-4": "#D0D7EB",
        "accent-purple": "#945CDB",
        "accent-lightblue": "#A1B0F6",
        "accent-green": "#17CDA7",
        "accent-lime": "#C4EF80",
        "accent-turquoise": "#52E1E3",
        "accent-red": "#F6292E",
        "accent-orange": "#FF9D6D",
        "accent-yellow": "#FFDC81",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Segoe UI", "Arial", "sans-serif"],
        display: ["var(--font-display)", "var(--font-inter)", "Segoe UI", "Arial", "sans-serif"],
        serif: ["Georgia", "Times New Roman", "serif"],
        amharic: ["var(--font-amharic)", "Noto Sans Ethiopic", "sans-serif"],
      },
      fontSize: {
        "display-lg": ["68px", { lineHeight: "1.05" }],
        "display-md": ["56px", { lineHeight: "1.08" }],
        headline: ["40px", { lineHeight: "1.1" }],
        kicker: ["13px", { lineHeight: "1.2", letterSpacing: "0.2em" }],
      },
      letterSpacing: {
        kicker: "0.2em",
      },
      backgroundImage: {
        "mesh-neutral":
          "radial-gradient(at 20% 20%, #F6F3F5 0%, transparent 50%), radial-gradient(at 80% 0%, #E6E0DB 0%, transparent 50%), radial-gradient(at 50% 100%, #D0D7EB 0%, transparent 60%), linear-gradient(180deg, #FFFFFF 0%, #F6F3F5 100%)",
        "mesh-blue":
          "radial-gradient(at 15% 15%, #476FFF 0%, transparent 45%), radial-gradient(at 85% 30%, #194BFF 0%, transparent 55%), radial-gradient(at 50% 100%, #000000 0%, transparent 70%), linear-gradient(135deg, #000000 0%, #194BFF 100%)",
        "mesh-green":
          "radial-gradient(at 20% 20%, #17CDA7 0%, transparent 45%), radial-gradient(at 80% 20%, #C4EF80 0%, transparent 50%), radial-gradient(at 50% 100%, #000000 0%, transparent 70%), linear-gradient(135deg, #000000 0%, #17CDA7 100%)",
        "mesh-red":
          "radial-gradient(at 20% 20%, #F6292E 0%, transparent 45%), radial-gradient(at 80% 20%, #FF9D6D 0%, transparent 50%), radial-gradient(at 50% 100%, #000000 0%, transparent 70%), linear-gradient(135deg, #000000 0%, #F6292E 100%)",
        "mesh-multicolor":
          "radial-gradient(at 10% 10%, #17CDA7 0%, transparent 40%), radial-gradient(at 90% 10%, #F6292E 0%, transparent 40%), radial-gradient(at 10% 90%, #194BFF 0%, transparent 40%), radial-gradient(at 90% 90%, #945CDB 0%, transparent 40%), linear-gradient(135deg, #17CDA7 0%, #F6292E 35%, #194BFF 70%, #945CDB 100%)",
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
