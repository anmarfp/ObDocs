/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'navy-main': '#021024',
        'navy-card': '#052659',
        'navy-blue': '#5483B3',
        'navy-border': '#7DA0CA',
        'navy-light': '#C1E8FF',
        'status-expired': '#e63946',
        'status-critical': '#f77f00',
        'status-renewal': '#0077b6',
        'status-regular': '#2a9d8f',
        'status-indeterminate': '#6c757d',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
