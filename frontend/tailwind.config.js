/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Sovereign Sentinel surface stack ──
        surface: {
          void:    '#0a0e14',
          low:     '#0e141c',
          DEFAULT: '#121a25',
          high:    '#16202e',
          highest: '#1a2637',
          variant: '#1a2637',
          bright:  '#1e2d41',
        },
        // ── Primary (Amber/Gold) ──
        primary: {
          DEFAULT: '#ffba3b',
          dim:     '#f4ab04',
          muted:   '#F2A900',
          container: '#604100',
          on:      '#573b00',
        },
        // ── Secondary (Jade/Green) ──
        secondary: {
          DEFAULT:   '#21b375',
          container: '#004529',
          on:        '#51d695',
        },
        // ── Tertiary / Critical (Red) ──
        tertiary: {
          DEFAULT: '#ff7162',
        },
        // ── Text / Outline ──
        outline:  {
          DEFAULT: '#6a768a',
          variant: '#3c495b',
        },
        'on-surface':         '#d9e6fd',
        'on-surface-variant': '#9facc1',

        // Keep backward-compat aliases used by admin pages
        navy: {
          950: '#0a0e14',
          900: '#0e141c',
          800: '#121a25',
          700: '#16202e',
          600: '#1a2637',
          500: '#1e2d41',
        },
        amber: {
          300: '#ffdead',
          400: '#ffcc7b',
          500: '#ffba3b',
          600: '#f4ab04',
        },
        teal: {
          400: '#51d695',
          500: '#21b375',
          600: '#006941',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sentinel: '2px',
        card:     '4px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'btn-primary': 'linear-gradient(135deg, #ffba3b 0%, #f4ab04 60%, #604100 100%)',
        'hero-pattern': "url(\"data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffba3b' fill-opacity='0.03'%3E%3Cpath d='M0 0h1v1H0zm16 0h1v1h-1zM0 16h1v1H0zm16 16h1v1h-1z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-up':    'fadeUp 0.5s ease-out both',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float':      'float 3.5s ease-in-out infinite',
        'shimmer':    'shimmer 2s linear infinite',
        'scan':       'scanLine 4s linear infinite',
        'spin-slow':  'spin 3s linear infinite',
      },
      keyframes: {
        fadeUp:    { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 12px rgba(255,186,59,0.25)' },
          '50%':      { boxShadow: '0 0 28px rgba(255,186,59,0.5)' },
        },
        float:   { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-6px)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        scanLine:{ '0%': { transform: 'translateY(-100%)', opacity: '0.3' }, '100%': { transform: 'translateY(100vh)', opacity: '0' } },
      },
      boxShadow: {
        'sentinel':   '0px 24px 48px rgba(0, 0, 0, 0.5)',
        'primary-glow': '0 0 16px 2px rgba(255, 186, 59, 0.35)',
        'secondary-glow': '0 0 16px 2px rgba(33, 179, 117, 0.25)',
        // admin back-compat
        'amber-glow': '0 0 24px rgba(255, 186, 59, 0.3)',
        'amber-lg':   '0 0 48px rgba(255, 186, 59, 0.15)',
        'card':       '0px 24px 48px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
}
