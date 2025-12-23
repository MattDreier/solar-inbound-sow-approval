# Test Suite - Quick Start Guide

This directory contains comprehensive tests for the SOW Approval System's self-healing feature.

---

## Quick Start

### 1. Install Dependencies

```bash
npm install --save-dev jest @types/jest ts-jest
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev msw
```

### 2. Run Tests

```bash
# All tests
npm test

# Watch mode (re-runs on file changes)
npm test -- --watch

# With coverage report
npm test -- --coverage

# Specific test file
npm test -- tests/unit/hubspot-setup.test.ts

# Integration tests only
npm test -- tests/integration

# E2E tests only
npm test -- tests/e2e
```

---

## Directory Structure

```
tests/
├── README.md                          # This file
├── setup.ts                          # Global test setup (MSW, mocks)
├── unit/
│   └── hubspot-setup.test.ts        # Unit tests for self-healing functions
├── integration/
│   ├── first-deployment.test.ts     # Fresh deployment scenarios
│   ├── property-recovery.test.ts    # Property deletion recovery
│   ├── concurrent-operations.test.ts # Concurrency tests
│   └── health-endpoint.test.ts      # Health check accuracy
├── e2e/
│   ├── happy-path.test.ts           # Complete user journey
│   ├── mid-operation-recovery.test.ts # Recovery during active session
│   ├── api-failure.test.ts          # Graceful degradation
│   └── multiple-deletion.test.ts    # Bulk deletion recovery
└── mocks/
    ├── server.ts                     # MSW server setup
    ├── hubspot-api.ts                # HubSpot API mock handlers
    └── fixtures/
        └── test-data.ts              # Test data fixtures
```

---

## Test Types

### Unit Tests (~30 seconds)

**No external dependencies required**

Tests individual functions in isolation using mocks.

- Pattern matching (`isPropertyError`)
- Retry logic (`withSelfHealing`)
- Idempotency (`ensureHubSpotSetup`)
- State management (`resetSetupState`)

```bash
npm test -- tests/unit
```

### Integration Tests (~2-3 minutes)

**Requires HubSpot test account**

Tests interactions with real HubSpot API.

- Property creation
- Property recreation after deletion
- Concurrent request handling
- Health endpoint accuracy

```bash
# Set up environment first
export HUBSPOT_ACCESS_TOKEN="pat-na1-test-YOUR-TOKEN"
export NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# Run tests
npm test -- tests/integration
```

### E2E Tests (~5-10 minutes)

**Requires running application + HubSpot**

Tests complete user journeys from frontend to backend.

- Happy path: Fresh deployment → SOW approval
- Mid-operation recovery
- API failure handling
- Multiple property deletion

```bash
# Start dev server
npm run dev &

# Run tests
npm test -- tests/e2e
```

---

## Environment Variables

### For Unit Tests (Mocked)
No environment variables needed - uses MSW mocks.

### For Integration Tests
```bash
export HUBSPOT_ACCESS_TOKEN="pat-na1-test-12345678-1234-1234-1234-123456789012"
export NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

### For E2E Tests
Same as integration tests, plus ensure the dev server is running.

---

## Mock Service Worker (MSW)

MSW intercepts HTTP requests in tests and returns mock responses.

### Using Mocks in Tests

```typescript
import { server } from './mocks/server';
import { mockState, simulatePropertyDeletion } from './mocks/hubspot-api';

describe('My Test', () => {
  beforeAll(() => server.listen());
  afterEach(() => {
    server.resetHandlers();
    mockState.reset();
  });
  afterAll(() => server.close());

  test('handles property deletion', async () => {
    // Simulate property existing initially
    mockState.createProperty('sow_token');

    // Delete it mid-test
    simulatePropertyDeletion('sow_token');

    // Your test code...
  });
});
```

### Customizing Handlers

```typescript
import { rest } from 'msw';
import { server } from './mocks/server';

test('custom scenario', () => {
  // Override default handler for this test
  server.use(
    rest.patch('https://api.hubapi.com/crm/v3/objects/deals/:dealId', (req, res, ctx) => {
      return res(ctx.status(500), ctx.json({ error: 'Server error' }));
    })
  );

  // Test your error handling...
});
```

---

## Common Test Patterns

### Testing Self-Healing Retry

```typescript
test('retries after property error', async () => {
  let attemptCount = 0;
  const mockOperation = jest.fn(async () => {
    attemptCount++;
    if (attemptCount === 1) {
      throw new Error('Property sow_token does not exist');
    }
    return { success: true };
  });

  const result = await withSelfHealing(mockOperation, 'test');

  expect(result).toEqual({ success: true });
  expect(attemptCount).toBe(2); // Initial + retry
});
```

### Testing Idempotency

```typescript
test('setup runs only once', async () => {
  const setupSpy = jest.spyOn(hubspotSetup, 'ensureHubSpotSetup');

  await ensureHubSpotSetup();
  await ensureHubSpotSetup();
  await ensureHubSpotSetup();

  expect(setupSpy).toHaveBeenCalledTimes(1);
});
```

### Testing Concurrent Calls

```typescript
test('deduplicates concurrent setup', async () => {
  const promises = Array(10).fill(null).map(() => ensureHubSpotSetup());
  await Promise.all(promises);

  expect(isSetupComplete()).toBe(true);
  // Properties created only once, not 10 times
});
```

---

## Debugging Tests

### Enable Verbose Logging

```bash
DEBUG=* npm test
```

### Run Single Test

```bash
npm test -- -t "retries after property error"
```

### Run with Node Debugger

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Then open `chrome://inspect` in Chrome.

### View Coverage Report

```bash
npm test -- --coverage
open coverage/lcov-report/index.html
```

---

## Troubleshooting

### Tests Failing: "Property already exists"

**Cause:** Previous test didn't clean up HubSpot properties.

**Solution:**
```bash
# Delete all test properties in HubSpot UI
# Settings → Properties → Deal Properties → "SOW Approval" → Delete Group

# Or run cleanup script
npm run cleanup:test-properties
```

### Tests Timing Out

**Cause:** HubSpot API slow or rate limiting.

**Solution:**
```javascript
// Increase timeout in test
test('my test', async () => {
  // test code...
}, 30000); // 30 second timeout

// Or globally in jest.config.js
testTimeout: 30000
```

### MSW Not Intercepting Requests

**Cause:** MSW server not started or handlers not configured.

**Solution:**
```typescript
// Ensure setup.ts is in setupFilesAfterEnv in jest.config.js
setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

// Check server is listening
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
```

### Integration Tests Failing

**Cause:** Missing environment variables.

**Solution:**
```bash
# Check variables are set
echo $HUBSPOT_ACCESS_TOKEN
echo $NEXT_PUBLIC_BASE_URL

# Set if missing
export HUBSPOT_ACCESS_TOKEN="pat-na1-test-YOUR-TOKEN"
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm test -- tests/unit

      - name: Run integration tests
        env:
          HUBSPOT_ACCESS_TOKEN: ${{ secrets.HUBSPOT_TEST_TOKEN }}
        run: npm test -- tests/integration

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Test Coverage Goals

| Component | Target Coverage | Current |
|-----------|----------------|---------|
| `lib/hubspot-setup.ts` | 90% | TBD |
| `lib/hubspot.ts` | 85% | TBD |
| `lib/hubspot-files.ts` | 80% | TBD |
| `app/api/health/route.ts` | 80% | TBD |
| **Overall** | 80% | TBD |

---

## Writing New Tests

### 1. Choose Test Type

- **Unit:** Testing a single function? → `tests/unit/`
- **Integration:** Testing API interaction? → `tests/integration/`
- **E2E:** Testing user journey? → `tests/e2e/`

### 2. Create Test File

```typescript
// tests/unit/my-feature.test.ts

import { myFunction } from '@/lib/my-module';

describe('My Feature', () => {
  test('does something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });
});
```

### 3. Run Your Test

```bash
npm test -- tests/unit/my-feature.test.ts
```

### 4. Check Coverage

```bash
npm test -- --coverage tests/unit/my-feature.test.ts
```

---

## Additional Resources

- **Full Test Plan:** `/docs/SELF_HEALING_TEST_PLAN.md`
- **Test Summary:** `/docs/SELF_HEALING_TEST_SUMMARY.md`
- **Jest Documentation:** https://jestjs.io/docs/getting-started
- **MSW Documentation:** https://mswjs.io/docs/getting-started
- **Testing Library:** https://testing-library.com/docs/react-testing-library/intro

---

## Questions?

See the comprehensive test plan in `/docs/SELF_HEALING_TEST_PLAN.md` for:
- Detailed test specifications
- Expected vs actual results
- Mock API response formats
- Debugging strategies
- Performance benchmarks
