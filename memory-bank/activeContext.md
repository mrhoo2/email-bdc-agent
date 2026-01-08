# Active Context

> **Purpose**: Track current development focus, recent decisions, and blockers for the Email BDC Agent project.

---

## Memory Bank Directory Index

| File | Purpose |
|------|---------|
| `activeContext.md` | Current focus, blockers, decisions-in-progress (this file) |
| `progress.md` | Stage completion status, test results, iteration notes |
| `systemPatterns.md` | Data models, architecture decisions, extraction patterns |
| `techContext.md` | Dependencies, environment setup, API configs (local, gitignored) |
| `techContext.template.md` | Template for techContext.md (public, committed) |
| `project-template.md` | Business requirements, scope, goals |
| `bv-style-guide.md` | BuildVision design system reference |

---

## Current Focus

**Stage:** 5 - Demo UI ✅ COMPLETE

**Status:** Stage 5 fully implemented with side-by-side panel layout

**Completed Tasks:**
- [x] Copy Header from Takeoffs with BuildVision Labs branding
- [x] Create bid list types (`lib/bids/types.ts`)
- [x] Create date grouping utilities (`lib/bids/grouping.ts`)
- [x] Build BidCard component with project/purchaser/seller display
- [x] Build BidList component with date-based grouping
- [x] Create EmailPanel component (combined list + viewer)
- [x] Update main page with side-by-side layout
- [x] Wire up data flow: Fetch → Extract → Cluster → Display
- [x] Build passes with no TypeScript errors

**Implementation Details:**
- **Header:** BuildVision logo + "Email BDC Agent" title + Process/Refresh buttons
- **Left Panel (400px):** Email list with inline viewer (click to expand)
- **Right Panel (flexible):** Bid list grouped by date (Today, Tomorrow, This Week, etc.)
- **Data Flow:** Process Emails button triggers Extract → Cluster → createGroupedBidList()
- **Bid Cards:** Show project name, address, bidder, seller, due date

---

## Stage 2 Implementation Summary

### Files Created

| File | Purpose |
|------|---------|
| `lib/extraction/schemas.ts` | Zod validation schemas for all extraction types |
| `lib/extraction/index.ts` | Extraction service using Gemini 3 Pro Preview |
| `app/api/extract/route.ts` | POST endpoint for entity extraction |
| `components/extraction/ExtractionCard.tsx` | UI for displaying extraction results |
| `components/extraction/index.ts` | Component exports |

### Architecture

```
Email → /api/extract → Gemini 3 Pro Preview → Zod Validation → ExtractedData
                                                                    ↓
                                                          ExtractionCard UI
```

### Extracted Entities

1. **PurchaserIdentity**: Company name, contact name/email/phone
2. **ProjectSignals**: Project name, address, GC, engineer, architect
3. **BidDueDates**: Date, time, timezone, source (explicit/inferred), raw text

All entities include confidence scores (0.0-1.0).

---

## AI Model Configuration (January 2026)

| Provider | Model | Status |
|----------|-------|--------|
| Google | `gemini-3-pro-preview` | ✅ Active - Primary extraction |
| OpenAI | `gpt-5.2` | ⏸️ Available |
| Anthropic | `claude-sonnet-4-5-20250929` | ⏸️ Available |

---

## Recent Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-08 | Stage 4 complete | AI-assisted clustering implemented |
| 2026-01-08 | Use Gemini Flash for clustering | Speed optimized for bulk processing |
| 2026-01-08 | Added FAST_MODELS tier | Centralized fast model config for speed tasks |
| 2026-01-08 | Hybrid clustering approach | Rule-based + AI for best accuracy |
| 2026-01-08 | Stage 2 complete and tested | Extraction working with real emails |
| 2026-01-08 | Skip database persistence | Will integrate with main app for production |

---

## Open Questions

- None currently

---

## Blockers

- None currently

---

## Completed Stages

### Stage 0: Foundation ✅
- Next.js 15 + TypeScript
- ShadCN UI (new-york style)
- AI provider abstraction
- BuildVision design tokens

### Stage 1: Gmail Integration ✅
- OAuth2 authentication
- Email fetching with pagination
- Email viewer component
- Token persistence (file-based)

### Stage 2: Entity Extraction ✅
- Zod validation schemas
- Extraction service with Gemini 3 Pro Preview
- /api/extract API endpoint
- ExtractionCard UI component
- Integration with main page (3-column layout)
- Tested with real bid emails

### Stage 3: Seller Inference ✅
- Seller types and Zod schemas
- Email recipient pattern matching
- @buildvision.io domain detection
- Confidence scoring by field type

### Stage 4: Project Clustering ✅
- Clustering types and schemas
- Similarity calculation (string-similarity)
- AI-assisted clustering with Gemini Flash
- Rule-based clustering with Union-Find
- /api/cluster API endpoint

### Stage 5: Demo UI ✅
- BuildVision Labs Header (from Takeoffs)
- Side-by-side panel layout
- Left panel: EmailPanel (list + inline viewer)
- Right panel: BidList grouped by date
- Bid cards with project, bidder, seller, due date
- Process Emails workflow (Extract → Cluster → Display)

---

## Notes

*Session notes and context that should carry forward to next session.*

- Gmail integration working with bids@buildvision.io
- Repository: `git@github.com:mrhoo2/email-bdc-agent.git`
- Extraction tested successfully on "Byron WWTP - Improvements" email
- Version: v0.2.0 (Stage 2 complete)
- UI: 3-column layout - Email List | Email Viewer | Extraction Card
*Session notes and context that should carry forward to next session.*

