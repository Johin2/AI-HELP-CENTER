/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './app/**/*.{js,jsx,mdx}',
    './components/**/*.{js,jsx,mdx}',
    './lib/**/*.{js,jsx}',
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
