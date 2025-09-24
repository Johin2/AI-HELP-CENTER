import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#6366f1',
          foreground: '#0b1120',
        },
      },
      boxShadow: {
        glow: '0 0 20px rgba(99, 102, 241, 0.35)',
      },
    },
  },
  plugins: [],
};

export default config;
