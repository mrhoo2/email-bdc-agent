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

**Stage:** 2 - Entity Extraction (Gemini 3 Pro)

**Status:** Starting implementation

**Active Tasks:**
- [ ] Create Zod validation schemas for extraction output
- [ ] Build extraction API route (/api/extract)
- [ ] Create extraction test UI component
- [ ] Test with real bid emails from Gmail

**Next Milestone:** Extract entities from bid emails using Gemini 3 Pro

---

## Scope Decision (2026-01-08)

**Focus on Gemini 3 Pro only** for initial extraction implementation.

**Deferred to Future Iteration:**
- GPT-5.2 extraction implementation
- Claude 4.5 Sonnet extraction implementation
- Multi-model comparison/benchmarking UI

**Rationale:** Faster iteration - get extraction working with one model first, then expand.

---

## Recent Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-08 | Focus on Gemini 3 Pro only | Faster iteration, single model first |
| 2026-01-08 | Update to 2026 AI models | GPT-5.2, Gemini 3 Pro, Claude 4.5 Sonnet |
| 2026-01-08 | In-memory token storage for MVP | Simple approach, no database needed for demo |
| 2026-01-08 | File-based token persistence for dev | Survives hot reloads |
| 2026-01-08 | Backfill-first approach | MVP processes historical inbox, no real-time polling |

---

## AI Model Configuration (January 2026)

| Provider | Model | Status |
|----------|-------|--------|
| Google | gemini-3-pro | 🔄 Active - Primary extraction |
| OpenAI | gpt-5.2 | ⏸️ Deferred |
| Anthropic | claude-4.5-sonnet | ⏸️ Deferred |

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

---

## Files to Create (Stage 2)

### Extraction Service
- `lib/extraction/schemas.ts` - Zod schemas for validation
- `lib/extraction/index.ts` - Extraction service using Gemini 3

### API Routes
- `app/api/extract/route.ts` - Extraction endpoint

### UI Components
- `components/extraction/ExtractionCard.tsx` - Display extraction results

---

## Notes

*Session notes and context that should carry forward to next session.*

- Gmail integration working with mackenzie@buildvision.io
- Repository: `git@github.com:mrhoo2/email-bdc-agent.git`
- Target inbox: bids@buildvision.io
- Gemini API key needed in GOOGLE_GENERATIVE_AI_API_KEY env var
