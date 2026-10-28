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
        app: {
          bg: '#0A0A0A',
          card: '#161616',
          border: '#262626',
          input: '#1A1A1A',
          bubble: '#1F1F1F',
          accent: '#3B82F6',
          gold: '#D4AF37',
          emerald: '#10B981'
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif']
      }
    },
  },
  plugins: [],
};
