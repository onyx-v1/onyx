/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Layers (from prototype) ───────────────────
        base:     '#181818',   // header, sidebar bg
        panel:    '#242424',   // main content panel
        hover:    '#222222',   // channel / item hover
        active:   '#2a2a2a',   // active channel bg
        elevated: '#2f2f2f',   // modals, dropdowns
        input:    '#1f1f1f',   // input backgrounds

        // ── Brand Accent ──────────────────────────────
        accent: {
          DEFAULT: '#8b7cf8',
          hover:   '#a695fa',
          muted:   '#8b7cf820',
        },

        // ── Text ──────────────────────────────────────
        primary:  '#f0f0f0',
        muted:    '#aaaaaa',
        subtle:   '#666666',

        // ── Status ───────────────────────────────────
        online:   '#3ecf8e',
        danger:   '#ef4444',
        warning:  '#f59e0b',
      },

      height: { header: '60px' },
      width:  { sidebar: '220px' },
      inset:  { header: '60px', sidebar: '220px' },

      borderRadius: {
        panel: '16px',
      },

      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-ring': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(139, 124, 248, 0.4)' },
          '50%':       { boxShadow: '0 0 0 6px rgba(139, 124, 248, 0)' },
        },
        'speaking-ring': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(62, 207, 142, 0.5)' },
          '50%':       { boxShadow: '0 0 0 4px rgba(62, 207, 142, 0)' },
        },
        'bounce-dot': {
          '0%, 80%, 100%': { transform: 'scale(0.8)', opacity: '0.5' },
          '40%':           { transform: 'scale(1.2)', opacity: '1' },
        },
      },

      animation: {
        'fade-in':      'fade-in 0.15s ease-out',
        'slide-in':     'slide-in 0.15s ease-out',
        'pulse-ring':   'pulse-ring 1.5s ease-in-out infinite',
        'speaking-ring':'speaking-ring 0.8s ease-in-out infinite',
        'bounce-dot':   'bounce-dot 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
