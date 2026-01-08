# Technical Context - Template

> **Purpose**: Document dependencies, environment setup, API configurations, and development workflow for the Email BDC Agent project.
>
> **NOTE**: Copy this file to `techContext.md` and fill in your local configuration. `techContext.md` is gitignored to protect sensitive information.

---

## Memory Bank Directory Index

| File | Purpose |
|------|---------|
| `activeContext.md` | Current focus, blockers, decisions-in-progress |
| `progress.md` | Stage completion status, test results, iteration notes |
| `systemPatterns.md` | Data models, architecture decisions, extraction patterns |
| `techContext.md` | Dependencies, environment setup, API configurations (local, gitignored) |
| `techContext.template.md` | Template for techContext.md (this file, committed) |
| `project-template.md` | Business requirements, scope, goals |
| `bv-style-guide.md` | BuildVision design system reference |

---

## Technical Stack

### Core Technologies

| Technology | Version | Notes |
|------------|---------|-------|
| **TypeScript** | 5.x | Strict mode enabled, no `any` types |
| **Next.js** | 15.x | App Router, React Server Components |
| **React** | 19.x | Latest stable version |
| **Tailwind CSS** | 4.x | With CSS variables for theming |
| **ShadCN/UI** | latest | Component library (new-york style) |
| **Bun** | 1.x | Package manager |

### ShadCN Configuration

Use the following `components.json` configuration:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

---

## Dependencies

### Core Dependencies

| Package | Purpose |
|---------|---------|
| `next` | React framework |
| `react` | UI library |
| `react-dom` | React DOM rendering |
| `tailwindcss` | Utility-first CSS |
| `lucide-react` | Icons |

### AI Providers

| Package | Purpose |
|---------|---------|
| `openai` | OpenAI GPT integration |
| `@google/generative-ai` | Gemini AI integration |
| `@anthropic-ai/sdk` | Claude AI integration |

### Data & Validation

| Package | Purpose |
|---------|---------|
| `zod` | Input validation & schema definition |
| `date-fns` | Date utilities |

### Gmail Integration

| Package | Purpose |
|---------|---------|
| `googleapis` | Google APIs (Gmail, OAuth) |

---

## Environment Variables

### .env.local Template

Create a `.env.local` file in the project root (see `.env.example`):

```env
# AI API Keys
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# AI Provider Selection (openai | google | anthropic)
AI_PROVIDER=openai

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Gmail OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/gmail/callback
```

---

## Git Configuration

### Repository Details

| Setting | Value |
|---------|-------|
| **Repository** | `git@github.com:<YOUR_USERNAME>/<REPO_NAME>.git` |
| **User Email** | `<YOUR_EMAIL>` |
| **User Name** | `<YOUR_GITHUB_USERNAME>` |
| **SSH Key** | `~/.ssh/<YOUR_SSH_KEY_FILE>` |

### Initial Setup Commands

**IMPORTANT:** When using a non-default SSH key (e.g., personal vs work account), you MUST configure the `core.sshCommand` to specify which key to use.

```bash
# Initialize git repository
git init

# Configure user for this repository
git config user.email "<YOUR_EMAIL>"
git config user.name "<YOUR_GITHUB_USERNAME>"

# CRITICAL: Configure SSH to use the correct key for this repo
git config core.sshCommand "ssh -i ~/.ssh/<YOUR_SSH_KEY_FILE> -o IdentitiesOnly=yes"

# Add remote origin
git remote add origin git@github.com:<YOUR_USERNAME>/<REPO_NAME>.git

# Initial commit
git add .
git commit -m "Initial commit: project setup"
git push -u origin main
```

### SSH Key Selection

If you have multiple GitHub accounts with different SSH keys, configure `core.sshCommand` per-repo:

```bash
# Example: Using a specific key
git config core.sshCommand "ssh -i ~/.ssh/id_ed25519_personal -o IdentitiesOnly=yes"
```

Or configure `~/.ssh/config` with host aliases:

```
Host github.com-personal
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_personal
  IdentitiesOnly yes

Host github.com-work
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_work
  IdentitiesOnly yes
```

---

## Development Setup

### Development Commands

```bash
bun dev          # Start development server (localhost:3000)
bun build        # Build for production
bun start        # Start production server
bun lint         # Run ESLint
bun typecheck    # Check TypeScript
```

---

## Google Cloud Setup (Gmail OAuth)

### Prerequisites

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the Gmail API

### OAuth Credentials Setup

1. Navigate to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Web application**
4. Configure:
   - **Name**: Email BDC Agent
   - **Authorized JavaScript origins**: `http://localhost:3000`
   - **Authorized redirect URIs**: `http://localhost:3000/api/auth/gmail/callback`
5. Copy Client ID and Client Secret to `.env.local`

### OAuth Scopes Required

```
https://www.googleapis.com/auth/gmail.readonly
```

---

## Local Development Checklist

- [ ] Clone repository
- [ ] Copy `techContext.template.md` to `techContext.md` and fill in values
- [ ] Copy `.env.example` to `.env.local` and fill in API keys
- [ ] Run `bun install`
- [ ] Configure git with correct SSH key
- [ ] Run `bun dev`
