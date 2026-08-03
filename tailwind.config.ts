import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // A warm, light, Claude/GPT-adjacent palette. Kept under the same
        // "base" scale names used throughout the app; only the hex values
        // changed, so text-base-400 etc. still mean the same *role*
        // (secondary text, muted text, panel bg...) everywhere they're used.
        base: {
          950: '#F7F5EF', // page background (warm cream)
          900: '#FFFFFF', // panel / card background
          850: '#F1EEE3', // sidebar background
          800: '#EAE6D8', // hover surface on cream areas
          700: '#DDD7C6', // borders / disabled surface
          600: '#B9B2A0', // faint decorative (arrows, dividers)
          500: '#8B8576', // muted text
          400: '#6B6759', // secondary text
          300: '#4E4A3F', // medium-prominent text
          200: '#38352C', // near-primary text
          100: '#242119', // primary text
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 40px -8px var(--tw-shadow-color)',
        panel: '0 1px 2px rgba(20,18,12,0.04), 0 10px 30px -12px rgba(20,18,12,0.10)',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
      },
      backgroundImage: {
        grid: 'linear-gradient(rgba(20,18,12,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(20,18,12,0.035) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '36px 36px',
      },
    },
  },
  plugins: [],
};

export default config;
