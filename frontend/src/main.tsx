/**
 * Application Entry Point - Weekend Planner Frontend
 * 
 * This file serves as the main entry point for the Weekend Planner React application.
 * It bootstraps the React 18 application using the createRoot API which enables
 * concurrent rendering mode for improved performance and responsiveness.
 * 
 * Architecture:
 * - Uses React 18 createRoot API for concurrent mode rendering
 * - Wraps the application in React.StrictMode for development checks:
 *   - Detects unsafe lifecycle methods
 *   - Warns about legacy string ref API usage
 *   - Detects unexpected side effects
 *   - Ensures reusable state for components
 * - Imports global CSS (index.css) with Tailwind CSS directives
 * 
 * Bootstrap Flow:
 * 1. Locate root DOM element by ID 'root'
 * 2. Validate root element exists (throw error if missing)
 * 3. Create React concurrent root using ReactDOM.createRoot
 * 4. Render App component wrapped in StrictMode
 * 
 * @fileoverview React 18 application bootstrap with concurrent rendering
 * @module main
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * ROOT_ELEMENT_ID - The ID of the DOM element where the React app will be mounted.
 * This must match the ID in index.html: <div id="root"></div>
 */
const ROOT_ELEMENT_ID = 'root';

/**
 * Get the root DOM element from the document.
 * 
 * The root element is defined in index.html and serves as the
 * mounting point for the entire React application tree.
 */
const rootElement = document.getElementById(ROOT_ELEMENT_ID);

/**
 * Validate that the root element exists before attempting to render.
 * 
 * This is a critical check that ensures the DOM is properly set up
 * before React attempts to mount the application. Without this check,
 * React would fail with a less descriptive error message.
 * 
 * Common causes of this error:
 * - Missing <div id="root"></div> in index.html
 * - Script running before DOM is fully loaded (should be in <body> with type="module")
 * - Typo in the element ID
 */
if (!rootElement) {
  throw new Error(
    `Root element with ID "${ROOT_ELEMENT_ID}" not found. ` +
    'Ensure index.html contains <div id="root"></div> within the body element.'
  );
}

/**
 * Create the React 18 concurrent root and render the application.
 * 
 * React 18 introduces the createRoot API which enables:
 * - Concurrent rendering for better responsiveness
 * - Automatic batching of state updates
 * - Transitions API for non-urgent updates
 * - Suspense improvements for data fetching
 * 
 * React.StrictMode wrapping enables additional development-time checks:
 * - Double-invokes functions to detect side effects
 * - Warns about deprecated APIs
 * - Helps identify potential problems in the application
 * 
 * Note: StrictMode only affects development builds; it has no impact on production.
 */
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
