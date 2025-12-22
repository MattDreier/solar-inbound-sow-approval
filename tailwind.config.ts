import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Theme-aware semantic tokens (NEW)
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        card: 'rgb(var(--color-card) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        hover: 'rgb(var(--color-hover) / <alpha-value>)',
        text: {
          primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
          tertiary: 'rgb(var(--color-text-tertiary) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
        },

        // Legacy colors (for backwards compatibility during migration)
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

        // Fixed colors (same in both themes)
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
          bg: 'rgb(var(--color-commission-bg) / <alpha-value>)',
          border: 'rgb(var(--color-commission-border) / <alpha-value>)',
          text: 'rgb(var(--color-commission-text) / <alpha-value>)',
        },
        status: {
          approved: '#22c55e',     // green-500 (fixed)
          rejected: '#ef4444',     // red-500 (fixed)
          pending: '#f59e0b',      // amber-500 (fixed)
        },
      },
      fontSize: {
        // Grafit-inspired typography scale (rem-based for accessibility)
        // Display & Headings
        'display': ['3.5rem', { lineHeight: '1.1', fontWeight: '300', letterSpacing: '-0.02em' }],
        'heading-1': ['2.375rem', { lineHeight: '1.186', fontWeight: '400', letterSpacing: '0' }], // 38px
        'heading-2': ['1.875rem', { lineHeight: '1.3', fontWeight: '300' }],
        'heading-3': ['1.4375rem', { lineHeight: '1.2', fontWeight: '300' }],

        // Body text
        'body-lg': ['1.125rem', { lineHeight: '1.5', fontWeight: '300' }],
        'body': ['1rem', { lineHeight: '1.5', fontWeight: '300' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '300' }],

        // Section-specific typography
        'section-label': ['1.1875rem', { lineHeight: '1.368', fontWeight: '400', letterSpacing: '0.05em' }], // 19px - uppercase labels
        'section-value': ['0.9375rem', { lineHeight: '1.5', fontWeight: '400', letterSpacing: '0' }], // 15px - data values

        // Sidebar & Navigation
        'sidebar-heading': ['0.8125rem', { lineHeight: '1.231', fontWeight: '600', letterSpacing: '0' }], // 13px
        'sidebar-text': ['0.6875rem', { lineHeight: '1.455', fontWeight: '400', letterSpacing: '0' }], // 11px

        // Metadata & Small Text
        'meta': ['0.6875rem', { lineHeight: '2.1045', fontWeight: '400', letterSpacing: '0' }], // 11px (23.15px line height)
        'meta-compact': ['0.6875rem', { lineHeight: '1.455', fontWeight: '400', letterSpacing: '0' }], // 11px (16px line height)
        'meta-label': ['0.6875rem', { lineHeight: '1.091', fontWeight: '400', letterSpacing: '0' }], // 11px (12px line height)
        'meta-badge': ['0.6875rem', { lineHeight: '1.455', fontWeight: '500', letterSpacing: '0' }], // 11px - status badges

        // Buttons & Interactive
        'button': ['0.9375rem', { lineHeight: '1.5', fontWeight: '400', letterSpacing: '0' }], // 15px

        // Special purpose
        'disclaimer': ['1.4375rem', { lineHeight: '1.565', fontWeight: '900', letterSpacing: '0.025em' }], // 23px - emphasis
        'breadcrumb': ['0.6875rem', { lineHeight: '1.455', fontWeight: '400', letterSpacing: '0.02em' }], // 11px

        // Legacy (keep for backwards compatibility during migration)
        'label': ['0.75rem', { lineHeight: '1.4', fontWeight: '300', letterSpacing: '0.05em' }],
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
        sans: ['var(--font-figtree)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Arial', 'sans-serif'],
      },
      transitionDuration: {
        '400': '400ms',
      },
      animation: {
        'ping-slow': 'ping 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 3s ease-in-out infinite',
        'fade-in': 'fadeIn 300ms ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        glow: {
          '0%, 100%': {
            boxShadow: '0 0 3px 1px rgba(239, 68, 68, 0.5), 0 0 6px 2px rgba(239, 68, 68, 0.3), 0 0 9px 3px rgba(239, 68, 68, 0.15)',
          },
          '25%': {
            boxShadow: '0 0 5px 2px rgba(239, 68, 68, 0.7), 0 0 10px 4px rgba(239, 68, 68, 0.5), 0 0 15px 6px rgba(239, 68, 68, 0.25)',
          },
          '50%': {
            boxShadow: '0 0 8px 3px rgba(239, 68, 68, 1), 0 0 16px 6px rgba(239, 68, 68, 0.7), 0 0 24px 9px rgba(239, 68, 68, 0.4)',
          },
          '75%': {
            boxShadow: '0 0 5px 2px rgba(239, 68, 68, 0.7), 0 0 10px 4px rgba(239, 68, 68, 0.5), 0 0 15px 6px rgba(239, 68, 68, 0.25)',
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
