/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro Display"', 'Inter', 'sans-serif'],
        display: ['"SF Pro Display"', '-apple-system', 'BlinkMacSystemFont', 'Outfit', 'sans-serif'],
      },
      colors: {
        brand: {
          orange: '#EA7F32',
          teal: '#164E4D',
          cream: '#FDF8F1',
          dark: '#0f172a',
        }
      },
      boxShadow: {
        'glass': '0 8px 30px rgb(0, 0, 0, 0.04)',
        'premium': '0 20px 40px -15px rgba(234, 127, 50, 0.15)', // Orange shadow
      }
    },
  },
  plugins: [],
}
