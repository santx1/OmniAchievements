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
        background: {
          dark: '#0b0f19',
          light: '#f8fafc'
        },
        card: {
          dark: '#131b2e',
          light: '#ffffff'
        },
        accent: {
          DEFAULT: 'var(--accent-color, #6366f1)',
          hover: 'var(--accent-hover, #4f46e5)'
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"Segoe UI"', 'Roboto', 'sans-serif']
      },
      boxShadow: {
        'glow': '0 0 25px -5px rgba(99, 102, 241, 0.4)',
        'glow-gold': '0 0 25px -5px rgba(234, 179, 8, 0.4)'
      }
    },
  },
  plugins: [],
}
