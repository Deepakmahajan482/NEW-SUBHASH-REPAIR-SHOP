/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        dark: {
          bg: '#0b0f19',          // Deep premium obsidian
          card: '#151d2e',        // Rich navy card surface
          cardHover: '#1c263c',
          border: '#24324d',      // Subtle separation border
          muted: '#94a3b8',       // Crisp secondary text
        },
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',        // Signature logo truck gold
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        brand: {
          gold: '#f59e0b',
          goldHover: '#e08e00',
          goldDark: '#b45309',
          charcoal: '#0f172a',
          charcoalHover: '#1e293b',
          blue: '#1d78c0',
        }
      },
    },
  },
  plugins: [],
}
