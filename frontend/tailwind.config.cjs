/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // Primary CTA color - dark blue for buttons and brand elements (WCAG AA compliant)
        primary: '#1e3a5f',
        // Background color - warm cream for full page background
        background: '#F4F1DE',
        // Text color - deep charcoal for body text and headings
        text: '#3D405B',
        // Success color - sage green for success states and confirmations
        success: '#81B29A',
        // Error color - muted red for error messages and alerts
        error: '#E63946'
      }
    }
  },
  plugins: []
};
