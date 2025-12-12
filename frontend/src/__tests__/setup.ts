/**
 * Test environment setup for Vitest.
 * Configures MSW server and jest-dom matchers.
 */

import '@testing-library/jest-dom';
import { beforeAll, afterAll, afterEach } from 'vitest';
import { server } from '../__mocks__/handlers';

/**
 * Start MSW server before all tests
 */
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

/**
 * Reset handlers after each test to ensure test isolation
 */
afterEach(() => {
  server.resetHandlers();
});

/**
 * Close MSW server after all tests complete
 */
afterAll(() => {
  server.close();
});
