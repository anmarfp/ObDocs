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
        navy: {
          950: '#021024', // Deepest background / sidebar
          900: '#052659', // Card background / dark container
          800: '#0a3a7e', // Medium dark navy
          700: '#1e4e8c', // Interactive dark
          600: '#5483B3', // Primary brand accent
          500: '#6994c2', // Primary lighter hover
          400: '#7DA0CA', // Primary border / subtle accent
          300: '#9cbce0', // Muted light blue
          200: '#aed0ee', // Soft highlight
          100: '#C1E8FF', // Ice blue badge / light accent
          50: '#f0f8ff',  // Softest ice blue
        },
        status: {
          expired: {
            bg: '#fef2f2',
            text: '#991b1b',
            border: '#fecaca',
            dot: '#ef4444',
          },
          critical: {
            bg: '#fffbe6',
            text: '#92400e',
            border: '#fef08a',
            dot: '#f59e0b',
          },
          renewal: {
            bg: '#C1E8FF',
            text: '#052659',
            border: '#7DA0CA',
            dot: '#5483B3',
          },
          regular: {
            bg: '#f0fdf4',
            text: '#166534',
            border: '#bbf7d0',
            dot: '#22c55e',
          },
          indeterminate: {
            bg: '#f8fafc',
            text: '#475569',
            border: '#e2e8f0',
            dot: '#94a3b8',
          },
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 10px 15px -3px rgba(5, 38, 89, 0.1), 0 4px 6px -2px rgba(5, 38, 89, 0.05)',
        glow: '0 0 20px rgba(84, 131, 179, 0.25)',
      },
    },
  },
  plugins: [],
};
