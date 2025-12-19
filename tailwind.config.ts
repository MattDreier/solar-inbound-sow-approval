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
        // Grafit's exact color palette
        dark: {
          bg: '#181819',           // Main background
          surface: '#1a1a1a',      // Slightly lighter surface
          card: '#1f1f1f',         // Card background
          border: '#2a2a2a',       // Subtle borders
          hover: '#242424',        // Hover states
        },
        light: {
          primary: '#fafafa',      // Grafit's main text rgb(250, 250, 250)
          secondary: '#e5e5e7',    // Light gray for body text
          tertiary: '#d7d8e0',     // Medium gray rgb(215, 216, 224)
          muted: '#8c8e99',        // Grafit's label color rgb(140, 142, 153)
        },
        primary: {
          DEFAULT: '#3b82f6',      // Blue accent
          light: '#60a5fa',        // Lighter variant
          dark: '#2563eb',         // Darker variant
        },
        accent: {
          cyan: '#06b6d4',         // Accent color
          purple: '#a855f7',       // Secondary accent
          pink: '#ec4899',         // Tertiary accent
        },
        commission: {
          bg: '#2d1b2e',           // Dark purple-pink background
          border: '#4a2d4b',       // Purple-pink border
          text: '#f0abfc',         // Light pink text
        },
        status: {
          approved: '#34d399',     // Green
          rejected: '#f87171',     // Red
          pending: '#fbbf24',      // Yellow
        },
      },
      fontSize: {
        // Grafit-inspired typography scale
        'display': ['3.5rem', { lineHeight: '1.1', fontWeight: '400', letterSpacing: '-0.02em' }],
        'heading-1': ['2.375rem', { lineHeight: '1.2', fontWeight: '400', letterSpacing: '-0.01em' }],
        'heading-2': ['1.875rem', { lineHeight: '1.3', fontWeight: '400' }],
        'heading-3': ['1.4375rem', { lineHeight: '1.2', fontWeight: '400' }],
        'body-lg': ['1.125rem', { lineHeight: '1.5', fontWeight: '400' }],
        'body': ['1rem', { lineHeight: '1.5', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'label': ['0.75rem', { lineHeight: '1.4', fontWeight: '400', letterSpacing: '0.05em' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      maxWidth: {
        'container': '1440px', // Grafit's container max-width
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
