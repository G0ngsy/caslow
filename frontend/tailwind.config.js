/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          100: '#E6CCFF',
          200: '#D1A3FF',
          300: '#B980FF',
          400: '#A14EFF',
          500: '#8A2BE2',
          600: '#7A00CC',
          700: '#6600B2',
          800: '#4D0080',
          900: '#330066',
          950: '#1A0033',
        }
      }
    },
  },
  plugins: [],
}