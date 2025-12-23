# Self-Healing Test Plan - Executive Summary

**Quick Reference Guide for Test Execution**

---

## Test Plan Document

The comprehensive test plan is located at:
`/opt/Projects/Solar Inbound SOW Approval/docs/SELF_HEALING_TEST_PLAN.md`

---

## Quick Start - Running Tests

### 1. Setup Test Environment (5 minutes)

```bash
# Clone and install
git clone <repo>
cd solar-sow-approval
npm install

# Install test dependencies
npm install --save-dev jest @types/jest ts-jest
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev msw

# Configure HubSpot test account
export HUBSPOT_ACCESS_TOKEN="pat-na1-test-YOUR-TOKEN"
export NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

### 2. Run Tests

```bash
# All tests
npm test

# Unit tests only (fastest)
npm test -- tests/unit

# Integration tests (requires HubSpot connection)
npm test -- tests/integration

# E2E tests (requires running server)
npm run dev &
npm test -- tests/e2e
```

---

## Test Coverage Overview

### Unit Tests (35 tests)
**Focus:** Individual function behavior
**Duration:** ~30 seconds
**No external dependencies required**

| Function | Test Count | Key Scenarios |
|----------|-----------|---------------|
| `isPropertyError()` | 15 | Pattern matching accuracy |
| `withSelfHealing()` | 8 | Retry logic correctness |
| `ensureHubSpotSetup()` | 8 | Idempotency & concurrency |
| `resetSetupState()` | 4 | State management |

### Integration Tests (12 tests)
**Focus:** HubSpot API interactions
**Duration:** ~2-3 minutes
**Requires:** HubSpot test account

| Test Suite | Test Count | Key Scenarios |
|------------|-----------|---------------|
| First Deployment | 3 | Property creation on fresh install |
| Property Recovery | 4 | Self-healing after deletion |
| Concurrent Requests | 2 | Race condition prevention |
| Health Endpoint | 3 | Status reporting accuracy |

### E2E Tests (4 scenarios)
**Focus:** Complete user journeys
**Duration:** ~5-10 minutes
**Requires:** Running application + HubSpot

| Scenario | Purpose |
|----------|---------|
| Happy Path | Fresh deployment → SOW approval |
| Mid-Operation Recovery | Property deleted during active session |
| API Failure | Graceful degradation |
| Multiple Deletion | Bulk property loss recovery |

---

## Critical Test Cases (Must Pass)

### Priority 1: Core Functionality

1. **Fresh Deployment Auto-Setup**
   - Clean HubSpot account → Make API call → All 9 properties created
   - Expected: Health endpoint returns `healthy`, properties visible in HubSpot UI

2. **Property Error Detection**
   - Trigger API call with deleted property → Error detected → Property recreated → Retry succeeds
   - Expected: Operation completes, logs show self-healing messages

3. **Idempotent Setup**
   - Call `ensureHubSpotSetup()` 10 times concurrently → Properties created once
   - Expected: No duplicate properties, no 409 errors propagated to caller

### Priority 2: Edge Cases

4. **Concurrent Recovery**
   - Delete property → Fire 10 simultaneous API calls → All succeed
   - Expected: Property created once, all requests complete

5. **Multiple Property Deletion**
   - Delete all 9 properties → Trigger operation → All recreated
   - Expected: System fully recovers, no manual intervention

### Priority 3: Failure Handling

6. **Graceful Degradation**
   - Simulate HubSpot API down → Attempt operation → Clear error shown
   - Expected: No infinite retries, user sees error message

---

## Manual Verification Steps

### Quick Health Check (2 minutes)

```bash
# 1. Start application
npm run dev

# 2. Hit health endpoint
curl http://localhost:3000/api/health | jq

# 3. Verify response
# {
#   "status": "healthy",
#   "hubspot": {
#     "connected": true,
#     "setupComplete": true,
#     "propertiesCreated": [<list of 9 properties>]
#   }
# }

# 4. Check HubSpot UI
# Settings → Properties → Deal Properties → "SOW Approval" group
# Should see all 9 properties
```

### Property Deletion Test (5 minutes)

```bash
# 1. In HubSpot UI: Delete "SOW Status" property

# 2. In application console:
resetSetupState();

# 3. Trigger API operation (e.g., update deal status)

# 4. Watch server logs for:
# [HubSpot Self-Healing] Recreated 1 properties: sow_status
# [HubSpot Self-Healing] updateDeal succeeded on retry

# 5. Verify property back in HubSpot UI
```

---

## Test Data Setup

### Required HubSpot Test Deals

**Create in HubSpot sandbox:**

```javascript
// Test Deal 1: Happy path
{
  dealname: "Test Customer - Solar Installation",
  customer_email: "test@example.com",
  sales_rep_email: "rep@example.com",
  system_size: "10.5",
  sow_status: "needs_review",
  sow_token: "test-123-20241222",
  sow_pin: "1234"
}

// Test Deal 2: Already approved (for status tests)
{
  dealname: "Completed Deal",
  sow_status: "approved",
  sow_accepted_date: "2024-12-20T10:00:00Z",
  sow_token: "test-456-20241220",
  sow_pin: "5678"
}
```

---

## Mock API Responses

### Key Response Patterns to Mock

**Property Missing Error (triggers self-healing):**
```json
{
  "status": "error",
  "message": "Property sow_token does not exist",
  "category": "VALIDATION_ERROR"
}
```

**Property Already Exists (normal, skip):**
```json
{
  "status": "error",
  "message": "Property already exists",
  "category": "CONFLICT"
}
```

**Network Error (no retry):**
```json
{
  "status": "error",
  "message": "Request timeout"
}
```

See full mock specifications in test plan section 7.

---

## Success Metrics

### Unit Tests
- [ ] 100% of pattern matching tests pass
- [ ] Retry logic works in all scenarios
- [ ] No race conditions in concurrent tests
- [ ] Code coverage > 90%

### Integration Tests
- [ ] Properties created on first deployment
- [ ] Recovery works after single property deletion
- [ ] Recovery works after multiple property deletion
- [ ] Health endpoint accurate

### E2E Tests
- [ ] Happy path: User can approve SOW on fresh deployment
- [ ] Recovery: Deletion during session is transparent
- [ ] Failure: Clear error when HubSpot unavailable

### Manual Testing
- [ ] Properties visible in HubSpot UI
- [ ] Self-healing logs appear in console
- [ ] No duplicate properties created
- [ ] PDF upload works after recovery

---

## Common Issues & Troubleshooting

### Issue 1: Tests Failing - "Property already exists"
**Cause:** Previous test run didn't clean up
**Solution:**
```bash
# Run cleanup script
npm run cleanup:test-properties

# Or manually delete in HubSpot UI
# Settings → Properties → Deal Properties → "SOW Approval" → Delete Group
```

### Issue 2: Integration Tests Timing Out
**Cause:** HubSpot API rate limiting or network issues
**Solution:**
```bash
# Increase test timeout in jest.config.js
testTimeout: 30000  // 30 seconds

# Or run tests sequentially
npm test -- --runInBand
```

### Issue 3: E2E Tests Can't Find Elements
**Cause:** Test running before page fully loaded
**Solution:**
```typescript
// Add explicit waits
await page.waitForSelector('[data-testid="sow-content"]', { timeout: 10000 });
```

### Issue 4: Mock Service Worker Not Intercepting
**Cause:** MSW server not started before tests
**Solution:**
```typescript
// In test setup file
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## Test Execution Checklist

### Pre-Test Setup
- [ ] HubSpot test account configured
- [ ] Access token in environment variables
- [ ] Dependencies installed (`npm install`)
- [ ] Test framework configured (Jest)
- [ ] Mock Service Worker setup (for unit/integration tests)

### During Testing
- [ ] Server logs monitored for self-healing messages
- [ ] Network tab open (for integration/e2e tests)
- [ ] HubSpot UI available to verify property creation

### Post-Test Cleanup
- [ ] Test properties deleted from HubSpot
- [ ] Test deals archived or deleted
- [ ] Application state reset (`resetSetupState()`)
- [ ] Server restarted for fresh state

---

## File Locations

| Component | File Path |
|-----------|-----------|
| Setup Logic | `/lib/hubspot-setup.ts` |
| Client with Wrappers | `/lib/hubspot.ts` |
| Health Endpoint | `/app/api/health/route.ts` |
| Unit Tests | `/tests/unit/hubspot-setup.test.ts` |
| Integration Tests | `/tests/integration/*.test.ts` |
| E2E Tests | `/tests/e2e/*.test.ts` |
| Mock Handlers | `/tests/mocks/hubspot-api.ts` |
| Test Fixtures | `/tests/fixtures/hubspot-errors.ts` |
| Cleanup Scripts | `/scripts/cleanup-test-environment.ts` |

---

## Next Steps

1. **Review full test plan:** `docs/SELF_HEALING_TEST_PLAN.md`
2. **Setup test environment:** Follow section 2
3. **Write unit tests:** Start with `isPropertyError()` tests
4. **Setup MSW mocks:** Follow section 7
5. **Run tests:** Execute and verify all pass
6. **Manual verification:** Follow section 6 checklist
7. **Document results:** Note any failures or issues

---

## Questions or Issues?

Reference the full test plan for:
- Detailed test specifications
- Expected vs actual results
- Mock API response formats
- Debugging strategies
- Performance benchmarks

**Full Plan:** `/docs/SELF_HEALING_TEST_PLAN.md`
