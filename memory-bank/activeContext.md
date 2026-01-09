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

**Stage:** Demo Ready ✅

**Status:** All core features complete for GreenHack demo

**Demo Context:**
- GreenHack prioritizes automated project rekeying to avoid manual data entry
- Demo will show: Email inbox → Automated bid list with calendar context
- Calendar highlights bid due dates and allows visual deadline awareness

---

## Completed Stages

| Stage | Name | Completed |
|-------|------|-----------|
| 0 | Foundation & Test Harness | 2026-01-08 |
| 1 | Gmail Integration (Backfill Mode) | 2026-01-08 |
| 2 | Entity Extraction (Gemini 3 Pro Preview) | 2026-01-08 |
| 3 | Seller Inference | 2026-01-08 |
| 4 | Project Clustering | 2026-01-08 |
| 5 | Demo UI | 2026-01-08 |
| 6 | GreenHack Demo Enhancements | 2026-01-09 |
| 6.1 | Calendar View & 3-Panel Layout | 2026-01-09 |

---

## Stage 6.1: Calendar View & 3-Panel Layout ✅ COMPLETE

### Summary
Implemented 3-panel resizable layout with calendar view showing bid due dates.

### Key Deliverables
- **3-Panel Layout**: Email (25%) | Bid List (50%) | Calendar (25%)
- **BidCalendar Component**: Month view with color-coded due date indicators
- **Resizable Panels**: Drag handles between all panels
- **Urgency Color Coding**: Green (safe), Yellow (soon), Red (urgent)

### Bug Fix Applied
- **Problem**: react-resizable-panels collapsed on load
- **Solution**: Use `className` instead of inline `style` on Separator; use `className="h-full overflow-auto"` on content containers

---

## Stage 6: Multi-Purchaser Consolidation ✅ COMPLETE

### Summary
The app now consolidates multiple emails into project-centric bid cards with multiple purchasers.

### Key Deliverables
- `Purchaser` type for individual contractors with due dates
- `BidItem` supports `purchasers: Purchaser[]` array
- Email signature parsing for purchaser identification
- `mergeBidsByCluster()` enabled in processing flow
- BidCard UI shows multi-purchaser display

---

## Recent Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-09 | Use `className` not inline `style` on react-resizable-panels Separator | Inline styles caused panel sizing bugs |
| 2026-01-09 | Parse email signatures for bidder info | Internal sales engineers forward emails; bidder is in body, not from-address |
| 2026-01-09 | Project-centric view with multiple bidders | Demo needs to show same project with different bidders |
| 2026-01-09 | Enable mergeBidsByCluster | Function exists but unused; fixes consolidation |
| 2026-01-08 | Add `success` field to all API responses | Consistent API response format for frontend |

---

## Blockers

- None currently

---

## Notes for Next Session

### GreenHack Demo Prep
- Demo emails being prepared by separate team
- Features ready:
  - Automated bid list creation from email inbox
  - AI extraction of project data
  - Multi-purchaser consolidation (multiple bidders → single project)
  - 3-panel resizable layout
  - Calendar view for deadline visualization

### Future Improvements (Post-Demo)
| Item | Description |
|------|-------------|
| Configurable internal domain | Replace hardcoded `@buildvision.io` |
| Click-to-scroll calendar | Click date scrolls bid list to that date |
| Calendar collapse/expand | Spotify-style toggle for calendar panel |
