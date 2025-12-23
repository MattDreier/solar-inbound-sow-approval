/**
 * Unit Tests for HubSpot Self-Healing Setup
 * ==========================================
 *
 * Tests the core self-healing functionality including:
 * - Error pattern detection (isPropertyError)
 * - Retry logic (withSelfHealing)
 * - Setup idempotency (ensureHubSpotSetup)
 * - State management (resetSetupState)
 *
 * Run with: npm test -- tests/unit/hubspot-setup.test.ts
 */

import {
  ensureHubSpotSetup,
  getSetupResult,
  isSetupComplete,
  resetSetupState,
  withSelfHealing,
} from '@/lib/hubspot-setup';

// Note: isPropertyError is not exported, so we'll test it indirectly through withSelfHealing
// If needed for direct testing, export it from hubspot-setup.ts

describe('HubSpot Self-Healing Setup - Unit Tests', () => {
  // Reset state before each test to ensure isolation
  beforeEach(() => {
    resetSetupState();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ============================================================================
  // isPropertyError() - Pattern Matching Tests
  // ============================================================================

  describe('isPropertyError - Pattern Detection (via withSelfHealing)', () => {
    describe('True Positives - Should trigger self-healing', () => {
      test('detects "property not found" error', async () => {
        let attemptCount = 0;
        const mockOperation = jest.fn(async () => {
          attemptCount++;
          if (attemptCount === 1) {
            throw new Error('property not found: sow_token');
          }
          return { success: true };
        });

        // Mock setup functions
        jest.spyOn(require('@/lib/hubspot-setup'), 'ensureHubSpotSetup')
          .mockResolvedValue(undefined);
        jest.spyOn(require('@/lib/hubspot-setup'), 'getSetupResult')
          .mockReturnValue({
            success: true,
            groupCreated: false,
            propertiesCreated: ['sow_token'],
            propertiesExisted: [],
            errors: [],
            timestamp: new Date().toISOString()
          });

        const result = await withSelfHealing(mockOperation, 'test');

        // Should have retried and succeeded
        expect(result).toEqual({ success: true });
        expect(attemptCount).toBe(2);
      });

      test('detects "does not exist" error', async () => {
        let attemptCount = 0;
        const mockOperation = jest.fn(async () => {
          attemptCount++;
          if (attemptCount === 1) {
            throw new Error('Property sow_status does not exist');
          }
          return { success: true };
        });

        jest.spyOn(require('@/lib/hubspot-setup'), 'ensureHubSpotSetup')
          .mockResolvedValue(undefined);
        jest.spyOn(require('@/lib/hubspot-setup'), 'getSetupResult')
          .mockReturnValue({
            success: true,
            groupCreated: false,
            propertiesCreated: ['sow_status'],
            propertiesExisted: [],
            errors: [],
            timestamp: new Date().toISOString()
          });

        await withSelfHealing(mockOperation, 'test');
        expect(attemptCount).toBe(2);
      });

      test('detects "invalid property" error', async () => {
        let attemptCount = 0;
        const mockOperation = jest.fn(async () => {
          attemptCount++;
          if (attemptCount === 1) {
            throw new Error('invalid property: sow_pin');
          }
          return { success: true };
        });

        jest.spyOn(require('@/lib/hubspot-setup'), 'ensureHubSpotSetup')
          .mockResolvedValue(undefined);
        jest.spyOn(require('@/lib/hubspot-setup'), 'getSetupResult')
          .mockReturnValue({
            success: true,
            groupCreated: false,
            propertiesCreated: ['sow_pin'],
            propertiesExisted: [],
            errors: [],
            timestamp: new Date().toISOString()
          });

        await withSelfHealing(mockOperation, 'test');
        expect(attemptCount).toBe(2);
      });

      test('detects "unknown property" error', async () => {
        let attemptCount = 0;
        const mockOperation = jest.fn(async () => {
          attemptCount++;
          if (attemptCount === 1) {
            throw new Error('unknown property requested');
          }
          return { success: true };
        });

        jest.spyOn(require('@/lib/hubspot-setup'), 'ensureHubSpotSetup')
          .mockResolvedValue(undefined);
        jest.spyOn(require('@/lib/hubspot-setup'), 'getSetupResult')
          .mockReturnValue({
            success: true,
            groupCreated: false,
            propertiesCreated: ['sow_rejected_reason'],
            propertiesExisted: [],
            errors: [],
            timestamp: new Date().toISOString()
          });

        await withSelfHealing(mockOperation, 'test');
        expect(attemptCount).toBe(2);
      });

      test('detects "PROPERTY_DOESNT_EXIST" error code', async () => {
        let attemptCount = 0;
        const mockOperation = jest.fn(async () => {
          attemptCount++;
          if (attemptCount === 1) {
            throw new Error('PROPERTY_DOESNT_EXIST: sow_accepted_date');
          }
          return { success: true };
        });

        jest.spyOn(require('@/lib/hubspot-setup'), 'ensureHubSpotSetup')
          .mockResolvedValue(undefined);
        jest.spyOn(require('@/lib/hubspot-setup'), 'getSetupResult')
          .mockReturnValue({
            success: true,
            groupCreated: false,
            propertiesCreated: ['sow_accepted_date'],
            propertiesExisted: [],
            errors: [],
            timestamp: new Date().toISOString()
          });

        await withSelfHealing(mockOperation, 'test');
        expect(attemptCount).toBe(2);
      });

      test('detects error with "propertyName" field', async () => {
        let attemptCount = 0;
        const mockOperation = jest.fn(async () => {
          attemptCount++;
          if (attemptCount === 1) {
            const error = new Error('Validation error');
            (error as any).propertyName = 'sow_rejected_date';
            throw error;
          }
          return { success: true };
        });

        jest.spyOn(require('@/lib/hubspot-setup'), 'ensureHubSpotSetup')
          .mockResolvedValue(undefined);
        jest.spyOn(require('@/lib/hubspot-setup'), 'getSetupResult')
          .mockReturnValue({
            success: true,
            groupCreated: false,
            propertiesCreated: ['sow_rejected_date'],
            propertiesExisted: [],
            errors: [],
            timestamp: new Date().toISOString()
          });

        await withSelfHealing(mockOperation, 'test');
        expect(attemptCount).toBe(2);
      });

      test('is case-insensitive', async () => {
        let attemptCount = 0;
        const mockOperation = jest.fn(async () => {
          attemptCount++;
          if (attemptCount === 1) {
            throw new Error('PROPERTY NOT FOUND');
          }
          return { success: true };
        });

        jest.spyOn(require('@/lib/hubspot-setup'), 'ensureHubSpotSetup')
          .mockResolvedValue(undefined);
        jest.spyOn(require('@/lib/hubspot-setup'), 'getSetupResult')
          .mockReturnValue({
            success: true,
            groupCreated: false,
            propertiesCreated: [],
            propertiesExisted: [],
            errors: [],
            timestamp: new Date().toISOString()
          });

        await withSelfHealing(mockOperation, 'test');
        expect(attemptCount).toBe(2);
      });
    });

    describe('True Negatives - Should NOT trigger self-healing', () => {
      test('does not retry network timeout errors', async () => {
        const mockOperation = jest.fn(async () => {
          throw new Error('Request timeout');
        });

        jest.spyOn(require('@/lib/hubspot-setup'), 'ensureHubSpotSetup')
          .mockResolvedValue(undefined);

        await expect(withSelfHealing(mockOperation, 'test'))
          .rejects.toThrow('Request timeout');

        // Should only attempt once (no retry)
        expect(mockOperation).toHaveBeenCalledTimes(1);
      });

      test('does not retry authentication errors', async () => {
        const mockOperation = jest.fn(async () => {
          throw new Error('Invalid access token');
        });

        jest.spyOn(require('@/lib/hubspot-setup'), 'ensureHubSpotSetup')
          .mockResolvedValue(undefined);

        await expect(withSelfHealing(mockOperation, 'test'))
          .rejects.toThrow('Invalid access token');

        expect(mockOperation).toHaveBeenCalledTimes(1);
      });

      test('does not retry rate limit errors', async () => {
        const mockOperation = jest.fn(async () => {
          throw new Error('Rate limit exceeded');
        });

        jest.spyOn(require('@/lib/hubspot-setup'), 'ensureHubSpotSetup')
          .mockResolvedValue(undefined);

        await expect(withSelfHealing(mockOperation, 'test'))
          .rejects.toThrow('Rate limit exceeded');

        expect(mockOperation).toHaveBeenCalledTimes(1);
      });

      test('does not retry validation errors on property value', async () => {
        const mockOperation = jest.fn(async () => {
          throw new Error('Property value must be a string');
        });

        jest.spyOn(require('@/lib/hubspot-setup'), 'ensureHubSpotSetup')
          .mockResolvedValue(undefined);

        await expect(withSelfHealing(mockOperation, 'test'))
          .rejects.toThrow('Property value must be a string');

        expect(mockOperation).toHaveBeenCalledTimes(1);
      });

      test('does not retry deal not found errors', async () => {
        const mockOperation = jest.fn(async () => {
          throw new Error('Deal does not exist');
        });

        jest.spyOn(require('@/lib/hubspot-setup'), 'ensureHubSpotSetup')
          .mockResolvedValue(undefined);

        await expect(withSelfHealing(mockOperation, 'test'))
          .rejects.toThrow('Deal does not exist');

        expect(mockOperation).toHaveBeenCalledTimes(1);
      });
    });
  });

  // ============================================================================
  // withSelfHealing() - Retry Logic Tests
  // ============================================================================

  describe('withSelfHealing - Retry Logic', () => {
    test('calls ensureHubSpotSetup before first attempt', async () => {
      const mockOperation = jest.fn(async () => ({ success: true }));
      const setupSpy = jest.spyOn(require('@/lib/hubspot-setup'), 'ensureHubSpotSetup')
        .mockResolvedValue(undefined);

      await withSelfHealing(mockOperation, 'test operation');

      expect(setupSpy).toHaveBeenCalled();
      // ensureHubSpotSetup should be called before the operation
      const setupOrder = setupSpy.mock.invocationCallOrder[0];
      const opOrder = mockOperation.mock.invocationCallOrder[0];
      expect(setupOrder).toBeLessThan(opOrder);
    });

    test('retries exactly once after property error', async () => {
      let attemptCount = 0;
      const mockOperation = jest.fn(async () => {
        attemptCount++;
        if (attemptCount === 1) {
          throw new Error('Property sow_token does not exist');
        }
        return { success: true };
      });

      jest.spyOn(require('@/lib/hubspot-setup'), 'ensureHubSpotSetup')
        .mockResolvedValue(undefined);
      jest.spyOn(require('@/lib/hubspot-setup'), 'getSetupResult')
        .mockReturnValue({
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

    test('throws error if retry fails with same property error', async () => {
      const mockOperation = jest.fn(async () => {
        throw new Error('Property sow_status does not exist');
      });

      jest.spyOn(require('@/lib/hubspot-setup'), 'ensureHubSpotSetup')
        .mockResolvedValue(undefined);
      jest.spyOn(require('@/lib/hubspot-setup'), 'getSetupResult')
        .mockReturnValue({
          success: true,
          groupCreated: false,
          propertiesCreated: [],
          propertiesExisted: [],
          errors: [],
          timestamp: new Date().toISOString()
        });

      await expect(withSelfHealing(mockOperation, 'test operation'))
        .rejects.toThrow('Property sow_status does not exist');

      // Should attempt twice: initial + 1 retry
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    test('resets setup state before retry', async () => {
      let attemptCount = 0;
      const mockOperation = jest.fn(async () => {
        attemptCount++;
        if (attemptCount === 1) {
          throw new Error('Property sow_pin does not exist');
        }
        return { success: true };
      });

      const resetSpy = jest.spyOn(require('@/lib/hubspot-setup'), 'resetSetupState');
      jest.spyOn(require('@/lib/hubspot-setup'), 'ensureHubSpotSetup')
        .mockResolvedValue(undefined);
      jest.spyOn(require('@/lib/hubspot-setup'), 'getSetupResult')
        .mockReturnValue({
          success: true,
          groupCreated: false,
          propertiesCreated: ['sow_pin'],
          propertiesExisted: [],
          errors: [],
          timestamp: new Date().toISOString()
        });

      await withSelfHealing(mockOperation, 'test operation');

      // resetSetupState should have been called after error detected
      expect(resetSpy).toHaveBeenCalled();
    });

    test('calls ensureHubSpotSetup again after reset', async () => {
      let attemptCount = 0;
      const mockOperation = jest.fn(async () => {
        attemptCount++;
        if (attemptCount === 1) {
          throw new Error('Property sow_needs_review_date does not exist');
        }
        return { success: true };
      });

      const setupSpy = jest.spyOn(require('@/lib/hubspot-setup'), 'ensureHubSpotSetup')
        .mockResolvedValue(undefined);
      jest.spyOn(require('@/lib/hubspot-setup'), 'getSetupResult')
        .mockReturnValue({
          success: true,
          groupCreated: false,
          propertiesCreated: ['sow_needs_review_date'],
          propertiesExisted: [],
          errors: [],
          timestamp: new Date().toISOString()
        });

      await withSelfHealing(mockOperation, 'test operation');

      // ensureHubSpotSetup should be called twice: before initial + before retry
      expect(setupSpy).toHaveBeenCalledTimes(2);
    });
  });

  // ============================================================================
  // ensureHubSpotSetup() - Idempotency Tests
  // ============================================================================

  describe('ensureHubSpotSetup - Idempotency', () => {
    test('runs setup only once on sequential calls', async () => {
      // We can't spy on runSetup as it's internal, so we'll verify via state
      expect(isSetupComplete()).toBe(false);

      await ensureHubSpotSetup();
      expect(isSetupComplete()).toBe(true);

      await ensureHubSpotSetup();
      await ensureHubSpotSetup();

      // Setup should still be complete (not run multiple times)
      expect(isSetupComplete()).toBe(true);
      // getSetupResult should return the same result
      const result = getSetupResult();
      expect(result).not.toBeNull();
    });

    test('deduplicates concurrent calls', async () => {
      resetSetupState();
      expect(isSetupComplete()).toBe(false);

      // Fire 10 concurrent setup calls
      const promises = Array(10).fill(null).map(() => ensureHubSpotSetup());
      await Promise.all(promises);

      // Should be complete after all promises resolve
      expect(isSetupComplete()).toBe(true);

      // Result should exist (setup ran)
      const result = getSetupResult();
      expect(result).not.toBeNull();
    });

    test('returns immediately if already completed', async () => {
      resetSetupState();

      // First call (does actual setup)
      await ensureHubSpotSetup();
      expect(isSetupComplete()).toBe(true);

      // Second call should return very quickly
      const startTime = Date.now();
      await ensureHubSpotSetup();
      const duration = Date.now() - startTime;

      // Should be near-instant (< 10ms)
      expect(duration).toBeLessThan(10);
      expect(isSetupComplete()).toBe(true);
    });

    test('allows setup to run again after reset', async () => {
      // First setup
      await ensureHubSpotSetup();
      expect(isSetupComplete()).toBe(true);
      const firstResult = getSetupResult();

      // Reset
      resetSetupState();
      expect(isSetupComplete()).toBe(false);
      expect(getSetupResult()).toBeNull();

      // Second setup
      await ensureHubSpotSetup();
      expect(isSetupComplete()).toBe(true);

      // Should have a new result
      const secondResult = getSetupResult();
      expect(secondResult).not.toBeNull();
      // Timestamps should be different (new setup ran)
      if (firstResult && secondResult) {
        expect(secondResult.timestamp).not.toBe(firstResult.timestamp);
      }
    });
  });

  // ============================================================================
  // resetSetupState() - State Management Tests
  // ============================================================================

  describe('resetSetupState - State Management', () => {
    test('clears setup completion flag', async () => {
      await ensureHubSpotSetup();
      expect(isSetupComplete()).toBe(true);

      resetSetupState();
      expect(isSetupComplete()).toBe(false);
    });

    test('clears setup result', async () => {
      await ensureHubSpotSetup();
      expect(getSetupResult()).not.toBeNull();

      resetSetupState();
      expect(getSetupResult()).toBeNull();
    });

    test('allows new setup to proceed after reset', async () => {
      await ensureHubSpotSetup();
      const firstTimestamp = getSetupResult()?.timestamp;

      resetSetupState();

      // Wait a tiny bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      await ensureHubSpotSetup();
      const secondTimestamp = getSetupResult()?.timestamp;

      expect(secondTimestamp).not.toBe(firstTimestamp);
    });

    test('can be called multiple times safely', () => {
      resetSetupState();
      resetSetupState();
      resetSetupState();

      expect(isSetupComplete()).toBe(false);
      expect(getSetupResult()).toBeNull();
    });
  });

  // ============================================================================
  // getSetupResult() - Result Retrieval Tests
  // ============================================================================

  describe('getSetupResult - Result Retrieval', () => {
    test('returns null before setup', () => {
      resetSetupState();
      expect(getSetupResult()).toBeNull();
    });

    test('returns result after setup', async () => {
      await ensureHubSpotSetup();
      const result = getSetupResult();

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('groupCreated');
      expect(result).toHaveProperty('propertiesCreated');
      expect(result).toHaveProperty('propertiesExisted');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('timestamp');
    });

    test('result includes timestamp', async () => {
      await ensureHubSpotSetup();
      const result = getSetupResult();

      expect(result?.timestamp).toBeDefined();
      expect(new Date(result!.timestamp)).toBeInstanceOf(Date);
    });

    test('returns null after reset', async () => {
      await ensureHubSpotSetup();
      expect(getSetupResult()).not.toBeNull();

      resetSetupState();
      expect(getSetupResult()).toBeNull();
    });
  });

  // ============================================================================
  // isSetupComplete() - Completion Check Tests
  // ============================================================================

  describe('isSetupComplete - Completion Check', () => {
    test('returns false before setup', () => {
      resetSetupState();
      expect(isSetupComplete()).toBe(false);
    });

    test('returns true after setup', async () => {
      await ensureHubSpotSetup();
      expect(isSetupComplete()).toBe(true);
    });

    test('returns false after reset', async () => {
      await ensureHubSpotSetup();
      expect(isSetupComplete()).toBe(true);

      resetSetupState();
      expect(isSetupComplete()).toBe(false);
    });
  });
});
