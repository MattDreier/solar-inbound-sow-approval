# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Solar Scope of Work (SOW) Approval System** - a Next.js application that allows sales representatives to review and approve solar installation designs via a PIN-authenticated web interface. Currently implemented as a **prototype with mock data**, designed for future integration with HubSpot CRM.

**Key Context:** Sales reps are independent contractors without HubSpot access. This app provides a zero-friction approval workflow: one link, one PIN, one click to approve.

## Development Commands

```bash
# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run ESLint
npm run lint
```

**Testing the Prototype:**
- Navigate to: `http://localhost:3000/sow/demo-token-abc123xyz789`
- Enter PIN: `1234` (4 digits)
- The demo data is based on a real solar installation for Petar Garov

## Working with Claude Code

### Agent Orchestration for Context Management

**CRITICAL:** Always use specialized agents via the Task tool to conserve context window. Do NOT perform heavy operations directly in the main conversation.

**When to use agents:**

1. **Codebase Exploration** - Use `Explore` agent (NOT direct Grep/Glob):
   ```
   - "Where are errors handled?"
   - "How does the authentication flow work?"
   - "What's the codebase structure?"
   - Any question requiring multiple file reads/searches
   ```

2. **Feature Planning** - Use `Plan` agent for implementation strategy:
   ```
   - Adding new features (e.g., "add email notifications")
   - Refactoring components
   - Architectural changes
   ```

3. **Code Review** - Use review agents after writing code:
   ```
   - After implementing features → /review-pr
   - After modifying types → Task tool with type-design-analyzer
   - After adding error handling → Task tool with silent-failure-hunter
   ```

4. **Testing** - Use `qa-test-automation-engineer` for test suites:
   ```
   - Writing comprehensive test coverage
   - E2E test scenarios
   ```

**Anti-patterns to avoid:**
- ❌ Running multiple Grep/Read operations directly to explore code
- ❌ Reading entire directories of files manually
- ❌ Performing complex refactors without planning agent
- ❌ Code reviews by reading files directly instead of using review agents

**Example workflow:**
```
User: "Add email notifications when SOW is approved"

✅ Correct approach:
1. Use EnterPlanMode or Task(Plan) to design the feature
2. Get user approval on approach
3. Implement the code
4. Use /review-pr to verify quality

❌ Wrong approach:
1. Start reading files directly
2. Make changes without planning
3. Skip code review
```

### Current Architecture State

**IMPORTANT UPDATE (2024):** Session management has been removed. The app now uses a single-page flow:

```
User Flow:
PIN Entry (/sow/[token])
  → Verify PIN (POST /api/verify-pin)
  → Show SOW content on same page (no redirect)
  → Load data (GET /api/get-sow)
  → Merge with localStorage state
  → Render sections + actions
  → Approve/Reject (POST /api/approve-sow or /api/reject-sow)
  → Update localStorage
  → Re-render with new state

Refreshing the page = back to PIN entry (no session persistence)
```

## Architecture Overview

### State Management Philosophy

**Critical Pattern:** This app uses a **dual-state architecture** where localStorage takes priority over server data:

```typescript
// Priority: localStorage > server data
const localState = getSOWState(token);
if (localState) {
  data.status = localState.status;
  data.approvedAt = localState.approvedAt || data.approvedAt;
  // ... etc
}
```

**Why:** In the prototype, approval/rejection state persists in localStorage. When HubSpot integration is added, localStorage will be removed and HubSpot becomes the single source of truth. This architecture allows the app to work identically in both modes.

### Key Architectural Decisions

1. **Next.js 15 App Router** with TypeScript strict mode
2. **No database** - HubSpot is the source of truth (currently mocked)
3. **No session management** - PIN required on every visit (component state only)
4. **Form validation** with react-hook-form + zod
5. **Styling** with Tailwind CSS custom colors for brand consistency

## Directory Structure

```
app/
├── sow/[token]/
│   └── page.tsx              # PIN entry + SOW display (single page, client component)
└── api/
    ├── verify-pin/route.ts   # POST: Validate PIN
    ├── get-sow/route.ts      # GET: Fetch SOW data
    ├── approve-sow/route.ts  # POST: Record approval
    └── reject-sow/route.ts   # POST: Record rejection

components/
├── ui/                       # Base components (Button, Card, Modal, etc.)
├── layout/                   # Header, Container
└── sow/                      # SOW-specific sections
    ├── *Section.tsx          # Display components (DealDetails, System, etc.)
    ├── ApprovalActions.tsx   # Approve/Reject buttons
    ├── RejectionModal.tsx    # Form for rejection reason
    └── StatusBadge.tsx       # Approved/Rejected state display

lib/
├── types.ts                  # All TypeScript interfaces (matches HubSpot schema)
├── mockData.ts               # Hardcoded demo data (REPLACE with HubSpot API)
├── storage.ts                # localStorage utilities (REMOVE when HubSpot integrated)
├── utils.ts                  # Formatters (currency, dates, labels)
└── constants.ts              # Config (PIN_LENGTH, API endpoints)
```

## Important Type Definitions

All types in `lib/types.ts` mirror the HubSpot deal schema from the PRD. Key interfaces:

- `SOWData` - Main data structure (matches API response)
- `SOWState` - Approval/rejection state (stored in localStorage)
- `SOWStatus` - `'pending' | 'approved' | 'rejected'`

**Critical:** When modifying types, maintain compatibility with HubSpot property names as defined in `sow-approval-system-prd.md`.

## Custom Tailwind Colors

Defined in `tailwind.config.ts`:

```typescript
colors: {
  primary: '#1e40af',           // Lunex Power brand blue
  commission: {
    bg: '#fecaca',              // Pink background for commission section
    border: '#f87171',
  },
  status: {
    approved: '#22c55e',        // Green
    rejected: '#ef4444',        // Red
    pending: '#eab308',         // Yellow
  },
}
```

The **Commission Breakdown section** uses `highlighted={true}` on Card component to apply the pink background.

## HubSpot Integration (Future)

**Current State:** Prototype with mock data
**Future State:** Live HubSpot integration

### Migration Path

When ready to connect to HubSpot:

1. **Replace mock data functions:**
   ```typescript
   // lib/mockData.ts → lib/hubspot.ts
   export function getSOWByToken(token: string): SOWData | null {
     // Current: return MOCK_SOW_DATA[token]
     // Future: Fetch from HubSpot API using token to search for deal
   }
   ```

2. **Remove localStorage usage:**
   - Delete calls to `saveSOWState()`, `getSOWState()`
   - HubSpot becomes single source of truth
   - Approval/rejection updates go directly to HubSpot

3. **Add webhook signature validation** in `/api/generate-sow` (not yet implemented)

4. **Configure environment variables:**
   ```
   HUBSPOT_ACCESS_TOKEN=your_token
   WEBHOOK_SECRET=your_secret
   ```

**No changes needed to:**
- Components (all read from `SOWData` interface)
- Pages (same data flow)
- Types (already match HubSpot schema)
- UI/UX (identical behavior)

## HubSpot Data Mapping

The app expects these HubSpot deal properties (from PRD):

**New properties to create in HubSpot:**
- `sow_token` - Unique URL identifier
- `sow_pin` - 4-digit verification code
- `sow_generated_at` - Timestamp
- `sow_approved_at` - Approval timestamp
- `sow_approved_by` - Approver email
- `plans_rejection_reason` - Rejection text

**Existing properties referenced:**
- Customer: `dealname`, `customer_phone`, `customer_email`
- Sales: `sales_rep_name`, `sales_rep_email`, `setter`, `lead_source`
- System: `system_size`, `panel_type`, `panel_count`, `inverter_type`, etc.
- Financing: `lender`, `term_length`, `finance_type`, `interest_rate`, etc.
- Adders: ~30 optional cost fields (see `lib/types.ts` AdderDetails interface)
- Commission: `gross_ppw`, `total_adders_ppw`, `net_ppw`, `total_commission`
- Files: `proposal_image`, `plan_file`
- Status: `design_status` (enum: `pending`, `approved`, `rejected`)

## Component Patterns

### Section Components

All SOW section components follow this pattern:

```typescript
interface SectionProps {
  data: SOWData;  // Never partial - always full SOWData
}

export function ExampleSection({ data }: SectionProps) {
  return (
    <Card>
      <CardHeader>Section Title</CardHeader>
      <CardContent>
        {/* 2-column grid layout on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          <div className="grid grid-cols-[140px_1fr] gap-4">
            <span className="text-gray-600">Label:</span>
            <span className="font-medium">{formatValue(data.field)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Always use formatters** from `lib/utils.ts`:
- `formatCurrency()` - For dollar amounts
- `formatValue()` - Shows "-" for null/empty
- `formatPercent()` - For percentages
- `formatDate()` - For ISO timestamps
- `formatAdderLabel()` - Converts camelCase to "Title Case"

### Modal Pattern

Use `Modal` component with `react-hook-form` + `zod`:

```typescript
const schema = z.object({
  field: z.string().min(1, 'Required').max(2000, 'Too long'),
});

export function ExampleModal({ isOpen, onClose, onSubmit }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Title">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* form fields */}
      </form>
    </Modal>
  );
}
```

## API Route Pattern

All API routes follow Next.js 15 App Router conventions:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import type { RequestType, ResponseType } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: RequestType = await request.json();

    // Validate
    if (!body.required) {
      return NextResponse.json(
        { error: 'Message' },
        { status: 400 }
      );
    }

    // Process (currently mock, future: HubSpot API call)
    const result = processData(body);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}
```

## Security Notes

**Authentication:**
- No session persistence - PIN required on every page visit
- PIN verification state lives only in React component memory
- Refreshing the page clears authentication state

**PIN Validation:**
- Currently 4 digits (configurable via `PIN_LENGTH`)
- No rate limiting in prototype (add for production)
- PINs stored in mock data (future: HubSpot deal property)

## Gotchas & Common Issues

1. **Image paths:** Dummy data files must be in `public/dummy-data/` and referenced as `/dummy-data/filename.ext`

2. **localStorage state priority:** Always check localStorage AFTER fetching from API. This allows client-side state to override server state (necessary for prototype, remove for production).

3. **Card component casing:** Import path is `@/components/ui/Card` but filename is `card.tsx` (lowercase). TypeScript imports are case-sensitive.

4. **PIN_LENGTH changes:** Must update:
   - `lib/constants.ts` - PIN_LENGTH constant
   - `lib/mockData.ts` - Demo PIN value
   - Paste validation regex updates automatically

5. **Commission section highlighting:** Use `<Card highlighted={true}>` - this applies pink background from Tailwind config.

## PRD Reference

Full requirements in `sow-approval-system-prd.md` including:
- HubSpot workflow specifications
- Email template requirements
- API endpoint contracts
- Security requirements
- Success metrics

**Always reference the PRD** when implementing new features or modifying data structures.
