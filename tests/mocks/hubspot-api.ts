/**
 * Mock HubSpot API Handlers for Testing
 * ======================================
 *
 * Provides Mock Service Worker (MSW) handlers to simulate HubSpot API responses.
 * Use these in unit and integration tests to avoid real API calls.
 *
 * Usage:
 *   import { server } from './mocks/server';
 *   import { hubspotHandlers, mockState } from './mocks/hubspot-api';
 *
 *   beforeAll(() => server.listen());
 *   afterEach(() => server.resetHandlers());
 *   afterAll(() => server.close());
 */

import { rest } from 'msw';

// ============================================================================
// MOCK STATE MANAGEMENT
// ============================================================================

/**
 * Simulates HubSpot property state for testing.
 * Tracks which properties/groups exist to simulate realistic API behavior.
 */
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

  groupExists(name: string): boolean {
    return this.groups.has(name);
  }

  reset() {
    this.properties.clear();
    this.groups.clear();
  }

  initializeAllProperties() {
    const allProperties = [
      'sow_token', 'sow_pin', 'sow_status', 'sow_needs_review_date',
      'sow_accepted_date', 'sow_rejected_date', 'sow_rejected_reason',
      'accepted_sow', 'rejected_sow'
    ];
    allProperties.forEach(prop => this.createProperty(prop));
    this.createGroup('sow_approval');
  }
}

export const mockState = new HubSpotMockState();

// ============================================================================
// ERROR RESPONSE FIXTURES
// ============================================================================

export const hubspotErrors = {
  // Property-related errors (should trigger self-healing)
  propertyNotFound: (propertyName: string) => ({
    status: 'error',
    message: `Property ${propertyName} does not exist`,
    correlationId: 'test-correlation-id',
    category: 'VALIDATION_ERROR'
  }),

  invalidProperty: (propertyName: string) => ({
    status: 'error',
    message: `invalid property: ${propertyName}`,
    category: 'VALIDATION_ERROR'
  }),

  unknownProperty: (propertyName: string) => ({
    status: 'error',
    message: 'unknown property requested',
    propertyName: propertyName
  }),

  propertyDoesntExist: {
    status: 'error',
    message: 'PROPERTY_DOESNT_EXIST',
    errorType: 'PROPERTY_DOESNT_EXIST'
  },

  // Non-property errors (should NOT trigger self-healing)
  rateLimitExceeded: {
    status: 'error',
    message: 'Rate limit exceeded. Try again later.',
    category: 'RATE_LIMIT'
  },

  unauthorized: {
    status: 'error',
    message: 'Invalid or expired access token',
    category: 'AUTHENTICATION'
  },

  dealNotFound: (dealId: string) => ({
    status: 'error',
    message: `Deal ${dealId} not found`,
    category: 'OBJECT_NOT_FOUND'
  }),

  validationError: (message: string) => ({
    status: 'error',
    message: message,
    category: 'VALIDATION_ERROR'
  }),

  serverError: {
    status: 'error',
    message: 'Internal server error',
    category: 'INTERNAL_ERROR'
  }
};

// ============================================================================
// MSW HANDLERS
// ============================================================================

const HUBSPOT_API_BASE = 'https://api.hubapi.com';

export const hubspotHandlers = [
  // -------------------------------------------------------------------------
  // Property Group Management
  // -------------------------------------------------------------------------

  // Create property group
  rest.post(`${HUBSPOT_API_BASE}/crm/v3/properties/deals/groups`, (req, res, ctx) => {
    const body = req.body as any;
    const groupName = body.name;

    if (mockState.groupExists(groupName)) {
      // Group already exists - return 409
      return res(
        ctx.status(409),
        ctx.json({
          status: 'error',
          message: 'Property group already exists',
          category: 'CONFLICT'
        })
      );
    }

    // Create group
    mockState.createGroup(groupName);
    return res(
      ctx.status(200),
      ctx.json({
        name: body.name,
        label: body.label,
        displayOrder: body.displayOrder,
        createdAt: new Date().toISOString()
      })
    );
  }),

  // -------------------------------------------------------------------------
  // Property Management
  // -------------------------------------------------------------------------

  // Create property
  rest.post(`${HUBSPOT_API_BASE}/crm/v3/properties/deals`, (req, res, ctx) => {
    const body = req.body as any;
    const propertyName = body.name;

    if (mockState.propertyExists(propertyName)) {
      // Property already exists - return 409
      return res(
        ctx.status(409),
        ctx.json({
          status: 'error',
          message: 'Property already exists',
          category: 'CONFLICT'
        })
      );
    }

    // Create property
    mockState.createProperty(propertyName);
    return res(
      ctx.status(200),
      ctx.json({
        name: body.name,
        label: body.label,
        type: body.type,
        fieldType: body.fieldType,
        groupName: body.groupName,
        description: body.description,
        options: body.options,
        hasUniqueValue: body.hasUniqueValue,
        createdAt: new Date().toISOString()
      })
    );
  }),

  // Get property
  rest.get(`${HUBSPOT_API_BASE}/crm/v3/properties/deals/:propertyName`, (req, res, ctx) => {
    const propertyName = req.params.propertyName as string;

    if (!mockState.propertyExists(propertyName)) {
      return res(
        ctx.status(404),
        ctx.json(hubspotErrors.propertyNotFound(propertyName))
      );
    }

    return res(
      ctx.status(200),
      ctx.json({
        name: propertyName,
        label: propertyName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        type: 'string',
        fieldType: 'text',
        groupName: 'sow_approval'
      })
    );
  }),

  // Delete property (for test cleanup)
  rest.delete(`${HUBSPOT_API_BASE}/crm/v3/properties/deals/:propertyName`, (req, res, ctx) => {
    const propertyName = req.params.propertyName as string;
    mockState.deleteProperty(propertyName);
    return res(ctx.status(204));
  }),

  // -------------------------------------------------------------------------
  // Deal Search
  // -------------------------------------------------------------------------

  rest.post(`${HUBSPOT_API_BASE}/crm/v3/objects/deals/search`, (req, res, ctx) => {
    const body = req.body as any;
    const filters = body.filterGroups?.[0]?.filters || [];
    const properties = body.properties || [];

    // Check if all requested properties exist
    for (const prop of properties) {
      if (!mockState.propertyExists(prop)) {
        return res(
          ctx.status(400),
          ctx.json(hubspotErrors.propertyNotFound(prop))
        );
      }
    }

    // Check filter properties
    for (const filter of filters) {
      if (!mockState.propertyExists(filter.propertyName)) {
        return res(
          ctx.status(400),
          ctx.json(hubspotErrors.propertyNotFound(filter.propertyName))
        );
      }
    }

    // Success - return mock deal
    return res(
      ctx.status(200),
      ctx.json({
        total: 1,
        results: [
          {
            id: 'test-deal-123',
            properties: {
              sow_token: 'test-token-123',
              sow_pin: '1234',
              sow_status: 'needs_review',
              dealname: 'Test Customer',
              customer_email: 'test@example.com',
              sales_rep_email: 'rep@example.com',
              system_size: '10.5'
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      })
    );
  }),

  // -------------------------------------------------------------------------
  // Deal Get
  // -------------------------------------------------------------------------

  rest.get(`${HUBSPOT_API_BASE}/crm/v3/objects/deals/:dealId`, (req, res, ctx) => {
    const dealId = req.params.dealId as string;
    const url = new URL(req.url);
    const properties = url.searchParams.get('properties')?.split(',') || [];

    // Check if all requested properties exist
    for (const prop of properties) {
      if (!mockState.propertyExists(prop)) {
        return res(
          ctx.status(400),
          ctx.json(hubspotErrors.propertyNotFound(prop))
        );
      }
    }

    return res(
      ctx.status(200),
      ctx.json({
        id: dealId,
        properties: {
          sow_token: 'test-token-123',
          sow_pin: '1234',
          sow_status: 'needs_review'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    );
  }),

  // -------------------------------------------------------------------------
  // Deal Update
  // -------------------------------------------------------------------------

  rest.patch(`${HUBSPOT_API_BASE}/crm/v3/objects/deals/:dealId`, (req, res, ctx) => {
    const dealId = req.params.dealId as string;
    const body = req.body as any;
    const properties = body.properties || {};

    // Check if all properties being updated exist
    for (const prop of Object.keys(properties)) {
      if (!mockState.propertyExists(prop)) {
        return res(
          ctx.status(400),
          ctx.json(hubspotErrors.propertyNotFound(prop))
        );
      }
    }

    return res(
      ctx.status(200),
      ctx.json({
        id: dealId,
        properties: properties,
        updatedAt: new Date().toISOString()
      })
    );
  }),

  // -------------------------------------------------------------------------
  // File Upload
  // -------------------------------------------------------------------------

  rest.post(`${HUBSPOT_API_BASE}/files/v3/files`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: 'mock-file-id-123',
        name: 'SOW-Approved-test.pdf',
        url: 'https://example.com/file.pdf',
        type: 'application/pdf',
        size: 12345,
        createdAt: new Date().toISOString()
      })
    );
  }),

  // File update (for setting access level)
  rest.patch(`${HUBSPOT_API_BASE}/files/v3/files/:fileId`, (req, res, ctx) => {
    const fileId = req.params.fileId as string;
    const body = req.body as any;

    return res(
      ctx.status(200),
      ctx.json({
        id: fileId,
        access: body.access,
        updatedAt: new Date().toISOString()
      })
    );
  }),

  // -------------------------------------------------------------------------
  // Note Creation
  // -------------------------------------------------------------------------

  rest.post(`${HUBSPOT_API_BASE}/crm/v3/objects/notes`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: 'mock-note-id-123',
        properties: (req.body as any).properties,
        createdAt: new Date().toISOString()
      })
    );
  })
];

// ============================================================================
// HANDLER CUSTOMIZATION UTILITIES
// ============================================================================

/**
 * Create a handler that simulates property missing on first call,
 * then succeeds on retry.
 */
export const createSelfHealingHandler = (propertyName: string) => {
  let attemptCount = 0;

  return rest.patch(`${HUBSPOT_API_BASE}/crm/v3/objects/deals/:dealId`, (req, res, ctx) => {
    attemptCount++;
    const body = req.body as any;

    if (attemptCount === 1 && body.properties[propertyName]) {
      // First attempt - property missing
      return res(
        ctx.status(400),
        ctx.json(hubspotErrors.propertyNotFound(propertyName))
      );
    }

    // Subsequent attempts - success
    return res(
      ctx.status(200),
      ctx.json({
        id: req.params.dealId,
        properties: body.properties,
        updatedAt: new Date().toISOString()
      })
    );
  });
};

/**
 * Create a handler that always fails with a specific error.
 */
export const createFailingHandler = (error: any) => {
  return rest.patch(`${HUBSPOT_API_BASE}/crm/v3/objects/deals/:dealId`, (req, res, ctx) => {
    return res(
      ctx.status(error.status || 400),
      ctx.json(error)
    );
  });
};

/**
 * Simulate HubSpot API being completely down.
 */
export const createDowntimeHandler = () => {
  return rest.all(`${HUBSPOT_API_BASE}/*`, (req, res, ctx) => {
    return res(
      ctx.status(503),
      ctx.json(hubspotErrors.serverError)
    );
  });
};

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Reset mock state to clean slate.
 */
export function resetMockState() {
  mockState.reset();
}

/**
 * Initialize mock state with all SOW properties.
 */
export function initializeMockProperties() {
  mockState.initializeAllProperties();
}

/**
 * Simulate deletion of a property during test.
 */
export function simulatePropertyDeletion(propertyName: string) {
  mockState.deleteProperty(propertyName);
}

/**
 * Simulate deletion of all SOW properties.
 */
export function simulateAllPropertiesDeletion() {
  const properties = [
    'sow_token', 'sow_pin', 'sow_status', 'sow_needs_review_date',
    'sow_accepted_date', 'sow_rejected_date', 'sow_rejected_reason',
    'accepted_sow', 'rejected_sow'
  ];
  properties.forEach(prop => mockState.deleteProperty(prop));
  mockState.deleteGroup('sow_approval');
}
