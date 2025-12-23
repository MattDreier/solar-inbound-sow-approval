/**
 * HubSpot Self-Healing Setup
 * ==========================
 *
 * Ensures all required custom properties exist in HubSpot before the app uses them.
 * This runs automatically on first API call, making deployment zero-configuration.
 *
 * Safety guarantees:
 * - NEVER modifies existing properties (409 Conflict = skip)
 * - NEVER deletes anything
 * - Only creates missing properties
 * - Logs all actions for visibility
 *
 * @see https://developers.hubspot.com/docs/api/crm/properties
 */

const HUBSPOT_API_BASE = 'https://api.hubapi.com';

/**
 * Wrap a promise with a timeout.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    )
  ]);
}

const SETUP_TIMEOUT_MS = 30000;
const OPERATION_TIMEOUT_MS = 30000;

/**
 * Property definition for creation.
 */
interface PropertyDefinition {
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'datetime' | 'enumeration' | 'bool';
  fieldType: 'text' | 'textarea' | 'select' | 'date' | 'file' | 'number' | 'booleancheckbox';
  groupName: string;
  description?: string;
  options?: Array<{ label: string; value: string; displayOrder: number }>;
  hasUniqueValue?: boolean;
}

/**
 * Property group for organization.
 */
const PROPERTY_GROUP = {
  name: 'sow_approval',
  label: 'SOW Approval',
  displayOrder: 1,
};

/**
 * All required SOW properties.
 */
const REQUIRED_PROPERTIES: PropertyDefinition[] = [
  {
    name: 'sow_token',
    label: 'SOW Token',
    type: 'string',
    fieldType: 'text',
    groupName: 'sow_approval',
    description: 'Unique token used in SOW approval URL',
    hasUniqueValue: true,
  },
  {
    name: 'sow_pin',
    label: 'SOW PIN',
    type: 'string',
    fieldType: 'text',
    groupName: 'sow_approval',
    description: '4-digit PIN for SOW authentication',
  },
  {
    name: 'sow_status',
    label: 'SOW Status',
    type: 'enumeration',
    fieldType: 'select',
    groupName: 'sow_approval',
    description: 'Current status of the SOW approval process',
    options: [
      { label: 'Not Ready', value: 'not_ready', displayOrder: 0 },
      { label: 'Needs Review', value: 'needs_review', displayOrder: 1 },
      { label: 'Approved', value: 'approved', displayOrder: 2 },
      { label: 'Rejected', value: 'rejected', displayOrder: 3 },
    ],
  },
  {
    name: 'sow_needs_review_date',
    label: 'SOW Needs Review Date',
    type: 'datetime',
    fieldType: 'date',
    groupName: 'sow_approval',
    description: 'Date when SOW was set to needs review status',
  },
  {
    name: 'sow_accepted_date',
    label: 'SOW Accepted Date',
    type: 'datetime',
    fieldType: 'date',
    groupName: 'sow_approval',
    description: 'Date when SOW was approved',
  },
  {
    name: 'sow_rejected_date',
    label: 'SOW Rejected Date',
    type: 'datetime',
    fieldType: 'date',
    groupName: 'sow_approval',
    description: 'Date when SOW was rejected',
  },
  {
    name: 'sow_rejected_reason',
    label: 'SOW Rejected Reason',
    type: 'string',
    fieldType: 'textarea',
    groupName: 'sow_approval',
    description: 'Reason provided for rejecting the SOW',
  },
  {
    name: 'accepted_sow',
    label: 'Accepted SOW',
    type: 'string',
    fieldType: 'file',
    groupName: 'sow_approval',
    description: 'PDF snapshot of accepted SOW',
  },
  {
    name: 'rejected_sow',
    label: 'Rejected SOW',
    type: 'string',
    fieldType: 'file',
    groupName: 'sow_approval',
    description: 'PDF snapshot of rejected SOW',
  },
];

// =============================================================================
// SETUP STATE
// =============================================================================

/**
 * Tracks whether setup has been completed this instance.
 * Prevents redundant API calls on subsequent requests.
 */
let setupCompleted = false;
let setupInProgress: Promise<void> | null = null;

/**
 * Results from the last setup run.
 */
export interface SetupResult {
  success: boolean;
  groupCreated: boolean;
  propertiesCreated: string[];
  propertiesExisted: string[];
  errors: string[];
  timestamp: string;
}

let lastSetupResult: SetupResult | null = null;

// =============================================================================
// API HELPERS
// =============================================================================

async function hubspotRequest(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: unknown
): Promise<{ ok: boolean; status: number; data?: unknown; error?: string }> {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;

  if (!accessToken) {
    return { ok: false, status: 0, error: 'HUBSPOT_ACCESS_TOKEN not configured' };
  }

  try {
    const response = await fetch(`${HUBSPOT_API_BASE}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    let data: unknown;
    try {
      data = await response.json();
    } catch (parseError) {
      const bodyText = await response.text().catch(() => '[unreadable]');
      console.error(`[HubSpot API] JSON parse failed for ${endpoint}: ${bodyText.substring(0, 200)}`);
      return {
        ok: false,
        status: response.status,
        error: 'Invalid JSON response from HubSpot API',
      };
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
      error: response.ok ? undefined : JSON.stringify(data),
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// =============================================================================
// SETUP FUNCTIONS
// =============================================================================

/**
 * Create the property group if it doesn't exist.
 */
async function ensurePropertyGroup(): Promise<{ created: boolean; error?: string }> {
  const result = await hubspotRequest('/crm/v3/properties/deals/groups', 'POST', PROPERTY_GROUP);

  if (result.ok) {
    console.log(`[HubSpot Setup] Created property group: ${PROPERTY_GROUP.label}`);
    return { created: true };
  } else if (result.status === 409) {
    // Already exists - this is fine
    return { created: false };
  } else {
    return { created: false, error: result.error };
  }
}

/**
 * Create a single property if it doesn't exist.
 */
async function ensureProperty(
  property: PropertyDefinition
): Promise<{ created: boolean; error?: string }> {
  const result = await hubspotRequest('/crm/v3/properties/deals', 'POST', property);

  if (result.ok) {
    console.log(`[HubSpot Setup] Created property: ${property.name}`);
    return { created: true };
  } else if (result.status === 409) {
    // Already exists - this is fine
    return { created: false };
  } else {
    return { created: false, error: `${property.name}: ${result.error}` };
  }
}

/**
 * Run the complete setup process.
 */
async function runSetup(): Promise<SetupResult> {
  console.log('[HubSpot Setup] Starting property verification...');

  const result: SetupResult = {
    success: true,
    groupCreated: false,
    propertiesCreated: [],
    propertiesExisted: [],
    errors: [],
    timestamp: new Date().toISOString(),
  };

  // Step 1: Ensure property group exists
  const groupResult = await ensurePropertyGroup();
  result.groupCreated = groupResult.created;
  if (groupResult.error) {
    // Non-fatal - properties can still be created in default group
    console.warn(`[HubSpot Setup] Group creation warning: ${groupResult.error}`);
  }

  // Step 2: Ensure all properties exist
  for (const property of REQUIRED_PROPERTIES) {
    const propResult = await ensureProperty(property);

    if (propResult.created) {
      result.propertiesCreated.push(property.name);
    } else if (propResult.error) {
      result.errors.push(propResult.error);
      result.success = false;
    } else {
      result.propertiesExisted.push(property.name);
    }
  }

  // Log summary
  if (result.propertiesCreated.length > 0) {
    console.log(`[HubSpot Setup] Created ${result.propertiesCreated.length} new properties`);
  }
  if (result.errors.length > 0) {
    console.error(`[HubSpot Setup] ${result.errors.length} errors occurred:`, result.errors);
  }
  console.log('[HubSpot Setup] Verification complete');

  return result;
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Ensure all required HubSpot properties exist.
 *
 * This function is idempotent and safe to call multiple times:
 * - First call: Runs setup, creates missing properties
 * - Subsequent calls: Returns immediately (cached result)
 *
 * Call this at the start of any API route that uses HubSpot.
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   await ensureHubSpotSetup();
 *   // Now safe to use HubSpot client
 * }
 * ```
 */
export async function ensureHubSpotSetup(): Promise<void> {
  // Already completed this instance
  if (setupCompleted) {
    return;
  }

  // Setup in progress (another request triggered it)
  if (!setupInProgress) {
    setupInProgress = runSetup().then(result => {
      lastSetupResult = result;
      if (result.success) {
        setupCompleted = true;
      } else {
        console.error('[HubSpot Setup] Setup failed, will retry on next call:', result.errors);
      }
    }).finally(() => {
      setupInProgress = null;
    });
  }

  await setupInProgress;
}

/**
 * Get the result of the last setup run.
 * Useful for debugging or health checks.
 */
export function getSetupResult(): SetupResult | null {
  return lastSetupResult;
}

/**
 * Force setup to run again on next call.
 * Useful for testing or if properties were deleted externally.
 */
export function resetSetupState(): void {
  setupCompleted = false;
  setupInProgress = null;
  lastSetupResult = null;
}

/**
 * Check if setup has been completed.
 */
export function isSetupComplete(): boolean {
  return setupCompleted;
}

// =============================================================================
// SELF-HEALING WRAPPER
// =============================================================================

/**
 * Error patterns that indicate a missing property.
 * These trigger automatic re-setup and retry.
 */
const PROPERTY_ERROR_PATTERNS = [
  'property not found',
  'does not exist',
  'invalid property',
  'unknown property',
  'PROPERTY_DOESNT_EXIST',
  // Removed: 'propertyName' - too generic, matches validation errors
];

/**
 * Check if an error indicates a missing property.
 */
function isPropertyError(error: unknown): boolean {
  const message = error instanceof Error
    ? error.message.toLowerCase()
    : String(error).toLowerCase();

  return PROPERTY_ERROR_PATTERNS.some(pattern =>
    message.includes(pattern.toLowerCase())
  );
}

/**
 * Wrap an async operation with self-healing capability.
 *
 * If the operation fails due to a missing property:
 * 1. Reset setup state
 * 2. Re-run property setup
 * 3. Retry the operation once
 *
 * This handles the case where a HubSpot user accidentally deletes a property.
 *
 * @example
 * ```typescript
 * const result = await withSelfHealing(async () => {
 *   return await hubspotClient.updateDeal(dealId, { sow_status: 'approved' });
 * });
 * ```
 */
export async function withSelfHealing<T>(
  operation: () => Promise<T>,
  operationName: string = 'HubSpot operation'
): Promise<T> {
  try {
    // Ensure setup before first attempt
    await withTimeout(ensureHubSpotSetup(), SETUP_TIMEOUT_MS, 'Setup');
    return await withTimeout(operation(), OPERATION_TIMEOUT_MS, operationName);
  } catch (error) {
    // Check if this looks like a property-related error
    if (isPropertyError(error)) {
      console.warn(`[HubSpot Self-Healing] ${operationName} failed due to property issue. Attempting recovery...`);
      console.warn(`[HubSpot Self-Healing] Error was: ${error instanceof Error ? error.message : error}`);

      // Reset and re-run setup
      resetSetupState();
      await withTimeout(ensureHubSpotSetup(), SETUP_TIMEOUT_MS, 'Setup recovery');

      const setupResult = getSetupResult();
      if (setupResult && setupResult.propertiesCreated.length > 0) {
        console.log(`[HubSpot Self-Healing] Recreated ${setupResult.propertiesCreated.length} properties: ${setupResult.propertiesCreated.join(', ')}`);
      }

      // Retry the operation once
      console.log(`[HubSpot Self-Healing] Retrying ${operationName}...`);
      try {
        const result = await withTimeout(operation(), OPERATION_TIMEOUT_MS, `${operationName} retry`);
        console.log(`[HubSpot Self-Healing] ${operationName} succeeded on retry`);
        return result;
      } catch (retryError) {
        console.error(`[HubSpot Self-Healing] ${operationName} failed on retry:`, retryError);
        throw retryError;
      }
    }

    // Not a property error, rethrow
    throw error;
  }
}
