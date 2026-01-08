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

**Stage:** 1 - Gmail Integration (Code Complete)

**Status:** Implementation complete, awaiting Google Cloud credentials for live testing

**Completed Tasks (Stage 1):**
- [x] Gmail OAuth2 authentication flow (lib/gmail/auth.ts)
- [x] Token management with automatic refresh
- [x] Email fetching service with pagination (lib/gmail/index.ts)
- [x] Email parsing (HTML/plain text body extraction)
- [x] API routes for OAuth and email fetching
- [x] UI components (GmailConnectionCard, EmailList, EmailViewer)
- [x] Integrated components into main page

**Next Steps:**
- [ ] Set up Google Cloud Project and enable Gmail API
- [ ] Create OAuth credentials and add to .env.local
- [ ] Test OAuth flow end-to-end with bids@buildvision.io
- [ ] Begin Stage 2: Entity Extraction

**Next Milestone:** Complete live testing of Gmail integration, then start Stage 2

---

## Recent Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-08 | In-memory token storage for MVP | Simple approach, no database needed for demo |
| 2026-01-08 | Batch email fetching with pagination | Handles large inboxes efficiently |
| 2026-01-08 | Base64url decoding for email bodies | Gmail API returns bodies in base64url format |
| 2026-01-08 | Basic HTML sanitization for display | Security - removes scripts and event handlers |
| 2026-01-08 | Use AI provider abstraction | Enable quick switching between GPT/Gemini/Claude |
| 2026-01-08 | Backfill-first approach | MVP processes historical inbox, no real-time polling |

---

## Open Questions

- None currently - ready to test with live credentials

---

## Blockers

- **Google Cloud Setup Required:** Need to create OAuth credentials in Google Cloud Console
  - Create project, enable Gmail API
  - Configure OAuth consent screen
  - Generate OAuth client ID/secret
  - Add credentials to .env.local

---

## Files Created (Stage 1)

### Gmail Service Layer
- `lib/gmail/types.ts` - Type definitions for Gmail API
- `lib/gmail/auth.ts` - OAuth2 authentication and token management
- `lib/gmail/index.ts` - Email fetching and parsing service

### API Routes
- `app/api/auth/gmail/route.ts` - OAuth initiation and status
- `app/api/auth/gmail/callback/route.ts` - OAuth callback handler
- `app/api/emails/route.ts` - Email fetching endpoint

### UI Components
- `components/gmail/GmailConnectionCard.tsx` - Gmail connection status and connect button
- `components/gmail/EmailList.tsx` - Email list with pagination
- `components/gmail/EmailViewer.tsx` - Full email display
- `components/gmail/index.ts` - Component exports

### ShadCN Components Added
- `components/ui/button.tsx`
- `components/ui/card.tsx`
- `components/ui/badge.tsx`
- `components/ui/scroll-area.tsx`
- `components/ui/separator.tsx`

---

## Notes

*Session notes and context that should carry forward to next session.*

- Build passes: `bun run build` ✓
- TypeScript check passes: `bun typecheck` ✓
- Repository: `git@github.com:mrhoo2/email-bdc-agent.git`
- Target inbox: bids@buildvision.io
- Ready for Stage 2 after live Gmail testing
