"use client";

import React, { useState, useRef, useEffect } from 'react';
import { SonioxClient, Recording, RealtimeToken } from '@soniox/client';
import languages from '@/data/languages.json';
import TranscriptView from '@/components/TranscriptView';
import { saveTranscript, type TranscriptSegment } from '@/lib/storage';
import { buildFinalSegments } from '@/lib/transcript';

/* ─── Component ─────────────────────────────────────────────────────── */

export default function TranscriptionStudio() {
  // ── UI state ───────────────────────────────────────────────────────
  const [isRecording, setIsRecording]     = useState(false);
  const [isLoading, setIsLoading]         = useState(false);  // token fetch in progress
  const [isStopping, setIsStopping]       = useState(false);
  const [status, setStatus]               = useState('');
  const [error, setError]                 = useState<string | null>(null);
  const [saved, setSaved]                 = useState(false);
  const [language, setLanguage]           = useState('');
  // Used only for the footer display — updated from event handlers
  const [finalCharCount, setFinalCharCount] = useState(0);
  const [durationSecs, setDurationSecs]     = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  // ── Transcript display state ───────────────────────────────────────
  // displaySegments: merged final and non-final tokens for seamless real-time rendering
  const [displaySegments, setDisplaySegments] = useState<TranscriptSegment[]>([]);

  // ── Refs (never read during render) ───────────────────────────────
  const recordingRef  = useRef<Recording | null>(null);
  const speakerMapRef = useRef<Map<string, number>>(new Map());
  const transcriptPanelRef = useRef<HTMLDivElement>(null);
  /**
   * Accumulates finalized tokens across result frames (each final is sent once).
   * Used to rebuild stable segments; never read during render.
   */
  const finalTokensRef = useRef<RealtimeToken[]>([]);
  /**
   * Accumulates ONLY finalized text across all result frames.
   * Updated on every result event. Used for saving — never set in state.
   * This is more reliable than reading state inside the finished event.
   */
  const finalTextRef  = useRef('');
  /**
   * Mirrors sessionStartTime state so event-handler closures can read the
   * *current* start time without going stale. Always set alongside the state.
   */
  const sessionStartTimeRef = useRef<number | null>(null);
  /**
   * Caches the last minted temporary API key and its expiry so that resume
   * sessions within the validity window skip an unnecessary round-trip.
   */
  const cachedTokenRef = useRef<{ api_key: string; expires_at: string } | null>(null);

  // ── Auto-scroll ───────────────────────────────────────────────────
  useEffect(() => {
    if (transcriptPanelRef.current) {
      transcriptPanelRef.current.scrollTop = transcriptPanelRef.current.scrollHeight;
    }
  }, [displaySegments]);

  /* ── Start recording ─────────────────────────────────────────────── */
  // sessionStart is passed in from the onClick handler (where Date.now() is
  // called) so this function body stays pure and satisfies react-hooks/purity.
  const startRecording = async (sessionStart: number) => {
    setError(null);
    setSaved(false);
    setStatus('');
    // Only clear if this is the absolute beginning of a session
    if (finalTokensRef.current.length === 0) {
      setDisplaySegments([]);
      setFinalCharCount(0);
      setDurationSecs(0);
      finalTextRef.current  = '';
      speakerMapRef.current = new Map();
      sessionStartTimeRef.current = sessionStart;
      setSessionStartTime(sessionStart);
    } else if (!sessionStartTimeRef.current) {
      sessionStartTimeRef.current = sessionStart;
      setSessionStartTime(sessionStart);
    }

    // Microphone requires a secure context (HTTPS or localhost).
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError(
        'Microphone access requires HTTPS. ' +
        'Open the app via https:// or run: npm run dev:https'
      );
      return;
    }

    // ── Step 1: fetch token — reuse cached if still valid ────────────────────
    // Doing this BEFORE calling the SDK means cert/network errors are
    // immediately visible instead of silently resetting the button.
    const cached = cachedTokenRef.current;
    const isTokenValid = cached && new Date(cached.expires_at).getTime() - Date.now() > 30_000;

    let apiKey: string;
    if (isTokenValid) {
      apiKey = cached!.api_key;
    } else {
      setIsLoading(true);
      setStatus('Fetching token…');
      try {
        const res = await fetch('/api/token', { method: 'POST' });
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = await res.json() as { api_key: string; expires_at: string };
        cachedTokenRef.current = data;
        apiKey = data.api_key;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // 'Failed to fetch' = network error or cert not trusted on mobile
        const hint = msg.toLowerCase().includes('fetch')
          ? ' (Is the dev server running? Did you accept the HTTPS certificate?)'
          : '';
        setError(`Could not reach server: ${msg}${hint}`);
        setIsLoading(false);
        setStatus('');
        return;
      }
      setIsLoading(false);
    }
    setStatus('Connecting…');

    // ── Step 2: start the SDK with the pre-fetched static key ──────────────
    const client = new SonioxClient({
      config: { api_key: apiKey },
    });

    // record() is synchronous — listeners must be attached before any await
    const recording = client.realtime.record({
      model: 'stt-rt-v4',
      enable_speaker_diarization: true,
      enable_language_identification: true,
      ...(language
        ? { language_hints: [language], language_hints_strict: true }
        : {}),
    });

    recording.on('state_change', ({ new_state }) => setStatus(new_state));
    recording.on('connected', () => setStatus('recording'));

    /**
     * Each result frame carries NEW tokens only — not the full session history.
     * Finals are sent once and appended; non-finals are the current in-flight guess.
     */
    recording.on('result', (result) => {
      const newFinals = result.tokens.filter(t => t.is_final);
      const nonFinals = result.tokens.filter(t => !t.is_final);

      if (newFinals.length > 0) {
        finalTokensRef.current.push(...newFinals);
        for (const t of newFinals) {
          finalTextRef.current += t.text;
        }
        // Keep char count in sync so the stats footer renders
        setFinalCharCount(finalTextRef.current.length);
      }

      setDisplaySegments(
        buildFinalSegments([...finalTokensRef.current, ...nonFinals], speakerMapRef.current)
      );
    });

    recording.on('error', (err) => {
      console.error('[Soniox] error:', err);
      // Don't auto-save on error anymore, let the user decide
      updateFinalDuration();
      // Surface friendly messages for the most common mobile failures
      const raw = err.message ?? String(err);
      const friendly =
        raw.includes('Permission denied') || raw.includes('NotAllowedError')
          ? 'Microphone permission denied. Allow microphone access in your browser settings and try again.'
          : raw.includes('NotFoundError') || raw.includes('Requested device not found')
            ? 'No microphone found. Connect a microphone and try again.'
            : raw;
      setError(friendly);
      setStatus('error');
      setIsRecording(false);
      setIsStopping(false);
      recordingRef.current = null;
    });

    recording.on('finished', () => {
      setDisplaySegments(
        buildFinalSegments(finalTokensRef.current, speakerMapRef.current)
      );
      updateFinalDuration();
      setStatus('stopped');
      setIsRecording(false);
      setIsStopping(false);
      recordingRef.current = null;
    });

    recordingRef.current = recording;
    setIsRecording(true);
  };

  /**
   * Updates the duration based on the current elapsed time in this sub-session.
   * Reads from ref (not state) to avoid stale closure inside event handlers.
   */
  const updateFinalDuration = () => {
    const start = sessionStartTimeRef.current;
    if (start) {
      const elapsed = Math.round((Date.now() - start) / 1000);
      setDurationSecs(prev => prev + elapsed);
      sessionStartTimeRef.current = null;
      setSessionStartTime(null);
    }
  };

  /**
   * Manually save the accumulated transcript and clear the studio.
   */
  const handleSave = async () => {
    const segments = buildFinalSegments(
      finalTokensRef.current,
      speakerMapRef.current,
    );
    const text = segments.map(s => s.text).join('').trim() || finalTextRef.current.trim();
    if (!text) return;

    const ok = await saveTranscript({ text, segments, durationSeconds: durationSecs });
    if (!ok) {
      setError('Failed to save — browser storage may be full or corrupted. Try deleting old transcripts in the Library.');
      return;
    }
    
    // Clear everything for a fresh start
    setSaved(true);
    setFinalCharCount(0);
    setDurationSecs(0);
    setDisplaySegments([]);
    finalTokensRef.current = [];
    finalTextRef.current = '';
    speakerMapRef.current = new Map();
    sessionStartTimeRef.current = null;
    setSessionStartTime(null);
  };

  /* ── Stop recording ──────────────────────────────────────────────── */
  const stopRecording = async () => {
    if (!recordingRef.current) return;
    setIsStopping(true);
    setStatus('stopping');
    try {
      await recordingRef.current.stop();
    } catch {
      // stop() throws if session already ended — safe to ignore
    }
    // `finished` event will handle state cleanup and save
  };

  const isListening = isRecording && status === 'recording';
  const isBusy      = isLoading || isRecording;  // disables the language select
  const hasContent  = displaySegments.length > 0;

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <div className="studio-container">

      <div className="section-header-row">
        <div>
          <h1 className="section-heading">Live Transcription Studio</h1>
          <p className="section-sub">
            Real-time speech-to-text · multi-speaker diarization
          </p>
        </div>
      </div>

      <div className="spacer-2rem" />

      {/* ── Error banner ── */}
      {error && (
        <div className="alert-error">
          ⚠️ {error}
        </div>
      )}

      {/* ── Saved banner ── */}
      {saved && !isRecording && (
        <div className="alert-saved" style={{ marginBottom: '1.5rem' }}>
          ✓ Transcript saved to your Library
        </div>
      )}

      {/* ── Controls ── */}
      <div className="studio-controls">

        {/* Language selector */}
        <select
          id="language-select"
          value={language}
          onChange={e => setLanguage(e.target.value)}
          disabled={isBusy}
          className="lang-select"
        >
          {languages.map(l => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>

        {/* Record / Stop button */}
        {isLoading ? (
          /* Token fetch in progress — show a disabled loading button */
          <button type="button" className="btn-primary" disabled>
            <div className="spinner" style={{ width: 16, height: 16 }} />
            {status || 'Connecting…'}
          </button>
        ) : !isRecording ? (
          <div className="studio-actions">
            <button
              type="button"
              id="btn-start-recording"
              onClick={() => startRecording(Date.now())}
              className="btn-primary"
            >
              <span>🎙</span> {hasContent ? 'Resume' : 'Start'} Recording
            </button>
            {hasContent && (
              <button
                type="button"
                onClick={handleSave}
                className="btn-secondary"
              >
                💾 Save to Library
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            id="btn-stop-recording"
            onClick={stopRecording}
            disabled={isStopping}
            className={`btn-danger${isStopping ? '' : ' pulse-ring'}`}
          >
            {isStopping
              ? <><div className="spinner" /> Stopping…</>
              : <><span>⏸</span> Pause Recording</>}
          </button>
        )}

        {/* Live status */}
        {isRecording && (
          <div className="studio-status">
            {isListening ? (
              <>
                <div className="waveform">
                  {[1, 2, 3, 4, 5].map(i => <div key={i} className="waveform-bar" />)}
                </div>
                <span>Listening…</span>
              </>
            ) : (
              <>
                <div className="spinner" style={{ width: 16, height: 16 }} />
                <span>{status}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Transcript area ── */}
      <div className="transcript-panel" ref={transcriptPanelRef}>
        {!hasContent && !isRecording ? (
          <div className="transcript-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.5">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
            </svg>
            <span>Choose a language and click Start Recording</span>
          </div>
        ) : (
          <TranscriptView segments={displaySegments} />
        )}
      </div>

      {/* ── Stats footer ── */}
      {finalCharCount > 0 && !isRecording && (
        <p className="transcript-footer">
          {finalCharCount} chars · {durationSecs}s recorded
        </p>
      )}

    </div>
  );
}
