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

**Stage:** 3 - Seller Inference ✅ COMPLETE

**Status:** Stage 3 fully implemented, ready for testing

**Completed Tasks:**
- [x] Create seller types and Zod schemas (`lib/sellers/types.ts`)
- [x] Implement seller inference from email recipients (`lib/sellers/inference.ts`)
- [x] Add InferredSeller to extraction schemas
- [x] Integrate seller inference into extraction flow
- [x] Update ExtractionCard UI to display inferred seller
- [x] Build passes with no TypeScript errors

**Implementation Details:**
- Seller inference checks TO/CC recipients for @buildvision.io addresses
- No AI needed - simple pattern matching on email domain
- Confidence: 95% for TO field, 85% for CC field, 75% for BCC field
- Name inferred from email username if display name not available

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

## Next Stage: Stage 3 - Seller Inference

**Planned:**
- [ ] Analyze email recipients for @buildvision.io addresses
- [ ] Map recipients to sales representatives
- [ ] Add seller inference to extraction output
- [ ] Update UI to display inferred seller

**Note:** Database persistence deferred - will integrate with main BuildVision app for production.

---

## Recent Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-08 | Stage 2 complete and tested | Extraction working with real emails |
| 2026-01-08 | Skip database persistence | Will integrate with main app for production |
| 2026-01-08 | Focus on Gemini 3 Pro Preview only | Faster iteration, single model first |
| 2026-01-08 | AI Models Reference added to global template | Standardize model names across projects |

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

---

## Notes

*Session notes and context that should carry forward to next session.*

- Gmail integration working with bids@buildvision.io
- Repository: `git@github.com:mrhoo2/email-bdc-agent.git`
- Extraction tested successfully on "Byron WWTP - Improvements" email
- Version: v0.2.0 (Stage 2 complete)
- UI: 3-column layout - Email List | Email Viewer | Extraction Card
*Session notes and context that should carry forward to next session.*
