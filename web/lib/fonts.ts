// Font optimization with next/font
import { Inter, Noto_Sans_Ethiopic } from 'next/font/google';

// Primary font - Inter
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
  adjustFontFallback: true,
});

// Amharic font - Noto Sans Ethiopic
export const notoSansEthiopic = Noto_Sans_Ethiopic({
  subsets: ['ethiopic'],
  display: 'swap',
  variable: '--font-amharic',
  preload: false, // Only preload if Amharic is default language
  fallback: ['system-ui', 'sans-serif'],
  adjustFontFallback: true,
});

// Font loading strategies
export const fontConfig = {
  // Preload critical fonts
  preloadFonts: [
    {
      href: '/fonts/inter-var.woff2',
      as: 'font',
      type: 'font/woff2',
      crossOrigin: 'anonymous',
    },
  ],
  
  // Font display strategy
  fontDisplay: 'swap', // Show fallback immediately, swap when font loads
  
  // Subset optimization
  unicodeRange: {
    latin: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
    ethiopic: 'U+1200-137F, U+1380-139F, U+2D80-2DDF',
  },
};
