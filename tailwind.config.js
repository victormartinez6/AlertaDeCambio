/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#654cf0',
          100: '#654cf0',
          200: '#654cf0',
          300: '#654cf0',
          400: '#654cf0',
          500: '#654cf0',
          600: '#654cf0',
          700: '#654cf0',
          800: '#654cf0',
          900: '#654cf0',
          950: '#654cf0',
        },
        remessa: '#D6FC49',
        marinho: '#211B4F'
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      boxShadow: {
        'glow': '0 0 15px -3px rgb(101 76 240 / 0.2), 0 0 6px -4px rgb(101 76 240 / 0.1)',
      }
    },
  },
  plugins: [],
}
