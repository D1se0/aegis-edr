/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: {
          950: '#05070d',
          900: '#0a0e1a',
          800: '#0f1526',
          700: '#161d33',
          600: '#1e2740'
        },
        aegis: {
          cyan: '#3ee6d0',
          blue: '#4f7bff',
          violet: '#8b6bff',
          pink: '#ff5ea8',
          amber: '#ffb84f',
          red: '#ff5470',
          green: '#33e39a'
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        glow: '0 0 24px 0 rgba(62, 230, 208, 0.35)',
        'glow-lg': '0 0 60px 0 rgba(62, 230, 208, 0.25)',
        'glow-red': '0 0 24px 0 rgba(255, 84, 112, 0.4)'
      },
      backdropBlur: {
        xs: '2px'
      },
      keyframes: {
        pulseRing: {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '80%, 100%': { transform: 'scale(1.9)', opacity: '0' }
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' }
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' }
        },
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        blipPulse: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.4)' }
        }
      },
      animation: {
        pulseRing: 'pulseRing 2.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        scanline: 'scanline 3s linear infinite',
        floatSlow: 'floatSlow 5s ease-in-out infinite',
        radarSweep: 'radarSweep 4s linear infinite',
        blipPulse: 'blipPulse 2s ease-in-out infinite'
      }
    }
  },
  plugins: []
}
