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

**Stage:** 5 - Demo UI ✅ COMPLETE (with refinements)

**Status:** Stage 5 fully implemented with UI fixes and improvements

**Latest Changes (January 8, 2026):**
- [x] Fixed email API response format (`success: true` field)
- [x] Fixed scroll functionality in both email and bid panels
- [x] Added concurrent LLM processing (max 15 parallel calls)
- [x] Added process single email functionality
- [x] Added Download JSON button for exporting bid results
- [x] Header shows connected Gmail account with disconnect option
- [x] PostCSS configured with `@tailwindcss/postcss`

**Implementation Details:**
- **Header:** BuildVision logo + "Email BDC Agent" title + stats + Download JSON + connection status
- **Left Panel (400px):** Email list with inline viewer, Process All button, Refresh button
- **Right Panel (flexible):** Bid list grouped by date (Overdue, Today, Tomorrow, This Week, etc.)
- **Data Flow:** Process Emails → Extract (15 concurrent) → Cluster → createGroupedBidList()
- **Scroll Fix:** Added `min-h-0` to flex containers and `overflow-y-auto` to ScrollArea viewport

---

## Recent Session Work

### Session: January 8, 2026 (Late)

**Issues Addressed:**
1. "Failed to fetch emails" error - API returned `{ emails }` but UI expected `{ success: true, emails }`
2. Scroll not working in email panel (only when email selected)
3. Scroll not working in bid list panel

**Fixes Applied:**
1. Updated `/api/emails/route.ts` to include `success: true` in all responses
2. Added `overflow-y-auto` to ScrollArea viewport component
3. Added `min-h-0` to all flex containers in EmailPanel, BidList, and page.tsx

**Commits:**
- `a00489d` - feat: Stage 5 UI improvements and fixes
- `a17fb66` - fix: scroll functionality in email and bid panels

---

## AI Model Configuration (January 2026)

| Provider | Model | Status |
|----------|-------|--------|
| Google | `gemini-3-pro-preview` | ✅ Active - Primary extraction |
| Google | `gemini-3-flash-preview` | ✅ Active - Fast tier (clustering) |
| OpenAI | `gpt-5.2` | ⏸️ Available |
| Anthropic | `claude-sonnet-4-5-20250929` | ⏸️ Available |

---

## Recent Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-08 | Add `success` field to all API responses | Consistent API response format for frontend |
| 2026-01-08 | Use `min-h-0` for flex scroll containers | Flexbox requires this to allow shrinking below content height |
| 2026-01-08 | 15 concurrent LLM calls | Balance between speed and API rate limits |
| 2026-01-08 | Stage 5 complete | Demo UI fully functional |

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

### Stage 3: Seller Inference ✅
- Seller types and Zod schemas
- Email recipient pattern matching
- @buildvision.io domain detection

### Stage 4: Project Clustering ✅
- AI-assisted clustering with Gemini Flash
- Rule-based clustering with Union-Find
- /api/cluster API endpoint

### Stage 5: Demo UI ✅
- BuildVision Labs Header with connection status
- Side-by-side panel layout with proper scrolling
- EmailPanel with process buttons
- BidList grouped by date
- Concurrent LLM processing
- JSON export functionality

---

## Notes

*Session notes and context that should carry forward to next session.*

- Gmail integration working with bids@buildvision.io
- Repository: `git@github.com:mrhoo2/email-bdc-agent.git`
- Latest commit: `a17fb66` (scroll fixes)
- All stages complete - ready for production integration or additional features
- PostCSS configuration: `postcss.config.mjs` with `@tailwindcss/postcss`
- Side-by-side panel layout
