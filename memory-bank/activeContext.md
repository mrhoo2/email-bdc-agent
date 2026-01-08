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

**Stage:** 2 - Entity Extraction (Gemini 3 Pro Preview) ✅ COMPLETE & TESTED

**Status:** Stage 2 fully implemented and tested with real bid emails

**Completed Tasks:**
- [x] Create Zod validation schemas for extraction output
- [x] Build extraction API route (/api/extract)
- [x] Create extraction test UI component (ExtractionCard)
- [x] Integrate extraction into main page
- [x] Test with real bid emails from Gmail (bids@buildvision.io)

**Test Results (January 8, 2026):**
Extraction tested on real email "Byron WWTP - Improvements":
- Purchaser: Michael Powers (80% confidence)
- Project: Byron WWTP - Improvements (90% confidence)
- Bid Due Date: Thu, Jan 8, 2026 (70% confidence, inferred from "by the end of this week")

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
