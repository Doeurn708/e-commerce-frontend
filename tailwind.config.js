/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#080D1A',
          900: '#0F172A',
          800: '#111827',
          700: '#1E293B',
          600: '#334155',
        },
      },
      spacing: {
        '4.5': '1.125rem',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease both',
        'fade-in': 'fadeIn 0.4s ease both',
        float: 'float 6s ease-in-out infinite',
        'float-delayed': 'float 7s ease-in-out 1.2s infinite',
        blob: 'blob 9s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        blob: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(24px, -20px) scale(1.05)' },
          '66%': { transform: 'translate(-18px, 16px) scale(0.96)' },
        },
      },
    },
  },
  plugins: [],
};