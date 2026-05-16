# Soniox Real-Time Transcription App Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Build a minimal, premium Next.js web application for real-time speech-to-text using the Soniox API.

**Architecture:** Next.js (App Router) on Netlify, using browser Local Storage and WebSocket connection to Soniox via a backend-generated temporary token.

**Tech Stack:** Next.js, React, Vanilla CSS, @soniox/client (or @soniox/node), Netlify.

---

### Task 1: Scaffold Next.js Application

**Files:**
- Create: `package.json`, `next.config.mjs`, `tsconfig.json`, `app/layout.tsx`, `app/page.tsx`

**Step 1: Run Next.js Scaffolding**
Run: `npx create-next-app@latest . --typescript --eslint --app --src-dir=false --import-alias "@/*" --use-npm --tailwind=false --yes`

**Step 2: Install Soniox SDK and Dependencies**
Run: `npm install @soniox/client @soniox/node`
Run: `npm install -D typescript @types/node @types/react`

**Step 3: Commit**
Run: `git init && git add . && git commit -m "chore: scaffold Next.js app and install dependencies"`

### Task 2: Create Temporary Token API Route

**Files:**
- Create: `app/api/token/route.ts`

**Step 1: Write API Route Implementation**
Create `app/api/token/route.ts` using `@soniox/node` to securely generate an ephemeral token.

**Step 2: Commit**
Run: `git add app/api/token/route.ts && git commit -m "feat: add Soniox temporary token API route"`

### Task 3: Create Usage API Route

**Files:**
- Create: `app/api/usage/route.ts`

**Step 1: Write API Route Implementation**
Create `app/api/usage/route.ts` to fetch usage data from Soniox for cost calculation.

**Step 2: Commit**
Run: `git add app/api/usage/route.ts && git commit -m "feat: add Soniox usage API route"`

### Task 4: Set up Global Styles and Design System

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

**Step 1: Implement CSS Variables and Base Styles**
Add dark mode default, CSS variables for colors, fonts, glassmorphism utilities, and animations to `app/globals.css`.

**Step 2: Update Layout**
Ensure `layout.tsx` uses the correct font and imports global styles.

**Step 3: Commit**
Run: `git add app/globals.css app/layout.tsx && git commit -m "style: set up global styles and design system"`

### Task 5: Build Local Storage Manager Utility

**Files:**
- Create: `lib/storage.ts`

**Step 1: Write Storage Service**
Create `lib/storage.ts` with typed functions to save, get, and delete transcripts from `localStorage`.

**Step 2: Commit**
Run: `git add lib/storage.ts && git commit -m "feat: add local storage utility for transcripts"`

### Task 6: Implement Core Transcription Hook & UI

**Files:**
- Create: `components/TranscriptionStudio.tsx`
- Modify: `app/page.tsx`

**Step 1: Build the Hook and Component**
Create `TranscriptionStudio.tsx` that fetches the temp token, requests microphone access, and connects to Soniox WebSocket. Renders the UI with recording status, live text, and speaker diarization.

**Step 2: Update Home Page**
Update `app/page.tsx` to render the `TranscriptionStudio` component.

**Step 3: Commit**
Run: `git add components/TranscriptionStudio.tsx app/page.tsx && git commit -m "feat: implement live transcription studio"`

### Task 7: Implement Library & Cost Dashboard Views

**Files:**
- Create: `components/Library.tsx`
- Create: `components/CostDashboard.tsx`

**Step 1: Build Library Component**
Create `Library.tsx` to display saved transcripts, and allow download/delete.

**Step 2: Build Cost Dashboard Component**
Create `CostDashboard.tsx` to fetch from `/api/usage` and display costs.

**Step 3: Integrate into Home Page**
Update `app/page.tsx` or create a navigation layout to switch between Studio, Library, and Dashboard views.

**Step 4: Commit**
Run: `git add components/Library.tsx components/CostDashboard.tsx app/page.tsx && git commit -m "feat: add library and cost dashboard components"`

### Task 8: Link and Push to GitHub

**Files:**
- No new files.

**Step 1: Create GitHub Repository**
Run: `gh repo create <your-repo-name> --public --source=. --remote=origin` (Assumes GitHub CLI is installed. Or, create manually and run `git remote add origin <url>`)
Expected: GitHub repository created and linked as origin remote.

**Step 2: Push Code**
Run: `git branch -M main && git push -u origin main`
Expected: Code successfully pushed to GitHub.
