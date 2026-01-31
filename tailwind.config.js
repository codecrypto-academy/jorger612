/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        elite: {
          black: '#0a0a0b',
          charcoal: '#141416',
          slate: '#1c1d21',
          silver: '#8b8d97',
          gold: '#c9a227',
          cream: '#f5f0e6',
          accent: '#2d2f36',
        },
        premium: {
          navy: '#0f172a',
          ink: '#1e293b',
          steel: '#334155',
          pearl: '#f8fafc',
        }
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'elite': '0 4px 24px rgba(0,0,0,0.4), 0 0 1px rgba(201,162,39,0.2)',
        'inner-elite': 'inset 0 1px 0 rgba(255,255,255,0.03)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
