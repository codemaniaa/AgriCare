/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    
   extend: {
      // ── Font families ──────────────────────────────────────────────
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        arimo: ['Arimo', 'sans-serif'],
        noto: ['Noto Sans', 'sans-serif'],
        raleway: ['Raleway', 'sans-serif'],
        display: ['Clash Display', 'Sora', 'sans-serif'],
        sans:    ['Sora', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Courier New', 'monospace'],
      },

      // ── Brand colours ──────────────────────────────────────────────
      colors: {
        agri: {
          bg:      '#0a1f0d',
          bg2:     '#0d2e14',
          bg3:     '#0f3d1c',
          green:   '#3ddc6c',
          green2:  '#5fee8a',
          lime:    '#a8f059',
          text:    '#e8f5ec',
          dim:     '#8ab498',
        },
      },

      // ── Keyframes (used as animate-[name_duration_...]) ────────────
      keyframes: {
        revealUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        revealRight: {
          '0%':   { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeDown: {
          '0%':   { opacity: '0', transform: 'translateX(-50%) translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(-50%) translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.3' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition:  '200% center' },
        },
      },

      animation: {
        float:        'float 4s ease-in-out infinite',
        blink:        'blink 2s ease-in-out infinite',
        shimmer:      'shimmer 2.5s linear infinite',
        revealUp:     'revealUp 0.8s cubic-bezier(0.16,1,0.3,1) both',
        revealRight:  'revealRight 1s cubic-bezier(0.16,1,0.3,1) both',
        fadeDown:     'fadeDown 0.8s ease both',
      },

      // ── Backdrop blur levels ───────────────────────────────────────
      backdropBlur: {
        xs: '4px',
      },

      // ── Box shadows ────────────────────────────────────────────────
      boxShadow: {
        'glow-green':  '0 0 30px rgba(61,220,108,0.35)',
        'glow-green2': '0 0 50px rgba(61,220,108,0.55)',
        'card':        '0 20px 60px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
}