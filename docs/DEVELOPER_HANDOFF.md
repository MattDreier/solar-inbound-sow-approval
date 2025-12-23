# Developer Handoff: HubSpot Integration

**Last Updated:** 2025-12-22
**Status:** Frontend Complete, Backend Ready for Integration

## CRITICAL: Projects API (Not Deals!)

**This system uses HubSpot's Projects API (beta), NOT the Deals API.**

- Object type ID: `0-970`
- All endpoints use `/crm/v3/objects/0-970` instead of `/crm/v3/objects/deals`
- Scopes are `crm.objects.projects.*` instead of `crm.objects.deals.*`
- See `docs/PROJECTS_API_REFERENCE.md` for complete beta API documentation

## Overview

This is a Next.js 15 application for solar Scope of Work (SOW) approvals. Sales representatives receive a link with a unique token, enter a PIN, and can approve or reject solar installation designs. The frontend is fully implemented and working with mock data. Your task is to connect the API routes to HubSpot Projects using the pre-built HubSpot client.

**What's Done:**
- ✅ Frontend UI components
- ✅ HubSpot client library with self-healing
- ✅ TypeScript types matching HubSpot schema
- ✅ Mock data for testing

**What You'll Do:**
- 🔧 Replace mock data calls with HubSpot client calls in 4 API routes
- 🔧 Test the integration with real HubSpot data
- 🔧 (Optional) Implement PDF generation on approval/rejection

---

## 1. Quick Start

### Prerequisites

- Node.js 18+ and npm
- HubSpot access token (provided by implementation specialist)
- Basic familiarity with Next.js and TypeScript

### Setup Steps

```bash
# 1. Clone and install dependencies
git clone <repository-url>
cd solar-inbound-sow-approval
npm install

# 2. Create environment file
cat > .env.local << 'EOF'
HUBSPOT_ACCESS_TOKEN=your_token_here
NEXT_PUBLIC_BASE_URL=http://localhost:3000
EOF

# 3. Start development server
npm run dev

# 4. Test the demo
# Navigate to: http://localhost:3000/sow/demo-token-abc123xyz789
# Enter PIN: 1234
```

### Verify Installation

1. Check health endpoint: `http://localhost:3000/api/health`
   - Should return `{ status: 'healthy', hubspot: 'connected' }` with valid token
   - Should return `{ status: 'degraded', hubspot: 'not configured' }` without token

2. Test the demo flow with mock data (works before HubSpot integration)

---

## 2. Current State

### What's Implemented

| Component | Status | Location |
|-----------|--------|----------|
| Frontend UI | ✅ Complete | `app/sow/[token]/page.tsx`, `components/sow/*` |
| HubSpot Client | ✅ Complete | `lib/hubspot.ts` |
| Self-Healing System | ✅ Complete | `lib/hubspot-setup.ts` |
| Type Definitions | ✅ Complete | `lib/types.ts` |
| API Routes | ⚠️ Mock Data | `app/api/*/route.ts` |
| Mock Data | ✅ Working | `lib/mockData.ts` |

### Self-Healing Architecture

The HubSpot client includes automatic property creation and retry logic:

1. **First API Call**: System checks if required HubSpot **Project** properties exist
2. **Property Creation**: Missing properties are auto-created on the Projects object (`0-970`)
3. **Automatic Retry**: Failed requests due to missing properties are automatically retried
4. **Error Recovery**: System handles property deletion and recreates them on next request

**API Endpoints used for self-healing:**
- Create property group: `POST /crm/v3/properties/0-970/groups`
- Create property: `POST /crm/v3/properties/0-970`

This means you don't need to manually configure HubSpot properties - the system handles it automatically.

---

## 3. Implementation Tasks

### Task 1: Update Verify PIN Route

**File:** `app/api/verify-pin/route.ts`

**Current Implementation:**
```typescript
import { verifyPIN } from '@/lib/mockData';
```

**Change To:**
```typescript
import { getHubSpotClient } from '@/lib/hubspot';

export async function POST(request: NextRequest) {
  try {
    const { token, pin }: VerifyPINRequest = await request.json();

    // Validate input
    if (!token || !pin) {
      return NextResponse.json(
        { success: false, message: 'Token and PIN are required' },
        { status: 400 }
      );
    }

    // Use HubSpot client instead of mock data
    const client = await getHubSpotClient();
    const isValid = await client.verifyPin(token, pin);

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid PIN' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'PIN verified'
    });

  } catch (error) {
    console.error('PIN verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Verification failed' },
      { status: 500 }
    );
  }
}
```

**Testing:**
- Verify correct PIN returns `{ success: true }`
- Verify incorrect PIN returns `{ success: false }` with 401 status
- Check console for any HubSpot errors

---

### Task 2: Update Get SOW Data Route

**File:** `app/api/get-sow/route.ts`

**Current Implementation:**
```typescript
import { getSOWByToken } from '@/lib/mockData';
```

**Change To:**
```typescript
import { getHubSpotClient } from '@/lib/hubspot';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Use HubSpot client instead of mock data
    const client = await getHubSpotClient();
    const sowData = await client.getSOWData(token);

    if (!sowData) {
      return NextResponse.json(
        { error: 'SOW not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(sowData);

  } catch (error) {
    console.error('Get SOW error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SOW data' },
      { status: 500 }
    );
  }
}
```

**Testing:**
- Create a test project in HubSpot with required properties
- Verify data loads correctly in the UI
- Check that all sections display properly

---

### Task 3: Update Approve SOW Route

**File:** `app/api/approve-sow/route.ts`

**Current Implementation:**
```typescript
// Currently just returns success without updating anything
```

**Change To:**
```typescript
import { getHubSpotClient } from '@/lib/hubspot';

export async function POST(request: NextRequest) {
  try {
    const { token, email }: ApproveSOWRequest = await request.json();

    if (!token || !email) {
      return NextResponse.json(
        { success: false, message: 'Token and email are required' },
        { status: 400 }
      );
    }

    const client = await getHubSpotClient();

    // First, find the project by token
    const sowData = await client.getSOWData(token);
    if (!sowData) {
      return NextResponse.json(
        { success: false, message: 'SOW not found' },
        { status: 404 }
      );
    }

    // Update project properties (uses /crm/v3/objects/0-970/{projectId})
    const now = new Date().toISOString();
    await client.updateProject(sowData.projectId, {
      sow_status: 'approved',
      sow_accepted_date: now,
      sow_accepted_by: email,
    });

    return NextResponse.json({
      success: true,
      message: 'SOW approved successfully',
      approvedAt: now,
    });

  } catch (error) {
    console.error('Approve SOW error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to approve SOW' },
      { status: 500 }
    );
  }
}
```

**Testing:**
- Approve a SOW and verify HubSpot Project properties are updated
- Check that `sow_status` and `sow_accepted_date` are set correctly
- Verify UI shows approval state after page refresh

---

### Task 4: Update Reject SOW Route

**File:** `app/api/reject-sow/route.ts`

**Current Implementation:**
```typescript
// Currently just returns success without updating anything
```

**Change To:**
```typescript
import { getHubSpotClient } from '@/lib/hubspot';

export async function POST(request: NextRequest) {
  try {
    const { token, email, reason }: RejectSOWRequest = await request.json();

    if (!token || !email || !reason) {
      return NextResponse.json(
        { success: false, message: 'Token, email, and reason are required' },
        { status: 400 }
      );
    }

    const client = await getHubSpotClient();

    // First, find the project by token
    const sowData = await client.getSOWData(token);
    if (!sowData) {
      return NextResponse.json(
        { success: false, message: 'SOW not found' },
        { status: 404 }
      );
    }

    // Update project properties (uses /crm/v3/objects/0-970/{projectId})
    const now = new Date().toISOString();
    await client.updateProject(sowData.projectId, {
      sow_status: 'rejected',
      sow_rejected_date: now,
      sow_rejected_by: email,
      sow_rejected_reason: reason,
    });

    return NextResponse.json({
      success: true,
      message: 'SOW rejected successfully',
      rejectedAt: now,
    });

  } catch (error) {
    console.error('Reject SOW error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to reject SOW' },
      { status: 500 }
    );
  }
}
```

**Testing:**
- Reject a SOW with a reason
- Verify HubSpot Project properties are updated
- Check that rejection reason is stored correctly
- Verify UI shows rejection state after page refresh

---

### Task 5: (Optional) PDF Generation

**File:** `lib/hubspot-files.ts`

The file upload functionality is already implemented. You can optionally generate a PDF snapshot of the SOW when it's approved or rejected and attach it to the HubSpot deal.

**Implementation Approach:**

1. Install PDF generation library (if not already present):
   ```bash
   npm install puppeteer
   # or
   npm install jspdf html2canvas
   ```

2. Create PDF generation function in `lib/pdf-generator.ts`:
   ```typescript
   import { SOWData } from './types';

   export async function generateSOWPDF(sowData: SOWData): Promise<Buffer> {
     // Generate PDF from SOW data
     // Return PDF as Buffer
   }
   ```

3. Update approve/reject routes to generate and upload PDF:
   ```typescript
   import { uploadFileToHubSpot } from '@/lib/hubspot-files';
   import { generateSOWPDF } from '@/lib/pdf-generator';

   // After updating deal properties
   const pdfBuffer = await generateSOWPDF(sowData);
   const fileUrl = await uploadFileToHubSpot(
     pdfBuffer,
     `SOW_${token}_${sowData.status}.pdf`,
     sowData.dealId
   );
   ```

**Note:** This is optional and can be implemented later based on business requirements.

---

## 4. Architecture Reference

### Key Files

| File | Purpose |
|------|---------|
| `lib/hubspot.ts` | HubSpot client with all API methods |
| `lib/hubspot-setup.ts` | Self-healing property creation system |
| `lib/hubspot-files.ts` | File upload utilities |
| `lib/types.ts` | TypeScript interfaces for SOW data |
| `lib/constants.ts` | Configuration constants |

### HubSpot Client Methods

**Note:** All methods use the Projects API (`0-970`), not Deals.

```typescript
const client = await getHubSpotClient();

// Methods you'll use:
await client.verifyPin(token: string, pin: string): Promise<boolean>
await client.getSOWData(token: string): Promise<SOWData | null>
await client.updateProject(projectId: string, properties: object): Promise<void>
await client.searchProjects(filters: object): Promise<Project[]>

// Internal API calls:
// - Search: POST /crm/v3/objects/0-970/search
// - Get: GET /crm/v3/objects/0-970/{projectId}
// - Update: PATCH /crm/v3/objects/0-970/{projectId}
```

### Project Properties

All required HubSpot properties are defined in `SOW_PROPERTIES` array in `lib/hubspot.ts`:

**Core Properties:**
- `sow_token` - Unique URL identifier
- `sow_pin` - 4-digit PIN
- `sow_status` - 'pending' | 'approved' | 'rejected'
- `sow_accepted_date` - Approval timestamp
- `sow_rejected_date` - Rejection timestamp
- `sow_rejected_reason` - Rejection text

**System Details:**
- Customer info (name, phone, email)
- Sales rep info
- System specifications (size, panels, inverters)
- Financing details
- Commission breakdown
- Adders (optional costs)

The self-healing system automatically creates these properties in HubSpot on first run.

### Self-Healing Process

```
1. API Request → getHubSpotClient()
2. Check if properties exist on Projects (0-970) → ensurePropertiesExist()
3. If missing → Create properties via POST /crm/v3/properties/0-970
4. Mark setup as complete
5. Retry failed requests automatically
```

This runs once per application startup or when properties are deleted from HubSpot Projects.

---

## 5. Testing Checklist

### Pre-Integration Testing (Mock Data)

- [ ] App starts without errors: `npm run dev`
- [ ] Demo page loads: `http://localhost:3000/sow/demo-token-abc123xyz789`
- [ ] Can enter PIN (1234) and see SOW data
- [ ] Can approve SOW (updates localStorage)
- [ ] Can reject SOW (updates localStorage)
- [ ] All sections display correctly

### Post-Integration Testing (HubSpot)

#### Health Check
- [ ] `/api/health` returns `{ status: 'healthy' }` with valid token
- [ ] `/api/health` returns degraded status without token
- [ ] Console shows no HubSpot setup errors

#### Create Test Project in HubSpot
- [ ] Create a project (object type `0-970`) with minimum required properties:
  - `sow_token`: unique string (e.g., "test-token-001")
  - `sow_pin`: "1234"
  - `hs_name`: "Test Customer" (built-in project name property)
  - `system_size`: 10.5
  - `gross_ppw`: 3.50
  - `total_commission`: 5000

#### PIN Verification
- [ ] Correct PIN returns success
- [ ] Incorrect PIN returns 401 error
- [ ] Missing token/PIN returns 400 error

#### Get SOW Data
- [ ] SOW loads with valid token
- [ ] All data sections display correctly:
  - [ ] Deal Details
  - [ ] Customer Information
  - [ ] Sales Information
  - [ ] System Details
  - [ ] Financing Details
  - [ ] Commission Breakdown
  - [ ] Adders (if present)
  - [ ] Documents (if URLs provided)
- [ ] Missing token returns 404
- [ ] Invalid token returns 404

#### Approval Flow
- [ ] Can approve SOW
- [ ] HubSpot Project updates with:
  - [ ] `sow_status` = 'approved'
  - [ ] `sow_accepted_date` = timestamp
  - [ ] `sow_accepted_by` = email
- [ ] UI shows approved state
- [ ] Refresh shows persistent approved state

#### Rejection Flow
- [ ] Can reject SOW with reason
- [ ] HubSpot Project updates with:
  - [ ] `sow_status` = 'rejected'
  - [ ] `sow_rejected_date` = timestamp
  - [ ] `sow_rejected_by` = email
  - [ ] `sow_rejected_reason` = reason text
- [ ] UI shows rejected state
- [ ] Refresh shows persistent rejected state

#### Edge Cases
- [ ] Project without required properties shows graceful errors
- [ ] Expired or invalid HubSpot token shows appropriate error
- [ ] Network errors are handled gracefully
- [ ] Very long rejection reasons (2000 chars) work correctly

---

## 6. Troubleshooting

### Common Issues

#### 403 "The scope needed for this API call isn't available for public use"
**Cause:** HubSpot account not yet whitelisted for Projects API beta
**Status:** ⚠️ EXPECTED - Awaiting HubSpot approval (as of 2025-12-22)
**Solution:**
1. This is NOT a configuration error - our scopes are correct
2. Continue development using mock data (`lib/mockData.ts`)
3. Once HubSpot confirms whitelisting, the same token will work
4. Do NOT regenerate tokens or modify scopes - they're already correct
5. Check with HubSpot support for whitelisting status

**Note:** Remove this entry once whitelisting is confirmed.

---

#### "HUBSPOT_ACCESS_TOKEN is required"
**Cause:** Environment variable not set
**Solution:**
1. Create `.env.local` file in project root
2. Add: `HUBSPOT_ACCESS_TOKEN=your_token_here`
3. Restart dev server

#### "Property 'sow_token' does not exist"
**Cause:** Self-healing hasn't run or failed
**Solution:**
1. Check `/api/health` endpoint for setup status
2. Check console logs for property creation errors
3. System should auto-retry and create properties
4. If persistent, manually verify HubSpot API token permissions

#### 401 Unauthorized Errors
**Cause:** Invalid or expired HubSpot token
**Solution:**
1. Verify token in HubSpot settings
2. Ensure token has required **Projects** scopes (NOT Deals!):
   - `crm.objects.projects.read`
   - `crm.objects.projects.write`
   - `crm.schemas.projects.read`
   - `crm.schemas.projects.write`
3. Generate new token if needed

#### 404 Not Found on Valid Token
**Cause:** Project doesn't exist or search filter issues
**Solution:**
1. Verify project exists in HubSpot (object type `0-970`)
2. Check `sow_token` property value matches exactly
3. Verify property was created successfully (check `/api/health`)

#### Data Not Displaying in UI
**Cause:** Type mismatch or null values
**Solution:**
1. Check browser console for errors
2. Verify HubSpot property names match `lib/types.ts`
3. Check that required fields have values in HubSpot
4. Use `formatValue()` utility for optional fields

#### Self-Healing Not Working
**Cause:** Insufficient permissions or API rate limits
**Solution:**
1. Verify token has `crm.schemas.projects.write` permission (NOT deals!)
2. Check for rate limit errors in logs
3. Wait and retry if rate limited
4. Check HubSpot API status page

---

## 7. Environment Variables

### Required

```bash
# HubSpot access token (from implementation specialist)
HUBSPOT_ACCESS_TOKEN=your_private_app_token_here

# Base URL for generating SOW links (used in emails/webhooks)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Optional

```bash
# Node environment
NODE_ENV=development  # or 'production'

# Custom port (default: 3000)
PORT=3000
```

### HubSpot Token Requirements

**CRITICAL:** Your HubSpot private app token must have **Projects** scopes (NOT Deals!):
- `crm.objects.projects.read` - Read project data
- `crm.objects.projects.write` - Update project properties
- `crm.schemas.projects.read` - Read property definitions
- `crm.schemas.projects.write` - Create custom properties

**To create a private app token:**
1. Go to HubSpot Settings > Integrations > Private Apps
2. Click "Create private app"
3. Add required **Projects** scopes above (NOT deals!)
4. Generate token and copy to `.env.local`

**API Reference:** See `docs/PROJECTS_API_REFERENCE.md` for complete Projects API documentation.

---

## 8. Reference Documents

### Project Documentation

- **`CLAUDE.md`** - Complete project context and architecture
- **`sow-approval-system-prd.md`** - Product requirements document
- **`docs/human_checklist.md`** - Setup tasks for HubSpot admin
- **`docs/SELF_HEALING_CONSOLIDATED_FINDINGS.md`** - Code review findings

### Code Reference

- **`lib/types.ts`** - All TypeScript interfaces
- **`lib/hubspot.ts`** - HubSpot client implementation
- **`lib/utils.ts`** - Utility functions (formatters)
- **`components/sow/*`** - UI components for SOW sections

### External Documentation

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [HubSpot API Reference](https://developers.hubspot.com/docs/api/overview)
- [HubSpot Private Apps](https://developers.hubspot.com/docs/api/private-apps)

---

## 9. Next Steps After Integration

Once HubSpot integration is complete:

1. **Remove Mock Data**
   - Delete `lib/mockData.ts`
   - Remove all imports of mock functions
   - Remove localStorage usage in `lib/storage.ts` (optional)

2. **Production Deployment**
   - Set up production environment variables
   - Configure production HubSpot token
   - Set `NEXT_PUBLIC_BASE_URL` to production domain
   - Deploy to hosting platform (Vercel recommended)

3. **HubSpot Integration Setup (Two-Phase Architecture)**
   - **Phase 1 (Webhook):** Configure webhook subscription on `send_rep_commission_sow` property
     - Webhook calls `/api/generate-sow` to generate tokens and PINs
   - **Phase 2 (Workflow):** Create email workflow that triggers when token/PIN populated
     - Enrollment: `send_rep_commission_sow`=yes AND `sow_token` known AND `sow_pin` known
   - See `docs/human_checklist.md` for step-by-step setup

4. **Optional Enhancements**
   - Implement PDF generation (Task 5)
   - Add rate limiting to PIN verification
   - Add analytics/tracking
   - Add email notifications on approval/rejection
   - Implement audit logging

---

## 10. Support

If you encounter issues during implementation:

1. **Check Logs**: Look in terminal and browser console for errors
2. **Verify Token**: Test HubSpot token at `/api/health`
3. **Review Types**: Ensure data matches `lib/types.ts` interfaces
4. **Test Incrementally**: Complete one task at a time and test

**Questions?** Review the reference documents listed in Section 8.

---

## Quick Reference: Implementation Summary

**Remember:** All API calls use Projects object type `0-970`, NOT Deals!

```typescript
// Task 1: app/api/verify-pin/route.ts
const client = await getHubSpotClient();
const isValid = await client.verifyPin(token, pin);

// Task 2: app/api/get-sow/route.ts
const client = await getHubSpotClient();
const sowData = await client.getSOWData(token);

// Task 3: app/api/approve-sow/route.ts
const client = await getHubSpotClient();
await client.updateProject(projectId, {  // Uses PATCH /crm/v3/objects/0-970/{projectId}
  sow_status: 'approved',
  sow_accepted_date: new Date().toISOString(),
});

// Task 4: app/api/reject-sow/route.ts
const client = await getHubSpotClient();
await client.updateProject(projectId, {  // Uses PATCH /crm/v3/objects/0-970/{projectId}
  sow_status: 'rejected',
  sow_rejected_date: new Date().toISOString(),
  sow_rejected_reason: reason,
});
```

**API Reference:** See `docs/PROJECTS_API_REFERENCE.md` for complete Projects API documentation.

**Good luck with the integration!**
