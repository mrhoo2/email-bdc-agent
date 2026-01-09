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

**Stage:** 6 - GreenHack Demo Preparation ✅ COMPLETE

**Status:** Complete - Multi-purchaser consolidation and signature parsing implemented

**Demo Context:**
- GreenHack prioritizes automated project rekeying to avoid manual data entry
- Demo will show: Email inbox → Automated bid list with multiple purchasers per project
- Key scenario: Bay Mechanical + ABC Mechanical requesting quotes for same project

---

## GreenHack Demo Implementation - COMPLETED

### Problem Solved
The app now consolidates multiple emails into project-centric bid cards with multiple purchasers. The `mergeBidsByCluster()` function is now called automatically in `createGroupedBidList()`.

### Phase 1: Data Model Updates ✅
- [x] Added `Purchaser` type for individual contractors
- [x] Updated `BidItem` to support `purchasers: Purchaser[]` array
- [x] Added `source` field to track extraction source

### Phase 2: Extraction Prompt Enhancement ✅
- [x] Updated `EXTRACTION_SYSTEM_PROMPT` for email signature parsing
- [x] Added instructions to detect forwarded message content
- [x] Handle case where "from" is internal domain, purchaser is in body

### Phase 3: Consolidation Logic ✅
- [x] Enabled `mergeBidsByCluster()` in processing flow
- [x] Updated merge logic to aggregate purchasers by company name
- [x] `createGroupedBidList()` now calls merge automatically

### Phase 4: UI Updates ✅
- [x] Updated `BidCard` to show multiple purchasers per project
- [x] Display purchaser source (signature, forwarded, etc.)
- [x] New layout with purchasers list and individual due dates

---

## Files to Modify

| File | Phase | Changes |
|------|-------|---------|
| `lib/bids/types.ts` | 1 | Add `Bidder` type, update `BidItem` |
| `lib/extraction/schemas.ts` | 1 | Add `bidderSource` field |
| `lib/ai/prompts.ts` | 2 | Signature parsing instructions |
| `lib/bids/grouping.ts` | 3 | Enable merge, aggregate bidders |
| `components/bids/BidCard.tsx` | 4 | Multi-bidder UI |
| `app/page.tsx` | 3 | Wire up merge logic |

---

## Recent Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-09 | Parse email signatures for bidder info | Internal sales engineers forward emails; bidder is in body, not from-address |
| 2026-01-09 | Project-centric view with multiple bidders | Demo needs to show same project with different bidders |
| 2026-01-09 | Enable mergeBidsByCluster | Function exists but unused; fixes consolidation |
| 2026-01-08 | Add `success` field to all API responses | Consistent API response format for frontend |

---

## Blockers

- None currently

---

## Notes

*Session notes and context for GreenHack demo*

- Demo for mechanical sales rep and manufacturer
- GreenHack contract is significant
- Email signature parsing critical for internal sales engineer use case
- Multiple bidders per project is key demo requirement
- Someone else handling demo email templates
### Stage 0: Foundation ✅
