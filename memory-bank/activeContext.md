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

**Stage:** 0 - Foundation & Test Harness

**Active Tasks:**
- [ ] Initialize Next.js project with BuildVision stack
- [ ] Configure ShadCN with components.json
- [ ] Set up globals.css with design tokens
- [ ] Create core TypeScript interfaces
- [ ] Build AI provider abstraction layer
- [ ] GitHub repo setup

**Next Milestone:** Complete Stage 0, verify all three AI providers connect successfully

---

## Recent Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-08 | Use AI provider abstraction | Enable quick switching between GPT/Gemini/Claude |
| 2026-01-08 | Backfill-first approach | MVP processes historical inbox, no real-time polling |
| 2026-01-08 | Infer sellers from recipients | Production Postgres mapping not yet accessible |
| 2026-01-08 | Seller interface designed for future Postgres | Architecture prep for production integration |

---

## Open Questions

- None currently

---

## Blockers

- None currently

---

## Notes

*Session notes and context that should carry forward to next session.*

- Initial project setup in progress
- Repository: `git@github.com:mrhoo2/email-bdc-agent.git`
- Target inbox: bids@buildvision.io
