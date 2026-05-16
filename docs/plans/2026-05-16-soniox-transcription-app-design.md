# Soniox Real-Time Transcription App Design

## Overview
A minimal, premium web application for real-time speech-to-text using the Soniox API. The application is designed for personal use, focusing on low latency, speaker diarization, privacy (local storage), and transparent cost tracking.

## Architecture
- **Framework**: Next.js (App Router), enabling both React frontend and minimal API routes.
- **Deployment**: Netlify (utilizing serverless functions for API routes).
- **Styling**: Vanilla CSS with responsive design (Mobile & Desktop support), featuring a dark-mode default, glassmorphism, and smooth micro-animations.

## Components & Data Flow
1. **Frontend (Client-Side)**
   - Uses `navigator.mediaDevices.getUserMedia` to capture audio.
   - Connects to Soniox via WebSocket (`@soniox/client` or `@soniox/react`) using a short-lived temporary token.
   - Streams live transcription and identifies speakers dynamically.
2. **Backend (Next.js API Routes)**
   - `/api/token`: Securely generates ephemeral WebSocket tokens using the root `SONIOX_API_KEY`.
   - `/api/usage`: Fetches usage logs from Soniox to calculate billing and metrics.
3. **Storage**
   - No external database. Transcripts are serialized and stored in browser `localStorage`.

## User Interface (Focused Minimalist)
- **Home/Record Screen**: A responsive, distraction-free UI centered around a main "Record" button. Transitions into a full-screen live text view with an audio visualizer and color-coded speaker labels.
- **Library View**: A modal or drawer displaying saved transcripts from local storage. Allows users to read, download (`.txt`), or delete previous recordings.
- **Cost Dashboard**: A dedicated view calculating month-to-date API costs based on token usage logs, displaying total audio transcribed and individual session costs.

## Edge Cases & Error Handling
- **Microphone Permissions**: Graceful fallback UI prompting the user if microphone access is denied.
- **WebSocket Drops**: Auto-reconnect logic or explicit error boundaries if the connection to Soniox is lost.
- **Storage Limits**: `localStorage` quota handling (typical max is 5MB, which is plenty for text, but will handle errors gracefully).
