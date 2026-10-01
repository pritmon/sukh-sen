/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          50:  '#fdf9ed',
          100: '#f9efcc',
          200: '#f2dc94',
          300: '#e8c96d',
          400: '#d4af37',
          500: '#C9A84C',
          600: '#b8962e',
          700: '#9a7a22',
          800: '#7d621c',
          900: '#614c16',
        },
        obsidian: {
          50:  '#f5f5f5',
          100: '#e0e0e0',
          200: '#c2c2c2',
          300: '#a3a3a3',
          400: '#737373',
          500: '#525252',
          600: '#333333',
          700: '#1f1f1f',
          800: '#141414',
          900: '#0A0A0A',
          950: '#050505',
        },
        cream: '#F5F0E8',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:  ['"Inter"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gold-shimmer': 'linear-gradient(135deg, #C9A84C 0%, #E8C96D 50%, #C9A84C 100%)',
      },
      boxShadow: {
        'gold': '0 0 20px rgba(201, 168, 76, 0.15)',
        'gold-sm': '0 0 8px rgba(201, 168, 76, 0.1)',
      },
    },
  },
  plugins: [],
};
