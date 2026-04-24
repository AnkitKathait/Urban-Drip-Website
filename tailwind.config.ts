import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // ─── Brand colors ──────────────────────────────────────────────────────
      colors: {
        'ud-black':   '#080808',
        'ud-dark':    '#111111',
        'ud-surface': '#161616',
        'ud-gray':    '#222222',
        'ud-line':    '#2A2A2A',
        'ud-subtle':  '#555555',
        'ud-muted':   '#888888',
        'ud-white':   '#F0F0F0',
        'ud-accent':  '#FF2D2D',
        'ud-gold':    '#C9A227',
        'ud-neon':    '#00E87A',
        'ud-purple':  '#8B5CF6',
        'ud-blue':    '#3B82F6',
        'ud-orange':  '#F97316',
      },

      // ─── Typography ────────────────────────────────────────────────────────
      fontFamily: {
        bebas:   ['var(--font-bebas-neue)', 'Bebas Neue', 'Impact', 'sans-serif'],
        oswald:  ['var(--font-oswald)', 'Oswald', 'sans-serif'],
        sans:    ['var(--font-dm-sans)', 'DM Sans', 'system-ui', 'sans-serif'],
        jakarta: ['var(--font-jakarta)', 'Plus Jakarta Sans', 'sans-serif'],
        mono:    ['var(--font-space-mono)', 'Space Mono', 'monospace'],
      },

      // ─── Spacing / sizing ──────────────────────────────────────────────────
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },

      // ─── Border radius ─────────────────────────────────────────────────────
      borderRadius: {
        'none': '0',
        'sm': '2px',
        DEFAULT: '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
      },

      // ─── Animations & keyframes ────────────────────────────────────────────
      keyframes: {
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)', filter: 'hue-rotate(90deg)' },
          '40%': { transform: 'translate(2px, -2px)', filter: 'hue-rotate(180deg)' },
          '60%': { transform: 'translate(-1px, 1px)' },
          '80%': { transform: 'translate(1px, -1px)', filter: 'hue-rotate(270deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'pulse-neon': {
          '0%, 100%': { boxShadow: '0 0 5px #00FF88, 0 0 10px #00FF88' },
          '50%': { boxShadow: '0 0 20px #00FF88, 0 0 40px #00FF88' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'border-glow': {
          '0%, 100%': { borderColor: '#FF3B3B' },
          '50%': { borderColor: '#00FF88' },
        },
      },
      animation: {
        glitch:         'glitch 0.4s ease-in-out',
        shimmer:        'shimmer 2s linear infinite',
        'pulse-neon':   'pulse-neon 2s ease-in-out infinite',
        'slide-up':     'slide-up 0.3s ease-out',
        'slide-right':  'slide-in-right 0.3s ease-out',
        'fade-in':      'fade-in 0.4s ease-out',
        'scale-in':     'scale-in 0.2s ease-out',
        marquee:        'marquee 20s linear infinite',
        'border-glow':  'border-glow 2s ease-in-out infinite',
      },

      // ─── Background gradients ──────────────────────────────────────────────
      backgroundImage: {
        'ud-gradient':      'linear-gradient(135deg, #0A0A0A 0%, #141414 50%, #1C1C1C 100%)',
        'accent-gradient':  'linear-gradient(135deg, #FF3B3B, #8B5CF6)',
        'anime-gradient':   'linear-gradient(135deg, #0A0A0A, #1a0a2e)',
        'gym-gradient':     'linear-gradient(135deg, #0A0A0A, #0a1628)',
        'pickle-gradient':  'linear-gradient(135deg, #0A0A0A, #1a0f00)',
        'shimmer-gradient': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
      },

      // ─── Box shadows ───────────────────────────────────────────────────────
      boxShadow: {
        'neon-red':    '0 0 12px rgba(255, 45, 45, 0.6), 0 0 40px rgba(255, 45, 45, 0.2)',
        'neon-green':  '0 0 12px rgba(0, 232, 122, 0.6), 0 0 40px rgba(0, 232, 122, 0.2)',
        'neon-purple': '0 0 12px rgba(139, 92, 246, 0.6), 0 0 40px rgba(139, 92, 246, 0.2)',
        'card':        '0 8px 32px rgba(0,0,0,0.6)',
        'card-hover':  '0 12px 48px rgba(255, 45, 45, 0.12)',
        'glow-red':    '0 0 0 1px rgba(255,45,45,0.5)',
      },

      // ─── Screens (mobile-first breakpoints) ────────────────────────────────
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },

      // ─── Typography scale ──────────────────────────────────────────────────
      fontSize: {
        'display-2xl': ['4.5rem',  { lineHeight: '1', letterSpacing: '0.02em' }],
        'display-xl':  ['3.75rem', { lineHeight: '1', letterSpacing: '0.02em' }],
        'display-lg':  ['3rem',    { lineHeight: '1.1', letterSpacing: '0.02em' }],
        'display-md':  ['2.25rem', { lineHeight: '1.2', letterSpacing: '0.01em' }],
        'display-sm':  ['1.875rem',{ lineHeight: '1.2', letterSpacing: '0.01em' }],
      },
    },
  },
  plugins: [],
}

export default config
