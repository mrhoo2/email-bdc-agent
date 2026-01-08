# Technical Context

> **Purpose**: Document dependencies, environment setup, API configurations, and development workflow for the Email BDC Agent project.

---

## Memory Bank Directory Index

| File | Purpose |
|------|---------|
| `activeContext.md` | Current focus, blockers, decisions-in-progress |
| `progress.md` | Stage completion status, test results, iteration notes |
| `systemPatterns.md` | Data models, architecture decisions, extraction patterns |
| `techContext.md` | Dependencies, environment setup, API configurations (this file) |
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

### Future Dependencies (Postgres Integration)

| Package | Purpose |
|---------|---------|
| `pg` | PostgreSQL client |
| `@types/pg` | TypeScript types |

---

## Environment Variables

### .env.local Template

Create a `.env.local` file in the project root:

```env
# ===========================================
# Environment Variables - DO NOT COMMIT
# ===========================================

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

# Target inbox (for demo)
TARGET_INBOX=bids@buildvision.io

# Future: Postgres Connection
# DATABASE_URL=postgresql://user:password@host:5432/database
```

### Accessing Environment Variables

```typescript
// Server-side (API routes, Server Components)
const openaiKey = process.env.OPENAI_API_KEY;
const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const anthropicKey = process.env.ANTHROPIC_API_KEY;
const aiProvider = process.env.AI_PROVIDER;

// Client-side (only for NEXT_PUBLIC_ prefixed vars)
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
```

---

## Git Configuration

### Repository Details

| Setting | Value |
|---------|-------|
| **Repository** | `git@github.com:mrhoo2/email-bdc-agent.git` |
| **User Email** | `mrhoo@hey.com` |
| **User Name** | `mrhoo2` |
| **Authentication** | SSH via personal key (`id_ed25519_personal`) |
| **SSH Key** | `~/.ssh/id_ed25519_personal` |

### Initial Setup Commands

**IMPORTANT:** When using a non-default SSH key (e.g., personal vs work account), you MUST configure the `core.sshCommand` to specify which key to use. Otherwise, git will use the default SSH key.

```bash
# Initialize git repository
git init

# Configure user for this repository
git config user.email "mrhoo@hey.com"
git config user.name "mrhoo2"

# CRITICAL: Configure SSH to use the personal key for this repo
# This ensures the correct GitHub account is used for authentication
git config core.sshCommand "ssh -i ~/.ssh/id_ed25519_personal -o IdentitiesOnly=yes"

# Add remote origin
git remote add origin git@github.com:mrhoo2/email-bdc-agent.git

# Initial commit
git add .
git commit -m "Initial commit: project setup"
git push -u origin main
```

### SSH Key Selection

This machine has multiple GitHub accounts with different SSH keys:

| Key File | Associated Account | Purpose |
|----------|-------------------|---------|
| `~/.ssh/id_ed25519` | (default) | May be shared or default |
| `~/.ssh/id_ed25519_buildvision` | mackenzie-bv | BuildVision work account |
| `~/.ssh/id_ed25519_personal` | mrhoo2 | Personal account |

**For mrhoo2 repos:** Always use `id_ed25519_personal`:
```bash
git config core.sshCommand "ssh -i ~/.ssh/id_ed25519_personal -o IdentitiesOnly=yes"
```

**For BuildVision work repos:** Use `id_ed25519_buildvision`:
```bash
git config core.sshCommand "ssh -i ~/.ssh/id_ed25519_buildvision -o IdentitiesOnly=yes"
```

### SSH Configuration (Alternative)

Alternatively, you can configure `~/.ssh/config` with host aliases:

```
# Personal GitHub account (mrhoo2)
Host github.com-personal
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_personal
  IdentitiesOnly yes
  UseKeychain yes
  AddKeysToAgent yes

# BuildVision work account
Host github.com-bv
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_buildvision
  IdentitiesOnly yes
  UseKeychain yes
  AddKeysToAgent yes
```

Then use the alias in the remote URL:
```bash
# For personal repos
git remote add origin git@github.com-personal:mrhoo2/repo-name.git

# For work repos  
git remote add origin git@github.com-bv:buildvision/repo-name.git
```

### .gitignore

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Build outputs
.next/
out/
build/
dist/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
bun-debug.log*

# Testing
coverage/

# Misc
*.pem

# Gmail tokens (OAuth)
tokens/
*.token.json
```

---

## Development Setup

### Project Initialization

```bash
# Create new Next.js project with Bun
bunx create-next-app@latest email-bdc-agent --typescript --tailwind --eslint --app --src-dir=false

cd email-bdc-agent

# Initialize ShadCN
bunx shadcn@latest init
# Select: new-york style, neutral base color, CSS variables: yes

# Add common ShadCN components
bunx shadcn@latest add button card input label tabs select table badge

# Install AI provider dependencies
bun add openai @google/generative-ai @anthropic-ai/sdk

# Install Gmail & validation dependencies
bun add googleapis zod date-fns

# Install icons
bun add lucide-react
```

### Development Commands

```bash
bun dev          # Start development server (localhost:3000)
bun build        # Build for production
bun start        # Start production server
bun lint         # Run ESLint
bun typecheck    # Check TypeScript (add script to package.json)
```

### package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --fix",
    "typecheck": "tsc --noEmit"
  }
}
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

## Code Style Guidelines

### TypeScript Conventions

```typescript
// Use strict TypeScript - no 'any' types
// ❌ Bad
const data: any = fetchData();

// ✅ Good
interface DataResponse {
  id: string;
  value: number;
}
const data: DataResponse = fetchData();
```

### Component Patterns

```typescript
"use client"; // Only when needed for client-side interactivity

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Props interface defined above component
interface MyComponentProps {
  title: string;
  onAction: (value: string) => void;
}

// Named export for components
export function MyComponent({ title, onAction }: MyComponentProps) {
  const [value, setValue] = useState("");

  const handleSubmit = useCallback(() => {
    onAction(value);
  }, [value, onAction]);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-h5 font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={handleSubmit}>Submit</Button>
      </CardContent>
    </Card>
  );
}
```

### Styling Conventions

- Use Tailwind utility classes for styling
- Use design system typography classes: `text-h5`, `text-body-md`, `text-detail`, etc.
- Use semantic color variables: `text-muted-foreground`, `bg-accent`, `border-border`
- Use `cn()` utility for conditional classes

```typescript
import { cn } from "@/lib/utils";

<div className={cn(
  "p-4 rounded-lg",
  isActive && "bg-accent border-primary",
  isDisabled && "opacity-50 cursor-not-allowed"
)}>
```

---

## Deployment

### Vercel Deployment (Future)

1. Push code to GitHub repository
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "Add New Project"
4. Import the GitHub repository
5. Configure environment variables
6. Deploy

### Environment Variables for Production

| Variable | Notes |
|----------|-------|
| `OPENAI_API_KEY` | Required for GPT |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Required for Gemini |
| `ANTHROPIC_API_KEY` | Required for Claude |
| `AI_PROVIDER` | Set default provider |
| `GOOGLE_CLIENT_ID` | Gmail OAuth |
| `GOOGLE_CLIENT_SECRET` | Gmail OAuth |
| `GOOGLE_REDIRECT_URI` | Update for production URL |

---

## Local Development Checklist

- [ ] Clone repository
- [ ] Copy `.env.example` to `.env.local` and fill in values
- [ ] Run `bun install`
- [ ] Verify Google Cloud project is set up
- [ ] Run `bun dev`
- [ ] Test OAuth flow at `/api/auth/gmail`

---

## Notes

*Technical notes and gotchas*

- Bun is used instead of npm/yarn for consistency with BuildVision main app
- Gmail OAuth tokens should be stored securely (not in git)
- AI provider can be switched via `AI_PROVIDER` env var or runtime config
