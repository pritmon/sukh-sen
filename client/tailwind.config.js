/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0fdf8',
          100: '#ccfbee',
          200: '#99f5de',
          300: '#5ce8c7',
          400: '#29cfaa',
          500: '#1D9E75',
          600: '#148e67',
          700: '#0f7254',
          800: '#0c5b43',
          900: '#0a4b37',
        },
      },
    },
  },
  plugins: [],
};
