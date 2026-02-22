/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fbe5e1',
          100: '#ffdcd5',
          200: '#fbc8be',
          300: '#fcbdb1',
          400: '#f49c8c',
          500: '#f08875',
          600: '#d16653',
          700: '#b34632',
          800: '#8f3727',
          900: '#813b2e',
        },
        accent: {
          green: '#10b981',
          blue: '#3b82f6',
          purple: '#8b5cf6',
          pink: '#ec4899',
          orange: '#f59e0b',
          red: '#ef4444',
          teal: '#14b8a6',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          800: '#1e293b',
          850: '#172033',
          900: '#0f172a',
          950: '#080e1c',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
