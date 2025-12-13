/**
 * PostCSS Configuration File
 * 
 * This configuration file sets up the CSS processing pipeline for the
 * Weekend Planner frontend application. It registers the required plugins
 * for processing Tailwind CSS utility classes and adding vendor prefixes
 * for cross-browser compatibility.
 * 
 * Plugins:
 * - tailwindcss: Processes Tailwind CSS utility classes and generates
 *   the necessary CSS based on the tailwind.config.js configuration
 * - autoprefixer: Automatically adds vendor prefixes (-webkit-, -moz-, etc.)
 *   to CSS rules for cross-browser compatibility
 * 
 * @see https://postcss.org/
 * @see https://tailwindcss.com/docs/installation/using-postcss
 */

module.exports = {
  plugins: {
    /**
     * Tailwind CSS plugin
     * Processes utility classes and generates optimized CSS output
     * Configuration is read from tailwind.config.js
     */
    tailwindcss: {},

    /**
     * Autoprefixer plugin
     * Parses CSS and adds vendor prefixes based on browser support data
     * from Can I Use (https://caniuse.com/)
     */
    autoprefixer: {},
  },
};
