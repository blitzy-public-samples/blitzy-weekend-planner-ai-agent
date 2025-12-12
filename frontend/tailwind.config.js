/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#E07A5F',
        background: '#F4F1DE',
        text: '#3D405B',
        success: '#81B29A',
        error: '#E63946'
      }
    }
  },
  plugins: []
};
