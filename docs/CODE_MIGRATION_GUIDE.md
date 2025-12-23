# Code Migration Guide: Deals API → Projects API

## Overview

This guide documents the code changes required to migrate the Solar SOW Approval System from HubSpot's Deals API to the **Projects API (beta)**.

**What's changing:**
- API object type: `deals` → `0-970` (Projects)
- Core entity: Deal records → Project records
- Property naming: Some standard properties have new names (e.g., `dealname` → `hs_name`)
- OAuth scopes: Deal scopes → Project scopes

**Why migrate:**
The Projects API provides better support for tracking work-based processes like solar installations, with clearer separation between sales (deals) and execution (projects).

**Reference:** See `/opt/Projects/Solar Inbound SOW Approval/docs/PROJECTS_API_REFERENCE.md` for complete Projects API documentation.

---

## 1. lib/hubspot.ts Changes

### API Endpoint Updates

Change all endpoint paths from `/crm/v3/objects/deals` to `/crm/v3/objects/0-970`:

```typescript
// BEFORE (Deals API)
const response = await fetch(
  `https://api.hubapi.com/crm/v3/objects/deals/search`,
  // ...
);

// AFTER (Projects API)
const response = await fetch(
  `https://api.hubapi.com/crm/v3/objects/0-970/search`,
  // ...
);
```

### Function Name Updates

Rename functions to reflect Projects terminology:

| Old Function Name | New Function Name |
|-------------------|-------------------|
| `searchDeals()` | `searchProjects()` |
| `updateDeal()` | `updateProject()` |
| `findDealByToken()` | `findProjectByToken()` |

```typescript
// BEFORE
export async function findDealByToken(token: string) {
  // ...
}

// AFTER
export async function findProjectByToken(token: string) {
  // ...
}
```

### Property Name Updates

Update standard property references:

| Old Property | New Property |
|--------------|--------------|
| `dealname` | `hs_name` |

```typescript
// BEFORE
const dealName = properties.dealname;

// AFTER
const projectName = properties.hs_name;
```

**Note:** Custom properties (e.g., `sow_token`, `system_size`, `sales_rep_name`) remain unchanged.

### Complete File Diff Example

```typescript
// BEFORE
export async function searchDeals(filters: any) {
  const response = await fetch(
    `https://api.hubapi.com/crm/v3/objects/deals/search`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filterGroups: filters,
        properties: ['dealname', 'sow_token', 'sow_pin', /* ... */],
      }),
    }
  );
  // ...
}

// AFTER
export async function searchProjects(filters: any) {
  const response = await fetch(
    `https://api.hubapi.com/crm/v3/objects/0-970/search`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filterGroups: filters,
        properties: ['hs_name', 'sow_token', 'sow_pin', /* ... */],
      }),
    }
  );
  // ...
}
```

---

## 2. lib/hubspot-setup.ts Changes

### API Endpoint Updates

Change all property and group endpoints:

```typescript
// BEFORE (Deals API)
const response = await fetch(
  `https://api.hubapi.com/crm/v3/properties/deals`,
  // ...
);

const groupResponse = await fetch(
  `https://api.hubapi.com/crm/v3/properties/deals/groups`,
  // ...
);

// AFTER (Projects API)
const response = await fetch(
  `https://api.hubapi.com/crm/v3/properties/0-970`,
  // ...
);

const groupResponse = await fetch(
  `https://api.hubapi.com/crm/v3/properties/0-970/groups`,
  // ...
);
```

### Error Message Updates

Update error messages to reflect Projects terminology:

```typescript
// BEFORE
throw new Error(`Failed to create deal property: ${property.name}`);

// AFTER
throw new Error(`Failed to create project property: ${property.name}`);
```

### Function Name Updates

Consider renaming setup functions for clarity:

| Old Function Name | New Function Name |
|-------------------|-------------------|
| `createDealProperties()` | `createProjectProperties()` |
| `createDealPropertyGroups()` | `createProjectPropertyGroups()` |

---

## 3. lib/types.ts Changes

### SOWData Interface

Change the primary identifier field:

```typescript
// BEFORE
export interface SOWData {
  dealId: string;
  dealname: string;
  // ... other properties
}

// AFTER
/**
 * Main data structure for SOW display.
 * Uses HubSpot Projects object type (0-970).
 */
export interface SOWData {
  projectId: string;  // Changed from dealId
  projectName: string;  // Changed from dealname
  // ... other properties
}
```

**Note:** If you want to minimize breaking changes, you could keep `dealname` in the interface and map it internally, but renaming to `projectName` is cleaner long-term.

---

## 4. API Route Changes

All four API routes need updates. The primary change is replacing `dealId` with `projectId` in request/response types and HubSpot function calls.

### `/app/api/verify-pin/route.ts`

```typescript
// BEFORE
const { token } = await request.json();
const deal = await findDealByToken(token);

// AFTER
const { token } = await request.json();
const project = await findProjectByToken(token);
```

### `/app/api/get-sow/route.ts`

```typescript
// BEFORE
const deal = await findDealByToken(token);
if (!deal) {
  return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
}

return NextResponse.json({
  dealId: deal.id,
  dealname: deal.properties.dealname,
  // ...
});

// AFTER
const project = await findProjectByToken(token);
if (!project) {
  return NextResponse.json({ error: 'Project not found' }, { status: 404 });
}

return NextResponse.json({
  projectId: project.id,
  projectName: project.properties.hs_name,
  // ...
});
```

### `/app/api/approve-sow/route.ts`

```typescript
// BEFORE
const { dealId, approvedBy } = await request.json();

await updateDeal(dealId, {
  design_status: 'approved',
  sow_approved_at: new Date().toISOString(),
  sow_approved_by: approvedBy,
});

// AFTER
const { projectId, approvedBy } = await request.json();

await updateProject(projectId, {
  design_status: 'approved',
  sow_approved_at: new Date().toISOString(),
  sow_approved_by: approvedBy,
});
```

### `/app/api/reject-sow/route.ts`

```typescript
// BEFORE
const { dealId, reason, rejectedBy } = await request.json();

await updateDeal(dealId, {
  design_status: 'rejected',
  plans_rejection_reason: reason,
  sow_rejected_by: rejectedBy,
});

// AFTER
const { projectId, reason, rejectedBy } = await request.json();

await updateProject(projectId, {
  design_status: 'rejected',
  plans_rejection_reason: reason,
  sow_rejected_by: rejectedBy,
});
```

### Summary of API Route Changes

| File | Primary Change |
|------|----------------|
| `verify-pin/route.ts` | `findDealByToken()` → `findProjectByToken()` |
| `get-sow/route.ts` | `dealId` → `projectId`, `dealname` → `projectName`, `findDealByToken()` → `findProjectByToken()` |
| `approve-sow/route.ts` | Request body: `dealId` → `projectId`, `updateDeal()` → `updateProject()` |
| `reject-sow/route.ts` | Request body: `dealId` → `projectId`, `updateDeal()` → `updateProject()` |

---

## 5. Environment Variables

**No changes required.**

The same environment variable works for both APIs:

```bash
HUBSPOT_ACCESS_TOKEN=your_private_app_token
```

---

## 6. OAuth Scopes Changes

Update your HubSpot Private App or OAuth scopes from Deals to Projects:

| Old Scope (Deals) | New Scope (Projects) | Purpose |
|-------------------|----------------------|---------|
| `crm.objects.deals.read` | `crm.objects.custom.read` | Read project records |
| `crm.objects.deals.write` | `crm.objects.custom.write` | Update project records (approval/rejection) |
| `crm.schemas.deals.read` | `crm.schemas.custom.read` | Read custom object schema (for property setup) |
| `crm.schemas.deals.write` | `crm.schemas.custom.write` | Create custom properties (for setup script) |

**How to update scopes:**

1. Go to HubSpot → Settings → Integrations → Private Apps
2. Select your app
3. Click "Scopes" tab
4. Remove old Deals scopes
5. Add new Projects scopes (listed above)
6. Save changes
7. Regenerate access token if prompted

**Important:** Projects use generic `custom` scopes because Projects are a custom object type (`0-970`), not a standard CRM object like Deals.

---

## 7. Testing the Migration

### Before Deployment

1. **Update scopes** in HubSpot Private App
2. **Run setup script** to create properties on Projects object:
   ```bash
   npm run setup-hubspot
   ```
3. **Test locally** with a test project record:
   - Create a test project in HubSpot with `sow_token` and `sow_pin`
   - Navigate to `http://localhost:3000/sow/[token]`
   - Verify PIN validation works
   - Verify SOW data displays correctly
   - Test approval/rejection flows

### Rollback Plan

If issues occur:

1. Revert code changes (git revert)
2. Restore Deals API scopes in HubSpot
3. Keep both object types (Deals + Projects) temporarily during transition

---

## 8. Migration Checklist

Use this checklist to ensure all changes are complete:

- [ ] `lib/hubspot.ts`: Change `/deals` → `/0-970` in all endpoints
- [ ] `lib/hubspot.ts`: Rename functions (`searchDeals` → `searchProjects`, etc.)
- [ ] `lib/hubspot.ts`: Update property references (`dealname` → `hs_name`)
- [ ] `lib/hubspot-setup.ts`: Change `/deals` → `/0-970` in property endpoints
- [ ] `lib/hubspot-setup.ts`: Update error messages
- [ ] `lib/types.ts`: Change `dealId` → `projectId` in SOWData interface
- [ ] `lib/types.ts`: Change `dealname` → `projectName` in SOWData interface
- [ ] `app/api/verify-pin/route.ts`: Update function calls
- [ ] `app/api/get-sow/route.ts`: Update response mapping
- [ ] `app/api/approve-sow/route.ts`: Update request body and function calls
- [ ] `app/api/reject-sow/route.ts`: Update request body and function calls
- [ ] HubSpot Private App: Update OAuth scopes to Projects scopes
- [ ] Run `npm run setup-hubspot` to create properties on Projects object
- [ ] Test with a real project record in HubSpot
- [ ] Update documentation (CLAUDE.md, README) to reference Projects instead of Deals

---

## 9. Additional Considerations

### Data Migration

If you have existing Deal records with SOW data:

1. **Option A: Dual-write pattern** - Write to both Deals and Projects during transition
2. **Option B: One-time migration** - Script to copy SOW-related properties from Deals to Projects
3. **Option C: Fresh start** - Only use Projects going forward (recommended for prototype)

### Workflow Updates

If you have HubSpot workflows that reference Deal properties:

1. Create new workflows for Projects object
2. Update property references (`dealname` → `hs_name`)
3. Update enrollment triggers to use Projects instead of Deals

### Associations

If you need to associate Projects with Contacts, Companies, or Deals:

- Use `/crm/v4/objects/0-970/associations/{toObjectType}` endpoint
- Example: Associate project with contact: `POST /crm/v4/objects/0-970/associations/contacts`

---

## Questions or Issues?

Refer to:
- `/opt/Projects/Solar Inbound SOW Approval/docs/PROJECTS_API_REFERENCE.md` - Complete Projects API documentation
- `/opt/Projects/Solar Inbound SOW Approval/CLAUDE.md` - Project architecture guide
- HubSpot Projects API Docs: https://developers.hubspot.com/docs/api/crm/custom-objects
