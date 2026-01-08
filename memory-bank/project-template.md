# Email BDC Agent - Project Brief

> **Purpose**: Business requirements, scope, and goals for the Email Bid Desk Coordinator Agent. Technical details are in `techContext.md`.

---

## Memory Bank Directory Index

| File | Purpose |
|------|---------|
| `activeContext.md` | Current focus, blockers, decisions-in-progress |
| `progress.md` | Stage completion status, test results, iteration notes |
| `systemPatterns.md` | Data models, architecture decisions, extraction patterns |
| `techContext.md` | Dependencies, environment setup, API configurations |
| `project-template.md` | Business requirements, scope, goals (this file) |
| `bv-style-guide.md` | BuildVision design system reference |

---

## Project Brief

### Overview

Email ingestion system that automatically turns bid-related emails into a structured bid list. Replaces the bid-desk coordinator function by monitoring email inbox, extracting bid-relevant information, and producing structured JSON reports.

### Target Users

- [x] HVAC Equipment Purchasers / Contractors
- [x] HVAC Sales Representatives

### Core Requirements

- Gmail OAuth integration to authorize one or more accounts. Start with bids@buildvision.io
- Inbox monitoring/polling (manual run is okay for MVP)
- For each email, extract:
  - Source inbox
  - Purchaser / contractor identity
  - Assigned seller (sales rep / account owner, inferred or mapped)
  - Project signals (project name, address, GC/engineer/architect if present)
  - Bid due date (per purchaser, per request)
  - Sender, recipients, subject, body, timestamps, thread IDs
- Project inference + grouping: cluster emails into "generic project" using subject/address/name similarity
- Structured output in JSON (optional table view for UI)
- Support many-to-many relationships:
  - One project → many purchasers (contractors)
  - One project → many sellers (sales reps/inboxes)
  - One purchaser ↔ many sellers across different projects

### Goals

- Demonstrate that a software tool can replace a manual bid desk coordinator.
  - No manual project creation
  - Correctly identify the appropriate sales representative assigned to their contractor
  - Manage multiple contractors bidding same job, different due dates for each purchaser
  - Create calendar-based bid lists for organization

---

## Scope

### In Scope

- Gmail OAuth + read-only inbox access
- Email polling or manual ingestion trigger
- LLM-assisted entity extraction (project, purchaser, seller, dates)
- Attachment + document download (metadata only for MVP)
- Many-to-many purchaser/seller modeling
- JSON export (primary MVP deliverable)
- Optional minimal list/table UI for demo

### Out of Scope

- Equipment selection, pricing, or takeoff logic
- BuildVision project creation or ingestion pipeline
- ERP / CRM integrations (Salesforce, etc.)
- Quote sending or sent-email workflows
- Full relevance classification (assume bids inbox is mostly relevant)
- Advanced deduplication or long-term historical reconciliation
- Calendar UI (future iteration)

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| AI provider abstraction | Enable quick switching between GPT/Gemini/Claude as models evolve |
| Backfill-first approach | MVP processes historical inbox, no real-time polling needed |
| Infer sellers from email recipients | Production Postgres mapping not yet accessible; architecture prepared for future integration |
| No batching for MVP | Demo inbox has low volume; future architecture will support high throughput |

---

## Success Criteria

### MVP (Stage 6 Complete)

1. **OAuth Flow:** Successfully authenticate with Gmail and fetch historical emails
2. **Entity Extraction:** Extract purchaser, project signals, and due dates with >80% accuracy on sample set
3. **Seller Inference:** Correctly infer seller from email recipients for known relationships
4. **Project Clustering:** Group related emails into projects with reasonable accuracy
5. **JSON Output:** Generate complete, well-structured bid list JSON
6. **Demo UI:** Basic table view for stakeholder review

### Future Iterations

- Real-time inbox monitoring
- Postgres integration for seller mapping
- Calendar-based bid list view
- Attachment content extraction
- Multi-inbox support

---

## Reference

- **Style Guide:** `bv-style-guide.md` - BuildVision design system
- **System Architecture:** `systemPatterns.md` - Data models and patterns
- **Technical Setup:** `techContext.md` - Dependencies and configuration
- **Progress Tracking:** `progress.md` - Implementation stages
