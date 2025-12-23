#!/usr/bin/env npx ts-node
/**
 * HubSpot Custom Properties Setup Script
 * =======================================
 *
 * This script creates all custom properties required for the SOW Approval System
 * in your HubSpot account.
 *
 * Usage:
 *   HUBSPOT_ACCESS_TOKEN=your_token npx ts-node scripts/create-hubspot-properties.ts
 *
 * Or set the token in your environment and run:
 *   npx ts-node scripts/create-hubspot-properties.ts
 *
 * Prerequisites:
 *   - Private app with `crm.schemas.deals.write` scope
 *   - Node.js 18+ with TypeScript support
 *
 * What This Script Does:
 *   1. Creates a "SOW Approval" property group
 *   2. Creates all required SOW-related custom properties
 *   3. Reports success/failure for each property
 *
 * Note: This script is idempotent - running it multiple times is safe.
 *       Existing properties will show as "already exists" and be skipped.
 */

const HUBSPOT_API_BASE = 'https://api.hubapi.com';

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

// =============================================================================
// PROPERTY DEFINITIONS
// =============================================================================

const PROPERTY_GROUP = {
  name: 'sow_approval',
  label: 'SOW Approval',
  displayOrder: 1,
};

const PROPERTIES: PropertyDefinition[] = [
  // SOW Metadata
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
    description: 'Reason provided by sales rep for rejecting the SOW (max 2000 chars)',
  },
  {
    name: 'accepted_sow',
    label: 'Accepted SOW',
    type: 'string',
    fieldType: 'file',
    groupName: 'sow_approval',
    description: 'PDF snapshot of accepted SOW (file ID reference)',
  },
  {
    name: 'rejected_sow',
    label: 'Rejected SOW',
    type: 'string',
    fieldType: 'file',
    groupName: 'sow_approval',
    description: 'PDF snapshot of rejected SOW (file ID reference)',
  },
];

// =============================================================================
// API HELPERS
// =============================================================================

async function hubspotRequest(
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' = 'GET',
  body?: unknown
): Promise<{ ok: boolean; status: number; data?: unknown; error?: string }> {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('HUBSPOT_ACCESS_TOKEN environment variable is required');
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

    const data = await response.json().catch(() => null);

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
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// MAIN SCRIPT
// =============================================================================

async function createPropertyGroup(): Promise<boolean> {
  console.log('\n📁 Creating property group...');

  const result = await hubspotRequest('/crm/v3/properties/deals/groups', 'POST', PROPERTY_GROUP);

  if (result.ok) {
    console.log(`   ✅ Created group: ${PROPERTY_GROUP.label}`);
    return true;
  } else if (result.status === 409) {
    console.log(`   ℹ️  Group already exists: ${PROPERTY_GROUP.label}`);
    return true;
  } else {
    console.log(`   ❌ Failed to create group: ${result.error}`);
    return false;
  }
}

async function createProperty(property: PropertyDefinition): Promise<boolean> {
  const result = await hubspotRequest('/crm/v3/properties/deals', 'POST', property);

  if (result.ok) {
    console.log(`   ✅ Created: ${property.label} (${property.name})`);
    return true;
  } else if (result.status === 409) {
    console.log(`   ℹ️  Already exists: ${property.label} (${property.name})`);
    return true;
  } else {
    console.log(`   ❌ Failed: ${property.label} - ${result.error}`);
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  HubSpot Custom Properties Setup for SOW Approval System');
  console.log('═══════════════════════════════════════════════════════════════');

  // Check for access token
  if (!process.env.HUBSPOT_ACCESS_TOKEN) {
    console.error('\n❌ Error: HUBSPOT_ACCESS_TOKEN environment variable is not set');
    console.error('\nUsage:');
    console.error('  HUBSPOT_ACCESS_TOKEN=your_token npx ts-node scripts/create-hubspot-properties.ts');
    process.exit(1);
  }

  // Test connection
  console.log('\n🔗 Testing HubSpot connection...');
  const testResult = await hubspotRequest('/crm/v3/properties/deals');
  if (!testResult.ok) {
    console.error(`\n❌ Failed to connect to HubSpot: ${testResult.error}`);
    process.exit(1);
  }
  console.log('   ✅ Connection successful');

  // Create property group
  const groupCreated = await createPropertyGroup();
  if (!groupCreated) {
    console.error('\n⚠️  Property group creation failed, but continuing with properties...');
  }

  // Create properties
  console.log('\n📋 Creating properties...');
  let successCount = 0;
  let failCount = 0;

  for (const property of PROPERTIES) {
    const success = await createProperty(property);
    if (success) successCount++;
    else failCount++;
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  Summary');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  ✅ Successful: ${successCount}`);
  console.log(`  ❌ Failed: ${failCount}`);
  console.log(`  📊 Total: ${PROPERTIES.length}`);

  if (failCount === 0) {
    console.log('\n🎉 All properties created successfully!');
    console.log('\nNext steps:');
    console.log('  1. Verify properties in HubSpot: Settings → Properties → Deals');
    console.log('  2. Create the workflow: Automation → Workflows');
    console.log('  3. Configure environment variables in Vercel');
    console.log('  4. Deploy the application');
  } else {
    console.log('\n⚠️  Some properties failed to create.');
    console.log('    Check the errors above and try again, or create them manually in HubSpot.');
  }

  console.log('\n');
}

// Run the script
main().catch((error) => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});
