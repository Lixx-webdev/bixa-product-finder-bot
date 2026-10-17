/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bixa: {
          green: '#2d6a4f',
          darkgreen: '#143618',
          lightgreen: '#d8f3dc',
          accent: '#52b788',
          gold: '#d4af37',
          bg: '#f8faf6',
          card: '#ffffff'
        }
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'Georgia', 'serif']
      }
    },
  },
  plugins: [],
}
