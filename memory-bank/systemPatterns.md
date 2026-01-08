# System Patterns

> **Purpose**: Document data models, architecture decisions, and extraction patterns for the Email BDC Agent project.

---

## Memory Bank Directory Index

| File | Purpose |
|------|---------|
| `activeContext.md` | Current focus, blockers, decisions-in-progress |
| `progress.md` | Stage completion status, test results, iteration notes |
| `systemPatterns.md` | Data models, architecture decisions, extraction patterns (this file) |
| `techContext.md` | Dependencies, environment setup, API configurations |
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
│  │ Email Viewer │ │ Extraction   │ │ Bid List     │                │
│  │              │ │ Comparison   │ │ Table        │                │
│  └──────────────┘ └──────────────┘ └──────────────┘                │
├─────────────────────────────────────────────────────────────────────┤
│  Service Layer                                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │
│  │ Gmail        │ │ Entity       │ │ Project      │                │
│  │ Service      │ │ Extraction   │ │ Clustering   │                │
│  └──────────────┘ └──────────────┘ └──────────────┘                │
│  ┌──────────────┐ ┌──────────────┐                                  │
│  │ Seller       │ │ Bid List     │                                  │
│  │ Inference    │ │ Aggregation  │                                  │
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
│  │ Gmail API    │ │ Postgres     │                                  │
│  │ (Read-only)  │ │ (Future)     │                                  │
│  └──────────────┘ └──────────────┘                                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Core Data Models

### Email

```typescript
interface RawEmail {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  historyId: string;
  internalDate: string;  // Unix timestamp in ms
  payload: {
    partId?: string;
    mimeType: string;
    filename?: string;
    headers: Array<{ name: string; value: string }>;
    body?: { size: number; data?: string };
    parts?: EmailPart[];
  };
  sizeEstimate: number;
}

interface ParsedEmail {
  id: string;
  threadId: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc: EmailAddress[];
  bcc: EmailAddress[];
  subject: string;
  body: {
    text: string;
    html?: string;
  };
  date: Date;
  receivedAt: Date;
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

### Seller

```typescript
interface Seller {
  id: string;
  name: string;
  email: string;
  territory?: string;
  assignedPurchasers?: string[];  // For future Postgres integration
}

interface SellerInference {
  seller: Seller | null;
  source: 'email_recipient' | 'postgres_mapping' | 'inferred';
  confidence: number;
  reasoning: string;
}
```

### Project

```typescript
interface Project {
  id: string;
  name: string;
  address?: string;
  generalContractor?: string;
  engineer?: string;
  architect?: string;
  
  emails: string[];        // Email IDs in this project
  purchasers: Purchaser[];
  sellers: Seller[];
  
  createdAt: Date;
  updatedAt: Date;
}

interface Purchaser {
  id: string;
  companyName: string;
  contacts: Contact[];
  bidDueDate?: Date;
  assignedSeller?: Seller;
}

interface Contact {
  name: string;
  email: string;
  phone?: string;
}
```

### Bid List Output

```typescript
interface BidList {
  generatedAt: Date;
  inbox: string;
  dateRange: {
    from: Date;
    to: Date;
  };
  
  projects: ProjectBid[];
  summary: {
    totalProjects: number;
    totalPurchasers: number;
    totalBids: number;
    upcomingDeadlines: number;
  };
}

interface ProjectBid {
  project: {
    id: string;
    name: string;
    address?: string;
    gc?: string;
    engineer?: string;
    architect?: string;
  };
  
  bids: Bid[];
}

interface Bid {
  purchaser: {
    id: string;
    companyName: string;
    contact: Contact;
  };
  seller: {
    id: string;
    name: string;
    email: string;
  };
  dueDate: Date;
  emails: string[];  // Related email IDs
  status: 'pending' | 'submitted' | 'won' | 'lost' | 'no_bid';
}
```

---

## AI Provider Abstraction

### Interface Design

```typescript
interface AIProvider {
  name: 'openai' | 'google' | 'anthropic';
  extractEntities(email: ParsedEmail): Promise<ExtractedData>;
  inferSeller(email: ParsedEmail, context: SellerContext): Promise<SellerInference>;
}

interface AIProviderConfig {
  provider: 'openai' | 'google' | 'anthropic';
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

// Factory function for provider switching
function createAIProvider(config: AIProviderConfig): AIProvider;
```

### Model Defaults

| Provider | Model | Use Case |
|----------|-------|----------|
| OpenAI | gpt-4o | Primary extraction |
| Google | gemini-1.5-pro | Comparison/fallback |
| Anthropic | claude-3-5-sonnet | Comparison/fallback |

---

## Seller Inference Strategy

### MVP Approach (Email Recipients)

```typescript
interface SellerInferenceStrategy {
  // Primary: Check if any BuildVision seller email is in To/CC
  fromRecipients(email: ParsedEmail): Seller | null;
  
  // Secondary: Check email domain for known seller patterns
  fromDomain(email: ParsedEmail): Seller | null;
  
  // Fallback: Return null with flag for manual assignment
  unknown(): null;
}
```

### Future Postgres Integration

```typescript
interface SellerMappingRepository {
  // Look up seller by purchaser company
  findByPurchaser(purchaserCompany: string): Promise<Seller | null>;
  
  // Look up seller by territory/region
  findByTerritory(region: string): Promise<Seller | null>;
  
  // Look up seller by email domain
  findByDomain(domain: string): Promise<Seller | null>;
}
```

---

## Project Clustering Algorithm

### Similarity Signals

| Signal | Weight | Description |
|--------|--------|-------------|
| Subject Match | 0.3 | Fuzzy match on email subject |
| Address Match | 0.35 | Fuzzy match on project address |
| Project Name | 0.25 | Fuzzy match on extracted project name |
| GC/Engineer | 0.1 | Match on general contractor or engineer |

### Clustering Approach

```typescript
interface ClusteringConfig {
  similarityThreshold: number;  // Default: 0.7
  signals: SignalWeight[];
}

interface ProjectCluster {
  id: string;
  name: string;
  emails: string[];
  confidence: number;
  mergedFrom?: string[];  // If cluster was merged
}

// Algorithm: Agglomerative clustering with custom similarity function
function clusterEmails(
  emails: ExtractedData[],
  config: ClusteringConfig
): ProjectCluster[];
```

---

## File Structure

```
email-agent/
├── app/
│   ├── globals.css              # BuildVision design tokens
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Main dashboard
│   └── api/
│       ├── auth/
│       │   └── gmail/
│       │       └── route.ts     # Gmail OAuth
│       ├── emails/
│       │   └── route.ts         # Email fetching
│       ├── extract/
│       │   └── route.ts         # Entity extraction
│       └── process/
│           └── route.ts         # Full pipeline
├── components/
│   ├── ui/                      # ShadCN components
│   ├── email/
│   │   ├── EmailViewer.tsx
│   │   └── EmailList.tsx
│   ├── extraction/
│   │   ├── ExtractionCard.tsx
│   │   └── ModelComparison.tsx
│   └── bids/
│       ├── BidTable.tsx
│       └── ProjectGroup.tsx
├── lib/
│   ├── utils.ts                 # ShadCN utility
│   ├── ai/
│   │   ├── index.ts             # Provider factory
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
│   │   ├── index.ts             # Seller lookup
│   │   ├── inference.ts         # Email-based inference
│   │   └── postgres.ts          # Future: DB integration
│   └── clustering/
│       ├── index.ts             # Clustering service
│       └── similarity.ts        # Similarity functions
├── hooks/
│   ├── useEmails.ts
│   └── useBidList.ts
├── memory-bank/
│   ├── activeContext.md
│   ├── progress.md
│   ├── systemPatterns.md
│   ├── techContext.md
│   ├── project-template.md
│   └── bv-style-guide.md
├── .env.local
├── .gitignore
├── components.json
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## Design Patterns

### Provider Pattern (AI Services)
Used for AI provider abstraction - allows runtime switching between GPT/Gemini/Claude.

### Repository Pattern (Seller Mapping)
Abstracts data access for seller lookup - enables easy swap between inference and Postgres.

### Strategy Pattern (Seller Inference)
Allows different inference strategies to be plugged in (recipients, domain, AI-inferred).

### Pipeline Pattern (Email Processing)
Sequential processing: Fetch → Parse → Extract → Cluster → Output

---

## API Design

### Internal API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/gmail` | GET/POST | Gmail OAuth flow |
| `/api/emails` | GET | Fetch emails (with pagination) |
| `/api/extract` | POST | Extract entities from email(s) |
| `/api/process` | POST | Run full pipeline |
| `/api/bids` | GET | Get generated bid list |

---

## Notes

*Architecture decisions and rationale*

- **No database for MVP:** All data is processed in-memory and exported to JSON
- **Stateless extraction:** Each email can be processed independently
- **Idempotent operations:** Re-processing same email produces same result
- **Provider-agnostic prompts:** Same prompt structure works across all AI providers
