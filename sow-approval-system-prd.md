# Product Requirements Document: Scope of Work Approval System

**Document Version:** 3.0
**Last Updated:** December 22, 2024
**Author:** [Your Name]
**Status:** Implemented (Frontend Complete, Backend Infrastructure Ready)

---

## Executive Summary

This document outlines the requirements for an internal Scope of Work (SOW) approval system that integrates with HubSpot CRM. The system generates a web-based SOW summary page from **Project** data (using HubSpot's beta Projects API), sends it to sales representatives for review, and captures their approval or rejection with a simple PIN-based authentication flow.

**IMPORTANT: Projects API (Not Deals)**
This system uses HubSpot's **Projects** object (API object type `0-970`), NOT the Deals object. The Projects API is currently in beta. See `docs/PROJECTS_API_REFERENCE.md` for complete API documentation.

**Implementation Status:** The frontend is fully implemented and functional. Core backend infrastructure including the HubSpot API client, self-healing property management system, and API routes are complete. The system is built on Next.js 15 with the App Router and deployed on Vercel.

**Business Goal:** Streamline the handoff between design completion and sales approval by providing sales reps with a clear, consolidated view of project details and enabling one-click approval without requiring HubSpot access.

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
- Project data is spread across multiple HubSpot properties, making it difficult to get a consolidated view
- No formal approval workflow exists to capture rep sign-off
- No audit trail of who approved what and when

---

## Solution Overview

Build a lightweight external web application that:

1. **Generates** a unique SOW page for each project when design is marked complete
2. **Secures** access via a simple PIN sent to the sales rep's email
3. **Displays** all relevant project information in a clean, read-only format
4. **Captures** approval or rejection with optional feedback
5. **Updates** HubSpot project properties to reflect the decision

### Key Design Principles

- **HubSpot Projects as source of truth** — All data lives in HubSpot Projects (object type `0-970`); the app is a read/write interface
- **Zero friction for reps** — One link, one PIN, one click to approve
- **Native HubSpot features** — Leverage workflows, custom properties, and the existing Private App
- **Simple infrastructure** — Next.js on Vercel with serverless functions

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

**Platform:** Next.js 15 App Router deployed on Vercel

**Key Architectural Features:**
- **Single-Page Flow:** PIN entry and SOW display on the same page (no redirect after PIN verification)
- **No Session Persistence:** Authentication state exists only in component memory; page refresh returns to PIN entry
- **Self-Healing Properties:** System automatically creates missing HubSpot custom properties on first API call
- **Dual-State Management:** LocalStorage priority over server data for prototype; HubSpot becomes single source of truth in production
- **Projects API (Beta):** Uses HubSpot Projects object (`0-970`), NOT Deals. See `docs/PROJECTS_API_REFERENCE.md`

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              HubSpot                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Project Record (Object Type: 0-970)                                   │
│  ├── [Built-in Properties]                                              │
│  │   ├── hs_name — Project name (customer name)                        │
│  │   ├── hs_pipeline — Pipeline ID                                      │
│  │   └── hs_pipeline_stage — Pipeline stage ID                         │
│  │                                                                      │
│  ├── [Custom Properties - Existing]                                     │
│  │   ├── Customer: customer_phone, customer_email, customer_address    │
│  │   ├── Sales: sales_rep_name, sales_rep_email, setter, lead_source   │
│  │   ├── System: system_size, panel_type, panel_count, inverter_*      │
│  │   ├── Financing: lender, term_length, finance_type, interest_rate   │
│  │   ├── Adders: ~32 itemized cost fields                              │
│  │   ├── Commission: gross_ppw, total_adders_ppw, net_ppw, total_comm  │
│  │   ├── proposal_image (URL from Files app)                           │
│  │   └── plan_file (URL from Files app)                                │
│  │                                                                      │
│  └── [SOW Approval Properties - AUTO-CREATED]                          │
│      ├── sow_token (string) — unique URL identifier                    │
│      ├── sow_pin (string) — 4-digit verification code                  │
│      ├── sow_status (enum) — not_ready|needs_review|approved|rejected  │
│      ├── sow_needs_review_date (datetime) — when SOW generated         │
│      ├── sow_accepted_date (datetime) — approval timestamp             │
│      ├── sow_rejected_date (datetime) — rejection timestamp            │
│      ├── sow_rejected_reason (textarea) — rejection explanation        │
│      ├── accepted_sow (file) — PDF snapshot of approved SOW            │
│      └── rejected_sow (file) — PDF snapshot of rejected SOW            │
│                                                                         │
│  Self-Healing Setup (lib/hubspot-setup.ts)                             │
│  ├── Automatically creates property group "SOW Approval"               │
│  ├── Creates all 9 required custom properties if missing               │
│  ├── Uses Projects API: POST /crm/v3/properties/0-970                  │
│  ├── Runs on first API call (zero manual configuration)                │
│  └── Recovers from accidental property deletion                        │
│                                                                         │
│  Webhook Subscription (Private App):                                   │
│  ├── Event: object.propertyChange on send_rep_commission_sow           │
│  ├── Triggers: POST to /api/generate-sow when value = "yes"            │
│  └── Action: Generate token + PIN, update Project record               │
│                                                                         │
│  Workflow: "SOW Email to Rep" (Separate from webhook)                  │
│  ├── Trigger: send_rep_commission_sow = "yes"                          │
│  │            AND sow_token is known                                   │
│  │            AND sow_pin is known                                     │
│  └── Action: Send email to sales rep with link + PIN                   │
│                                                                         │
│  NOTE: Private apps cannot programmatically enroll records in          │
│  workflows. The webhook handles data generation; the workflow          │
│  triggers independently when all conditions are met.                   │
│                                                                         │
│  Private App: Required Scopes (Projects, not Deals!)                   │
│  ├── crm.objects.projects.read                                         │
│  ├── crm.objects.projects.write                                        │
│  ├── crm.schemas.projects.read (for self-healing)                      │
│  └── crm.schemas.projects.write (for self-healing)                     │
│                                                                         │
│  API Endpoints (use object type 0-970):                                │
│  ├── CRUD: /crm/v3/objects/0-970                                       │
│  ├── Search: /crm/v3/objects/0-970/search                              │
│  ├── Properties: /crm/v3/properties/0-970                              │
│  └── Pipelines: /crm/v3/pipelines/0-970                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   Vercel (Next.js 15 App Router)                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Frontend (Client Components)                                          │
│  └── /sow/[token]           → Single page: PIN entry + SOW display     │
│      ├── PIN entry UI shown initially                                  │
│      ├── SOW content shown after PIN verified (no redirect)            │
│      └── Refresh = back to PIN entry (no session)                      │
│                                                                         │
│  API Routes (Next.js App Router)                 Status                │
│  ├── /api/health            → System status      ✅ Implemented       │
│  ├── /api/verify-pin        → PIN verification   ✅ Implemented       │
│  ├── /api/get-sow           → Fetch SOW data     ✅ Implemented       │
│  ├── /api/approve-sow       → Record approval    ✅ Implemented       │
│  ├── /api/reject-sow        → Record rejection   ✅ Implemented       │
│  └── /api/generate-sow      → Webhook receiver   ⏳ Planned           │
│                                                                         │
│  Core Libraries                                                         │
│  ├── lib/hubspot.ts         → HubSpot API client (with self-healing)  │
│  ├── lib/hubspot-setup.ts   → Auto property creation & recovery       │
│  ├── lib/hubspot-files.ts   → File upload utilities (for PDF)         │
│  ├── lib/types.ts           → TypeScript interfaces                   │
│  ├── lib/mockData.ts        → Demo data (prototype only)              │
│  └── lib/storage.ts         → LocalStorage (prototype only)           │
│                                                                         │
│  Environment Variables                                                 │
│  ├── HUBSPOT_ACCESS_TOKEN        → Private app access token           │
│  ├── NEXT_PUBLIC_BASE_URL        → App base URL (for links)           │
│  └── HEALTH_CHECK_API_KEY        → Auth for /api/health diagnostics   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Functional Requirements

### FR-1: SOW Generation

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-1.1 | System shall generate a unique SOW token (URL-safe, 24+ characters) when triggered | Must | ⏳ Planned |
| FR-1.2 | System shall generate a random 4-digit PIN for each SOW | Must | ⏳ Planned |
| FR-1.3 | System shall store token and PIN on the deal record via HubSpot API | Must | ⏳ Planned |
| FR-1.4 | System shall record generation timestamp in `sow_needs_review_date` | Must | ⏳ Planned |
| FR-1.5 | Webhook endpoint shall validate request authenticity using shared secret | Must | ⏳ Planned |
| FR-1.6 | System shall handle duplicate triggers gracefully (idempotent) | Should | ⏳ Planned |

**Implementation Note:** The `/api/generate-sow` webhook endpoint is not yet implemented. Currently, demo data uses pre-generated tokens and PINs for testing. When implemented, PIN length will be 4 digits (not 6 as originally specified).

### FR-2: Email Notification

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-2.1 | HubSpot workflow shall send email to sales rep after SOW generation | Must | ⏳ Planned |
| FR-2.2 | Email shall contain the SOW URL with embedded token | Must | ⏳ Planned |
| FR-2.3 | Email shall contain the 4-digit PIN | Must | ⏳ Planned |
| FR-2.4 | Email shall include customer name and deal identifier for context | Must | ⏳ Planned |
| FR-2.5 | Email shall use a branded template consistent with company standards | Should | ⏳ Planned |

**Implementation Note:** Email workflow configuration is documented in `docs/human_checklist.md`. Template should reference 4-digit PIN (not 6).

### FR-3: PIN Verification

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-3.1 | SOW page shall require PIN entry before displaying deal data | Must | ✅ Implemented |
| FR-3.2 | System shall verify PIN against deal record via HubSpot API | Must | ✅ Implemented |
| FR-3.3 | System shall allow unlimited PIN attempts (no lockout) | Must | ✅ Implemented |
| FR-3.4 | System shall display clear error message for incorrect PIN | Must | ✅ Implemented |
| FR-3.5 | System shall use component state (no session persistence) | Changed | ✅ Implemented |
| FR-3.6 | System shall require PIN re-entry on page refresh | Changed | ✅ Implemented |

**Implementation Changes:**
- **No session cookies:** Authentication state lives only in React component memory
- **No persistence:** Refreshing the page returns user to PIN entry screen
- **Rate limiting:** Not yet implemented (to be added in production)

### FR-4: SOW Display

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-4.1 | Page shall display customer name as header | Must | ✅ Implemented |
| FR-4.2 | Page shall display Deal Details section (name, phone, email, address, sales rep, setter, lead source) | Must | ✅ Implemented |
| FR-4.3 | Page shall display System Details section (size, panel type, count, inverter type/count, battery type/count) | Must | ✅ Implemented |
| FR-4.4 | Page shall display Financing Details section (lender, term, type, rate, contract amount, dealer fee) | Must | ✅ Implemented |
| FR-4.5 | Page shall display Adder Details section (itemized list with costs) | Must | ✅ Implemented |
| FR-4.6 | Page shall display Commission Breakdown section (gross PPW, adders PPW, net PPW, total) | Must | ✅ Implemented |
| FR-4.7 | Page shall display Proposal image from proposal_image property | Must | ✅ Implemented |
| FR-4.8 | Page shall display Plan image/PDF from plan_file property | Must | ✅ Implemented |
| FR-4.9 | Page shall display disclaimer: "This is subject to change after pre-production upload and installation" | Must | ✅ Implemented |
| FR-4.10 | All monetary values shall be formatted with $ and appropriate decimals | Must | ✅ Implemented |
| FR-4.11 | Empty/null values shall display as "-" | Must | ✅ Implemented |

**Implementation Notes:**
- All sections use component-based architecture (`components/sow/*Section.tsx`)
- Formatters provided in `lib/utils.ts` (formatCurrency, formatValue, formatDate, etc.)
- Commission section has highlighted pink background as specified
- Responsive design with mobile-first approach
- Customer address added to Deal Details section

### FR-5: Approval Flow

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-5.1 | Page shall display "Approve" button when status is pending (desktop sidebar + mobile sticky CTA) | Must | ✅ Implemented |
| FR-5.2 | Clicking Approve shall update `sow_status` to "approved" | Must | ✅ Implemented |
| FR-5.3 | System shall record approval timestamp in `sow_accepted_date` | Must | ✅ Implemented |
| FR-5.4 | System shall record approver email (sales rep email used) | Must | ✅ Implemented |
| FR-5.5 | After approval, page shall display "Approved" state and hide action buttons | Must | ✅ Implemented |
| FR-5.6 | Approval action shall be idempotent (multiple clicks don't cause issues) | Must | ✅ Implemented |
| FR-5.7 | Approval modal shall confirm action before submitting | Added | ✅ Implemented |

**Implementation Changes:**
- Property name changed from `design_status` to `sow_status`
- Approval timestamp stored in `sow_accepted_date` (not `sow_approved_at`)
- Status value changed from `plans_approved` to `approved`
- Desktop: Sticky sidebar with approve/reject buttons
- Mobile: Sticky bottom CTA that appears when user scrolls to bottom
- Confirmation modal prevents accidental approvals

### FR-6: Rejection Flow

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-6.1 | Page shall display "Reject" button alongside Approve button | Must | ✅ Implemented |
| FR-6.2 | Clicking Reject shall open a modal/form with required text field | Must | ✅ Implemented |
| FR-6.3 | Rejection reason text field shall be required (non-empty, max 2000 chars) | Must | ✅ Implemented |
| FR-6.4 | Rejection reason shall be saved to `sow_rejected_reason` property | Must | ✅ Implemented |
| FR-6.5 | System shall update `sow_status` to "rejected" | Must | ✅ Implemented |
| FR-6.6 | System shall record rejection timestamp in `sow_rejected_date` | Added | ✅ Implemented |
| FR-6.7 | After rejection, page shall display "Rejected" state with submitted reason | Must | ✅ Implemented |

**Implementation Changes:**
- Property name changed from `plans_rejection_reason` to `sow_rejected_reason`
- Status property changed from `design_status` to `sow_status`
- Status value changed from `plans_rejected` to `rejected`
- Added `sow_rejected_date` property to track rejection timestamp
- Form validation with zod + react-hook-form
- Character limit enforced at 2000 characters

### FR-7: State Handling

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-7.1 | If deal already approved, page shall show approved state (no action buttons) | Must | ✅ Implemented |
| FR-7.2 | If deal already rejected, page shall show rejected state with reason | Must | ✅ Implemented |
| FR-7.3 | If token is invalid, page shall show "SOW not found" error | Must | ✅ Implemented |
| FR-7.4 | If deal is deleted in HubSpot, page shall handle gracefully | Should | ✅ Implemented |
| FR-7.5 | System shall support dual-state management (localStorage + HubSpot) | Added | ✅ Implemented |

**Implementation Notes:**
- State management uses localStorage priority over server data for prototype
- When HubSpot integration is active, HubSpot becomes single source of truth
- Status transitions include fade animations for better UX
- Error handling with user-friendly messages
- Loading states for all async operations

---

## Data Model

### HubSpot Project Properties (SOW Approval)

**IMPORTANT:** This system uses the HubSpot **Projects** object (type `0-970`), NOT Deals.

**All properties below are automatically created by the self-healing system** (`lib/hubspot-setup.ts`). No manual property creation is required.

| Property Name | Internal Name | Type | Description | Auto-Created |
|---------------|---------------|------|-------------|--------------|
| SOW Token | `sow_token` | Single-line text | Unique URL identifier (24+ char alphanumeric) | ✅ |
| SOW PIN | `sow_pin` | Single-line text | 4-digit verification code | ✅ |
| SOW Status | `sow_status` | Dropdown select | Current status: `not_ready`, `needs_review`, `approved`, `rejected` | ✅ |
| SOW Needs Review Date | `sow_needs_review_date` | Date picker | Timestamp when SOW was generated | ✅ |
| SOW Accepted Date | `sow_accepted_date` | Date picker | Timestamp when rep approved | ✅ |
| SOW Rejected Date | `sow_rejected_date` | Date picker | Timestamp when rep rejected | ✅ |
| SOW Rejected Reason | `sow_rejected_reason` | Multi-line text | Free text explanation for rejection | ✅ |
| Accepted SOW | `accepted_sow` | File | PDF snapshot of approved SOW | ✅ |
| Rejected SOW | `rejected_sow` | File | PDF snapshot of rejected SOW | ✅ |

**Property Group:** All properties are organized under "SOW Approval" group in HubSpot

**Self-Healing Behavior:**
- Properties are created on first API call if missing
- If properties are accidentally deleted, they are recreated automatically on next request
- System validates property existence before every HubSpot operation
- See `lib/hubspot-setup.ts` for complete property definitions

### Existing Properties Referenced

**These properties must exist on the HubSpot Project for the SOW to display correctly.** See `lib/hubspot.ts` SOW_PROPERTIES array for authoritative list.

**Project Details:**
- `hs_name` - Project/Customer name (built-in HubSpot property)
- `customer_phone` - Customer phone number
- `customer_email` - Customer email address
- `customer_address` - Full customer address
- `sales_rep_name` - Sales representative name
- `sales_rep_email` - Sales representative email
- `setter` - Setter name
- `lead_source` - Lead source

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

**Note:** The complete list of 70+ HubSpot Project properties referenced by the system is documented in `lib/hubspot.ts` in the `SOW_PROPERTIES` array. This includes:
- 1 built-in property (`hs_name` for project/customer name)
- 7 customer/sales properties
- 7 system specification properties
- 6 financing properties
- 32 adder cost properties
- 4 commission calculation properties
- 2 file properties (proposal_image, plan_file)

**API Object Type:** All properties are on the Projects object (`0-970`), not Deals.

---

## User Flows

### Flow 1: SOW Generation (Automated)

```
┌────────────────────────┐
│  Design team sets      │
│  send_rep_commission_  │
│  sow = "yes"           │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│ HubSpot Webhook fires  │
│ (property change event)│
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐     ┌──────────────────┐
│ POST to                │────▶│ Generate token   │
│ /api/generate-sow      │     │ + PIN            │
└────────────────────────┘     └────────┬─────────┘
                                        │
                                        ▼
                               ┌──────────────────┐
                               │ Update Project   │
                               │ with token, PIN, │
                               │ sow_status=      │
                               │ needs_review     │
                               └────────┬─────────┘
                                        │
           ┌────────────────────────────┘
           │
           ▼
┌────────────────────────┐
│ HubSpot Workflow       │
│ triggers (separate):   │
│ • send_rep_commission_ │
│   sow = "yes"          │
│ • sow_token is known   │
│ • sow_pin is known     │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│ Workflow sends email   │
│ to sales rep with      │
│ link + PIN             │
└────────────────────────┘
```

### Flow 2: SOW Review & Approval

**Updated Flow (Single-Page Architecture):**

```
┌──────────────────┐
│ Rep receives     │
│ email with link  │
│ + 4-digit PIN    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Rep clicks link  │
│ /sow/[token]     │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ SINGLE PAGE: /sow/[token]            │
│                                      │
│ ┌────────────────────────────┐      │
│ │ PIN Entry UI Displayed     │      │
│ │ (Component state: !verified)│     │
│ └──────────┬─────────────────┘      │
│            │                         │
│            ▼                         │
│   Rep enters 4-digit PIN            │
│            │                         │
│            ▼                         │
│   POST /api/verify-pin              │
│            │                         │
│  ┌─────────┴─────────┐              │
│  ▼                   ▼              │
│ PIN ✓              PIN ✗            │
│  │               Show error          │
│  │               Try again           │
│  ▼                                   │
│ Component state: verified=true      │
│ Data fetch starts                   │
│  │                                   │
│  ▼                                   │
│ ┌────────────────────────────┐      │
│ │ SOW Content Displayed      │      │
│ │ (Same page, no redirect)   │      │
│ │                            │      │
│ │ - Customer Name            │      │
│ │ - System Details           │      │
│ │ - Financing Info           │      │
│ │ - Commission               │      │
│ │ - Approve/Reject Actions   │      │
│ └──────────┬─────────────────┘      │
│            │                         │
│            ▼                         │
│   Rep clicks APPROVE               │
│            │                         │
│            ▼                         │
│   Confirmation modal shown          │
│            │                         │
│            ▼                         │
│   POST /api/approve-sow             │
│   Updates HubSpot                   │
│            │                         │
│            ▼                         │
│   Component re-renders              │
│   Shows "Approved" state            │
│   Hides action buttons              │
│                                      │
│   (Page refresh = back to PIN)     │
└──────────────────────────────────────┘
```

**Key Changes from Original PRD:**
- No redirect to `/sow/[token]/view` - same page for PIN + content
- No session cookies - state in React component memory only
- Page refresh returns to PIN entry
- Parallel data loading during PIN verification for faster UX

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

### Single Page: PIN Entry + SOW Display

**URL:** `/sow/[token]` (all states on same page)

**Implementation:** `app/sow/[token]/page.tsx` (Client Component)

**State 1: PIN Entry (Initial)**

```
┌─────────────────────────────────────────┐
│              [Company Logo]             │
├─────────────────────────────────────────┤
│                                         │
│         Scope of Work                   │
│                                         │
│    Enter your PIN to view this SOW      │
│                                         │
│         ┌─────────────────┐             │
│         │  [  ] [  ] [  ] [  ]          │
│         │  4-digit PIN                  │
│         └─────────────────┘             │
│                                         │
│    PIN was sent to your email.          │
│                                         │
│    [Error message if wrong PIN]         │
│                                         │
└─────────────────────────────────────────┘
```

**Behavior:**
- Auto-focus first PIN digit on load
- Auto-advance cursor as digits entered
- Automatic submission on 4th digit entry
- Show inline error for wrong PIN: "Incorrect PIN. Please try again."
- Fade out animation, then reveal SOW content on same page (no redirect)
- Parallel data loading starts during PIN verification

---

### State 2: SOW Display (After PIN Verified)

**Same URL:** `/sow/[token]` (component state change only)

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
- Pull all data fresh from HubSpot on each load (or from mock data in prototype)
- Display "-" for null/empty values (via `formatValue()` utility)
- Format currency with $ and 2 decimal places (via `formatCurrency()` utility)
- Commission section has pink highlighted background (via `highlighted={true}` prop)
- Images are responsive using Next.js Image component
- **Desktop:** Sticky sidebar with approve/reject buttons (appears at `top: 69px`)
- **Mobile:** Sticky bottom CTA appears when user scrolls to bottom of page
- Staggered entrance animations for smooth UX
- Page refresh returns to PIN entry (no session persistence)

---

### State 3: Rejection Modal

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
- Text field required (zod validation: min 1 char, max 2000 chars)
- Character counter displayed
- Cancel closes modal, returns to SOW view
- Submit calls `/api/reject-sow`, shows loading state, then updates page
- Form validation with react-hook-form + zod

---

### State 4: Approved

**Same URL:** `/sow/[token]` (component state change)

**Changes from pending view:**
- Large green "APPROVED" heading replacing action buttons
- Approval timestamp displayed: "BY {email} ON {date}"
- APPROVE and REJECT buttons hidden
- All SOW data still visible for reference
- Fade animation when transitioning from pending to approved state
- Desktop and mobile CTAs both hidden

---

### State 5: Rejected

**Same URL:** `/sow/[token]` (component state change)

**Changes from pending view:**
- Large red "REJECTED" heading replacing action buttons
- Rejection timestamp displayed: "BY {email} ON {date}"
- Rejection reason displayed in text block: "Reason: {reason}"
- APPROVE and REJECT buttons hidden
- All SOW data still visible for reference
- Fade animation when transitioning from pending to rejected state
- Desktop and mobile CTAs both hidden

---

## API Specifications

**Platform:** Next.js 15 App Router API Routes
**Location:** `app/api/*/route.ts`
**HubSpot Client:** All routes use `lib/hubspot.ts` client with self-healing
**Timeout Protection:** All HubSpot operations have 30-second timeouts

### GET /api/health

**Purpose:** System health check and diagnostics

**Status:** ✅ Implemented

**Request:**
```
GET /api/health
[Optional] X-Health-Check-Key: {HEALTH_CHECK_API_KEY}
```

**Process:**
1. Run HubSpot setup verification
2. Check environment configuration
3. Return health status

**Response (200 - Unauthenticated):**
```json
{
  "status": "healthy" | "degraded",
  "timestamp": "2024-12-22T10:00:00.000Z"
}
```

**Response (200 - With API Key):**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-22T10:00:00.000Z",
  "hubspot": {
    "connected": true,
    "setupComplete": true,
    "groupCreated": true,
    "propertiesCreated": ["sow_token", "sow_pin", ...],
    "propertiesExisted": [...],
    "errors": []
  },
  "environment": {
    "hasAccessToken": true,
    "baseUrl": "https://sow.example.com",
    "nodeEnv": "production"
  }
}
```

---

### POST /api/generate-sow

**Purpose:** Webhook endpoint called by HubSpot workflow to generate SOW credentials

**Status:** ⏳ Planned (Not Yet Implemented)

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
3. Generate 4-digit PIN (changed from 6)
4. Update deal via HubSpot API:
   - `sow_token` = generated token
   - `sow_pin` = generated PIN
   - `sow_needs_review_date` = current timestamp
   - `sow_status` = "needs_review"
5. Return success

**Response (200):**
```json
{
  "success": true,
  "token": "abc123...",
  "pin": "1234"
}
```

**Response (400/500):**
```json
{
  "success": false,
  "error": "Error message"
}
```

**Implementation Note:** This endpoint is planned but not yet implemented. See `docs/DEVELOPER_HANDOFF.md` for implementation guidance.

---

### POST /api/verify-pin

**Purpose:** Verify PIN entered by user

**Status:** ✅ Implemented

**Request:**
```json
{
  "token": "abc123...",
  "pin": "1234"
}
```

**Process:**
1. Validate input (token and PIN required)
2. Look up deal by `sow_token` via HubSpot client
3. Verify deal status is `needs_review`
4. Compare submitted PIN to `sow_pin`
5. Return result

**Response (200 - Valid):**
```json
{
  "valid": true,
  "dealId": "12345678",
  "status": "needs_review"
}
```

**Response (200 - Invalid):**
```json
{
  "valid": false,
  "error": "Invalid PIN"
}
```

**Response (200 - Already Processed):**
```json
{
  "valid": false,
  "dealId": "12345678",
  "status": "approved",
  "error": "SOW already approved"
}
```

**Response (400):**
```json
{
  "error": "Token and PIN are required"
}
```

---

### GET /api/get-sow

**Purpose:** Fetch deal data for SOW display

**Status:** ✅ Implemented

**Request:**
```
GET /api/get-sow?token=abc123...
```

**Process:**
1. Validate token parameter
2. Look up deal by `sow_token` via HubSpot client
3. Fetch all SOW properties (see SOW_PROPERTIES in lib/hubspot.ts)
4. Map HubSpot deal to SOWData format
5. Return formatted data

**Response (200):**
```json
{
  "dealId": "12345678",
  "token": "abc123...",
  "pin": "1234",
  "status": "pending",
  "generatedAt": "2024-12-22T10:00:00Z",
  "approvedAt": null,
  "approvedBy": null,
  "rejectedAt": null,
  "rejectionReason": null,
  "customer": {
    "name": "John Doe",
    "phone": "+1234567890",
    "email": "john@example.com",
    "address": "123 Main St, City, State 12345"
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
    "inverterAdder": 767,
    ...
    "addersTotal": 767
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

**Response (404):**
```json
{
  "error": "SOW not found"
}
```

**Response (400):**
```json
{
  "error": "Token is required"
}
```

**Implementation Notes:**
- No session validation (component state only)
- Status mapping: `needs_review` → `pending`, `approved` → `approved`, `rejected` → `rejected`
- HubSpot properties mapped via `mapDealToSOWData()` method
- Self-healing wraps the HubSpot API call

---

### POST /api/approve-sow

**Purpose:** Record approval and update deal status

**Status:** ✅ Implemented

**Request:**
```json
{
  "token": "abc123...",
  "approverEmail": "jane@company.com"
}
```

**Process:**
1. Validate input (token and approverEmail required)
2. Look up deal by `sow_token` via HubSpot client
3. Verify deal exists
4. Update deal via HubSpot API:
   - `sow_status` = "approved"
   - `sow_accepted_date` = current timestamp
5. Return success with timestamp

**Response (200):**
```json
{
  "success": true,
  "approvedAt": "2024-12-22T15:30:00Z"
}
```

**Response (404):**
```json
{
  "success": false,
  "error": "SOW not found"
}
```

**Response (400):**
```json
{
  "error": "Token and approver email are required"
}
```

**Implementation Notes:**
- No session validation required
- Property name changed from `design_status` to `sow_status`
- Timestamp property changed from `sow_approved_at` to `sow_accepted_date`
- Status value changed from `plans_approved` to `approved`
- Self-healing wraps the HubSpot update operation

---

### POST /api/reject-sow

**Purpose:** Record rejection with reason

**Status:** ✅ Implemented

**Request:**
```json
{
  "token": "abc123...",
  "reason": "Panel count is incorrect. Should be 20 panels, not 18.",
  "rejecterEmail": "jane@company.com"
}
```

**Process:**
1. Validate input (token, reason, and rejecterEmail required)
2. Validate reason is non-empty and under 2000 characters
3. Look up deal by `sow_token` via HubSpot client
4. Verify deal exists
5. Update deal via HubSpot API:
   - `sow_status` = "rejected"
   - `sow_rejected_date` = current timestamp
   - `sow_rejected_reason` = reason
6. Return success with timestamp

**Response (200):**
```json
{
  "success": true,
  "rejectedAt": "2024-12-22T15:30:00Z"
}
```

**Response (404):**
```json
{
  "success": false,
  "error": "SOW not found"
}
```

**Response (400):**
```json
{
  "error": "Token, reason, and rejecter email are required"
}
```

**Implementation Notes:**
- No session validation required
- Property name changed from `design_status` to `sow_status`
- Rejection reason property changed from `plans_rejection_reason` to `sow_rejected_reason`
- Added `sow_rejected_date` property to track rejection timestamp
- Status value changed from `plans_rejected` to `rejected`
- Self-healing wraps the HubSpot update operation

---

## Security Requirements

### SR-1: Authentication & Access

| ID | Requirement | Status |
|----|-------------|--------|
| SR-1.1 | SOW pages shall not be accessible without valid PIN verification | ✅ Implemented |
| SR-1.2 | Authentication state shall be stored in component memory only (no cookies) | ✅ Implemented |
| SR-1.3 | Page refresh shall require PIN re-entry | ✅ Implemented |
| SR-1.4 | Tokens shall be cryptographically random (minimum 24 characters) | ⏳ Planned |
| SR-1.5 | PINs shall be 4 digits, randomly generated | ⏳ Planned |

**Implementation Changes:**
- **No session cookies:** Changed from original requirement of HttpOnly cookies with 24hr expiry
- **Component state only:** Authentication state lives in React component memory
- **No persistence:** Intentional security trade-off for simpler architecture

### SR-2: Data Protection

| ID | Requirement | Status |
|----|-------------|--------|
| SR-2.1 | All traffic shall be HTTPS only (enforced by Vercel) | ✅ Implemented |
| SR-2.2 | HubSpot API token shall be stored in environment variables, never in code | ✅ Implemented |
| SR-2.3 | API responses shall not include sensitive fields beyond what's displayed | ✅ Implemented |
| SR-2.4 | Error messages shall not reveal system internals | ✅ Implemented |
| SR-2.5 | Health check diagnostics shall require API key authentication | ✅ Implemented |

**Implementation Notes:**
- Environment variables: `HUBSPOT_ACCESS_TOKEN`, `NEXT_PUBLIC_BASE_URL`, `HEALTH_CHECK_API_KEY`
- Public health endpoint returns minimal status only
- Detailed diagnostics require `X-Health-Check-Key` header

### SR-3: Webhook Security

| ID | Requirement | Status |
|----|-------------|--------|
| SR-3.1 | Webhook endpoint shall validate HubSpot signature | ⏳ Planned |
| SR-3.2 | Webhook endpoint shall reject requests with invalid signatures | ⏳ Planned |
| SR-3.3 | Webhook secret shall be stored in environment variables | ⏳ Planned |

**Implementation Status:** Webhook endpoint (`/api/generate-sow`) not yet implemented. See `docs/DEVELOPER_HANDOFF.md` for implementation guidance.

### SR-4: Rate Limiting

| ID | Requirement | Status |
|----|-------------|--------|
| SR-4.1 | PIN verification endpoint shall be rate-limited (10 attempts per minute per IP) | ⏳ Planned |
| SR-4.2 | API endpoints shall implement basic rate limiting | ⏳ Planned |

**Implementation Status:** Rate limiting not yet implemented. Recommended for production deployment.

---

## Integration Requirements

### HubSpot Private App

**CRITICAL: Use Projects Scopes (NOT Deals!)**

The system uses HubSpot's **Projects** object (beta API, object type `0-970`), not Deals.

**Required Scopes:**
- `crm.objects.projects.read` — Read project properties
- `crm.objects.projects.write` — Update project properties
- `crm.schemas.projects.read` — Read property schemas (for self-healing)
- `crm.schemas.projects.write` — Create custom properties (for self-healing)

**Optional Scopes (for file attachments):**
- `files` — Upload and read PDF files in HubSpot

**Note on Notes/Engagements:** HubSpot does not have dedicated `crm.objects.notes.*` scopes. Notes API (`/crm/v3/objects/notes`) uses the parent object's scopes. With `crm.objects.projects.write`, you can create notes associated with Projects.

**Setup Steps:**
1. Create new Private App in HubSpot
2. Add all required **projects** scopes above (NOT deals scopes!)
3. Generate access token
4. Store token in Vercel environment variable: `HUBSPOT_ACCESS_TOKEN`
5. Deploy application - properties are created automatically on first API call

**Self-Healing Feature:**
- No manual property creation needed
- System automatically creates all 9 SOW approval properties on **Projects** object
- Properties organized under "SOW Approval" group
- Uses API endpoint: `POST /crm/v3/properties/0-970`
- If properties are deleted, they are recreated on next request
- See `lib/hubspot-setup.ts` for property definitions

**API Reference:** See `docs/PROJECTS_API_REFERENCE.md` for complete beta API documentation.

### HubSpot Integration (Two-Phase Architecture)

**Why Two Phases?** Private apps cannot programmatically enroll records in workflows. The webhook generates data; the workflow sends the email independently.

#### Phase 1: Webhook Subscription (Token/PIN Generation)

**Subscription Type:** `object.propertyChange`
**Object Type:** `0-970` (Projects)
**Property:** `send_rep_commission_sow`

**When `send_rep_commission_sow` changes to "yes":**
1. HubSpot POSTs to `/api/generate-sow`
2. Endpoint generates unique token + 4-digit PIN
3. Updates Project with:
   - `sow_token`
   - `sow_pin`
   - `sow_status` = "needs_review"
   - `sow_needs_review_date` = now

#### Phase 2: HubSpot Workflow (Email Delivery)

**Workflow Name:** "SOW Email to Rep"

**Status:** ⏳ Planned (Documentation in `docs/human_checklist.md`)

**Enrollment Criteria (ALL must be true):**
- `send_rep_commission_sow` = "yes"
- `sow_token` is known (not empty)
- `sow_pin` is known (not empty)

**Action:** Send email to `{{sales_rep_email}}` with link + PIN

**Implementation Notes:**
- Workflow triggers independently when all conditions met
- No dependency between webhook completion and workflow enrollment
- Re-enrollment: Enable for re-sends when criteria met again
- Must be Project-based workflow (not Deal-based)

### Email Template

**Subject:** "Scope of Work Ready for Review: {{project.hs_name}}"

**Body Content:**
```
Hi {{project.sales_rep_name}},

The Scope of Work for {{project.hs_name}} is ready for your review.

Click below to view and approve:
[View Scope of Work](https://[your-domain]/sow/{{project.sow_token}})

Your PIN: {{project.sow_pin}}

Please review all details carefully before approving.

Thanks,
[Company Name] Design Team
```

**Changes from Original:**
- Uses Project object, not Deal object
- Trigger property: `send_rep_commission_sow` = "yes" (not `sow_status`)
- Two-phase flow: Webhook generates token/PIN → Workflow sends email
- Customer name uses `hs_name` (built-in Project property)
- PIN is 4 digits (not 6)

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

**Actual Implementation:**

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Frontend | Next.js 15 App Router | React 18, Server/Client Components, optimized image loading |
| Hosting | Vercel | Native Next.js support, edge functions, automatic HTTPS |
| Backend/API | Next.js API Routes | App Router API routes, serverless deployment |
| Database | None (HubSpot is source of truth) | Simplicity, no sync issues, self-healing properties |
| Styling | Tailwind CSS | Rapid development, custom design tokens, responsive utilities |
| Forms | react-hook-form + zod | Type-safe validation, excellent DX |
| CRM | HubSpot | Existing system, auto-configured via self-healing |
| Language | TypeScript (strict mode) | Type safety, better IDE support, fewer runtime errors |

**Key Libraries:**
- `next` v15.1.6 - React framework with App Router
- `react` v18 - UI library
- `tailwindcss` - Utility-first CSS
- `react-hook-form` - Form state management
- `zod` - Schema validation
- `next-themes` - Dark mode support

**Changes from Original PRD:**
- Platform changed from Netlify to Vercel (better Next.js support)
- Added TypeScript for type safety
- Added form validation libraries
- Added self-healing HubSpot property management

### B. HubSpot API Endpoints Used

**IMPORTANT:** All endpoints use **Projects** object type (`0-970`), NOT Deals.

**Implemented in `lib/hubspot.ts`:**

| Endpoint | Purpose | Used By |
|----------|---------|---------|
| `POST /crm/v3/objects/0-970/search` | Find project by `sow_token` | `findProjectByToken()`, PIN verification, get SOW |
| `GET /crm/v3/objects/0-970/{projectId}` | Fetch project properties | `getProject()`, property retrieval |
| `PATCH /crm/v3/objects/0-970/{projectId}` | Update project properties | `updateProject()`, approve/reject actions |
| `POST /crm/v3/properties/0-970` | Create custom property | Self-healing setup |
| `POST /crm/v3/properties/0-970/groups` | Create property group | Self-healing setup |
| `GET /crm/v3/properties/0-970` | List all project properties | Health check, debugging |

**Timeout Protection:** All HubSpot API calls wrapped with 30-second timeout

**API Reference:** See `docs/PROJECTS_API_REFERENCE.md` for complete beta API documentation.

### C. Sample Token Generation Code

**Updated for 4-digit PIN:**

```javascript
const crypto = require('crypto');

function generateToken() {
  return crypto.randomBytes(18).toString('base64url'); // 24 chars
}

function generatePin() {
  return Math.floor(1000 + Math.random() * 9000).toString(); // 4 digits
}
```

**Implementation Status:** ⏳ Planned for `/api/generate-sow` endpoint

### D. Sample HubSpot Webhook Validation

**Implementation Status:** ⏳ Planned for `/api/generate-sow` endpoint

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

### E. Self-Healing Property System

**New Feature (Not in Original PRD)**

The system includes automatic HubSpot property management via `lib/hubspot-setup.ts`:

**IMPORTANT:** Properties are created on the **Projects** object (`0-970`), NOT Deals.

**How It Works:**
1. On first API call, system checks if required properties exist on Projects object
2. If missing, properties are automatically created via `POST /crm/v3/properties/0-970`
3. Properties are organized under "SOW Approval" group
4. If properties are accidentally deleted, system recreates them on next request
5. System retries failed requests after property recreation

**Properties Auto-Created (on Projects object):**
- `sow_token` (text, unique)
- `sow_pin` (text)
- `sow_status` (enum: not_ready, needs_review, approved, rejected)
- `sow_needs_review_date` (datetime)
- `sow_accepted_date` (datetime)
- `sow_rejected_date` (datetime)
- `sow_rejected_reason` (textarea)
- `accepted_sow` (file)
- `rejected_sow` (file)

**API Endpoints Used:**
- Property group creation: `POST /crm/v3/properties/0-970/groups`
- Property creation: `POST /crm/v3/properties/0-970`
- Property check: `GET /crm/v3/properties/0-970`

**Benefits:**
- Zero-configuration deployment
- No manual property setup required
- Automatic recovery from property deletion
- Consistent property definitions across environments

**Error Handling:**
- System logs all property creation attempts
- Failed property creation doesn't crash the app
- Self-healing only activates when property-related errors detected
- 30-second timeout on all HubSpot operations

---

### F. Deployment Guide

**Platform:** Vercel

**Required Environment Variables:**
```bash
HUBSPOT_ACCESS_TOKEN=your_private_app_token
NEXT_PUBLIC_BASE_URL=https://your-domain.com
HEALTH_CHECK_API_KEY=random_secure_key_for_diagnostics
```

**Deployment Steps:**
1. Connect repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy - properties are created automatically on first request
4. Verify deployment with `/api/health` endpoint
5. Configure HubSpot workflow (see `docs/human_checklist.md`)

**No manual configuration needed** - the self-healing system handles all HubSpot property creation.

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 19, 2024 | [Author] | Initial draft |
| 2.0 | Dec 22, 2024 | [Author] | Updated to reflect actual implementation: Next.js 15/Vercel, self-healing properties, single-page architecture, 4-digit PIN, corrected property names |
| 3.0 | Dec 22, 2024 | [Author] | **MAJOR CHANGE:** Migrated from Deals API to Projects API (beta). All references updated from `crm.objects.deals.*` to `crm.objects.projects.*`. API endpoints now use object type `0-970`. Added `docs/PROJECTS_API_REFERENCE.md` with beta API documentation. |

---

*End of Document*
