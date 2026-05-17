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
          red: '#dc2626',
          'red-dark': '#991b1b',
          'red-light': '#fca5a5',
          black: '#000000',
          white: '#ffffff',
          gray: '#f3f4f6',
          green: '#10b981',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'SF Mono', 'Monaco', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
