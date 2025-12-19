# Product Requirements Document: Scope of Work Approval System

**Document Version:** 1.0  
**Last Updated:** December 19, 2024  
**Author:** [Your Name]  
**Status:** Draft

---

## Executive Summary

This document outlines the requirements for building an internal Scope of Work (SOW) approval system that integrates with HubSpot CRM. The system generates a web-based SOW summary page from deal data, sends it to sales representatives for review, and captures their approval or rejection with a simple PIN-based authentication flow.

**Business Goal:** Streamline the handoff between design completion and sales approval by providing sales reps with a clear, consolidated view of deal details and enabling one-click approval without requiring HubSpot access.

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Solution Overview](#solution-overview)
3. [User Personas](#user-personas)
4. [System Architecture](#system-architecture)
5. [Functional Requirements](#functional-requirements)
6. [Data Model](#data-model)
7. [User Flows](#user-flows)
8. [Page Specifications](#page-specifications)
9. [API Specifications](#api-specifications)
10. [Security Requirements](#security-requirements)
11. [Integration Requirements](#integration-requirements)
12. [Non-Functional Requirements](#non-functional-requirements)
13. [Success Metrics](#success-metrics)
14. [Implementation Phases](#implementation-phases)
15. [Open Questions & Decisions](#open-questions--decisions)
16. [Appendix](#appendix)

---

## Problem Statement

When the design team completes solar installation plans, sales representatives need to review and approve the Scope of Work before the project proceeds. Currently, this process lacks a standardized, self-service review mechanism.

**Challenges:**
- Sales reps are independent contractors who may not have HubSpot logins
- Deal data is spread across multiple HubSpot properties, making it difficult to get a consolidated view
- No formal approval workflow exists to capture rep sign-off
- No audit trail of who approved what and when

---

## Solution Overview

Build a lightweight external web application that:

1. **Generates** a unique SOW page for each deal when design is marked complete
2. **Secures** access via a simple PIN sent to the sales rep's email
3. **Displays** all relevant deal information in a clean, read-only format
4. **Captures** approval or rejection with optional feedback
5. **Updates** HubSpot deal properties to reflect the decision

### Key Design Principles

- **HubSpot as source of truth** — All data lives in HubSpot; the app is a read/write interface
- **Zero friction for reps** — One link, one PIN, one click to approve
- **Native HubSpot features** — Leverage workflows, custom properties, and the existing Private App
- **Simple infrastructure** — Static-ish site on Netlify with serverless functions

---

## User Personas

### Primary: Sales Representative (Independent Contractor)

- **Access:** Email only (no HubSpot login)
- **Technical proficiency:** Low to medium
- **Goals:** Quickly review SOW accuracy, approve to move deal forward
- **Frustrations:** Too many systems, complicated logins, unclear what they're approving

### Secondary: Design Team Member

- **Access:** Full HubSpot access
- **Goals:** Hand off completed designs efficiently, get quick approval to proceed
- **Frustrations:** Chasing reps for approval, unclear approval status

### Tertiary: Operations/Admin

- **Access:** Full HubSpot access
- **Goals:** Track approval status, troubleshoot issues, view rejection reasons
- **Frustrations:** Lack of visibility into where deals are stuck

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              HubSpot                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Deal Record                                                            │
│  ├── [Existing Properties]                                              │
│  │   ├── Customer name, phone, email                                    │
│  │   ├── Sales rep name, email                                          │
│  │   ├── System details (size, panel type, count, inverter, battery)   │
│  │   ├── Financing details (lender, term, type, rate, amount)          │
│  │   ├── Adder details (itemized costs)                                │
│  │   ├── Commission breakdown (gross PPW, adders, net PPW, total)      │
│  │   ├── proposal_image (URL from Files app)                           │
│  │   ├── plan_file (URL from Files app)                                │
│  │   └── design_status                                                  │
│  │                                                                      │
│  └── [New Properties]                                                   │
│      ├── sow_token (string) — unique URL identifier                    │
│      ├── sow_pin (string) — 6-digit verification code                  │
│      ├── sow_generated_at (datetime)                                   │
│      ├── sow_approved_at (datetime)                                    │
│      ├── sow_approved_by (string) — email of approver                  │
│      └── plans_rejection_reason (multi-line text)                      │
│                                                                         │
│  Workflow: "SOW Generation Trigger"                                    │
│  ├── Trigger: design_status = "plans_complete"                         │
│  ├── Action 1: Webhook POST to /api/generate-sow                       │
│  └── Action 2: Send email to sales rep (after webhook completes)       │
│                                                                         │
│  Private App: "Files" (existing)                                       │
│  └── Used for proposal_image and plan_file storage                     │
│                                                                         │
│  Private App: "SOW System" (new or extend existing)                    │
│  └── Scopes: crm.objects.deals.read, crm.objects.deals.write           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Netlify (Web Application)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Frontend (Static/SSR)                                                 │
│  ├── /sow/[token]           → PIN entry page                           │
│  ├── /sow/[token]/view      → SOW display page (after PIN verified)   │
│  └── /sow/[token]/approved  → Approved confirmation state              │
│                                                                         │
│  Serverless Functions (Netlify Functions)                              │
│  ├── /api/generate-sow      → Webhook receiver from HubSpot           │
│  ├── /api/verify-pin        → PIN verification endpoint               │
│  ├── /api/get-sow           → Fetch deal data for display             │
│  ├── /api/approve-sow       → Handle approval action                  │
│  └── /api/reject-sow        → Handle rejection action                 │
│                                                                         │
│  Environment Variables                                                 │
│  ├── HUBSPOT_ACCESS_TOKEN   → Private app access token                │
│  └── WEBHOOK_SECRET         → Verify webhook authenticity             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Functional Requirements

### FR-1: SOW Generation

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1.1 | System shall generate a unique SOW token (URL-safe, 24+ characters) when triggered | Must |
| FR-1.2 | System shall generate a random 6-digit PIN for each SOW | Must |
| FR-1.3 | System shall store token and PIN on the deal record via HubSpot API | Must |
| FR-1.4 | System shall record generation timestamp on the deal | Must |
| FR-1.5 | Webhook endpoint shall validate request authenticity using shared secret | Must |
| FR-1.6 | System shall handle duplicate triggers gracefully (idempotent) | Should |

### FR-2: Email Notification

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-2.1 | HubSpot workflow shall send email to sales rep after SOW generation | Must |
| FR-2.2 | Email shall contain the SOW URL with embedded token | Must |
| FR-2.3 | Email shall contain the 6-digit PIN | Must |
| FR-2.4 | Email shall include customer name and deal identifier for context | Must |
| FR-2.5 | Email shall use a branded template consistent with company standards | Should |

### FR-3: PIN Verification

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-3.1 | SOW page shall require PIN entry before displaying deal data | Must |
| FR-3.2 | System shall verify PIN against deal record via HubSpot API | Must |
| FR-3.3 | System shall allow unlimited PIN attempts (no lockout) | Must |
| FR-3.4 | System shall display clear error message for incorrect PIN | Must |
| FR-3.5 | System shall set session cookie (24hr) after successful PIN entry | Should |
| FR-3.6 | System shall allow re-entry via PIN if session expires | Should |

### FR-4: SOW Display

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-4.1 | Page shall display customer name as header | Must |
| FR-4.2 | Page shall display Deal Details section (name, phone, email, sales rep, setter, lead source) | Must |
| FR-4.3 | Page shall display System Details section (size, panel type, count, inverter type/count, battery type/count) | Must |
| FR-4.4 | Page shall display Financing Details section (lender, term, type, rate, contract amount, dealer fee) | Must |
| FR-4.5 | Page shall display Adder Details section (itemized list with costs) | Must |
| FR-4.6 | Page shall display Commission Breakdown section (gross PPW, adders PPW, net PPW, total) | Must |
| FR-4.7 | Page shall display Proposal image from proposal_image property | Must |
| FR-4.8 | Page shall display Plan image/PDF from plan_file property | Must |
| FR-4.9 | Page shall display disclaimer: "This is subject to change after pre-production upload and installation" | Must |
| FR-4.10 | All monetary values shall be formatted with $ and appropriate decimals | Must |
| FR-4.11 | Empty/null values shall display as "-" | Must |

### FR-5: Approval Flow

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-5.1 | Page shall display "Approve" button at bottom when status is pending | Must |
| FR-5.2 | Clicking Approve shall update deal property design_status to "plans_approved" | Must |
| FR-5.3 | System shall record approval timestamp in sow_approved_at | Must |
| FR-5.4 | System shall record approver email in sow_approved_by | Must |
| FR-5.5 | After approval, page shall display "Approved" badge and hide action buttons | Must |
| FR-5.6 | Approval action shall be idempotent (multiple clicks don't cause issues) | Must |

### FR-6: Rejection Flow

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-6.1 | Page shall display "Reject" button alongside Approve button | Must |
| FR-6.2 | Clicking Reject shall open a modal/form with required text field | Must |
| FR-6.3 | Rejection reason text field shall be required (non-empty) | Must |
| FR-6.4 | Rejection reason shall be saved to plans_rejection_reason property | Must |
| FR-6.5 | System shall update design_status to "plans_rejected" | Must |
| FR-6.6 | After rejection, page shall display "Rejected" state with submitted reason | Should |

### FR-7: State Handling

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-7.1 | If deal already approved, page shall show approved state (no action buttons) | Must |
| FR-7.2 | If deal already rejected, page shall show rejected state with reason | Must |
| FR-7.3 | If token is invalid, page shall show "SOW not found" error | Must |
| FR-7.4 | If deal is deleted in HubSpot, page shall handle gracefully | Should |

---

## Data Model

### New HubSpot Deal Properties

| Property Name | Internal Name | Type | Description |
|---------------|---------------|------|-------------|
| SOW Token | `sow_token` | Single-line text | Unique URL identifier (24 char alphanumeric) |
| SOW PIN | `sow_pin` | Single-line text | 6-digit verification code |
| SOW Generated At | `sow_generated_at` | Date picker | Timestamp when SOW was generated |
| SOW Approved At | `sow_approved_at` | Date picker | Timestamp when rep approved |
| SOW Approved By | `sow_approved_by` | Single-line text | Email of approving rep |
| Plans Rejection Reason | `plans_rejection_reason` | Multi-line text | Free text explanation for rejection |

### Existing Properties Referenced (Verify These Exist)

**Deal Details:**
- `dealname` or customer name property
- `customer_phone`
- `customer_email`
- `sales_rep_name`
- `sales_rep_email`
- `setter`
- `lead_source`

**System Details:**
- `system_size`
- `panel_type`
- `panel_count`
- `inverter_type`
- `inverter_count`
- `battery_type`
- `battery_count`

**Financing Details:**
- `lender`
- `term_length`
- `finance_type`
- `interest_rate`
- `total_contract_amount`
- `dealer_fee_amount`

**Adder Details:**
- `additional_wire_run`
- `battery_adder`
- `battery_inside_garage`
- `battery_on_mobile_home`
- `concrete_coated`
- `detach_and_reset`
- `ground_mount`
- `high_roof`
- `inverter_adder`
- `level_2_charger_install`
- `lightreach_adder`
- `metal_roof`
- `meter_main`
- `mpu`
- `misc_electrical`
- `module_adder`
- `mounting_adder`
- `new_roof`
- `project_hats`
- `span_smart_panel`
- `solar_insure`
- `solar_insure_with_battery`
- `steep_roof`
- `structural_reinforcement`
- `tesla_ev_charger`
- `tier_2_insurance`
- `tile_roof_metal_shingle`
- `travel_adder`
- `tree_trimming`
- `trench_over_100ft`
- `wallbox_charger`
- `subpanel_100a`
- `adders_total`

**Commission Breakdown:**
- `gross_ppw`
- `total_adders_ppw`
- `net_ppw`
- `total_commission`

**Files:**
- `proposal_image` (URL)
- `plan_file` (URL)

**Status:**
- `design_status` (existing enum: plans_complete, plans_approved, plans_rejected)

---

## User Flows

### Flow 1: SOW Generation (Automated)

```
┌──────────────────┐
│  Design team     │
│  marks deal as   │
│  plans_complete  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ HubSpot Workflow │
│ triggers         │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────────┐
│ Webhook POST to  │────▶│ Generate token   │
│ /api/generate-sow│     │ + PIN            │
└──────────────────┘     └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ Update deal with │
                         │ token, PIN, ts   │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ Return success   │
                         │ to workflow      │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ Workflow sends   │
                         │ email to rep     │
                         └──────────────────┘
```

### Flow 2: SOW Review & Approval

```
┌──────────────────┐
│ Rep receives     │
│ email with link  │
│ + PIN            │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Rep clicks link  │
│ /sow/[token]     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────────┐
│ PIN entry screen │────▶│ Rep enters PIN   │
└──────────────────┘     └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ Verify PIN via   │
                         │ /api/verify-pin  │
                         └────────┬─────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
           ┌──────────────┐            ┌──────────────┐
           │ PIN correct  │            │ PIN wrong    │
           │ Set session  │            │ Show error   │
           │ cookie       │            │ Try again    │
           └──────┬───────┘            └──────────────┘
                  │
                  ▼
         ┌──────────────────┐
         │ Display SOW page │
         │ /sow/[token]/view│
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │ Rep reviews all  │
         │ deal details     │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │ Rep clicks       │
         │ APPROVE button   │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │ /api/approve-sow │
         │ updates HubSpot  │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │ Page shows       │
         │ "Approved" state │
         └──────────────────┘
```

### Flow 3: SOW Rejection

```
         ┌──────────────────┐
         │ Rep reviewing    │
         │ SOW page         │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │ Rep clicks       │
         │ REJECT button    │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │ Modal opens with │
         │ text field       │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │ Rep enters       │
         │ rejection reason │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │ Rep clicks       │
         │ Submit           │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │ /api/reject-sow  │
         │ updates HubSpot  │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │ Page shows       │
         │ "Rejected" state │
         └──────────────────┘
```

---

## Page Specifications

### Page 1: PIN Entry

**URL:** `/sow/[token]`

**Layout:**
```
┌─────────────────────────────────────────┐
│              [Company Logo]             │
├─────────────────────────────────────────┤
│                                         │
│         Scope of Work Review            │
│                                         │
│    Enter your PIN to view this SOW      │
│                                         │
│         ┌─────────────────┐             │
│         │  [  ] [  ] [  ] │             │
│         │  [  ] [  ] [  ] │             │
│         └─────────────────┘             │
│                                         │
│           [ Verify PIN ]                │
│                                         │
│    PIN was sent to your email.          │
│                                         │
└─────────────────────────────────────────┘
```

**Behavior:**
- Auto-focus first PIN digit on load
- Auto-advance cursor as digits entered
- Submit on final digit or button click
- Show inline error for wrong PIN: "Incorrect PIN. Please try again."
- Redirect to /sow/[token]/view on success

---

### Page 2: SOW Display

**URL:** `/sow/[token]/view`

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│                    [Company Logo]                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                   Scope of Work                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                   {Customer Name}                       │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  Deal Details                                           │
│  ┌─────────────────────┬─────────────────────────────┐  │
│  │ Customer Name       │ {value}                     │  │
│  │ Phone Number        │ {value}                     │  │
│  │ Email               │ {value}                     │  │
│  │ Sales Rep           │ {value}                     │  │
│  │ Setter              │ {value}                     │  │
│  │ Lead Source         │ {value}                     │  │
│  └─────────────────────┴─────────────────────────────┘  │
│                                                         │
│  System Details                                         │
│  ┌─────────────────────┬─────────────────────────────┐  │
│  │ System Size         │ {value} kW                  │  │
│  │ Panel Type          │ {value}                     │  │
│  │ Panel Count         │ {value}                     │  │
│  │ Inverter Type       │ {value}                     │  │
│  │ Inverter Count      │ {value}                     │  │
│  │ Battery Type        │ {value}                     │  │
│  │ Battery Count       │ {value}                     │  │
│  └─────────────────────┴─────────────────────────────┘  │
│                                                         │
│  Financing Details                                      │
│  ┌─────────────────────┬─────────────────────────────┐  │
│  │ Lender              │ {value}                     │  │
│  │ Term Length         │ {value} years               │  │
│  │ Finance Type        │ {value}                     │  │
│  │ Interest Rate       │ {value}%                    │  │
│  │ Total Contract Amt  │ ${value}                    │  │
│  │ Dealer Fee Amount   │ ${value}                    │  │
│  └─────────────────────┴─────────────────────────────┘  │
│                                                         │
│  Adder Details                                          │
│  ┌─────────────────────────────────┬─────────────────┐  │
│  │ Additional Wire Run ($)         │ {value}         │  │
│  │ Battery Adder ($)               │ {value}         │  │
│  │ ...                             │ ...             │  │
│  │ Adders Total ($)                │ {value}         │  │
│  └─────────────────────────────────┴─────────────────┘  │
│                                                         │
│  Commission Breakdown                                   │
│  ┌─────────────────────────────────┬─────────────────┐  │
│  │ Gross PPW                       │ ${value}        │  │
│  │ Total Adders (PPW)              │ ${value}        │  │
│  │ Net PPW                         │ ${value}        │  │
│  │ Total Commission                │ ${value}        │  │
│  └─────────────────────────────────┴─────────────────┘  │
│                                                         │
│  Proposal                                               │
│  ┌─────────────────────────────────────────────────────┐│
│  │                                                     ││
│  │              [Proposal Image]                       ││
│  │                                                     ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  Plan                                                   │
│  ┌─────────────────────────────────────────────────────┐│
│  │                                                     ││
│  │              [Plan Image/PDF]                       ││
│  │                                                     ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│     THIS IS SUBJECT TO CHANGE AFTER PRE-PRODUCTION     │
│              UPLOAD AND INSTALLATION                    │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│       [ REJECT ]                    [ APPROVE ]         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Behavior:**
- Pull all data fresh from HubSpot on each load
- Display "-" for null/empty values
- Format currency with $ and 2 decimal places where appropriate
- Commission section should have highlighted/colored background (like original)
- Images should be responsive and clickable to enlarge
- Buttons fixed at bottom or clearly visible after scroll

---

### Page 3: Rejection Modal

**Triggered by:** Click "Reject" button

**Layout:**
```
┌─────────────────────────────────────────┐
│                                         │
│         Reject Scope of Work            │
│                                    [X]  │
├─────────────────────────────────────────┤
│                                         │
│  Please provide a reason for rejection: │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │                                     ││
│  │                                     ││
│  │                                     ││
│  └─────────────────────────────────────┘│
│                                         │
│  This will be sent to the design team.  │
│                                         │
│       [ Cancel ]    [ Submit ]          │
│                                         │
└─────────────────────────────────────────┘
```

**Behavior:**
- Text field required (validate non-empty before submit)
- Character limit: 2000 characters
- Cancel closes modal, returns to SOW view
- Submit calls API, shows loading state, then updates page

---

### Page 4: Approved State

**URL:** `/sow/[token]/view` (same URL, different state)

**Changes from standard view:**
- Large green "Approved" badge at top
- Approval timestamp displayed
- APPROVE and REJECT buttons hidden/removed
- All data still visible for reference

---

### Page 5: Rejected State

**URL:** `/sow/[token]/view` (same URL, different state)

**Changes from standard view:**
- Large red "Rejected" badge at top
- Rejection timestamp displayed
- Rejection reason displayed in highlighted box
- APPROVE and REJECT buttons hidden/removed
- All data still visible for reference

---

## API Specifications

### POST /api/generate-sow

**Purpose:** Webhook endpoint called by HubSpot workflow to generate SOW credentials

**Request:**
```json
{
  "dealId": "12345678",
  "portalId": "87654321"
}
```

**Headers:**
```
X-HubSpot-Signature: {signature}
Content-Type: application/json
```

**Process:**
1. Validate webhook signature
2. Generate 24-character alphanumeric token
3. Generate 6-digit PIN
4. Update deal via HubSpot API:
   - `sow_token` = generated token
   - `sow_pin` = generated PIN
   - `sow_generated_at` = current timestamp
5. Return success

**Response (200):**
```json
{
  "success": true,
  "token": "abc123...",
  "pin": "847291"
}
```

**Response (400/500):**
```json
{
  "success": false,
  "error": "Error message"
}
```

---

### POST /api/verify-pin

**Purpose:** Verify PIN entered by user

**Request:**
```json
{
  "token": "abc123...",
  "pin": "847291"
}
```

**Process:**
1. Look up deal by `sow_token`
2. Compare submitted PIN to `sow_pin`
3. Return result

**Response (200):**
```json
{
  "valid": true,
  "dealId": "12345678"
}
```

**Response (200, invalid):**
```json
{
  "valid": false,
  "error": "Invalid PIN"
}
```

---

### GET /api/get-sow

**Purpose:** Fetch deal data for SOW display

**Request:**
```
GET /api/get-sow?token=abc123...
Cookie: sow_session={session_token}
```

**Process:**
1. Validate session cookie
2. Look up deal by `sow_token`
3. Fetch all required properties
4. Fetch file URLs for images
5. Return formatted data

**Response (200):**
```json
{
  "dealId": "12345678",
  "status": "pending|approved|rejected",
  "approvedAt": null,
  "rejectedAt": null,
  "rejectionReason": null,
  "customer": {
    "name": "John Doe",
    "phone": "+1234567890",
    "email": "john@example.com"
  },
  "salesRep": {
    "name": "Jane Rep",
    "email": "jane@company.com"
  },
  "setter": "Mike Setter",
  "leadSource": "Referral",
  "system": {
    "size": "7.47",
    "panelType": "Trina 415W",
    "panelCount": "18",
    "inverterType": "SolarEdge 7.6kW",
    "inverterCount": "1",
    "batteryType": null,
    "batteryCount": null
  },
  "financing": {
    "lender": "GoodLeap TPO",
    "termLength": "25",
    "financeType": "Lease",
    "interestRate": "1.99",
    "totalContractAmount": "27004.54",
    "dealerFeeAmount": null
  },
  "adders": {
    "additionalWireRun": null,
    "batteryAdder": null,
    "inverterAdder": "767",
    ...
    "addersTotal": "767"
  },
  "commission": {
    "grossPpw": "2.82",
    "totalAddersPpw": "0.1",
    "netPpw": "3.71",
    "totalCommission": "8677.2"
  },
  "proposalImageUrl": "https://...",
  "planFileUrl": "https://..."
}
```

---

### POST /api/approve-sow

**Purpose:** Record approval and update deal status

**Request:**
```json
{
  "token": "abc123...",
  "approverEmail": "jane@company.com"
}
```

**Process:**
1. Validate session
2. Look up deal by token
3. Verify deal is in "pending" state (design_status = plans_complete)
4. Update deal:
   - `design_status` = "plans_approved"
   - `sow_approved_at` = current timestamp
   - `sow_approved_by` = approverEmail
5. Return success

**Response (200):**
```json
{
  "success": true,
  "approvedAt": "2024-12-19T15:30:00Z"
}
```

---

### POST /api/reject-sow

**Purpose:** Record rejection with reason

**Request:**
```json
{
  "token": "abc123...",
  "reason": "Panel count is incorrect. Should be 20 panels, not 18.",
  "rejecterEmail": "jane@company.com"
}
```

**Process:**
1. Validate session
2. Validate reason is non-empty
3. Look up deal by token
4. Verify deal is in "pending" state
5. Update deal:
   - `design_status` = "plans_rejected"
   - `plans_rejection_reason` = reason
6. Return success

**Response (200):**
```json
{
  "success": true,
  "rejectedAt": "2024-12-19T15:30:00Z"
}
```

---

## Security Requirements

### SR-1: Authentication & Access

| ID | Requirement |
|----|-------------|
| SR-1.1 | SOW pages shall not be accessible without valid PIN verification |
| SR-1.2 | Session cookies shall be HttpOnly, Secure, and SameSite=Strict |
| SR-1.3 | Session cookies shall expire after 24 hours |
| SR-1.4 | Tokens shall be cryptographically random (minimum 24 characters) |
| SR-1.5 | PINs shall be 6 digits, randomly generated |

### SR-2: Data Protection

| ID | Requirement |
|----|-------------|
| SR-2.1 | All traffic shall be HTTPS only |
| SR-2.2 | HubSpot API token shall be stored in environment variables, never in code |
| SR-2.3 | API responses shall not include sensitive fields beyond what's displayed |
| SR-2.4 | Error messages shall not reveal system internals |

### SR-3: Webhook Security

| ID | Requirement |
|----|-------------|
| SR-3.1 | Webhook endpoint shall validate HubSpot signature |
| SR-3.2 | Webhook endpoint shall reject requests with invalid signatures |
| SR-3.3 | Webhook secret shall be stored in environment variables |

### SR-4: Rate Limiting

| ID | Requirement |
|----|-------------|
| SR-4.1 | PIN verification endpoint shall be rate-limited (10 attempts per minute per IP) |
| SR-4.2 | API endpoints shall implement basic rate limiting |

---

## Integration Requirements

### HubSpot Private App

**Required Scopes:**
- `crm.objects.deals.read` — Read deal properties
- `crm.objects.deals.write` — Update deal properties
- `files` — Read file URLs (if using Files API)

**Setup Steps:**
1. Create new Private App or extend existing "Files" app
2. Add required scopes
3. Generate access token
4. Store token in Netlify environment variables

### HubSpot Workflow

**Workflow Name:** "SOW Generation on Plans Complete"

**Configuration:**
- **Trigger:** Deal-based, when `design_status` is changed to `plans_complete`
- **Action 1:** Webhook
  - Method: POST
  - URL: `https://[your-app].netlify.app/api/generate-sow`
  - Include: Deal ID, Portal ID
  - Authentication: Signature validation
- **Action 2:** Delay (5 seconds) — Allow webhook to complete
- **Action 3:** Send email
  - To: `{{deal.sales_rep_email}}`
  - Template: SOW Review Request
  - Personalization tokens for link, PIN, customer name

### Email Template

**Subject:** "Scope of Work Ready for Review: {{deal.customer_name}}"

**Body Content:**
```
Hi {{deal.sales_rep_name}},

The Scope of Work for {{deal.customer_name}} is ready for your review.

Click below to view and approve:
[View Scope of Work](https://[your-app].netlify.app/sow/{{deal.sow_token}})

Your PIN: {{deal.sow_pin}}

Please review all details carefully before approving.

Thanks,
[Company Name] Design Team
```

---

## Non-Functional Requirements

### Performance

| ID | Requirement |
|----|-------------|
| NFR-1.1 | SOW page shall load in under 3 seconds |
| NFR-1.2 | PIN verification shall respond in under 1 second |
| NFR-1.3 | Approval/rejection actions shall complete in under 2 seconds |

### Availability

| ID | Requirement |
|----|-------------|
| NFR-2.1 | System shall have 99.5% uptime |
| NFR-2.2 | System shall handle 200+ SOW generations per month |
| NFR-2.3 | System shall handle concurrent access (up to 20 simultaneous users) |

### Scalability

| ID | Requirement |
|----|-------------|
| NFR-3.1 | Architecture shall support 10x growth without major changes |
| NFR-3.2 | No persistent database required (HubSpot is data store) |

### Maintainability

| ID | Requirement |
|----|-------------|
| NFR-4.1 | Code shall be documented with inline comments |
| NFR-4.2 | Environment-specific config shall be externalized |
| NFR-4.3 | Error logging shall be implemented (Netlify logs or external service) |

### Browser Support

| ID | Requirement |
|----|-------------|
| NFR-5.1 | Application shall support Chrome, Safari, Firefox, Edge (latest 2 versions) |
| NFR-5.2 | Application shall be mobile-responsive |
| NFR-5.3 | Application shall function on iOS Safari and Android Chrome |

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| SOW Approval Rate | >90% approved (vs rejected) | HubSpot reporting on design_status |
| Time to Approval | <24 hours from email sent | Difference between sow_generated_at and sow_approved_at |
| System Reliability | 99.5% uptime | Netlify status monitoring |
| Rep Satisfaction | No support tickets about access issues | Support ticket tracking |
| Error Rate | <1% failed SOW generations | Webhook success rate in HubSpot |

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Deliverables:**
- [ ] HubSpot: Create new deal properties
- [ ] HubSpot: Create Private App with required scopes
- [ ] Netlify: Project setup with environment variables
- [ ] API: `/api/generate-sow` webhook endpoint
- [ ] API: `/api/verify-pin` endpoint
- [ ] Frontend: PIN entry page
- [ ] Testing: Manual end-to-end test

### Phase 2: Core Display (Week 2-3)

**Deliverables:**
- [ ] API: `/api/get-sow` endpoint
- [ ] Frontend: SOW display page with all sections
- [ ] Frontend: Styling to match brand
- [ ] Frontend: Responsive design
- [ ] Frontend: Image display with click-to-enlarge
- [ ] Testing: Verify all data fields map correctly

### Phase 3: Actions & Workflow (Week 3-4)

**Deliverables:**
- [ ] API: `/api/approve-sow` endpoint
- [ ] API: `/api/reject-sow` endpoint
- [ ] Frontend: Approve button functionality
- [ ] Frontend: Reject modal with text field
- [ ] Frontend: Approved/Rejected state display
- [ ] HubSpot: Create workflow with webhook + email
- [ ] HubSpot: Design email template
- [ ] Testing: Full workflow test

### Phase 4: Polish & Launch (Week 4-5)

**Deliverables:**
- [ ] Security: Rate limiting implementation
- [ ] Security: Audit and penetration testing
- [ ] Frontend: Error handling and loading states
- [ ] Frontend: Edge case handling (deleted deals, etc.)
- [ ] Documentation: Admin guide
- [ ] Documentation: Rep-facing instructions
- [ ] Launch: Gradual rollout (10 deals → 50 → all)

---

## Open Questions & Decisions

| # | Question | Options | Decision | Owner |
|---|----------|---------|----------|-------|
| 1 | Session duration after PIN entry | 1 hour / 24 hours / browser session | 24 hours | |
| 2 | What happens if rep loses PIN? | Re-send email manually / self-service regenerate / call support | TBD | |
| 3 | Should rejected SOWs allow re-approval after changes? | Generate new SOW / allow re-approve on same SOW | TBD | |
| 4 | Notification when SOW is approved/rejected? | Email to design team / Slack notification / just HubSpot update | TBD | |
| 5 | Branding/styling specifics | Match existing brand guide / new design | TBD | |
| 6 | Domain for app | sow.yourcompany.com / app.yourcompany.com/sow / yourcompany.netlify.app | TBD | |

---

## Appendix

### A. Technology Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Frontend | Next.js (or Astro) | SSR for dynamic content, good Netlify support |
| Hosting | Netlify | Simple deployment, serverless functions included |
| Backend/API | Netlify Functions | No separate server needed, scales automatically |
| Database | None (HubSpot is source of truth) | Simplicity, no sync issues |
| Styling | Tailwind CSS | Rapid development, consistent design |
| CRM | HubSpot Enterprise | Existing system |

### B. HubSpot API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `GET /crm/v3/objects/deals/{dealId}` | Fetch deal properties |
| `PATCH /crm/v3/objects/deals/{dealId}` | Update deal properties |
| `POST /crm/v3/objects/deals/search` | Find deal by sow_token |
| `GET /files/v3/files/{fileId}` | Get file URL (if needed) |

### C. Sample Token Generation Code

```javascript
const crypto = require('crypto');

function generateToken() {
  return crypto.randomBytes(18).toString('base64url'); // 24 chars
}

function generatePin() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
}
```

### D. Sample HubSpot Webhook Validation

```javascript
const crypto = require('crypto');

function validateHubSpotSignature(req, secret) {
  const signature = req.headers['x-hubspot-signature'];
  const sourceString = secret + req.method + req.url + JSON.stringify(req.body);
  const hash = crypto.createHash('sha256').update(sourceString).digest('hex');
  return signature === hash;
}
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 19, 2024 | [Author] | Initial draft |

---

*End of Document*
