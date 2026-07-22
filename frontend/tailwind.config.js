/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Indigo/violet — the product's primary, used with restraint.
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        // Warm stone neutrals for a calmer canvas than cold grays.
        gray: {
          50: '#faf9f7',
          100: '#f5f4f1',
          200: '#e7e5e0',
          300: '#d6d3cd',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        },
        // "Away" accent — a warm amber that reads as time off / sun.
        away: {
          100: '#fef3c7',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(28, 25, 23, 0.04), 0 4px 16px rgba(28, 25, 23, 0.06)',
      },
    },
  },
  plugins: [],
}
