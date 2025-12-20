# Solar SOW Approval System

**🔗 Live Demo:** [https://solar-inbound-sow-approval.vercel.app/sow/demo-token-abc123xyz789](https://solar-inbound-sow-approval.vercel.app/sow/demo-token-abc123xyz789)

**Demo PIN:** `1234`

---

A Next.js application that enables sales representatives to review and approve solar installation Scopes of Work (SOW) via a PIN-authenticated web interface. Built as a prototype with mock data, designed for future integration with HubSpot CRM.

## Overview

Sales representatives are independent contractors without HubSpot access. This app provides a **zero-friction approval workflow**: one link, one PIN, one click to approve.

### Key Features

- **PIN Authentication** - Secure 4-digit verification (no passwords, no login)
- **Single-Page Flow** - PIN entry → SOW review → Approve/Reject
- **Mobile-First Design** - Optimized for mobile devices with responsive layout
- **Comprehensive SOW Display** - Deal details, system specs, financing, adders, commission breakdown
- **PDF Plan Viewer** - Embedded viewer on desktop, download link on mobile
- **Dual-State Architecture** - localStorage for prototype, ready for HubSpot integration

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS with custom design system
- **Form Validation:** react-hook-form + zod
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/MattDreier/solar-inbound-sow-approval.git
cd solar-inbound-sow-approval

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000/sow/demo-token-abc123xyz789](http://localhost:3000/sow/demo-token-abc123xyz789) and enter PIN: `1234`

### Available Scripts

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## Project Structure

```
app/
├── sow/[token]/
│   └── page.tsx              # PIN entry + SOW display (single page)
└── api/
    ├── verify-pin/route.ts   # POST: Validate PIN
    ├── get-sow/route.ts      # GET: Fetch SOW data
    ├── approve-sow/route.ts  # POST: Record approval
    └── reject-sow/route.ts   # POST: Record rejection

components/
├── ui/                       # Base components (Button, Card, Modal, etc.)
├── layout/                   # Header, Container
└── sow/                      # SOW-specific sections
    ├── *Section.tsx          # Display components
    ├── ApprovalActions.tsx   # Approve/Reject buttons
    ├── RejectionModal.tsx    # Rejection reason form
    └── StatusBadge.tsx       # Status display

lib/
├── types.ts                  # TypeScript interfaces (matches HubSpot schema)
├── mockData.ts               # Hardcoded demo data (REPLACE with HubSpot API)
├── storage.ts                # localStorage utilities (REMOVE when integrated)
├── utils.ts                  # Formatters (currency, dates, labels)
└── constants.ts              # Config (PIN_LENGTH, API endpoints)
```

## Current State: Prototype

This is a **fully functional prototype** with mock data:

- **Demo SOW** with fictional customer data for demonstration purposes
- **localStorage** stores approval/rejection state
- **No database** - all data is hardcoded in `lib/mockData.ts`
- **No session persistence** - PIN required on every visit

## Future: HubSpot Integration

When ready for production:

1. **Replace mock data** with HubSpot API calls in `lib/hubspot.ts`
2. **Remove localStorage** - HubSpot becomes single source of truth
3. **Add webhook signature validation** for security
4. **Configure environment variables** for HubSpot credentials

**No component changes needed** - all components already use the `SOWData` interface that matches the HubSpot schema.

## Design System

### Custom Tailwind Colors

```typescript
colors: {
  primary: '#1e40af',           // Lunex Power brand blue
  commission: {
    bg: '#fecaca',              // Pink background
    border: '#f87171',
  },
  status: {
    approved: '#22c55e',        // Green
    rejected: '#ef4444',        // Red
    pending: '#eab308',         // Yellow
  },
}
```

### Typography

- Heading sizes: `text-heading-1` through `text-heading-3`
- Body text: `text-body` (base), `text-body-sm`, `text-body-lg`
- Responsive design with mobile-first approach

## Testing the Prototype

1. Navigate to the live demo link
2. Enter PIN: `1234`
3. Review the SOW details
4. Click "Approve" or "Reject"
5. State persists in localStorage until page refresh

## Documentation

- **PRD:** See `sow-approval-system-prd.md` for full requirements
- **Development Guide:** See `CLAUDE.md` for architecture details and patterns

## License

Private - Lunex Power

## Contact

For questions or issues, contact the development team.
