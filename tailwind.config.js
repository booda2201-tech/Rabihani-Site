/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        ink: '#050816',
        night: '#0a0e17',
        card: '#151b28',
        bid: '#3b82f6',
        gold: {
          DEFAULT: '#d4af37',
          light: '#f3d77a',
          dark: '#a8861f',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans Arabic"', 'Tahoma', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        phone: '0 40px 80px -20px rgba(0,0,0,.8), 0 0 0 1px rgba(255,255,255,.06), inset 0 0 0 2px rgba(255,255,255,.04)',
        glow: '0 0 40px -6px rgba(59,130,246,.6)',
        'glow-gold': '0 0 40px -6px rgba(212,175,55,.55)',
      },
      keyframes: {
        'cta-pulse': {
          '0%': { boxShadow: '0 0 0 0 rgba(59,130,246,.55)' },
          '70%': { boxShadow: '0 0 0 18px rgba(59,130,246,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(59,130,246,0)' },
        },
        shine: {
          '0%': { transform: 'translateX(120%)' },
          '100%': { transform: 'translateX(-120%)' },
        },
        // applied to a track spanning 12%–84% of the frame; the line sits on the track's top edge
        scan: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(100%)' },
        },
        'live-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.25' },
        },
        gift: {
          '0%, 55%, 100%': { transform: 'translateY(0) rotate(0) scale(1)' },
          '10%': { transform: 'translateY(0) scale(1.08, .9)' },
          '22%': { transform: 'translateY(-14%) rotate(-8deg) scale(.96, 1.06)' },
          '32%': { transform: 'translateY(-14%) rotate(8deg)' },
          '42%': { transform: 'translateY(0) rotate(-3deg) scale(1.05, .94)' },
          '48%': { transform: 'translateY(0) rotate(2deg)' },
        },
      },
      animation: {
        'cta-pulse': 'cta-pulse 2.2s ease-out infinite',
        shine: 'shine 2.4s ease-in-out infinite',
        scan: 'scan 2.6s ease-in-out infinite',
        'live-dot': 'live-dot 1.2s ease-in-out infinite',
        gift: 'gift 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
