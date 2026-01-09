# System Patterns

> **Purpose**: Document data models, architecture decisions, and extraction patterns for the Email BDC Agent project.

---

## Memory Bank Directory Index

| File | Purpose |
|------|---------|
| `activeContext.md` | Current focus, blockers, decisions-in-progress |
| `progress.md` | Stage completion status, test results, iteration notes |
| `systemPatterns.md` | Data models, architecture decisions, extraction patterns (this file) |
| `techContext.md` | Dependencies, environment setup, API configs (local, gitignored) |
| `techContext.template.md` | Template for techContext.md (public, committed) |
| `project-template.md` | Business requirements, scope, goals |
| `bv-style-guide.md` | BuildVision design system reference |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Email BDC Agent                             │
├─────────────────────────────────────────────────────────────────────┤
│  UI Layer (Next.js + React)                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │
│  │ Header       │ │ EmailPanel   │ │ BidList      │                │
│  │ (connection) │ │ (list+view)  │ │ (grouped)    │                │
│  └──────────────┘ └──────────────┘ └──────────────┘                │
├─────────────────────────────────────────────────────────────────────┤
│  Service Layer                                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │
│  │ Gmail        │ │ Entity       │ │ Project      │                │
│  │ Service      │ │ Extraction   │ │ Clustering   │                │
│  └──────────────┘ └──────────────┘ └──────────────┘                │
│  ┌──────────────┐ ┌──────────────┐                                  │
│  │ Seller       │ │ Bid List     │                                  │
│  │ Inference    │ │ Grouping     │                                  │
│  └──────────────┘ └──────────────┘                                  │
├─────────────────────────────────────────────────────────────────────┤
│  AI Provider Abstraction                                            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │
│  │ OpenAI (GPT) │ │ Google       │ │ Anthropic    │                │
│  │              │ │ (Gemini)     │ │ (Claude)     │                │
│  └──────────────┘ └──────────────┘ └──────────────┘                │
├─────────────────────────────────────────────────────────────────────┤
│  Data Layer                                                         │
│  ┌──────────────┐ ┌──────────────┐                                  │
│  │ Gmail API    │ │ JSON Export  │                                  │
│  │ (Read-only)  │ │ (Download)   │                                  │
│  └──────────────┘ └──────────────┘                                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## UI Layout Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│ [Header]                                                             │
│ ┌────────┬──────────────────┬───────────┬──────────┬───────────────┐│
│ │ Logo   │ Email BDC Agent  │ Stats     │ Download │ Account       ││
│ │        │                  │ (emails/  │ JSON     │ (email+disc.) ││
│ │        │                  │ bids)     │          │               ││
│ └────────┴──────────────────┴───────────┴──────────┴───────────────┘│
├───────────────────────┬──────────────────────────────────────────────┤
│ [EmailPanel - 400px]  │ [BidList - flexible]                        │
│ ┌───────────────────┐ │ ┌──────────────────────────────────────────┐│
│ │ Header            │ │ │ Summary Header                           ││
│ │ - Emails (count)  │ │ │ - Total bids, Overdue, Today             ││
│ │ - Process All     │ │ │ - Generated timestamp                    ││
│ │ - Refresh         │ │ └──────────────────────────────────────────┘│
│ └───────────────────┘ │ ┌──────────────────────────────────────────┐│
│ ┌───────────────────┐ │ │ [ScrollArea]                             ││
│ │ [ScrollArea]      │ │ │ ┌────────────────────────────────────┐   ││
│ │ - Email Row 1     │ │ │ │ Overdue (red)                      │   ││
│ │   - From, Date    │ │ │ │ - BidCard                          │   ││
│ │   - Subject       │ │ │ │ - BidCard                          │   ││
│ │   - Preview       │ │ │ └────────────────────────────────────┘   ││
│ │   - Play button   │ │ │ ┌────────────────────────────────────┐   ││
│ │ - Email Row 2     │ │ │ │ Today (yellow)                     │   ││
│ │   [Expanded]      │ │ │ │ - BidCard                          │   ││
│ │   - Full details  │ │ │ └────────────────────────────────────┘   ││
│ │   - Body          │ │ │ ┌────────────────────────────────────┐   ││
│ │                   │ │ │ │ Tomorrow (blue)                    │   ││
│ │                   │ │ │ │ - BidCard                          │   ││
│ │                   │ │ │ └────────────────────────────────────┘   ││
│ └───────────────────┘ │ └──────────────────────────────────────────┘│
└───────────────────────┴──────────────────────────────────────────────┘
```

---

## Core Data Models

### Email

```typescript
interface ParsedEmail {
  id: string;
  threadId: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc: EmailAddress[];
  bcc: EmailAddress[];
  subject: string;
  body: { text: string; html?: string } | string;
  date: Date;
  receivedAt: Date;
  labels: string[];
  snippet: string;
  attachments: Attachment[];
}

interface EmailAddress {
  name?: string;
  email: string;
}

interface Attachment {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
}
```

### Extracted Entities

```typescript
interface ExtractedData {
  emailId: string;
  extractedAt: Date;
  provider: 'openai' | 'google' | 'anthropic';
  confidence: number;
  
  purchaser: PurchaserIdentity | null;
  projectSignals: ProjectSignals | null;
  bidDueDates: BidDueDate[];
  extractionNotes: string[];
}

interface PurchaserIdentity {
  companyName: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  confidence: number;
}

interface ProjectSignals {
  projectName?: string;
  projectAddress?: string;
  generalContractor?: string;
  engineer?: string;
  architect?: string;
  confidence: number;
}

interface BidDueDate {
  date: Date;
  time?: string;
  timezone?: string;
  source: 'explicit' | 'inferred';
  rawText: string;
  confidence: number;
}
```

### Bid List Types

```typescript
type DateGroup = 'overdue' | 'today' | 'tomorrow' | 'this_week' | 'next_week' | 'later' | 'no_date';

interface BidItem {
  id: string;
  project: {
    name: string;
    address?: string;
    generalContractor?: string;
    engineer?: string;
    architect?: string;
  };
  bidder: {
    companyName: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
  };
  seller?: {
    id: string;
    name: string;
    email: string;
  };
  dueDate?: Date;
  emailIds: string[];
  confidence: number;
}

interface BidGroup {
  group: DateGroup;
  label: string;
  bids: BidItem[];
  count: number;
}

interface GroupedBidList {
  groups: BidGroup[];
  summary: {
    totalBids: number;
    overdueCount: number;
    todayCount: number;
    thisWeekCount: number;
  };
  generatedAt: Date;
}

interface ProcessingState {
  stage: 'idle' | 'extracting' | 'clustering' | 'complete' | 'error';
  progress: number;
  message: string;
  emailsFetched: number;
  emailsExtracted: number;
  bidsCreated: number;
  error?: string;
}
```

---

## API Response Patterns

All API endpoints follow a consistent response format:

### Success Response
```typescript
{
  success: true,
  // ... endpoint-specific data
}
```

### Error Response
```typescript
{
  success?: false,
  error: string,
  message?: string
}
```

### Endpoint Examples

```typescript
// GET /api/emails
{ success: true, emails: ParsedEmail[], nextPageToken?: string, totalEstimate: number }

// GET /api/emails?id=xxx
{ success: true, email: ParsedEmail }

// POST /api/extract
{ success: true, data: ExtractedData }

// POST /api/cluster
{ success: true, data: ClusteringResult }

// GET /api/auth/gmail
{ isAuthenticated: boolean, email?: string }
```

---

## Concurrent Processing Pattern

```typescript
// Process emails in batches with max concurrency
const MAX_CONCURRENT = 15;

async function processEmailBatch(
  emails: ParsedEmail[],
  onProgress: (completed: number) => void
): Promise<ExtractedData[]> {
  const results: ExtractedData[] = [];
  let completed = 0;

  // Process in chunks of MAX_CONCURRENT
  for (let i = 0; i < emails.length; i += MAX_CONCURRENT) {
    const chunk = emails.slice(i, i + MAX_CONCURRENT);
    
    // Process chunk in parallel
    const chunkResults = await Promise.allSettled(
      chunk.map(email => extractEntities(email))
    );

    // Collect successful results
    for (const result of chunkResults) {
      if (result.status === 'fulfilled' && result.value) {
        results.push(result.value);
      }
      completed++;
      onProgress(completed);
    }
  }

  return results;
}
```

---

## Scroll Pattern for Flexbox

Proper scrolling in flexbox containers requires:

```typescript
// Parent container: h-full + flex + min-h-0
<div className="h-full flex flex-col min-h-0">
  
  // Fixed header: flex-shrink-0
  <div className="flex-shrink-0">Header</div>
  
  // Scrollable area: flex-1 + min-h-0 + overflow-y-auto
  <ScrollArea className="flex-1 min-h-0">
    <div>Content that can scroll</div>
  </ScrollArea>
</div>

// ScrollArea viewport needs overflow-y-auto
<ScrollAreaPrimitive.Viewport className="... overflow-y-auto">
```

**Why `min-h-0`?** Flexbox items default to `min-height: auto`, preventing shrinking below content size. `min-h-0` allows the flex item to shrink, enabling overflow scrolling.

---

## File Structure

```
email-agent/
├── app/
│   ├── globals.css              # BuildVision design tokens
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Main dashboard (side-by-side panels)
│   └── api/
│       ├── auth/gmail/          # Gmail OAuth
│       │   ├── route.ts         # Auth status, initiate, disconnect
│       │   └── callback/route.ts # OAuth callback
│       ├── emails/route.ts      # Email fetching
│       ├── extract/route.ts     # Entity extraction
│       └── cluster/route.ts     # Project clustering
├── components/
│   ├── ui/                      # ShadCN components (scroll-area, button, etc.)
│   ├── gmail/
│   │   ├── EmailPanel.tsx       # Combined list + inline viewer
│   │   ├── GmailConnectionCard.tsx
│   │   └── index.ts
│   ├── bids/
│   │   ├── BidCard.tsx          # Individual bid display
│   │   ├── BidList.tsx          # Grouped bid list with date headers
│   │   └── index.ts
│   ├── layout/
│   │   ├── Header.tsx           # App header with connection status
│   │   └── index.ts
│   └── extraction/
│       ├── ExtractionCard.tsx
│       └── index.ts
├── lib/
│   ├── utils.ts                 # ShadCN utility (cn)
│   ├── ai/
│   │   ├── index.ts             # Provider factory, FAST_MODELS
│   │   ├── types.ts             # Common types
│   │   ├── prompts.ts           # Extraction prompts
│   │   └── providers/
│   │       ├── openai.ts
│   │       ├── google.ts
│   │       └── anthropic.ts
│   ├── gmail/
│   │   ├── index.ts             # Gmail service
│   │   ├── auth.ts              # OAuth handling
│   │   └── types.ts
│   ├── extraction/
│   │   ├── index.ts             # Extraction service
│   │   └── schemas.ts           # Zod schemas
│   ├── sellers/
│   │   ├── index.ts
│   │   ├── inference.ts         # Email-based inference
│   │   └── types.ts
│   ├── clustering/
│   │   ├── index.ts             # Clustering service
│   │   ├── similarity.ts        # Similarity functions
│   │   └── types.ts
│   └── bids/
│       ├── index.ts             # Exports
│       ├── grouping.ts          # Date grouping utilities
│       └── types.ts             # BidItem, BidGroup, etc.
├── memory-bank/
│   ├── activeContext.md
│   ├── progress.md
│   ├── systemPatterns.md
│   ├── techContext.md
│   ├── project-template.md
│   └── bv-style-guide.md
├── postcss.config.mjs           # PostCSS config for Tailwind
├── .env.local
├── .gitignore
├── components.json
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## Design Patterns Used

### Provider Pattern (AI Services)
Factory pattern for AI provider abstraction - allows runtime switching between GPT/Gemini/Claude.

### Strategy Pattern (Seller Inference)
Different inference strategies: email recipients, domain matching, future Postgres lookup.

### Pipeline Pattern (Email Processing)
Sequential processing: Fetch → Extract (concurrent) → Cluster → Group → Display

### Concurrent Batch Pattern
Process items in parallel batches with `Promise.allSettled()` for fault tolerance.

---

## Notes

*Architecture decisions and rationale*

- **No database for MVP:** All data is processed in-memory and exported to JSON
- **Stateless extraction:** Each email can be processed independently
- **Concurrent processing:** 15 parallel LLM calls balance speed vs rate limits
- **Consistent API format:** All endpoints return `{ success: true, ... }` or `{ error: string }`
- **Flexbox scroll pattern:** `min-h-0` required on flex containers for proper overflow
Allows different inference strategies to be plugged in (recipients, domain, AI-inferred).
