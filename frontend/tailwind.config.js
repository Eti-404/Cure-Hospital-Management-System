/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mint: {
          soft: '#eef6f2',
          50: '#f1f7f4',
          100: '#e1efe8',
          200: '#c6dfd4',
          300: '#9ec6b6',
          400: '#6fa792',
          500: '#4c8c74',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        sage: {
          border: '#dbe7df',
          bg: '#f8faf9',
          card: '#ffffff',
          subtle: '#f1f7f4',
        },
      },
      fontFamily: {
        sans: ["'Hind Siliguri'", 'sans-serif'],
      },
      fontSize: {
        base: ['16px', '1.65'],
        lg: ['18px', '1.65'],
        xl: ['20px', '1.5'],
      },
      boxShadow: {
        sm: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        subtle: '0 4px 20px -2px rgba(15, 118, 110, 0.04), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
      },
    },
  },
  plugins: [],
}
