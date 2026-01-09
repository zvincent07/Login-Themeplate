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
        // Light theme colors
        light: {
          bg: '#ffffff',
          'bg-secondary': '#f8f9fa',
          'bg-tertiary': '#f1f3f5',
          text: '#1a1a1a',
          'text-secondary': '#495057',
          'text-tertiary': '#6c757d',
          border: '#e9ecef',
          'border-hover': '#dee2e6',
          accent: '#2563eb',
          'accent-hover': '#1d4ed8',
        },
        // Dark theme colors
        dark: {
          bg: '#0f172a',
          'bg-secondary': '#1e293b',
          'bg-tertiary': '#334155',
          text: '#f1f5f9',
          'text-secondary': '#cbd5e1',
          'text-tertiary': '#94a3b8',
          border: '#334155',
          'border-hover': '#475569',
          accent: '#3b82f6',
          'accent-hover': '#60a5fa',
        },
      },
    },
  },
  plugins: [],
}

