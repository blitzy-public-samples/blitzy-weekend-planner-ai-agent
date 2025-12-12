/**
 * Test environment setup for Vitest with MSW (Mock Service Worker) integration.
 * 
 * This file configures the testing environment by:
 * 1. Importing jest-dom matchers to extend Vitest's expect with DOM-specific assertions
 * 2. Setting up MSW server lifecycle hooks for API mocking
 * 3. Providing browser API mocks for jsdom environment compatibility
 * 
 * This setup file is referenced in vitest.config.ts as setupFiles and runs 
 * before all test files to ensure a consistent testing environment.
 * 
 * @module __tests__/setup
 */

// ============================================================================
// Jest-DOM Matchers Extension
// ============================================================================

/**
 * Import jest-dom matchers to extend Vitest's expect with DOM-specific assertions.
 * 
 * Available matchers include:
 * - toBeInTheDocument() - Assert element exists in the document
 * - toHaveTextContent() - Assert element has specific text content
 * - toBeDisabled() - Assert element is disabled
 * - toBeEnabled() - Assert element is enabled
 * - toHaveAttribute() - Assert element has specific attribute
 * - toHaveClass() - Assert element has specific CSS class
 * - toBeVisible() - Assert element is visible to the user
 * - toHaveValue() - Assert form element has specific value
 * - toHaveFocus() - Assert element has focus
 * - toBeChecked() - Assert checkbox/radio is checked
 * - toBeRequired() - Assert form element is required
 * - toBeEmpty() - Assert element has no content
 * - toContainElement() - Assert element contains another element
 * - toContainHTML() - Assert element contains specific HTML
 * - toHaveStyle() - Assert element has specific CSS styles
 * - toHaveAccessibleDescription() - Assert element has accessible description
 * - toHaveAccessibleName() - Assert element has accessible name
 * - toHaveErrorMessage() - Assert form element has error message
 * - toBeInvalid() - Assert form element is invalid
 * - toBeValid() - Assert form element is valid
 * - toHaveDisplayValue() - Assert select/textarea displays specific value
 */
import '@testing-library/jest-dom';

// ============================================================================
// Vitest Lifecycle Hooks
// ============================================================================

import { beforeAll, afterEach, afterAll } from 'vitest';

// ============================================================================
// MSW Server Import
// ============================================================================

/**
 * Import the MSW server instance configured with mock handlers for ADK API endpoints.
 * 
 * The server provides:
 * - listen() - Start intercepting requests
 * - resetHandlers() - Reset to default handlers
 * - close() - Stop intercepting requests
 */
import { server } from '../__mocks__/handlers';

// ============================================================================
// Browser API Mocks for jsdom Environment
// ============================================================================

/**
 * Mock implementation of window.matchMedia for responsive design testing.
 * 
 * jsdom does not implement window.matchMedia, which is used by Tailwind CSS
 * and responsive components. This mock provides a minimal implementation
 * that allows tests to run without errors.
 * 
 * By default, returns false for all media queries. Tests can override this
 * behavior by providing custom implementations when needed.
 */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // Deprecated but required for older implementations
    removeListener: () => {}, // Deprecated but required for older implementations
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
});

/**
 * Mock implementation of ResizeObserver for layout-aware component testing.
 * 
 * jsdom does not implement ResizeObserver, which may be used by components
 * that respond to element size changes. This mock provides a no-op
 * implementation that prevents test errors.
 */
class MockResizeObserver implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
});

/**
 * Mock implementation of IntersectionObserver for lazy-loading component testing.
 * 
 * jsdom does not implement IntersectionObserver, which may be used by components
 * that need to detect when elements enter the viewport. This mock provides
 * a no-op implementation that prevents test errors.
 */
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});

// ============================================================================
// MSW Server Lifecycle Hooks
// ============================================================================

/**
 * Start MSW server before all tests.
 * 
 * The onUnhandledRequest: 'error' option ensures that any network requests
 * not handled by defined mock handlers will cause the test to fail immediately.
 * This helps catch missing mocks early and ensures all API calls are intentional.
 * 
 * This strict mode prevents accidental real network requests during testing,
 * which would make tests unreliable and potentially slow.
 */
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

/**
 * Reset request handlers after each test to ensure test isolation.
 * 
 * This removes any runtime handlers added with server.use() during tests,
 * restoring the original default handlers defined in handlers.ts.
 * 
 * This ensures that test-specific handler overrides don't leak into
 * subsequent tests, maintaining proper test isolation.
 * 
 * @example
 * // In a test file, you might add a custom handler:
 * it('handles server error', async () => {
 *   server.use(create500Handler());
 *   // Test error handling...
 * });
 * 
 * // After this test, resetHandlers() will be called automatically,
 * // removing the 500 handler so the next test uses default handlers.
 */
afterEach(() => {
  server.resetHandlers();
});

/**
 * Close MSW server after all tests complete.
 * 
 * This properly shuts down the MSW server, releasing any resources
 * and stopping request interception. This cleanup ensures tests
 * don't leave hanging processes.
 */
afterAll(() => {
  server.close();
});

// ============================================================================
// Global Test Configuration
// ============================================================================

/**
 * Suppress console.error output during tests unless explicitly needed.
 * 
 * React Testing Library may emit console errors for expected error boundaries
 * and error states. This keeps test output clean while still allowing
 * legitimate errors to surface when debugging.
 * 
 * Uncomment the following code if you need to suppress specific console methods:
 * 
 * const originalError = console.error;
 * beforeAll(() => {
 *   console.error = (...args) => {
 *     if (/Warning: ReactDOM.render is no longer supported/.test(args[0])) {
 *       return;
 *     }
 *     originalError.call(console, ...args);
 *   };
 * });
 * afterAll(() => {
 *   console.error = originalError;
 * });
 */
