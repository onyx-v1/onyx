/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // ── Design Tokens ───────────────────────────────────────────────────────
      colors: {
        base:     'var(--color-base)',
        panel:    'var(--color-panel)',
        hover:    'var(--color-hover)',
        active:   'var(--color-active)',
        elevated: 'var(--color-elevated)',
        input:    'var(--color-input)',
        border:   'var(--color-border)',

        accent: {
          DEFAULT: 'var(--color-accent)',
          hover:   'var(--color-accent-hover)',
          muted:   'var(--color-accent-muted)',
        },

        primary:  'var(--color-primary)',
        muted:    'var(--color-muted)',
        subtle:   'var(--color-subtle)',

        online:   'var(--color-online)',
        danger:   'var(--color-danger)',
        warning:  'var(--color-warning)',
      },

      // ── Layout Dimensions ───────────────────────────────────────────────────
      height:  { header: 'var(--size-header)' },
      width:   { sidebar: 'var(--size-sidebar)' },
      inset:   { header: 'var(--size-header)', sidebar: 'var(--size-sidebar)' },

      // ── Border Radius ───────────────────────────────────────────────────────
      borderRadius: {
        panel: 'var(--radius-panel)',
        control: 'var(--radius-control)',
      },

      // ── Font sizes (base = 15px, so em values stay proportional) ────────────
      fontSize: {
        '2xs': ['11px', { lineHeight: '1.4' }],
        xs:    ['12px', { lineHeight: '1.5' }],
        sm:    ['13px', { lineHeight: '1.5' }],
        base:  ['15px', { lineHeight: '1.6' }],
        md:    ['15px', { lineHeight: '1.6' }],
        lg:    ['17px', { lineHeight: '1.5' }],
        xl:    ['20px', { lineHeight: '1.4' }],
      },

      // ── Spacing: a few named steps ──────────────────────────────────────────
      spacing: {
        'sidebar': 'var(--size-sidebar)',
        'header':  'var(--size-header)',
      },

      // ── Animations ─────────────────────────────────────────────────────────
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%':   { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-ring': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(139,124,248,0.4)' },
          '50%':       { boxShadow: '0 0 0 6px rgba(139,124,248,0)' },
        },
        'speaking-ring': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(62,207,142,0.5)' },
          '50%':       { boxShadow: '0 0 0 4px rgba(62,207,142,0)' },
        },
        'bounce-dot': {
          '0%, 80%, 100%': { transform: 'scale(0.8)', opacity: '0.5' },
          '40%':            { transform: 'scale(1.2)', opacity: '1' },
        },
      },
      animation: {
        'fade-in':       'fade-in 0.15s ease-out',
        'slide-in':      'slide-in 0.15s ease-out',
        'pulse-ring':    'pulse-ring 1.5s ease-in-out infinite',
        'speaking-ring': 'speaking-ring 0.8s ease-in-out infinite',
        'bounce-dot':    'bounce-dot 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
