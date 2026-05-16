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
| **Transcript Library** | Saves finished recordings to browser `localStorage`; supports download (`.txt`) and delete |
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
| Soniox (server) | `@soniox/node` | ^2.0.3 |
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
│   └── storage.ts          # localStorage CRUD for transcripts
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
        │  5. Stop → save to localStorage                             │
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

## Components

### `TranscriptionStudio`

**File:** `components/TranscriptionStudio.tsx`
**Route:** Studio tab (default)

The main recording interface. Manages the full lifecycle of a real-time transcription session.

**State:**

| State | Type | Purpose |
|---|---|---|
| `isRecording` | `boolean` | Whether a session is active |
| `isStopping` | `boolean` | Waiting for the server to finish |
| `segments` | `Segment[]` | Rendered transcript (final + non-final, grouped by speaker) |
| `finalCharCount` | `number` | Count of finalized characters (shown as footer) |
| `error` | `string \| null` | Error banner text |
| `saved` | `boolean` | Whether the transcript was saved after stopping |

**Refs (never read during render):**

| Ref | Purpose |
|---|---|
| `recordingRef` | The `Recording` instance; used in `stopRecording()` |
| `startTimeRef` | Unix timestamp when recording began; used to compute duration |
| `finalTokensRef` | Accumulated finalized tokens across result frames |
| `speakerMapRef` | Maps speaker ID → color index for stable color assignment |

**Recording flow:**

1. User clicks **Start Recording**
2. A `SonioxClient` is created with an async `config` function that calls `POST /api/token`
3. `client.realtime.record({ model: 'stt-rt-v4', enable_speaker_diarization: true })` is called synchronously
4. Event listeners are attached (`result`, `error`, `finished`) before any async work starts
5. The `MicrophoneSource` inside the SDK handles `getUserMedia` + `MediaRecorder` internally
6. Each `result` event carries a snapshot of current tokens; final tokens are accumulated in `finalTokensRef`
7. User clicks **Stop Recording** → `recording.stop()` (gracefully flushes pending audio)
8. Final tokens are joined and saved to `localStorage` via `saveTranscript()`

**Token accumulation logic:**

```
result.tokens = [final_token_A, final_token_B, non_final_token_C]
                        │                              │
                        ▼                              ▼
          appended to finalTokensRef          replaces prior non-finals
                        │
                        └──► displayed segments = [...finals, ...non-finals]
```

---

### `Library`

**File:** `components/Library.tsx`
**Route:** Library tab

Displays and manages all transcripts saved in `localStorage`.

**Key implementation details:**

- **No `useEffect` for initial load** — uses a lazy `useState` initializer (`() => getTranscripts()`) to read `localStorage` once synchronously at mount, avoiding a flash of empty content
- **Download** — creates a `Blob`, appends an `<a>` to `document.body`, triggers `.click()`, then removes it (required for Firefox); `URL.revokeObjectURL` is deferred 100ms to avoid racing the browser download
- **Delete** — calls `deleteTranscript(id)` then re-reads `localStorage` into state
- Text preview is clamped to 2 lines via `-webkit-line-clamp`

---

## Data Layer

### `lib/storage.ts`

Client-side only. All data is stored under the `localStorage` key `soniox_transcripts`.

#### `Transcript` interface

```typescript
interface Transcript {
  id: string;              // crypto.randomUUID()
  text: string;            // Concatenated final tokens
  date: string;            // ISO 8601 timestamp
  durationSeconds: number; // Rounded seconds from start → stop
}
```

#### Functions

| Function | Signature | Description |
|---|---|---|
| `getTranscripts` | `() => Transcript[]` | Read all transcripts. Returns `[]` on error or SSR. |
| `saveTranscript` | `(Omit<Transcript, 'id' \| 'date'>) => void` | Prepend a new transcript (newest first). |
| `deleteTranscript` | `(id: string) => void` | Remove transcript by ID. |

All functions are SSR-safe (`typeof window === 'undefined'` guard).

---

## Design System

**File:** `app/globals.css`

The entire visual design is driven by CSS custom properties defined in `:root`.

### Color Tokens

| Token | Value | Usage |
|---|---|---|
| `--bg-base` | `#080b14` | Page background |
| `--bg-surface` | `#0d1117` | Elevated surfaces |
| `--accent` | `#4f8ef7` | Primary blue — buttons, links |
| `--accent-glow` | `rgba(79,142,247,0.45)` | Button glow effect |
| `--green` | `#34d399` | Success states |
| `--red` | `#f87171` | Error states, stop button |
| `--speaker-1..4` | blue/green/purple/yellow | Per-speaker label colors |
| `--glass-bg` | `rgba(255,255,255,0.045)` | Card / panel backgrounds |
| `--glass-border` | `rgba(255,255,255,0.09)` | Card borders |
| `--text-primary` | `#f0f2f8` | Body text |
| `--text-secondary` | `#8892a4` | Subdued text |
| `--text-muted` | `#4b5568` | Labels, timestamps |

### Component Classes

| Class | Description |
|---|---|
| `.app-shell` | Full-height flex column wrapper |
| `.app-header` | Sticky top bar with blur backdrop |
| `.app-main` | Centered content area (max 1200px) |
| `.glass-panel` | Frosted glass card |
| `.btn-primary` | Blue filled button with glow |
| `.btn-danger` | Red outlined button for stop actions |
| `.btn-secondary` | Ghost button for secondary actions |
| `.badge` | Small inline label (`.badge-blue`, `.badge-green`, `.badge-red`) |
| `.waveform` + `.waveform-bar` | Animated audio waveform indicator |
| `.pulse-ring` | Animated ring around the stop button |
| `.spinner` | CSS-only loading spinner |
| `.transcript-area` | Scrollable transcript display box |
| `.empty-state` | Centered icon + text placeholder |
| `.alert-error` | Red error banner |

### Animations

| Animation | Used by |
|---|---|
| `wave` | Waveform bars — simulates live audio activity |
| `ring-pulse` | Stop button ring — pulses while recording |
| `spin` | Loading spinner |

---

## Known Limitations

| Limitation | Detail |
|---|---|
| **LocalStorage only** | Transcripts are stored in the browser. Clearing browser data will erase them. There is no cloud sync. |
| **Single tab** | Two browser tabs recording simultaneously would interfere with localStorage writes. |
| **Temporary key per session** | A new temporary key is minted on every recording start. Keys expire after 1 hour but are not explicitly revoked on stop. |
| **Browser mic only** | The app uses `MicrophoneSource` from `@soniox/client`, which requires `getUserMedia`. It does not support file upload or server-side audio. |
| **Real-time model only** | Only the `stt-rt-v4` real-time model is used. Batch file transcription (async jobs) is not exposed in the UI. |
| **No billing data** | Soniox does not expose a public cost/billing API. For usage costs visit the [Soniox dashboard](https://soniox.com/dashboard). |
