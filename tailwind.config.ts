import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1e40af',
          dark: '#1e3a8a',
        },
        commission: {
          bg: '#fecaca',
          border: '#f87171',
        },
        status: {
          approved: '#22c55e',
          rejected: '#ef4444',
          pending: '#eab308',
        },
      },
    },
  },
  plugins: [],
};

export default config;
