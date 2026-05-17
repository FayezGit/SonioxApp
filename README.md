# SonioxApp — Real-Time Speech-to-Text

A full-stack Next.js web application for real-time speech transcription using the [Soniox](https://soniox.com) API. Supports live microphone recording, multi-speaker diarization, and a local transcript library.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Architecture Overview](#architecture-overview)
- [API Routes](#api-routes)
- [Components](#components)
- [Data Layer](#data-layer)
- [Design System](#design-system)
- [Known Limitations](#known-limitations)

---

## Features

| Feature | Description |
|---|---|
| **Live Transcription** | Real-time speech-to-text via the Soniox WebSocket API (`stt-rt-v4` model) |
| **Speaker Diarization** | Identifies and labels multiple speakers with distinct color coding |
| **Transcript Library** | Saves finished recordings to browser **IndexedDB (Dexie.js)**; supports download (`.txt`) and delete |
| **Secure Key Handling** | The permanent API key never leaves the server; the browser only ever holds short-lived temporary keys (1-hour TTL) |

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | [Next.js](https://nextjs.org) (App Router) | 16.2.6 |
| UI | React | 19.2.4 |
| Language | TypeScript | ^5 |
| Styling | Vanilla CSS + Tailwind (utilities only) | 4.x |
| Soniox (browser) | `@soniox/client` | ^2.0.2 |
| soniox (server) | `@soniox/node` | ^2.0.3 |
| Storage | [Dexie.js](https://dexie.org) (IndexedDB) | ^3.2.7 |
| Font | Inter (via `next/font/google`) | — |

---

## Project Structure

```
soniox/
├── app/
│   ├── layout.tsx          # Root layout — font, metadata, viewport
│   ├── page.tsx            # App shell — sticky header + tab navigation
│   ├── globals.css         # Full design system (tokens, components, animations)
│   └── api/
│       └── token/
│           └── route.ts    # POST /api/token — mints a temporary Soniox key
├── components/
│   ├── TranscriptionStudio.tsx  # Live recording UI
│   └── Library.tsx              # Saved transcript browser
├── lib/
│   └── storage.ts          # IndexedDB CRUD for transcripts (Dexie)
├── next.config.ts
├── tsconfig.json
└── .env.local              # SONIOX_API_KEY (not committed)
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- A [Soniox account](https://soniox.com) with an API key

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
echo "SONIOX_API_KEY=your_key_here" > .env.local

# 3. Start development server
npm run dev
```

The app will be available at `http://localhost:3000`.

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile production bundle |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint across `app/`, `components/`, `lib/` |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SONIOX_API_KEY` | ✅ | Your permanent Soniox API key. **Server-side only** — never exposed to the browser. |

Set this in `.env.local` (already in `.gitignore`):

```env
SONIOX_API_KEY=f98b898b...
```

---

## Architecture Overview

```
Browser                          Next.js Server              Soniox Cloud
──────────────────────────────   ──────────────────────────  ──────────────────────

  TranscriptionStudio            POST /api/token             auth.createTemporaryKey()
        │                              │                              │
        │  1. POST /api/token ────────>│                              │
        │                              │──── createTemporaryKey() ──>│
        │                              │<─── { api_key, expires_at } ─┤
        │<──── { api_key } ────────────│                              │
        │                                                             │
        │  2. SonioxClient({ config: async () => api_key })          │
        │  3. client.realtime.record({ model: 'stt-rt-v4' })         │
        │                                                             │
        │  4. WebSocket ──────────────────────────────────────────> STT Server
        │     (MicrophoneSource captures audio via MediaRecorder)     │
        │     Audio chunks streamed over WS ───────────────────────> │
        │     result events (tokens) <──────────────────────────────  │
        │                                                             │
        │  5. Stop → save to IndexedDB                                │
```

### Security model

The permanent API key is stored **only in `.env.local`** and accessed exclusively inside Next.js API Route handlers that run on the server. The client receives a **temporary key** (`temp:…`) that:
- Has a **1-hour TTL**
- Is scoped to `transcribe_websocket` usage only
- Cannot be used to access billing data, manage files, or perform admin operations

---

## API Routes

### `POST /api/token`

Mints a short-lived temporary API key for the browser to open a WebSocket transcription session.

**Request:** No body required.

**Response `200`:**
```json
{
  "api_key": "temp:JHA2TVPPFQBPGX5B4T5YZWYVKF",
  "expires_at": "2026-05-16T06:58:51.073Z"
}
```

**Response `500`:**
```json
{ "error": "Failed to generate temporary token" }
```

**Implementation notes:**
- Uses `SonioxNodeClient.auth.createTemporaryKey()` from `@soniox/node`
- Key TTL is set to `3600` seconds (1 hour)
- `usage_type: "transcribe_websocket"` restricts the key to STT WebSocket only

---

## Core Components

### `TranscriptionStudio`
The main recording interface. It features a persistent solid bottom deck, live microphone recording with real-time speaker diarization, animated speech waveform, and smart layout centering/scrolling.

### `Library`
An archive of saved sessions stored in IndexedDB. It features automatic data migration, asynchronous loading for performance, and tools for downloading or deleting past transcripts.

---

## Data Layer

### `lib/storage.ts`

Client-side only. All data is stored in **IndexedDB** under the database name `SonioxDatabase`.

#### `Transcript` interface

```typescript
interface Transcript {
  id: string;              // UUID
  text: string;            // Concatenated final tokens
  segments?: Segment[];    // Speaker-diarized blocks
  date: string;            // ISO 8601 timestamp
  durationSeconds: number; // Rounded seconds from start → stop
}
```

#### Functions

| Function | Signature | Description |
|---|---|---|
| `getTranscripts` | `() => Promise<Transcript[]>` | Read all transcripts. Returns `[]` on error. |
| `saveTranscript` | `(Omit<Transcript, 'id' \| 'date'>) => Promise<boolean>` | Save a new transcript. |
| `deleteTranscript` | `(id: string) => Promise<void>` | Remove transcript by ID. |
| `migrateFromLocalStorage` | `() => Promise<void>` | One-time migration of legacy data. |

All functions are SSR-safe (`typeof window === 'undefined'` guard).

---

## Design System

The app uses a consistent design system defined in `app/globals.css` using CSS custom properties. It features a dark-themed, glassmorphic UI with vibrant accent colors for different speakers.

### Color Palette
- **Background**: Deep obsidian (`#080b14`)
- **Accent**: Electric blue (`#4f8ef7`)
- **Speaker Colors**: Blue, Green, Purple, and Yellow for diarization clarity.
- **Surface**: Frosted glass effects via `backdrop-filter`.

---

## Known Limitations

| Limitation | Detail |
|---|---|
| **IndexedDB only** | Transcripts are stored in the browser's IndexedDB. Clearing browser site data will erase them. There is no cloud sync. |
| **High Capacity** | Unlike `localStorage`, IndexedDB can store gigabytes of data, but it is still local to the specific browser/device. |
| **Temporary key per session** | A new temporary key is minted on every recording start. Keys expire after 1 hour but are not explicitly revoked on stop. |
| **Browser mic only** | The app uses `MicrophoneSource` from `@soniox/client`, which requires `getUserMedia`. It does not support file upload or server-side audio. |
| **Real-time model only** | Only the `stt-rt-v4` real-time model is used. Batch file transcription (async jobs) is not exposed in the UI. |
| **No billing data** | Soniox does not expose a public cost/billing API. For usage costs visit the [Soniox dashboard](https://soniox.com/dashboard). |
