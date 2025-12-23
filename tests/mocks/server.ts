/**
 * Mock Service Worker Server Setup
 * =================================
 *
 * Configures MSW server for intercepting HTTP requests in tests.
 * Import and use in test setup files.
 *
 * Usage in tests:
 *   import { server } from './mocks/server';
 *
 *   beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
 *   afterEach(() => server.resetHandlers());
 *   afterAll(() => server.close());
 */

import { setupServer } from 'msw/node';
import { hubspotHandlers } from './hubspot-api';

// Create MSW server with HubSpot handlers
export const server = setupServer(...hubspotHandlers);
