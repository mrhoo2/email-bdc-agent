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

**Stage:** 6.1 - Calendar View & 3-Panel Layout

**Status:** In Progress - Adding calendar with resizable panels

**Demo Context:**
- GreenHack prioritizes automated project rekeying to avoid manual data entry
- Demo will show: Email inbox → Automated bid list with calendar context
- Calendar highlights bid due dates and allows click-to-scroll

---

## Stage 6.1: Calendar View Implementation

### Requirements
1. **3-Panel Layout**: Email (left) | Bid List (middle) | Calendar (right)
2. **Resizable panels**: Drag handles between panels to resize
3. **Calendar features**:
   - Month view with highlighted bid due dates
   - Color-coded by urgency (overdue=red, today=yellow, upcoming=blue)
   - Click on day scrolls to bids for that day
4. **Spotify-style collapse**: Calendar can be hidden/shown with toggle button
5. **Calendar visible by default**

### Layout
```
┌──────────────────────────────────────────────────────────────────────────┐
│ [Header]                                                                  │
├─────────────────┬───────────────────────────────┬────────────────────────┤
│  [Email Panel]  ⋮  [Bid List Panel]            ⋮  [Calendar Panel]      │
│  ~320px         │  (flexible)                   │  ~320px (collapsible)  │
│  <drag>         │                               │  <drag>                │
└─────────────────┴───────────────────────────────┴────────────────────────┘
```

### Implementation Plan
- [ ] Install react-resizable-panels
- [ ] Create BidCalendar.tsx component
- [ ] Add click-to-scroll functionality
- [ ] Update page.tsx with 3-panel resizable layout
- [ ] Add Spotify-style collapse/expand
- [ ] Style with BuildVision design tokens

### Files to Create/Modify
| File | Action |
|------|--------|
| `package.json` | Add react-resizable-panels |
| `components/bids/BidCalendar.tsx` | Create calendar component |
| `components/bids/index.ts` | Export BidCalendar |
| `app/page.tsx` | 3-panel resizable layout |
| `app/globals.css` | Panel resize handle styles |

---

## Previous Stage: Multi-Purchaser Consolidation ✅ COMPLETE

### Problem Solved
The app now consolidates multiple emails into project-centric bid cards with multiple purchasers.

### Changes Made (Commit d8ee30b)
- Added `Purchaser` type for individual contractors
- Updated `BidItem` to support `purchasers: Purchaser[]` array
- Updated extraction prompt for email signature parsing
- Enabled `mergeBidsByCluster()` in processing flow
- Updated BidCard UI for multi-purchaser display

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
