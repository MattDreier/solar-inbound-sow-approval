# SOW Approval System - Backend Integration Guide

This document provides comprehensive technical documentation for integrating the Solar SOW Approval System frontend with HubSpot CRM and deploying to production.

**Last Updated:** December 22, 2024
**Status:** Ready for Implementation

## CRITICAL: Projects API (Not Deals!)

**This system uses HubSpot's Projects API (beta), NOT the Deals API.**

- **Object Type ID:** `0-970`
- **API Endpoints:** `/crm/v3/objects/0-970/*` instead of `/crm/v3/objects/deals/*`
- **Scopes:** `crm.objects.projects.*` instead of `crm.objects.deals.*`
- **Reference:** See `docs/PROJECTS_API_REFERENCE.md` for complete beta API documentation

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [HubSpot Custom Properties](#2-hubspot-custom-properties)
3. [HubSpot Workflow Configuration](#3-hubspot-workflow-configuration)
4. [API Endpoint Updates](#4-api-endpoint-updates)
5. [PDF Generation & Upload](#5-pdf-generation--upload)
6. [Token Generation Strategy](#6-token-generation-strategy)
7. [Environment Variables](#7-environment-variables)
8. [Deployment](#8-deployment)
9. [Testing Checklist](#9-testing-checklist)

---

## 1. Architecture Overview

### System Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PHASE 1: WEBHOOK (Token/PIN Generation)                   │
│                                                                             │
│   Trigger: send_rep_commission_sow changed to "yes"                         │
│   (via HubSpot Private App webhook subscription)                            │
│      │                                                                      │
│      ▼                                                                      │
│   ┌───────────────────────────────────────────────────────────────────┐    │
│   │ POST https://sow.sunvena.com/api/generate-sow                      │    │
│   │   • Generates unique sow_token                                     │    │
│   │   • Generates 4-digit sow_pin                                      │    │
│   │   • Updates Project: token, pin, sow_status="needs_review"         │    │
│   └───────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    PHASE 2: WORKFLOW (Email Delivery)                        │
│                                                                             │
│   Enrollment Criteria (ALL must be true):                                   │
│   • send_rep_commission_sow = "yes"                                         │
│   • sow_token is known (not empty)                                          │
│   • sow_pin is known (not empty)                                            │
│      │                                                                      │
│      ▼                                                                      │
│   ┌───────────────────┐                                                     │
│   │ Send Email        │  NOTE: Private apps cannot enroll records in        │
│   │ to sales_rep_email│  workflows programmatically. Phase 2 triggers       │
│   │ with {{sow_token}}│  independently when all conditions are met.         │
│   │ and {{sow_pin}}   │                                                     │
│   └───────────────────┘                                                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           VERCEL APPLICATION                                 │
│                                                                             │
│   Sales Rep clicks link: sow.sunvena.com/{token}                            │
│      │                                                                      │
│      ▼                                                                      │
│   ┌───────────────────┐     ┌───────────────────┐                          │
│   │ PIN Entry Page    │────▶│ POST /api/verify  │                          │
│   └───────────────────┘     │      -pin         │                          │
│      │                      └───────────────────┘                          │
│      │ PIN Valid                     │                                      │
│      ▼                               │ Validates against HubSpot           │
│   ┌───────────────────┐              │                                      │
│   │ SOW Display Page  │◀─────────────┘                                      │
│   │ (data from        │                                                     │
│   │  HubSpot deal)    │                                                     │
│   └───────────────────┘                                                     │
│      │                                                                      │
│      │ User clicks Approve/Reject                                           │
│      ▼                                                                      │
│   ┌───────────────────┐     ┌───────────────────┐     ┌──────────────────┐ │
│   │ Confirmation      │────▶│ Generate PDF      │────▶│ Upload to        │ │
│   │ Modal             │     │ (Puppeteer)       │     │ HubSpot Files    │ │
│   └───────────────────┘     └───────────────────┘     └──────────────────┘ │
│                                                              │              │
│                              ┌───────────────────────────────┘              │
│                              ▼                                              │
│                        ┌───────────────────┐     ┌──────────────────┐      │
│                        │ Create Note with  │────▶│ Update Deal      │      │
│                        │ PDF Attachment    │     │ Status           │      │
│                        └───────────────────┘     └──────────────────┘      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Integration Points

| Component | Current (Mock) | Production |
|-----------|---------------|------------|
| Data Source | `lib/mockData.ts` | HubSpot Projects API (`0-970`) |
| State Storage | `localStorage` | HubSpot Project Properties |
| File Storage | `/public/dummy-data/` | HubSpot Files API |
| Authentication | Static PIN in mock | HubSpot `sow_pin` property (on Project) |

---

## 2. HubSpot Custom Properties

### 2.1 Automatic Property Creation (Self-Healing)

**IMPORTANT:** Properties are created on the **Projects** object (`0-970`), NOT Deals.

**The app automatically creates all required custom properties on first API call.**

This is handled by `lib/hubspot-setup.ts` which:
1. Creates the `sow_approval` property group via `POST /crm/v3/properties/0-970/groups`
2. Creates all 9 required SOW properties via `POST /crm/v3/properties/0-970`
3. Safely skips any properties that already exist (409 Conflict = skip)
4. Logs all actions for visibility

**No manual property creation is required.** The app ensures its own dependencies exist.

To verify setup status, hit the health endpoint:
```
GET https://sow.sunvena.com/api/health
```

### 2.2 Required Custom Properties (Auto-Created)

These properties are created automatically. **Internal names must match exactly** as they're referenced in code.

#### SOW Metadata Properties

| Property Name | Label | Type | Field Type | Notes |
|--------------|-------|------|------------|-------|
| `sow_token` | SOW Token | string | text | Unique, used in URL |
| `sow_pin` | SOW PIN | string | text | 4-digit verification |
| `sow_status` | SOW Status | enumeration | select | See options below |
| `sow_needs_review_date` | SOW Needs Review Date | datetime | date | Workflow trigger date |
| `sow_accepted_date` | SOW Accepted Date | datetime | date | Approval timestamp |
| `sow_rejected_date` | SOW Rejected Date | datetime | date | Rejection timestamp |
| `sow_rejected_reason` | SOW Rejected Reason | string | textarea | Max 2000 chars |
| `accepted_sow` | Accepted SOW Files | string | file | Multi-file upload |
| `rejected_sow` | Rejected SOW Files | string | file | Multi-file upload |

#### SOW Status Enumeration Options

```json
{
  "name": "sow_status",
  "label": "SOW Status",
  "type": "enumeration",
  "fieldType": "select",
  "groupName": "sow_approval",
  "options": [
    { "label": "Not Ready", "value": "not_ready", "displayOrder": 0 },
    { "label": "Needs Review", "value": "needs_review", "displayOrder": 1 },
    { "label": "Approved", "value": "approved", "displayOrder": 2 },
    { "label": "Rejected", "value": "rejected", "displayOrder": 3 }
  ]
}
```

### 2.3 Existing Properties to Verify

These properties should already exist on your **Project** records (object type `0-970`). Verify their internal names match:

**Built-in Project Properties:**
- `hs_name` - Project name (built-in, equivalent to `dealname` on deals)

**Customer Information:**
- `customer_phone`
- `customer_email`
- `customer_address`

**Sales Information:**
- `sales_rep_name`
- `sales_rep_email`
- `setter`
- `lead_source`

**System Specifications:**
- `system_size`
- `panel_type`
- `panel_count`
- `inverter_type`
- `inverter_count`
- `battery_type`
- `battery_count`

**Financing:**
- `lender`
- `term_length`
- `finance_type`
- `interest_rate`
- `total_contract_amount`
- `dealer_fee_amount`

**Adders (32 optional fields):**
- `additional_wire_run`, `battery_adder`, `battery_inside_garage`, `battery_on_mobile_home`, `concrete_coated`, `detach_and_reset`, `ground_mount`, `high_roof`, `inverter_adder`, `level2_charger_install`, `lightreach_adder`, `metal_roof`, `meter_main`, `mpu`, `misc_electrical`, `module_adder`, `mounting_adder`, `new_roof`, `project_hats`, `span_smart_panel`, `solar_insure`, `solar_insure_with_battery`, `steep_roof`, `structural_reinforcement`, `tesla_ev_charger`, `tier2_insurance`, `tile_roof_metal_shingle`, `travel_adder`, `tree_trimming`, `trench_over_100ft`, `wallbox_charger`, `subpanel_100a`
- `adders_total` (calculated)

**Commission:**
- `gross_ppw`
- `total_adders_ppw`
- `net_ppw`
- `total_commission`

**Files:**
- `proposal_image` (URL to proposal visualization)
- `plan_file` (URL to installation plan PDF)

### 2.4 Property Creation Script

See `scripts/create-hubspot-properties.ts` for automated property creation.

---

## 3. HubSpot Integration Configuration

### 3.1 Two-Phase Architecture

**Why Two Phases?** Private apps cannot programmatically enroll records in workflows. Therefore:

1. **Phase 1 (Webhook):** Generates token/PIN when `send_rep_commission_sow` = "yes"
2. **Phase 2 (Workflow):** Sends email when token/PIN are populated

### 3.2 Phase 1: Webhook Subscription

Configure in your HubSpot Private App settings:

**Webhook Configuration:**
```json
{
  "subscriptionType": "object.propertyChange",
  "objectType": "0-970",
  "propertyName": "send_rep_commission_sow",
  "targetUrl": "https://sow.sunvena.com/api/generate-sow"
}
```

**The `/api/generate-sow` endpoint will:**
1. Verify the request is from HubSpot (signature validation)
2. Check if new value is "yes" (ignore other changes)
3. Generate unique `sow_token` and 4-digit `sow_pin`
4. Update the Project with token, PIN, and `sow_status` = "needs_review"
5. Return 200 OK

### 3.3 Phase 2: HubSpot Workflow

**IMPORTANT:** Create a **Project-based** workflow, NOT a Deal-based workflow.

**Workflow Name:** "SOW Email to Rep"

**Enrollment Criteria (ALL must be true):**
- `send_rep_commission_sow` = "yes"
- `sow_token` is known (not empty)
- `sow_pin` is known (not empty)

**Re-enrollment:** Enable "Re-enroll when criteria met again" for re-sends.

**Action:** Send email to `{{sales_rep_email}}` with personalization tokens

### 3.4 Why No Custom Code Block?

The previous architecture used a workflow custom code block to generate tokens. The new architecture moves this to the webhook endpoint because:

1. **Webhook fires immediately** when property changes (no workflow delay)
2. **Better error handling** in a full Node.js/Next.js environment
3. **Self-healing properties** are available in the API route
4. **Cleaner separation:** Webhook = data generation, Workflow = email delivery

### 3.4 Email Template Configuration

In the "Send email" action, use these personalization tokens:

**Note:** Use Project property tokens (with `hs_name` for project name):

```
Subject: Action Required: SOW Review for {{hs_name}}

Body:
Hi {{sales_rep_name}},

A new Scope of Work is ready for your review.

Customer: {{hs_name}}
System Size: {{system_size}} kW

Click here to review: {{custom.sow_link}}

Your PIN: {{custom.sow_pin}}

This link will expire when the SOW status changes.

Thanks,
Sunvena Solar Team
```

### 3.5 Integration Steps Summary

**Phase 1 (Webhook):**
1. **Trigger:** Private app webhook on `send_rep_commission_sow` property change
2. **Condition:** New value = "yes"
3. **Action:** `/api/generate-sow` generates token/PIN and updates Project

**Phase 2 (Workflow):**
1. **Enrollment:** `send_rep_commission_sow` = "yes" AND `sow_token` known AND `sow_pin` known
2. **Action:** Send email to `{{sales_rep_email}}` with link and PIN

---

## 4. API Endpoint Updates

**IMPORTANT:** All endpoints use HubSpot Projects API (`0-970`), NOT Deals.

### 4.1 GET /api/get-sow

**Current:** Returns mock data from `lib/mockData.ts`

**Updated Implementation:**

```typescript
// app/api/get-sow/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { HubSpotClient } from '@/lib/hubspot';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 });
  }

  try {
    const client = new HubSpotClient();

    // Search for project by sow_token (uses POST /crm/v3/objects/0-970/search)
    const searchResponse = await client.searchProjects({
      filterGroups: [{
        filters: [{
          propertyName: 'sow_token',
          operator: 'EQ',
          value: token
        }]
      }],
      properties: [
        // All properties listed in section 2.3
        'hs_name', 'customer_phone', 'customer_email', 'customer_address',
        'sales_rep_name', 'sales_rep_email', 'setter', 'lead_source',
        'system_size', 'panel_type', 'panel_count', 'inverter_type',
        'inverter_count', 'battery_type', 'battery_count',
        'lender', 'term_length', 'finance_type', 'interest_rate',
        'total_contract_amount', 'dealer_fee_amount',
        // ... all adder properties
        'gross_ppw', 'total_adders_ppw', 'net_ppw', 'total_commission',
        'proposal_image', 'plan_file',
        'sow_status', 'sow_accepted_date', 'sow_rejected_date', 'sow_rejected_reason'
      ],
      limit: 1
    });

    if (searchResponse.results.length === 0) {
      return NextResponse.json({ error: 'SOW not found' }, { status: 404 });
    }

    const project = searchResponse.results[0];
    const sowData = mapProjectToSOWData(project);

    return NextResponse.json(sowData);

  } catch (error) {
    console.error('Error fetching SOW:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### 4.2 POST /api/verify-pin

**Updated Implementation:**

```typescript
// app/api/verify-pin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { HubSpotClient } from '@/lib/hubspot';

export async function POST(request: NextRequest) {
  const { token, pin } = await request.json();

  if (!token || !pin) {
    return NextResponse.json({ error: 'Token and PIN required' }, { status: 400 });
  }

  try {
    const client = new HubSpotClient();

    // Search for project by token (uses POST /crm/v3/objects/0-970/search)
    const searchResponse = await client.searchProjects({
      filterGroups: [{
        filters: [{
          propertyName: 'sow_token',
          operator: 'EQ',
          value: token
        }]
      }],
      properties: ['sow_pin', 'sow_status'],
      limit: 1
    });

    if (searchResponse.results.length === 0) {
      return NextResponse.json({ valid: false, error: 'Invalid token' }, { status: 401 });
    }

    const project = searchResponse.results[0];
    const storedPin = project.properties.sow_pin;
    const status = project.properties.sow_status;

    // Check if SOW is still reviewable
    if (status !== 'needs_review') {
      return NextResponse.json({
        valid: false,
        error: `SOW already ${status}`
      }, { status: 400 });
    }

    // Validate PIN
    if (pin !== storedPin) {
      return NextResponse.json({ valid: false, error: 'Invalid PIN' }, { status: 401 });
    }

    return NextResponse.json({ valid: true });

  } catch (error) {
    console.error('PIN verification error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### 4.3 POST /api/approve-sow

**Updated Implementation:**

```typescript
// app/api/approve-sow/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { HubSpotClient } from '@/lib/hubspot';
import { generatePDF } from '@/lib/pdf-generator';
import { uploadFileToHubSpot, createNoteWithAttachment } from '@/lib/hubspot-files';

export async function POST(request: NextRequest) {
  const { token, approverEmail } = await request.json();

  if (!token || !approverEmail) {
    return NextResponse.json({ error: 'Token and approver email required' }, { status: 400 });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(approverEmail)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
  }

  try {
    const client = new HubSpotClient();

    // Find the project
    const project = await client.findProjectByToken(token);
    if (!project) {
      return NextResponse.json({ error: 'SOW not found' }, { status: 404 });
    }

    const projectId = project.id;
    const approvedAt = new Date().toISOString();

    // Step 1: Generate PDF of the approved SOW
    const pdfBuffer = await generatePDF(token);

    // Step 2: Upload PDF to HubSpot
    const fileId = await uploadFileToHubSpot(
      pdfBuffer,
      `SOW-Approved-${token}.pdf`,
      '/SOW-Approvals'
    );

    // Step 3: Create note with PDF attachment
    const noteBody = `✅ SOW APPROVED

Approved by: ${approverEmail.toUpperCase()}
Approved at: ${new Date().toLocaleString('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short'
})}

The signed SOW document is attached to this note.`;

    await createNoteWithAttachment(projectId, noteBody, fileId);

    // Step 4: Update project properties
    await client.updateProject(projectId, {
      sow_status: 'approved',
      sow_accepted_date: approvedAt,
      accepted_sow: fileId // Store file reference
    });

    return NextResponse.json({
      success: true,
      approvedAt
    });

  } catch (error) {
    console.error('Approval error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### 4.4 POST /api/reject-sow

**Updated Implementation:**

```typescript
// app/api/reject-sow/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { HubSpotClient } from '@/lib/hubspot';
import { generatePDF } from '@/lib/pdf-generator';
import { uploadFileToHubSpot, createNoteWithAttachment } from '@/lib/hubspot-files';

export async function POST(request: NextRequest) {
  const { token, reason, rejecterEmail } = await request.json();

  if (!token || !reason || !rejecterEmail) {
    return NextResponse.json({
      error: 'Token, reason, and rejecter email required'
    }, { status: 400 });
  }

  // Validate inputs
  if (reason.length > 2000) {
    return NextResponse.json({ error: 'Reason too long (max 2000 chars)' }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(rejecterEmail)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
  }

  try {
    const client = new HubSpotClient();

    // Find the project
    const project = await client.findProjectByToken(token);
    if (!project) {
      return NextResponse.json({ error: 'SOW not found' }, { status: 404 });
    }

    const projectId = project.id;
    const rejectedAt = new Date().toISOString();

    // Step 1: Generate PDF of the rejected SOW
    const pdfBuffer = await generatePDF(token);

    // Step 2: Upload PDF to HubSpot
    const fileId = await uploadFileToHubSpot(
      pdfBuffer,
      `SOW-Rejected-${token}.pdf`,
      '/SOW-Rejections'
    );

    // Step 3: Create note with PDF attachment
    const noteBody = `❌ SOW REJECTED

Rejected by: ${rejecterEmail.toUpperCase()}
Rejected at: ${new Date().toLocaleString('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short'
})}

Rejection Reason:
${reason}

The SOW document at time of rejection is attached to this note.`;

    await createNoteWithAttachment(projectId, noteBody, fileId);

    // Step 4: Update project properties
    await client.updateProject(projectId, {
      sow_status: 'rejected',
      sow_rejected_date: rejectedAt,
      sow_rejected_reason: reason,
      rejected_sow: fileId
    });

    return NextResponse.json({
      success: true,
      rejectedAt
    });

  } catch (error) {
    console.error('Rejection error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

---

## 5. PDF Generation & Upload

### 5.1 Dependencies

```bash
npm install puppeteer-core @sparticuz/chromium-min
npm install --save-dev puppeteer  # For local development
```

### 5.2 PDF Generator Module

```typescript
// lib/pdf-generator.ts
import chromium from '@sparticuz/chromium-min';
import puppeteer from 'puppeteer-core';

export async function generatePDF(token: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 1200, height: 800 },
    executablePath: process.env.VERCEL
      ? await chromium.executablePath(
          '/opt/nodejs/node_modules/@sparticuz/chromium-min/bin'
        )
      : process.platform === 'darwin'
        ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        : '/usr/bin/google-chrome',
    headless: chromium.headless,
  });

  try {
    const page = await browser.newPage();

    // Navigate to the SOW page with print mode
    // The ?print=true param should hide interactive elements
    await page.goto(
      `${process.env.NEXT_PUBLIC_BASE_URL}/sow/${token}?print=true`,
      { waitUntil: 'networkidle0', timeout: 30000 }
    );

    // Wait for any lazy-loaded content
    await page.waitForSelector('[data-print-ready="true"]', { timeout: 10000 });

    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm'
      }
    });

    return Buffer.from(pdf);

  } finally {
    await browser.close();
  }
}
```

### 5.3 HubSpot File Upload Module

```typescript
// lib/hubspot-files.ts

const HUBSPOT_API_BASE = 'https://api.hubapi.com';

export async function uploadFileToHubSpot(
  fileBuffer: Buffer,
  fileName: string,
  folderPath: string
): Promise<string> {
  const formData = new FormData();
  formData.append('file', new Blob([fileBuffer]), fileName);
  formData.append('folderPath', folderPath);
  formData.append('options', JSON.stringify({
    access: 'PRIVATE'
  }));

  const response = await fetch(`${HUBSPOT_API_BASE}/files/v3/files`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error(`File upload failed: ${response.statusText}`);
  }

  const result = await response.json();
  const fileId = result.id;

  // Workaround: Set privacy again after upload (HubSpot bug)
  await fetch(`${HUBSPOT_API_BASE}/files/v3/files/${fileId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ access: 'PRIVATE' })
  });

  return fileId;
}

export async function createNoteWithAttachment(
  projectId: string,
  noteBody: string,
  fileId: string
): Promise<void> {
  const response = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/notes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        hs_timestamp: new Date().toISOString(),
        hs_note_body: noteBody,
        hs_attachment_ids: fileId
      },
      associations: [{
        to: { id: projectId },
        types: [{
          associationCategory: 'HUBSPOT_DEFINED',
          associationTypeId: 1248  // Project to Note
        }]
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`Note creation failed: ${response.statusText}`);
  }
}
```

### 5.4 Vercel Configuration

```json
// vercel.json
{
  "functions": {
    "app/api/approve-sow/route.ts": {
      "maxDuration": 60,
      "memory": 1024
    },
    "app/api/reject-sow/route.ts": {
      "maxDuration": 60,
      "memory": 1024
    }
  }
}
```

### 5.5 Print Mode Styling

Add print-specific styles to hide interactive elements:

```css
/* In your global CSS or component styles */
@media print, screen and (min-width: 0px) {
  .print-mode .no-print {
    display: none !important;
  }

  .print-mode [data-print-ready] {
    break-inside: avoid;
  }
}
```

Update the page component to detect print mode:

```typescript
// In app/sow/[token]/page.tsx
const searchParams = useSearchParams();
const isPrintMode = searchParams.get('print') === 'true';

// Add to root element:
<div className={isPrintMode ? 'print-mode' : ''} data-print-ready="true">
```

---

## 6. Token Generation Strategy

### URL Format

As requested: `sow.sunvena.com/{projectId}-{needs_review_date}`

Example: `sow.sunvena.com/12345678-20241222`

### Token Generation (in HubSpot Workflow)

```javascript
// Token format: {projectId}-{YYYYMMDD}
const needsReviewDate = project.properties.sow_needs_review_date;
const dateStr = new Date(needsReviewDate)
  .toISOString()
  .split('T')[0]
  .replace(/-/g, '');
const token = `${projectId}-${dateStr}`;
```

### Security Considerations

- Token is predictable but requires PIN for access
- PIN is randomly generated 4-digit number
- Consider rate limiting PIN attempts (not implemented in prototype)

---

## 7. Environment Variables

### Required Variables

```env
# HubSpot Integration
HUBSPOT_ACCESS_TOKEN=pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Application
NEXT_PUBLIC_BASE_URL=https://sow.sunvena.com
NODE_ENV=production

# Optional: PDF Generation debugging
DEBUG_PDF=false
```

### Vercel Environment Configuration

Add these in Vercel Dashboard → Settings → Environment Variables:

| Variable | Value | Environments |
|----------|-------|--------------|
| `HUBSPOT_ACCESS_TOKEN` | `pat-na1-...` | Production |
| `NEXT_PUBLIC_BASE_URL` | `https://sow.sunvena.com` | Production |
| `NEXT_PUBLIC_BASE_URL` | `http://localhost:3000` | Development |

---

## 8. Deployment

### 8.1 Vercel Deployment Checklist

1. Connect repository to Vercel
2. Configure environment variables
3. Add custom domain: `sow.sunvena.com`
4. Verify SSL certificate generation
5. Test with demo data

### 8.2 DNS Configuration

See `vercel-custom-domain-setup.md` for detailed instructions.

**Quick Reference:**

| Record | Name | Value |
|--------|------|-------|
| CNAME | sow | cname.vercel-dns.com |
| TXT | _vercel | (from Vercel dashboard) |

---

## 9. Testing Checklist

### Pre-Deployment

- [ ] All environment variables configured
- [ ] HubSpot custom properties created
- [ ] HubSpot workflow created and published
- [ ] DNS records configured
- [ ] SSL certificate verified

### Functional Testing

- [ ] Webhook triggers on `send_rep_commission_sow = yes`
- [ ] Workflow enrolls when token and PIN are populated
- [ ] Email sent with correct link and PIN
- [ ] PIN verification works
- [ ] SOW displays with all data from HubSpot
- [ ] Approval flow:
  - [ ] Confirmation modal appears
  - [ ] PDF generates correctly
  - [ ] PDF uploads to HubSpot
  - [ ] Note created with attachment
  - [ ] Project status updated to `approved`
- [ ] Rejection flow:
  - [ ] Modal with reason field appears
  - [ ] Reason validated (max 2000 chars)
  - [ ] PDF generates correctly
  - [ ] PDF uploads to HubSpot
  - [ ] Note created with attachment and reason
  - [ ] Project status updated to `rejected`

### Edge Cases

- [ ] Invalid token returns 404
- [ ] Invalid PIN returns 401
- [ ] Already approved/rejected SOW shows correct state
- [ ] Network errors handled gracefully
- [ ] Large rejection reasons (near 2000 chars) work

---

## Appendix: File Structure

After integration, new/modified files:

```
lib/
├── hubspot.ts              # HubSpot API client
├── hubspot-setup.ts        # Self-healing property creation
├── hubspot-files.ts        # File upload utilities
├── pdf-generator.ts        # Puppeteer PDF generation
└── types.ts                # Updated (no changes needed)

app/api/
├── health/route.ts         # NEW: Health check endpoint
├── verify-pin/route.ts     # Updated: HubSpot validation
├── get-sow/route.ts        # Updated: HubSpot data fetch
├── approve-sow/route.ts    # Updated: Full approval flow
└── reject-sow/route.ts     # Updated: Full rejection flow

scripts/
└── create-hubspot-properties.ts  # Optional: Manual setup script (not needed)

# DELETE after integration:
lib/mockData.ts
lib/storage.ts
public/dummy-data/
```
