/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'osion': {
          black: '#0a0a0f',
          surface: '#141419',
          surfaceLight: '#1e1e26',
          violet: '#8b5cf6',
          rose: '#f43f5e',
          cyan: '#06b6d4',
          amber: '#f59e0b',
          green: '#10b981',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
