# Self-Healing Feature - Comprehensive Test Plan

**Project:** Solar SOW Approval System
**Feature:** HubSpot Property Self-Healing
**Version:** 1.0
**Last Updated:** 2024-12-22
**Status:** Ready for Execution

---

## Table of Contents

1. [Overview](#1-overview)
2. [Test Environment Setup](#2-test-environment-setup)
3. [Unit Tests](#3-unit-tests)
4. [Integration Tests](#4-integration-tests)
5. [End-to-End Scenarios](#5-end-to-end-scenarios)
6. [Manual Testing Checklist](#6-manual-testing-checklist)
7. [Mock Requirements](#7-mock-requirements)
8. [Test Data Requirements](#8-test-data-requirements)
9. [Success Criteria](#9-success-criteria)

---

## 1. Overview

### 1.1 Feature Description

The self-healing system automatically creates missing HubSpot custom properties and recovers from property deletion errors during runtime. This ensures zero-configuration deployment and resilience against accidental property deletion in HubSpot.

### 1.2 Components Under Test

| Component | File | Responsibility |
|-----------|------|----------------|
| Property Setup | `lib/hubspot-setup.ts` | Creates properties, manages setup state |
| HubSpot Client | `lib/hubspot.ts` | API operations with self-healing wrappers |
| File Upload | `lib/hubspot-files.ts` | File operations (no self-healing currently) |
| Health Endpoint | `app/api/health/route.ts` | System status verification |

### 1.3 Critical Functions

- `ensureHubSpotSetup()` - Idempotent property creation
- `withSelfHealing()` - Retry wrapper for property errors
- `isPropertyError()` - Error pattern matching
- `resetSetupState()` - State reset for recovery

---

## 2. Test Environment Setup

### 2.1 HubSpot Sandbox Requirements

**Required:**
- HubSpot Developer Test Account
- Private App with permissions:
  - `crm.objects.deals.read`
  - `crm.objects.deals.write`
  - `crm.schemas.custom.read`
  - `crm.schemas.custom.write`

**Setup Steps:**
```bash
# 1. Create test HubSpot account
# 2. Generate private app access token
# 3. Configure environment variables

export HUBSPOT_ACCESS_TOKEN="pat-na1-test-xxxxxxxx"
export NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

### 2.2 Local Development Environment

```bash
# Install dependencies
npm install

# Install testing frameworks
npm install --save-dev jest @types/jest ts-jest
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev msw # Mock Service Worker for API mocking

# Run in development mode
npm run dev
```

### 2.3 Test Database State

**Initial State:** Clean HubSpot account with:
- Zero custom properties in `sow_approval` group
- No existing deals with `sow_token` property
- Fresh property schema

**How to Reset:**
```typescript
// Manual cleanup script (scripts/cleanup-hubspot-properties.ts)
// WARNING: Only run in test environments!

async function cleanupTestProperties() {
  const properties = [
    'sow_token', 'sow_pin', 'sow_status', 'sow_needs_review_date',
    'sow_accepted_date', 'sow_rejected_date', 'sow_rejected_reason',
    'accepted_sow', 'rejected_sow'
  ];

  for (const prop of properties) {
    await deleteProperty(prop); // DELETE /crm/v3/properties/deals/{propertyName}
  }

  await deletePropertyGroup('sow_approval'); // DELETE /crm/v3/properties/deals/groups/{groupName}
}
```

---

## 3. Unit Tests

### 3.1 Test: `isPropertyError()` Pattern Matching

**File:** `tests/unit/hubspot-setup.test.ts`

**Purpose:** Verify that error messages indicating missing properties are correctly identified.

#### 3.1.1 True Positives (Should Return `true`)

```typescript
describe('isPropertyError - True Positives', () => {
  test('HubSpot standard error format', () => {
    const error = new Error('Property sow_token does not exist');
    expect(isPropertyError(error)).toBe(true);
  });

  test('Property not found message', () => {
    const error = new Error('property not found: sow_status');
    expect(isPropertyError(error)).toBe(true);
  });

  test('Invalid property error', () => {
    const error = new Error('invalid property: sow_pin');
    expect(isPropertyError(error)).toBe(true);
  });

  test('Unknown property error', () => {
    const error = new Error('unknown property requested');
    expect(isPropertyError(error)).toBe(true);
  });

  test('HubSpot API error code PROPERTY_DOESNT_EXIST', () => {
    const error = new Error('PROPERTY_DOESNT_EXIST: sow_token');
    expect(isPropertyError(error)).toBe(true);
  });

  test('HubSpot error object format with propertyName field', () => {
    const error = new Error(JSON.stringify({
      status: 'error',
      message: 'Invalid property',
      propertyName: 'sow_token'
    }));
    expect(isPropertyError(error)).toBe(true);
  });

  test('Case-insensitive matching', () => {
    const error = new Error('PROPERTY NOT FOUND');
    expect(isPropertyError(error)).toBe(true);
  });

  test('String error instead of Error object', () => {
    const error = 'property does not exist';
    expect(isPropertyError(error)).toBe(true);
  });
});
```

#### 3.1.2 True Negatives (Should Return `false`)

```typescript
describe('isPropertyError - True Negatives', () => {
  test('Network timeout error', () => {
    const error = new Error('Request timeout');
    expect(isPropertyError(error)).toBe(false);
  });

  test('Authentication error', () => {
    const error = new Error('Invalid access token');
    expect(isPropertyError(error)).toBe(false);
  });

  test('Rate limit error', () => {
    const error = new Error('Rate limit exceeded');
    expect(isPropertyError(error)).toBe(false);
  });

  test('Validation error on property value', () => {
    const error = new Error('Property value must be a string');
    expect(isPropertyError(error)).toBe(false);
  });

  test('Generic server error', () => {
    const error = new Error('Internal server error');
    expect(isPropertyError(error)).toBe(false);
  });

  test('Deal not found error', () => {
    const error = new Error('Deal does not exist');
    expect(isPropertyError(error)).toBe(false);
  });

  test('Empty error message', () => {
    const error = new Error('');
    expect(isPropertyError(error)).toBe(false);
  });
});
```

**Expected Results:**
- All true positive tests pass (pattern detected)
- All true negative tests pass (pattern not detected)
- No false positives or false negatives

---

### 3.2 Test: `withSelfHealing()` Retry Logic

**File:** `tests/unit/hubspot-setup.test.ts`

**Purpose:** Verify retry mechanism works correctly for property errors.

#### 3.2.1 Successful Retry After Property Creation

```typescript
describe('withSelfHealing - Retry Logic', () => {
  test('retries once after property error and succeeds', async () => {
    let attemptCount = 0;
    const mockOperation = jest.fn(async () => {
      attemptCount++;
      if (attemptCount === 1) {
        throw new Error('Property sow_token does not exist');
      }
      return { success: true };
    });

    // Mock ensureHubSpotSetup to succeed
    jest.spyOn(hubspotSetup, 'ensureHubSpotSetup').mockResolvedValue();
    jest.spyOn(hubspotSetup, 'getSetupResult').mockReturnValue({
      success: true,
      groupCreated: false,
      propertiesCreated: ['sow_token'],
      propertiesExisted: [],
      errors: [],
      timestamp: new Date().toISOString()
    });

    const result = await withSelfHealing(mockOperation, 'test operation');

    expect(result).toEqual({ success: true });
    expect(attemptCount).toBe(2);
    expect(mockOperation).toHaveBeenCalledTimes(2);
  });
});
```

#### 3.2.2 Fails After Retry if Problem Persists

```typescript
describe('withSelfHealing - Retry Logic', () => {
  test('throws error after retry if property still missing', async () => {
    const mockOperation = jest.fn(async () => {
      throw new Error('Property sow_status does not exist');
    });

    jest.spyOn(hubspotSetup, 'ensureHubSpotSetup').mockResolvedValue();

    await expect(
      withSelfHealing(mockOperation, 'test operation')
    ).rejects.toThrow('Property sow_status does not exist');

    expect(mockOperation).toHaveBeenCalledTimes(2); // Initial + 1 retry
  });
});
```

#### 3.2.3 No Retry for Non-Property Errors

```typescript
describe('withSelfHealing - Retry Logic', () => {
  test('does not retry for non-property errors', async () => {
    const mockOperation = jest.fn(async () => {
      throw new Error('Network timeout');
    });

    await expect(
      withSelfHealing(mockOperation, 'test operation')
    ).rejects.toThrow('Network timeout');

    expect(mockOperation).toHaveBeenCalledTimes(1); // No retry
  });
});
```

#### 3.2.4 Calls Setup Before First Attempt

```typescript
describe('withSelfHealing - Retry Logic', () => {
  test('calls ensureHubSpotSetup before first attempt', async () => {
    const mockOperation = jest.fn(async () => ({ success: true }));
    const setupSpy = jest.spyOn(hubspotSetup, 'ensureHubSpotSetup')
      .mockResolvedValue();

    await withSelfHealing(mockOperation, 'test operation');

    expect(setupSpy).toHaveBeenCalledTimes(1);
    expect(setupSpy).toHaveBeenCalledBefore(mockOperation);
  });
});
```

**Expected Results:**
- Retry occurs exactly once for property errors
- No retry for non-property errors
- Setup called before operation
- Proper error propagation on persistent failures

---

### 3.3 Test: `ensureHubSpotSetup()` Idempotency

**File:** `tests/unit/hubspot-setup.test.ts`

**Purpose:** Verify setup only runs once per instance and handles concurrent calls.

#### 3.3.1 Single Execution on Multiple Calls

```typescript
describe('ensureHubSpotSetup - Idempotency', () => {
  beforeEach(() => {
    resetSetupState(); // Reset before each test
  });

  test('runs setup only once on sequential calls', async () => {
    const runSetupSpy = jest.spyOn(hubspotSetup, 'runSetup');

    await ensureHubSpotSetup();
    await ensureHubSpotSetup();
    await ensureHubSpotSetup();

    expect(runSetupSpy).toHaveBeenCalledTimes(1);
    expect(isSetupComplete()).toBe(true);
  });
});
```

#### 3.3.2 Concurrent Call Deduplication

```typescript
describe('ensureHubSpotSetup - Idempotency', () => {
  test('deduplicates concurrent calls', async () => {
    resetSetupState();
    const runSetupSpy = jest.spyOn(hubspotSetup, 'runSetup');

    // Fire 10 concurrent setup calls
    const promises = Array(10).fill(null).map(() => ensureHubSpotSetup());
    await Promise.all(promises);

    expect(runSetupSpy).toHaveBeenCalledTimes(1);
  });
});
```

#### 3.3.3 Returns Immediately if Already Complete

```typescript
describe('ensureHubSpotSetup - Idempotency', () => {
  test('returns immediately if setup already completed', async () => {
    resetSetupState();

    await ensureHubSpotSetup(); // First call

    const startTime = Date.now();
    await ensureHubSpotSetup(); // Second call
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(10); // Should be near-instant
  });
});
```

#### 3.3.4 Creates Properties Only if Missing

```typescript
describe('ensureHubSpotSetup - Idempotency', () => {
  test('skips existing properties (409 Conflict)', async () => {
    // Mock HubSpot API to return 409 for all properties
    const mockRequest = jest.fn()
      .mockResolvedValue({ ok: false, status: 409 });

    jest.spyOn(hubspotSetup, 'hubspotRequest').mockImplementation(mockRequest);

    await ensureHubSpotSetup();
    const result = getSetupResult();

    expect(result.propertiesCreated).toHaveLength(0);
    expect(result.propertiesExisted).toHaveLength(9); // All 9 properties existed
    expect(result.success).toBe(true);
  });
});
```

**Expected Results:**
- Setup runs exactly once per instance
- Concurrent calls wait for single setup
- 409 Conflict responses are treated as success
- Cached result used on subsequent calls

---

### 3.4 Test: `resetSetupState()` Behavior

**File:** `tests/unit/hubspot-setup.test.ts`

**Purpose:** Verify state reset allows re-running setup.

#### 3.4.1 Allows Setup to Run Again After Reset

```typescript
describe('resetSetupState - Behavior', () => {
  test('allows setup to run again after reset', async () => {
    const runSetupSpy = jest.spyOn(hubspotSetup, 'runSetup');

    await ensureHubSpotSetup();
    expect(isSetupComplete()).toBe(true);

    resetSetupState();
    expect(isSetupComplete()).toBe(false);

    await ensureHubSpotSetup();

    expect(runSetupSpy).toHaveBeenCalledTimes(2);
  });
});
```

#### 3.4.2 Clears Setup Result

```typescript
describe('resetSetupState - Behavior', () => {
  test('clears setup result', async () => {
    await ensureHubSpotSetup();
    expect(getSetupResult()).not.toBeNull();

    resetSetupState();
    expect(getSetupResult()).toBeNull();
  });
});
```

#### 3.4.3 Clears In-Progress Flag

```typescript
describe('resetSetupState - Behavior', () => {
  test('clears in-progress flag', async () => {
    resetSetupState();

    // Start setup but don't await
    const setupPromise = ensureHubSpotSetup();

    // Reset should clear the in-progress state
    resetSetupState();

    // New setup should start fresh
    const runSetupSpy = jest.spyOn(hubspotSetup, 'runSetup');
    await ensureHubSpotSetup();

    expect(runSetupSpy).toHaveBeenCalled();
  });
});
```

**Expected Results:**
- State flags cleared correctly
- Setup can re-run after reset
- Previous result discarded

---

## 4. Integration Tests

### 4.1 Test: Property Creation on First API Call

**File:** `tests/integration/first-deployment.test.ts`

**Purpose:** Simulate fresh deployment to clean HubSpot account.

#### 4.1.1 Full Setup Flow

```typescript
describe('First Deployment Integration', () => {
  beforeAll(async () => {
    // Clean all properties from HubSpot test account
    await cleanupTestProperties();
  });

  test('creates all properties on first API call', async () => {
    // Make first API call
    const response = await fetch('http://localhost:3000/api/health');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.hubspot.setupComplete).toBe(true);
    expect(data.hubspot.groupCreated).toBe(true);
    expect(data.hubspot.propertiesCreated).toHaveLength(9);
    expect(data.hubspot.errors).toHaveLength(0);
  });

  test('properties exist in HubSpot after setup', async () => {
    const requiredProperties = [
      'sow_token', 'sow_pin', 'sow_status', 'sow_needs_review_date',
      'sow_accepted_date', 'sow_rejected_date', 'sow_rejected_reason',
      'accepted_sow', 'rejected_sow'
    ];

    for (const propName of requiredProperties) {
      const prop = await getHubSpotProperty(propName);
      expect(prop).toBeDefined();
      expect(prop.name).toBe(propName);
      expect(prop.groupName).toBe('sow_approval');
    }
  });
});
```

#### 4.1.2 Verify Property Definitions

```typescript
describe('Property Definition Verification', () => {
  test('sow_token has unique constraint', async () => {
    const prop = await getHubSpotProperty('sow_token');
    expect(prop.hasUniqueValue).toBe(true);
  });

  test('sow_status has correct enum options', async () => {
    const prop = await getHubSpotProperty('sow_status');
    expect(prop.type).toBe('enumeration');
    expect(prop.options).toEqual([
      { label: 'Not Ready', value: 'not_ready', displayOrder: 0 },
      { label: 'Needs Review', value: 'needs_review', displayOrder: 1 },
      { label: 'Approved', value: 'approved', displayOrder: 2 },
      { label: 'Rejected', value: 'rejected', displayOrder: 3 }
    ]);
  });

  test('sow_rejected_reason is textarea type', async () => {
    const prop = await getHubSpotProperty('sow_rejected_reason');
    expect(prop.fieldType).toBe('textarea');
  });

  test('file properties are correct type', async () => {
    const acceptedSow = await getHubSpotProperty('accepted_sow');
    const rejectedSow = await getHubSpotProperty('rejected_sow');

    expect(acceptedSow.fieldType).toBe('file');
    expect(rejectedSow.fieldType).toBe('file');
  });
});
```

**Expected Results:**
- All 9 properties created successfully
- Property group created
- Constraints and options configured correctly
- Health endpoint reports success

---

### 4.2 Test: Property Recreation After Deletion

**File:** `tests/integration/property-recovery.test.ts`

**Purpose:** Verify self-healing when properties are deleted during operation.

#### 4.2.1 Single Property Deletion Recovery

```typescript
describe('Property Deletion Recovery', () => {
  test('recovers when sow_status is deleted', async () => {
    // Initial setup
    await ensureHubSpotSetup();

    // Delete property externally
    await deleteHubSpotProperty('sow_status');

    // Reset app state to trigger re-check
    resetSetupState();

    // Attempt update that uses sow_status
    const client = new HubSpotClient();
    const result = await client.updateDeal(testDealId, {
      sow_status: 'approved'
    });

    // Should succeed after auto-recreation
    expect(result).toBeDefined();

    // Verify property was recreated
    const prop = await getHubSpotProperty('sow_status');
    expect(prop).toBeDefined();
  });
});
```

#### 4.2.2 Multiple Properties Deleted

```typescript
describe('Property Deletion Recovery', () => {
  test('recovers when multiple properties deleted', async () => {
    await ensureHubSpotSetup();

    // Delete multiple properties
    await deleteHubSpotProperty('sow_token');
    await deleteHubSpotProperty('sow_pin');
    await deleteHubSpotProperty('sow_status');

    resetSetupState();

    // Search operation uses all three properties
    const client = new HubSpotClient();
    const deal = await client.findDealByToken('test-token-123');

    // Should succeed after recreation
    // Verify all properties recreated
    const props = await Promise.all([
      getHubSpotProperty('sow_token'),
      getHubSpotProperty('sow_pin'),
      getHubSpotProperty('sow_status')
    ]);

    props.forEach(prop => expect(prop).toBeDefined());
  });
});
```

#### 4.2.3 Property Group Deletion Recovery

```typescript
describe('Property Deletion Recovery', () => {
  test('recreates property group if deleted', async () => {
    await ensureHubSpotSetup();

    // Delete entire property group
    await deleteHubSpotPropertyGroup('sow_approval');

    resetSetupState();
    await ensureHubSpotSetup();

    // Verify group recreated
    const group = await getHubSpotPropertyGroup('sow_approval');
    expect(group).toBeDefined();
    expect(group.label).toBe('SOW Approval');
  });
});
```

**Expected Results:**
- Deleted properties are automatically recreated
- Operations succeed after recreation
- No manual intervention required
- Proper error logging

---

### 4.3 Test: Concurrent Request Handling

**File:** `tests/integration/concurrent-operations.test.ts`

**Purpose:** Verify system handles multiple simultaneous requests correctly.

#### 4.3.1 Concurrent Requests During Initial Setup

```typescript
describe('Concurrent Request Handling', () => {
  test('handles concurrent requests during initial setup', async () => {
    await cleanupTestProperties();
    resetSetupState();

    // Fire 20 concurrent API requests
    const requests = Array(20).fill(null).map((_, i) =>
      fetch(`http://localhost:3000/api/health`)
    );

    const responses = await Promise.all(requests);

    // All should succeed
    responses.forEach(res => expect(res.status).toBe(200));

    // Properties created only once
    const setupResult = getSetupResult();
    expect(setupResult.propertiesCreated).toHaveLength(9);
  });
});
```

#### 4.3.2 Concurrent Requests During Recovery

```typescript
describe('Concurrent Request Handling', () => {
  test('handles concurrent requests during property recovery', async () => {
    await ensureHubSpotSetup();

    // Delete property
    await deleteHubSpotProperty('sow_status');
    resetSetupState();

    // Fire concurrent update requests
    const client = new HubSpotClient();
    const updates = Array(10).fill(null).map(() =>
      client.updateDeal(testDealId, { sow_status: 'approved' })
    );

    const results = await Promise.all(updates);

    // All should succeed
    results.forEach(result => expect(result).toBeDefined());
  });
});
```

**Expected Results:**
- No race conditions
- Property created only once even with concurrent requests
- All requests succeed
- No duplicate property creation errors

---

### 4.4 Test: Health Endpoint Accuracy

**File:** `tests/integration/health-endpoint.test.ts`

**Purpose:** Verify health endpoint reports accurate system state.

#### 4.4.1 Healthy State Reporting

```typescript
describe('Health Endpoint Accuracy', () => {
  test('reports healthy when all properties exist', async () => {
    await ensureHubSpotSetup();

    const response = await fetch('http://localhost:3000/api/health');
    const data = await response.json();

    expect(data.status).toBe('healthy');
    expect(data.hubspot.connected).toBe(true);
    expect(data.hubspot.setupComplete).toBe(true);
    expect(data.hubspot.errors).toHaveLength(0);
    expect(data.environment.hasAccessToken).toBe(true);
  });
});
```

#### 4.4.2 Degraded State Detection

```typescript
describe('Health Endpoint Accuracy', () => {
  test('reports degraded when access token missing', async () => {
    const originalToken = process.env.HUBSPOT_ACCESS_TOKEN;
    delete process.env.HUBSPOT_ACCESS_TOKEN;

    const response = await fetch('http://localhost:3000/api/health');
    const data = await response.json();

    expect(data.status).toBe('degraded');
    expect(data.environment.hasAccessToken).toBe(false);

    // Restore token
    process.env.HUBSPOT_ACCESS_TOKEN = originalToken;
  });
});
```

#### 4.4.3 Error Reporting

```typescript
describe('Health Endpoint Accuracy', () => {
  test('reports errors when property creation fails', async () => {
    // Mock property creation to fail
    jest.spyOn(hubspotSetup, 'ensureProperty')
      .mockResolvedValue({ created: false, error: 'Permission denied' });

    resetSetupState();
    const response = await fetch('http://localhost:3000/api/health');
    const data = await response.json();

    expect(data.status).toBe('degraded');
    expect(data.hubspot.errors.length).toBeGreaterThan(0);
  });
});
```

**Expected Results:**
- Accurate status reporting
- Environment variables detected correctly
- Error details provided when applicable
- Timestamp included in response

---

## 5. End-to-End Scenarios

### 5.1 Scenario: Happy Path - Fresh Deployment, First SOW Approval

**File:** `tests/e2e/happy-path.test.ts`

**Purpose:** Full user journey on fresh deployment.

#### Steps:

```typescript
describe('E2E: Happy Path - Fresh Deployment', () => {
  test('complete SOW approval flow on fresh deployment', async () => {
    // STEP 1: Clean environment
    await cleanupTestProperties();
    resetSetupState();

    // STEP 2: Create test deal in HubSpot (manually or via API)
    const deal = await createTestDeal({
      dealname: 'John Doe Solar Installation',
      system_size: '10.5',
      sales_rep_email: 'rep@test.com'
    });

    // STEP 3: Trigger workflow (set sow_status = needs_review)
    await updateDeal(deal.id, { sow_status: 'needs_review' });

    // STEP 4: Workflow generates token and PIN
    // (This would normally happen in HubSpot workflow)
    const token = `${deal.id}-20241222`;
    const pin = '1234';
    await updateDeal(deal.id, { sow_token: token, sow_pin: pin });

    // STEP 5: User visits SOW page
    const page = await browser.newPage();
    await page.goto(`http://localhost:3000/sow/${token}`);

    // STEP 6: Properties auto-created on first API call
    await page.waitForSelector('[data-testid="pin-entry"]');

    // Verify health
    const healthResponse = await fetch('http://localhost:3000/api/health');
    const healthData = await healthResponse.json();
    expect(healthData.hubspot.propertiesCreated).toHaveLength(9);

    // STEP 7: Enter PIN
    await page.type('[data-testid="pin-input"]', pin);
    await page.click('[data-testid="verify-pin-button"]');

    // STEP 8: SOW displays
    await page.waitForSelector('[data-testid="sow-content"]');

    // STEP 9: Click Approve
    await page.click('[data-testid="approve-button"]');

    // STEP 10: Confirm in modal
    await page.type('[data-testid="approver-email"]', 'rep@test.com');
    await page.click('[data-testid="confirm-approve"]');

    // STEP 11: Verify success
    await page.waitForSelector('[data-testid="approval-success"]');

    // STEP 12: Verify HubSpot updated
    const updatedDeal = await getDeal(deal.id);
    expect(updatedDeal.properties.sow_status).toBe('approved');
    expect(updatedDeal.properties.sow_accepted_date).toBeDefined();

    // STEP 13: Verify PDF uploaded
    const fileId = updatedDeal.properties.accepted_sow;
    expect(fileId).toBeDefined();

    const file = await getHubSpotFile(fileId);
    expect(file.name).toContain('SOW-Approved');
    expect(file.type).toBe('application/pdf');

    // STEP 14: Verify note created
    const notes = await getDealNotes(deal.id);
    const approvalNote = notes.find(n => n.body.includes('SOW APPROVED'));
    expect(approvalNote).toBeDefined();
    expect(approvalNote.attachments).toContain(fileId);
  });
});
```

**Expected Results:**
- All 9 properties created automatically
- PIN validation succeeds
- SOW displays correctly
- Approval processes successfully
- PDF generated and uploaded
- Note created with attachment
- Deal status updated to 'approved'

---

### 5.2 Scenario: Recovery - Property Deleted Mid-Operation

**File:** `tests/e2e/mid-operation-recovery.test.ts`

**Purpose:** System recovers from property deletion during active use.

#### Steps:

```typescript
describe('E2E: Mid-Operation Property Deletion', () => {
  test('recovers when property deleted during user session', async () => {
    // STEP 1: Complete initial setup
    await ensureHubSpotSetup();
    const deal = await createTestDeal({ sow_status: 'needs_review' });
    const token = `${deal.id}-20241222`;
    const pin = '1234';
    await updateDeal(deal.id, { sow_token: token, sow_pin: pin });

    // STEP 2: User opens SOW page
    const page = await browser.newPage();
    await page.goto(`http://localhost:3000/sow/${token}`);
    await page.type('[data-testid="pin-input"]', pin);
    await page.click('[data-testid="verify-pin-button"]');
    await page.waitForSelector('[data-testid="sow-content"]');

    // STEP 3: Meanwhile, admin accidentally deletes sow_status property
    await deleteHubSpotProperty('sow_status');
    resetSetupState();

    // STEP 4: User clicks Approve (triggers API call with sow_status)
    await page.click('[data-testid="approve-button"]');
    await page.type('[data-testid="approver-email"]', 'rep@test.com');
    await page.click('[data-testid="confirm-approve"]');

    // STEP 5: First API call fails due to missing property
    // Self-healing kicks in: property recreated, operation retried

    // STEP 6: Success message shown (retry succeeded)
    await page.waitForSelector('[data-testid="approval-success"]', {
      timeout: 10000
    });

    // STEP 7: Verify property was recreated
    const prop = await getHubSpotProperty('sow_status');
    expect(prop).toBeDefined();

    // STEP 8: Verify deal updated successfully
    const updatedDeal = await getDeal(deal.id);
    expect(updatedDeal.properties.sow_status).toBe('approved');

    // STEP 9: Check logs for self-healing messages
    const logs = await getServerLogs();
    expect(logs).toContain('[HubSpot Self-Healing] Recreated 1 properties: sow_status');
    expect(logs).toContain('[HubSpot Self-Healing] updateDeal succeeded on retry');
  });
});
```

**Expected Results:**
- First API call fails with property error
- Self-healing detects pattern
- Property recreated automatically
- Retry succeeds
- User sees success (transparent recovery)
- Proper logging of recovery

---

### 5.3 Scenario: Failure - HubSpot API Down During Recovery

**File:** `tests/e2e/api-failure.test.ts`

**Purpose:** Verify graceful failure when HubSpot is unavailable.

#### Steps:

```typescript
describe('E2E: HubSpot API Failure', () => {
  test('fails gracefully when HubSpot unavailable during recovery', async () => {
    // STEP 1: Initial setup succeeds
    await ensureHubSpotSetup();
    const deal = await createTestDeal({ sow_status: 'needs_review' });

    // STEP 2: Simulate HubSpot API going down
    // (Use MSW to intercept and fail all HubSpot requests)
    server.use(
      rest.all('https://api.hubapi.com/*', (req, res, ctx) => {
        return res(ctx.status(503), ctx.json({ error: 'Service unavailable' }));
      })
    );

    // STEP 3: Delete property to trigger recovery
    resetSetupState();

    // STEP 4: Attempt operation
    const client = new HubSpotClient();

    // STEP 5: Should fail (cannot recover when API is down)
    await expect(
      client.updateDeal(deal.id, { sow_status: 'approved' })
    ).rejects.toThrow();

    // STEP 6: Verify user sees error message
    const page = await browser.newPage();
    await page.goto(`http://localhost:3000/sow/${deal.properties.sow_token}`);

    // Should show error state
    await page.waitForSelector('[data-testid="error-message"]');
    const errorText = await page.textContent('[data-testid="error-message"]');
    expect(errorText).toContain('Unable to connect to HubSpot');

    // STEP 7: Restore API
    server.resetHandlers();

    // STEP 8: Retry should succeed
    resetSetupState();
    const result = await client.updateDeal(deal.id, { sow_status: 'approved' });
    expect(result).toBeDefined();
  });
});
```

**Expected Results:**
- Recovery fails when HubSpot unavailable
- Clear error message shown to user
- No infinite retry loops
- System recovers when HubSpot comes back online

---

### 5.4 Scenario: Edge Case - Multiple Properties Deleted Simultaneously

**File:** `tests/e2e/multiple-deletion.test.ts`

**Purpose:** Verify recovery from bulk property deletion.

#### Steps:

```typescript
describe('E2E: Multiple Property Deletion', () => {
  test('recovers when multiple properties deleted at once', async () => {
    // STEP 1: Setup complete
    await ensureHubSpotSetup();

    // STEP 2: Admin accidentally deletes entire property group
    await deleteHubSpotPropertyGroup('sow_approval');
    // All 9 properties are now gone

    resetSetupState();

    // STEP 3: New deal created (workflow runs)
    const deal = await createTestDeal({
      dealname: 'Test Customer',
      sow_status: 'needs_review'
    });

    // STEP 4: Workflow tries to set sow_token and sow_pin
    // First attempt fails (properties don't exist)
    // Self-healing recreates all 9 properties
    // Retry succeeds

    const token = `${deal.id}-20241222`;
    const pin = '5678';

    const result = await updateDeal(deal.id, {
      sow_token: token,
      sow_pin: pin
    });

    expect(result).toBeDefined();

    // STEP 5: Verify all properties recreated
    const properties = await Promise.all([
      'sow_token', 'sow_pin', 'sow_status', 'sow_needs_review_date',
      'sow_accepted_date', 'sow_rejected_date', 'sow_rejected_reason',
      'accepted_sow', 'rejected_sow'
    ].map(name => getHubSpotProperty(name)));

    properties.forEach(prop => expect(prop).toBeDefined());

    // STEP 6: Complete SOW approval flow
    const page = await browser.newPage();
    await page.goto(`http://localhost:3000/sow/${token}`);
    await page.type('[data-testid="pin-input"]', pin);
    await page.click('[data-testid="verify-pin-button"]');
    await page.waitForSelector('[data-testid="sow-content"]');

    // Should work normally after recovery
    await page.click('[data-testid="approve-button"]');
    await page.type('[data-testid="approver-email"]', 'test@test.com');
    await page.click('[data-testid="confirm-approve"]');
    await page.waitForSelector('[data-testid="approval-success"]');
  });
});
```

**Expected Results:**
- All 9 properties recreated in single recovery
- Property group recreated
- Normal operation resumes
- No data loss

---

## 6. Manual Testing Checklist

### 6.1 HubSpot Sandbox Setup

**Prerequisites:**
- [ ] HubSpot test account created
- [ ] Private app with required permissions
- [ ] Access token configured in `.env`

### 6.2 Fresh Deployment Test

1. **Clean Environment**
   - [ ] Delete all `sow_*` properties from HubSpot
   - [ ] Delete `sow_approval` property group
   - [ ] Restart application server

2. **First API Call**
   - [ ] Navigate to: `http://localhost:3000/api/health`
   - [ ] Verify response status: `200`
   - [ ] Check `hubspot.propertiesCreated` array has 9 items
   - [ ] Check `hubspot.groupCreated` is `true`

3. **Verify in HubSpot UI**
   - [ ] Go to Settings > Properties > Deal Properties
   - [ ] Find "SOW Approval" group
   - [ ] Verify all 9 properties exist:
     - [ ] SOW Token (unique)
     - [ ] SOW PIN
     - [ ] SOW Status (enum with 4 options)
     - [ ] SOW Needs Review Date
     - [ ] SOW Accepted Date
     - [ ] SOW Rejected Date
     - [ ] SOW Rejected Reason (textarea)
     - [ ] Accepted SOW (file)
     - [ ] Rejected SOW (file)

### 6.3 Property Deletion Recovery Test

1. **Setup**
   - [ ] Run application, ensure setup complete
   - [ ] Create test deal with `sow_status = needs_review`

2. **Delete Property**
   - [ ] In HubSpot UI: Delete "SOW Status" property
   - [ ] In application: Run `resetSetupState()` in console

3. **Trigger Recovery**
   - [ ] Attempt to update deal status via API
   - [ ] Check server logs for self-healing messages:
     ```
     [HubSpot Self-Healing] updateDeal failed due to property issue
     [HubSpot Self-Healing] Recreated 1 properties: sow_status
     [HubSpot Self-Healing] Retrying updateDeal...
     [HubSpot Self-Healing] updateDeal succeeded on retry
     ```

4. **Verify Recovery**
   - [ ] Operation completed successfully
   - [ ] Property exists in HubSpot again
   - [ ] Property definition matches original

### 6.4 Concurrent Request Test

1. **Setup**
   - [ ] Clean environment (delete all properties)
   - [ ] Restart server

2. **Load Test**
   - [ ] Use tool like Apache Bench: `ab -n 50 -c 10 http://localhost:3000/api/health`
   - [ ] Verify all requests succeed
   - [ ] Check health endpoint: `propertiesCreated` should still be 9 (not 90)

3. **Verify**
   - [ ] No duplicate properties in HubSpot
   - [ ] No 409 errors in logs (some are expected, but should be handled)

### 6.5 End-to-End User Flow

1. **Create Test Deal**
   - [ ] In HubSpot: Create deal with all required fields populated
   - [ ] Set `sow_status = needs_review`
   - [ ] Set `sow_token = test-deal-123`
   - [ ] Set `sow_pin = 1234`

2. **User Journey**
   - [ ] Navigate to: `http://localhost:3000/sow/test-deal-123`
   - [ ] Enter PIN: `1234`
   - [ ] Click "Verify"
   - [ ] SOW details display correctly
   - [ ] Click "Approve"
   - [ ] Enter email: `test@example.com`
   - [ ] Click "Confirm Approval"

3. **Verify Results**
   - [ ] Success message shown
   - [ ] In HubSpot deal record:
     - [ ] `sow_status = approved`
     - [ ] `sow_accepted_date` is set
     - [ ] `accepted_sow` has file ID
   - [ ] In HubSpot deal timeline:
     - [ ] Note with "SOW APPROVED" exists
     - [ ] PDF attachment present on note

### 6.6 Logging Verification

**Enable debug logging:**
```bash
# Set in .env or export
DEBUG_HUBSPOT=true
```

**Check for these log patterns:**

On startup:
```
[HubSpot Setup] Starting property verification...
[HubSpot Setup] Created property: sow_token
[HubSpot Setup] Created 9 new properties
[HubSpot Setup] Verification complete
```

On recovery:
```
[HubSpot Self-Healing] updateDeal(123) failed due to property issue
[HubSpot Self-Healing] Error was: Property sow_status does not exist
[HubSpot Self-Healing] Recreated 1 properties: sow_status
[HubSpot Self-Healing] Retrying updateDeal(123)...
[HubSpot Self-Healing] updateDeal(123) succeeded on retry
```

---

## 7. Mock Requirements

### 7.1 HubSpot API Response Mocks

**For Unit Tests (MSW handlers):**

```typescript
// tests/mocks/hubspot-api.ts

import { rest } from 'msw';

export const hubspotHandlers = [
  // Property creation - success
  rest.post('https://api.hubapi.com/crm/v3/properties/deals', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        name: req.body.name,
        label: req.body.label,
        type: req.body.type,
        fieldType: req.body.fieldType,
        groupName: req.body.groupName,
        createdAt: new Date().toISOString()
      })
    );
  }),

  // Property creation - already exists (409)
  rest.post('https://api.hubapi.com/crm/v3/properties/deals', (req, res, ctx) => {
    if (req.body.name === 'sow_token') {
      return res(
        ctx.status(409),
        ctx.json({
          status: 'error',
          message: 'Property already exists',
          category: 'CONFLICT'
        })
      );
    }
  }),

  // Property group creation
  rest.post('https://api.hubapi.com/crm/v3/properties/deals/groups', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        name: req.body.name,
        label: req.body.label,
        displayOrder: req.body.displayOrder,
        createdAt: new Date().toISOString()
      })
    );
  }),

  // Deal search - property missing error
  rest.post('https://api.hubapi.com/crm/v3/objects/deals/search', (req, res, ctx) => {
    return res(
      ctx.status(400),
      ctx.json({
        status: 'error',
        message: 'Property sow_token does not exist',
        correlationId: 'test-correlation-id',
        category: 'VALIDATION_ERROR',
        propertyName: 'sow_token'
      })
    );
  }),

  // Deal update - property missing error
  rest.patch('https://api.hubapi.com/crm/v3/objects/deals/:dealId', (req, res, ctx) => {
    return res(
      ctx.status(400),
      ctx.json({
        status: 'error',
        message: 'unknown property: sow_status',
        category: 'VALIDATION_ERROR'
      })
    );
  }),

  // Deal update - success
  rest.patch('https://api.hubapi.com/crm/v3/objects/deals/:dealId', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: req.params.dealId,
        properties: req.body.properties,
        updatedAt: new Date().toISOString()
      })
    );
  }),
];
```

### 7.2 Simulating Property Deletion

**Mock utility for tests:**

```typescript
// tests/utils/hubspot-mock-state.ts

class HubSpotMockState {
  private properties = new Set<string>();
  private groups = new Set<string>();

  createProperty(name: string) {
    this.properties.add(name);
  }

  deleteProperty(name: string) {
    this.properties.delete(name);
  }

  propertyExists(name: string): boolean {
    return this.properties.has(name);
  }

  createGroup(name: string) {
    this.groups.add(name);
  }

  deleteGroup(name: string) {
    this.groups.delete(name);
  }

  reset() {
    this.properties.clear();
    this.groups.clear();
  }
}

export const mockState = new HubSpotMockState();

// Use in MSW handlers:
rest.post('https://api.hubapi.com/crm/v3/objects/deals/search', (req, res, ctx) => {
  const filters = req.body.filterGroups[0].filters;

  for (const filter of filters) {
    if (!mockState.propertyExists(filter.propertyName)) {
      return res(
        ctx.status(400),
        ctx.json({
          message: `Property ${filter.propertyName} does not exist`
        })
      );
    }
  }

  // Continue with normal response...
});
```

### 7.3 Error Response Patterns to Mock

**Collection of real HubSpot error formats:**

```typescript
// tests/fixtures/hubspot-errors.ts

export const hubspotErrors = {
  propertyNotFound: {
    status: 400,
    body: {
      status: 'error',
      message: 'Property sow_token does not exist',
      correlationId: 'abc-123',
      category: 'VALIDATION_ERROR'
    }
  },

  invalidProperty: {
    status: 400,
    body: {
      status: 'error',
      message: 'invalid property: sow_status',
      category: 'VALIDATION_ERROR'
    }
  },

  unknownProperty: {
    status: 400,
    body: {
      status: 'error',
      message: 'unknown property requested',
      propertyName: 'sow_pin'
    }
  },

  propertyDoesntExist: {
    status: 400,
    body: {
      status: 'error',
      message: 'PROPERTY_DOESNT_EXIST',
      errorType: 'PROPERTY_DOESNT_EXIST'
    }
  },

  // Non-property errors (should NOT trigger self-healing)
  rateLimitExceeded: {
    status: 429,
    body: {
      status: 'error',
      message: 'Rate limit exceeded',
      category: 'RATE_LIMIT'
    }
  },

  unauthorized: {
    status: 401,
    body: {
      status: 'error',
      message: 'Invalid access token',
      category: 'AUTHENTICATION'
    }
  },

  networkTimeout: {
    status: 0,
    error: new Error('Request timeout')
  }
};
```

---

## 8. Test Data Requirements

### 8.1 HubSpot Test Deals

**Create these test deals in HubSpot sandbox:**

```typescript
// Test Deal 1: Complete data for happy path
{
  dealname: "John Doe - 10.5kW Solar",
  customer_phone: "(555) 123-4567",
  customer_email: "john.doe@example.com",
  customer_address: "123 Main St, San Diego, CA 92101",
  sales_rep_name: "Mike Johnson",
  sales_rep_email: "mike@sunvena.com",
  setter: "Sarah Chen",
  lead_source: "Referral",
  system_size: "10.5",
  panel_type: "Trina Solar TSM-410W",
  panel_count: "26",
  inverter_type: "SolarEdge SE7600H",
  inverter_count: "1",
  lender: "Sunlight Financial",
  term_length: "25",
  finance_type: "Loan",
  interest_rate: "1.99",
  total_contract_amount: "35000",
  gross_ppw: "3.00",
  total_adders_ppw: "0.15",
  net_ppw: "3.15",
  total_commission: "9500",
  sow_status: "needs_review",
  sow_token: "test-deal-1-20241222",
  sow_pin: "1234"
}

// Test Deal 2: Minimal data (testing null handling)
{
  dealname: "Jane Smith - Basic System",
  customer_email: "jane@example.com",
  sales_rep_email: "rep@sunvena.com",
  system_size: "5.0",
  sow_status: "needs_review",
  sow_token: "test-deal-2-20241222",
  sow_pin: "5678"
}

// Test Deal 3: Already approved (for status check tests)
{
  dealname: "Bob Wilson - Completed",
  sow_status: "approved",
  sow_accepted_date: "2024-12-20T10:00:00Z",
  sow_token: "test-deal-3-20241220",
  sow_pin: "9012"
}
```

### 8.2 Environment Variables for Testing

```bash
# .env.test

# HubSpot sandbox credentials
HUBSPOT_ACCESS_TOKEN=pat-na1-test-12345678-1234-1234-1234-123456789012

# Test application URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Node environment
NODE_ENV=test

# Optional: Enable debug logging
DEBUG_HUBSPOT=true
DEBUG_PDF=false

# Test-specific timeouts
TEST_TIMEOUT=30000
HUBSPOT_REQUEST_TIMEOUT=10000
```

---

## 9. Success Criteria

### 9.1 Unit Tests

- [ ] All `isPropertyError()` tests pass (100% pattern detection accuracy)
- [ ] All `withSelfHealing()` tests pass (retry logic correct)
- [ ] All `ensureHubSpotSetup()` tests pass (idempotency verified)
- [ ] All `resetSetupState()` tests pass (state management correct)
- [ ] Code coverage > 90% for `lib/hubspot-setup.ts`

### 9.2 Integration Tests

- [ ] Fresh deployment creates all 9 properties
- [ ] Property definitions match specifications
- [ ] Property recreation works after deletion
- [ ] Multiple property deletion recovered
- [ ] Concurrent requests handled without race conditions
- [ ] Health endpoint reports accurate status

### 9.3 End-to-End Scenarios

- [ ] Happy path completes successfully
- [ ] Mid-operation recovery is transparent to user
- [ ] System fails gracefully when HubSpot unavailable
- [ ] Multiple simultaneous deletions recovered
- [ ] User sees success/error messages appropriately

### 9.4 Manual Testing

- [ ] All manual checklist items completed
- [ ] Properties visible in HubSpot UI
- [ ] Self-healing logs observed in console
- [ ] No duplicate properties created
- [ ] PDF upload works after property recreation

### 9.5 Performance

- [ ] Setup completes in < 5 seconds
- [ ] Recovery retry adds < 2 seconds to operation
- [ ] Health endpoint responds in < 1 second
- [ ] No memory leaks during repeated setup/reset cycles

### 9.6 Error Handling

- [ ] Non-property errors don't trigger retry
- [ ] Clear error messages logged
- [ ] No infinite retry loops
- [ ] Proper error propagation to API responses

---

## Appendix A: Test Execution Commands

```bash
# Run all tests
npm test

# Run unit tests only
npm test -- tests/unit

# Run integration tests only
npm test -- tests/integration

# Run e2e tests only
npm test -- tests/e2e

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- tests/unit/hubspot-setup.test.ts

# Run in watch mode
npm test -- --watch

# Run with debug logging
DEBUG=* npm test
```

## Appendix B: Cleanup Scripts

```typescript
// scripts/cleanup-test-environment.ts

import { HubSpotClient } from '@/lib/hubspot';

async function cleanup() {
  const client = new HubSpotClient();

  console.log('Deleting test properties...');
  const properties = [
    'sow_token', 'sow_pin', 'sow_status', 'sow_needs_review_date',
    'sow_accepted_date', 'sow_rejected_date', 'sow_rejected_reason',
    'accepted_sow', 'rejected_sow'
  ];

  for (const prop of properties) {
    try {
      await deleteProperty(prop);
      console.log(`  ✓ Deleted ${prop}`);
    } catch (error) {
      console.log(`  ⚠ ${prop} not found`);
    }
  }

  console.log('Deleting property group...');
  try {
    await deletePropertyGroup('sow_approval');
    console.log('  ✓ Deleted sow_approval group');
  } catch (error) {
    console.log('  ⚠ Group not found');
  }

  console.log('✅ Cleanup complete');
}

cleanup();
```

---

## Document History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2024-12-22 | Initial test plan creation | QA Team |

---

**End of Test Plan**
