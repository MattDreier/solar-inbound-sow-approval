# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Agent-First Development (CRITICAL)

**Principle:** Before any multi-step operation, ask: *"Would a specialized agent handle this better while preserving my context?"* This project has extensive documentation that agents can reference without polluting main context.

### When to Delegate (Think Before Acting)

Delegate to agents when a task involves:
- **Multiple file reads/searches** → Use `Explore` agent instead of direct Grep/Glob
- **Architectural decisions** → Use `Plan` agent or `EnterPlanMode` before implementing
- **Quality verification** → Use review agents (`/review-pr`, `code-reviewer`, `type-design-analyzer`, `silent-failure-hunter`, etc.)
- **Comprehensive test writing** → Use `qa-test-automation-engineer`
- **Any operation that would consume significant context** → Consider if an agent exists for it

The available agents are documented in your system prompt. Match the task to the agent's description - don't limit yourself to the examples above.

### When NOT to Delegate

- Quick single-file edits (< 20 lines)
- Reading a specific file you already know the path to
- Simple targeted searches with predictable results
- Tasks where the overhead of agent coordination exceeds the benefit

### Anti-patterns (Context Wasteful)

- Running 5+ Grep/Read operations to explore code (use `Explore` agent)
- Reading entire directories manually to understand architecture
- Implementing multi-file features without planning first
- Reviewing your own code by re-reading files instead of using review agents

### Example Workflow

```
User: "Connect the approve-sow API route to HubSpot"

1. Task(Explore) → Find existing patterns in lib/hubspot.ts and other API routes
2. Implement the integration (direct edits - agent already mapped the approach)
3. /review-pr → Verify error handling and type safety
```

## Development Commands

```bash
npm run dev    # Start at http://localhost:3000
npm run build  # Production build
npm run lint   # ESLint
```

**Demo:** `http://localhost:3000/sow/demo-token-abc123xyz789` with PIN `1234`

## Project Overview

Solar SOW Approval System - PIN-authenticated web interface for sales reps to approve/reject solar installation designs. **Frontend complete, backend ready for HubSpot integration.**

**Key Constraint:** Sales reps are independent contractors without HubSpot access. Zero-friction flow: one link → one PIN → one click.

## Critical: HubSpot Projects API (Not Deals)

This system uses HubSpot **Projects** (beta API, object type `0-970`), NOT Deals.

- All API endpoints: `/crm/v3/objects/0-970` (not `/deals`)
- Required scopes: `crm.objects.projects.*` (not `deals`)
- Complete API docs: `docs/PROJECTS_API_REFERENCE.md`

### ⚠️ TEMPORARY: Projects API Whitelist Pending

**Status:** Awaiting HubSpot account whitelisting for Projects API beta access.

**Expected Error (IGNORE FOR NOW):**
```
HTTP 403: "The scope needed for this API call isn't available for public use"
```

**What this means:**
- The Projects API (`0-970`) is a beta endpoint requiring explicit HubSpot approval
- Our private app has the correct scopes configured, but the account isn't whitelisted yet
- Once whitelisted, the same token will work without changes

**Development Guidance:**
- ✅ Continue using mock data (`lib/mockData.ts`) for frontend development
- ✅ Write HubSpot integration code - it's correct, just can't be tested yet
- ✅ Test the health endpoint for token validity (non-Projects calls work)
- ❌ Don't troubleshoot 403 errors on Projects endpoints - they're expected
- ❌ Don't modify scopes or regenerate tokens - the config is correct

**Remove this section** once HubSpot confirms whitelisting is complete.

## Architecture

### User Flow (Single-Page)

```
/sow/[token] → PIN Entry → Verify (POST /api/verify-pin)
                        → Show SOW content (same page, no redirect)
                        → Load data (GET /api/get-sow)
                        → Approve/Reject → Update state

Page refresh = back to PIN entry (no session persistence)
```

### State Management

**Dual-state architecture** for prototype-to-production migration:

```typescript
// localStorage takes priority over server data (prototype)
// When HubSpot integrated, remove localStorage - HubSpot becomes truth
const localState = getSOWState(token);
if (localState) {
  data.status = localState.status;
  data.approvedAt = localState.approvedAt || data.approvedAt;
}
```

### Key Files

| File | Purpose |
|------|---------|
| `lib/hubspot.ts` | HubSpot client with self-healing property creation |
| `lib/hubspot-setup.ts` | Auto-creates missing HubSpot properties on first API call |
| `lib/types.ts` | TypeScript interfaces (mirrors HubSpot Projects schema) |
| `lib/mockData.ts` | Demo data (REPLACE with HubSpot API) |
| `lib/storage.ts` | localStorage utilities (REMOVE when HubSpot integrated) |
| `lib/utils.ts` | Formatters: `formatCurrency()`, `formatValue()`, `formatDate()` |

### API Routes

All routes in `app/api/*/route.ts` follow Next.js 15 App Router pattern:

| Route | Method | Purpose | Status |
|-------|--------|---------|--------|
| `/api/verify-pin` | POST | Validate PIN | Mock |
| `/api/get-sow` | GET | Fetch SOW data | Mock |
| `/api/approve-sow` | POST | Record approval | Mock |
| `/api/reject-sow` | POST | Record rejection | Mock |
| `/api/health` | GET | System diagnostics | Implemented |
| `/api/generate-sow` | POST | Webhook receiver (generates token/PIN) | Not implemented |

**Webhook Trigger:** When `send_rep_commission_sow` = "yes" on a Project, HubSpot webhooks to `/api/generate-sow`, which generates the token/PIN and updates the Project. A separate HubSpot workflow then sends the email when token/PIN are populated.

**Integration Task:** Replace mock data imports with `getHubSpotClient()` calls. See `docs/DEVELOPER_HANDOFF.md` for step-by-step guide.

## Code Patterns

### Section Components

All SOW sections receive full `SOWData` (never partial):

```typescript
interface SectionProps {
  data: SOWData;  // Always full SOWData
}

export function ExampleSection({ data }: SectionProps) {
  return (
    <Card>
      <CardHeader>Section Title</CardHeader>
      <CardContent>
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

**Commission section:** Use `<Card highlighted={true}>` for pink background.

### API Route Pattern

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.required) {
      return NextResponse.json({ error: 'Message' }, { status: 400 });
    }
    // Process: currently mock, future: getHubSpotClient() call
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### Modal with Form Validation

```typescript
const schema = z.object({
  field: z.string().min(1, 'Required').max(2000, 'Too long'),
});

export function ExampleModal({ isOpen, onClose, onSubmit }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });
  // ...
}
```

## Type Definitions

All types in `lib/types.ts` mirror HubSpot Projects schema. Key interfaces:

- `SOWData` - Main data structure (matches API response)
- `SOWState` - Approval/rejection state
- `SOWStatus` - `'pending' | 'approved' | 'rejected'`

**Critical:** When modifying types, maintain compatibility with HubSpot property names. Reference `sow-approval-system-prd.md` Data Model section.

Note: Uses `projectId` (not `dealId`) for HubSpot Project record.

## Custom Tailwind Colors

Defined in `tailwind.config.ts`:

```typescript
colors: {
  primary: '#1e40af',           // Brand blue
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

## Gotchas

1. **Image paths:** Files in `public/dummy-data/`, reference as `/dummy-data/filename.ext`

2. **localStorage priority:** Check localStorage AFTER fetching API (allows client override)

3. **Card component casing:** Import `@/components/ui/Card` (capital C)

4. **PIN_LENGTH changes:** Update `lib/constants.ts` AND `lib/mockData.ts` demo PIN

5. **Self-healing HubSpot:** Properties auto-create on first API call - no manual setup needed

## Reference Documentation

| Document | Purpose |
|----------|---------|
| `sow-approval-system-prd.md` | Full requirements, HubSpot workflow specs, API contracts |
| `docs/DEVELOPER_HANDOFF.md` | Step-by-step HubSpot integration guide |
| `docs/PROJECTS_API_REFERENCE.md` | HubSpot Projects API (beta) documentation |
| `docs/human_checklist.md` | HubSpot admin setup tasks |

**Always reference PRD** when implementing features or modifying data structures.

## Environment Variables

```bash
HUBSPOT_ACCESS_TOKEN=your_token       # Required for HubSpot integration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
HEALTH_CHECK_API_KEY=random_key       # Optional: for /api/health diagnostics
```
