/**
 * Global Test Setup
 * ==================
 *
 * Runs before all tests. Configures test environment, MSW server, etc.
 */

import { server } from './mocks/server';
import { resetMockState } from './mocks/hubspot-api';

// Start MSW server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

// Reset handlers and mock state after each test
afterEach(() => {
  server.resetHandlers();
  resetMockState();
});

// Clean up after all tests
afterAll(() => {
  server.close();
});

// Suppress console errors in tests (optional - remove if you want to see them)
// global.console.error = jest.fn();
// global.console.warn = jest.fn();
