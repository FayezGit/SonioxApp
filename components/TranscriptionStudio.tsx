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
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [langSearch, setLangSearch] = useState('');
  // Used only for the footer display — updated from event handlers
  const [finalCharCount, setFinalCharCount] = useState(0);
  const [durationSecs, setDurationSecs]     = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [dotCount, setDotCount] = useState(3);

  // Cycle dots animation while recording
  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      setDotCount(prev => (prev % 3) + 1);
    }, 500);
    return () => clearInterval(interval);
  }, [isRecording]);

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
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // ── LocalStorage Helpers ──────────────────────────────────────────
  const persistSession = (tokens: RealtimeToken[], speakers: Map<string, number>) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('soniox_studio_tokens', JSON.stringify(tokens));
      localStorage.setItem('soniox_studio_speaker_map', JSON.stringify(Array.from(speakers.entries())));
    } catch (e) {
      console.error('Failed to persist session to localStorage', e);
    }
  };

  const clearPersistedSession = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('soniox_studio_tokens');
    localStorage.removeItem('soniox_studio_speaker_map');
    localStorage.removeItem('soniox_studio_duration');
  };

  const toggleLanguage = (code: string) => {
    if (code === '') {
      setSelectedLanguages([]);
      if (typeof window !== 'undefined') {
        localStorage.setItem('soniox_studio_languages', JSON.stringify([]));
      }
      return;
    }

    setSelectedLanguages(prev => {
      let next: string[];
      if (prev.includes(code)) {
        next = prev.filter(c => c !== code);
      } else {
        next = [...prev, code];
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('soniox_studio_languages', JSON.stringify(next));
      }
      return next;
    });
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ── Hydration from LocalStorage on mount ──────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const storedTokensStr = localStorage.getItem('soniox_studio_tokens');
      const storedSpeakersStr = localStorage.getItem('soniox_studio_speaker_map');
      const storedDurationStr = localStorage.getItem('soniox_studio_duration');
      const storedLanguagesStr = localStorage.getItem('soniox_studio_languages');
      const storedLanguageStr = localStorage.getItem('soniox_studio_language');

      let restoredTokens: RealtimeToken[] = [];
      let restoredSpeakers: Array<[string, number]> = [];
      let restoredDuration = 0;

      if (storedTokensStr) {
        restoredTokens = JSON.parse(storedTokensStr) as RealtimeToken[];
        finalTokensRef.current = restoredTokens;
        
        let text = '';
        for (const t of restoredTokens) {
          text += t.text;
        }
        finalTextRef.current = text;
        setFinalCharCount(text.length);
      }

      if (storedSpeakersStr) {
        restoredSpeakers = JSON.parse(storedSpeakersStr) as Array<[string, number]>;
        speakerMapRef.current = new Map(restoredSpeakers);
      }

      if (storedDurationStr) {
        restoredDuration = Number(storedDurationStr);
        setDurationSecs(restoredDuration);
      }

      if (storedLanguagesStr) {
        setSelectedLanguages(JSON.parse(storedLanguagesStr) as string[]);
      } else if (storedLanguageStr) {
        setSelectedLanguages([storedLanguageStr]);
      }

      if (restoredTokens.length > 0) {
        setDisplaySegments(
          buildFinalSegments(restoredTokens, speakerMapRef.current)
        );
      }
    } catch (e) {
      console.error('Failed to restore transcription studio session', e);
    }
  }, []);

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
      ...(selectedLanguages.length > 0
        ? { language_hints: selectedLanguages, language_hints_strict: true }
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
        
        persistSession(finalTokensRef.current, speakerMapRef.current);
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
      setDurationSecs(prev => {
        const next = prev + elapsed;
        if (typeof window !== 'undefined') {
          localStorage.setItem('soniox_studio_duration', String(next));
        }
        return next;
      });
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
    clearPersistedSession();
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

  /**
   * Wipes the active studio transcription session.
   */
  const handleClear = () => {
    clearPersistedSession();
    setSaved(false);
    setFinalCharCount(0);
    setDurationSecs(0);
    setDisplaySegments([]);
    finalTokensRef.current = [];
    finalTextRef.current = '';
    speakerMapRef.current = new Map();
    sessionStartTimeRef.current = null;
    setSessionStartTime(null);
    setShowClearConfirm(false);
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

        {/* Custom Multi-Select Language Dropdown */}
        <div className="lang-select-container" ref={langDropdownRef}>
          <button
            type="button"
            className="lang-select-btn"
            onClick={() => !isBusy && setIsLangDropdownOpen(!isLangDropdownOpen)}
            disabled={isBusy}
          >
            <span className="lang-select-text">
              {selectedLanguages.length === 0
                ? 'Auto-detect language'
                : selectedLanguages.length === 1
                  ? languages.find(l => l.code === selectedLanguages[0])?.label || selectedLanguages[0]
                  : `${languages.find(l => l.code === selectedLanguages[0])?.label || selectedLanguages[0]} + ${selectedLanguages.length - 1} more`}
            </span>
            <svg
              className="lang-select-chevron"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8892a4"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {isLangDropdownOpen && (
            <div className="lang-dropdown-menu">
              <div className="lang-dropdown-search-wrapper">
                <input
                  type="text"
                  placeholder="Search languages..."
                  value={langSearch}
                  onChange={e => setLangSearch(e.target.value)}
                  className="lang-dropdown-search"
                  autoFocus
                />
              </div>
              <div className="lang-dropdown-list">
                {/* Auto-detect item (Clear all) */}
                <div
                  className={`lang-dropdown-item auto-detect-item${selectedLanguages.length === 0 ? ' selected' : ''}`}
                  onClick={() => toggleLanguage('')}
                >
                  <input
                    type="checkbox"
                    checked={selectedLanguages.length === 0}
                    readOnly
                    className="lang-checkbox"
                  />
                  <span className="lang-label">Auto-detect language</span>
                </div>
                
                {/* List of checkable languages (filtered by search) */}
                {languages
                  .filter(l => l.code !== '')
                  .filter(l => l.label.toLowerCase().includes(langSearch.toLowerCase()))
                  .map(l => {
                    const isSelected = selectedLanguages.includes(l.code);
                    return (
                      <div
                        key={l.code}
                        className={`lang-dropdown-item${isSelected ? ' selected' : ''}`}
                        onClick={() => toggleLanguage(l.code)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="lang-checkbox"
                        />
                        <span className="lang-label">{l.label}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="transcript-panel-wrapper" style={{ position: 'relative', width: '100%' }}>
        <div className={`transcript-panel${(hasContent || isRecording) ? ' has-controls' : ''}`} ref={transcriptPanelRef}>
          {!hasContent && !isRecording ? (
            <div className="transcript-placeholder">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
              </svg>
              <span>Choose a language and click the microphone below to start</span>
            </div>
          ) : (
            <TranscriptView segments={displaySegments} />
          )}
        </div>

        {/* Integrated Floating Controls inside the transcript panel wrapper */}
        <div className="studio-floating-layout">
          <div className="studio-controls-bar">
          {/* Save Button (Left) */}
          {(hasContent || isRecording) && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isRecording || !hasContent}
              className="circle-btn save-btn"
              title="Save to Library"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          )}

          {/* Record / Pause Button (Center Hero Button) */}
          {isLoading ? (
            <button type="button" className="circle-btn hero-btn loading-btn" disabled>
              <div className="spinner" style={{ width: 20, height: 20 }} />
            </button>
          ) : !isRecording ? (
            <button
              type="button"
              id="btn-start-recording"
              onClick={() => startRecording(Date.now())}
              className="circle-btn hero-btn start-btn"
              title={hasContent ? 'Resume Recording' : 'Start Recording'}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              id="btn-stop-recording"
              onClick={stopRecording}
              disabled={isStopping}
              className={`circle-btn hero-btn stop-btn${isStopping ? '' : ' pulse-ring'}`}
              title="Pause Recording"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="2" x2="18" y2="22" />
                <line x1="6" y1="2" x2="6" y2="22" />
              </svg>
            </button>
          )}

          {/* Clear Button (Right) */}
          {(hasContent || isRecording) && (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              disabled={isRecording || !hasContent}
              className="circle-btn clear-btn"
              title="Clear Transcription"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}
        </div>

        {/* Animated Status wrapped in rounded rectangle below the buttons */}
        {isRecording && (
          <div className="studio-status-box">
            {isListening && (
              <div className="waveform">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="waveform-bar" />)}
              </div>
            )}
            <span className="status-text-italic">
              {isListening ? 'listening' : status}
              <span className="anim-dots">{".".repeat(dotCount)}</span>
            </span>
          </div>
        )}
      </div>
    </div>

      {/* ── Stats footer ── */}
      {finalCharCount > 0 && !isRecording && (
        <p className="transcript-footer">
          {finalCharCount} chars · {durationSecs}s recorded
        </p>
      )}

      {/* ── Confirmation Modal ── */}
      {showClearConfirm && (
        <div className="confirm-overlay">
          <div className="confirm-card">
            <h2 className="confirm-title">Clear Active Transcription?</h2>
            <p className="confirm-desc">
              This will permanently wipe your current session transcript. This action cannot be undone.
            </p>
            <div className="confirm-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary btn-danger-solid"
                onClick={handleClear}
              >
                Clear Everything
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
