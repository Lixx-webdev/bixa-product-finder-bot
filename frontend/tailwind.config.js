/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // The widget is embedded in the live Shopify theme, so its CSS must not touch the host page:
  // Tailwind's global Preflight reset is off (a scoped copy lives in index.css), and every utility
  // is prefixed with the widget root so it only applies inside `.bixa-product-finder-root`.
  important: '.bixa-product-finder-root',
  corePlugins: {
    preflight: false,
    // Unused by the widget, and would override the host theme's own `.container` grid class.
    container: false
  },
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
