/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        rubik: ['Rubik', 'sans-serif'],
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-right': 'env(safe-area-inset-right)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
      },
      padding: {
        'safe-t': 'env(safe-area-inset-top)',
        'safe-r': 'env(safe-area-inset-right)',
        'safe-b': 'env(safe-area-inset-bottom)',
        'safe-l': 'env(safe-area-inset-left)',
      },
      colors: {
        primary: {
          DEFAULT: '#086674',
          dark: '#064e5a',
          light: '#0a8a9c',
        },
        accent: {
          DEFAULT: '#F5B461',
          hover: '#e3a64f',
        },
        cta: '#d63e36',
        surface: {
          ground: 'hsl(225, 15%, 8%)',
          0: 'hsl(225, 14%, 11%)',
          1: 'hsl(225, 13%, 15%)',
          2: 'hsl(225, 12%, 19%)',
          3: 'hsl(225, 11%, 24%)',
          4: 'hsl(225, 10%, 30%)',
        },
        // Keep editor colors for backwards compat in editor view
        editor: {
          bg: 'hsl(225, 15%, 8%)',
          panel: 'hsl(225, 13%, 15%)',
          border: 'hsl(225, 10%, 24%)',
          text: '#e0e0e0',
          accent: '#086674',
        },
      },
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['14px', { lineHeight: '20px' }],
        base: ['16px', { lineHeight: '24px' }],
        lg: ['18px', { lineHeight: '28px' }],
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        instant: '50ms',
        fast: '100ms',
        normal: '200ms',
        slow: '350ms',
      },
      keyframes: {
        'skeleton-shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'skeleton-shimmer': 'skeleton-shimmer 1.8s ease-in-out infinite',
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'scale-in': 'scale-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      boxShadow: {
        'depth-sm': '0 1px 2px rgba(0, 0, 0, 0.3)',
        'depth-md': '0 4px 8px rgba(0, 0, 0, 0.3)',
        'depth-lg': '0 8px 24px rgba(0, 0, 0, 0.35)',
        'depth-xl': '0 16px 48px rgba(0, 0, 0, 0.4)',
        'glow': '0 0 20px rgba(8, 102, 116, 0.3)',
      },
    },
  },
  plugins: [],
}
