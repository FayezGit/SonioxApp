"use client";

import React, { useState, useRef } from 'react';
import { SonioxClient, Recording, RealtimeToken } from '@soniox/client';
import { saveTranscript } from '@/lib/storage';

/* ─── Constants ────────────────────────────────────────────────────── */

const SPEAKER_COLORS = [
  'var(--speaker-1)',
  'var(--speaker-2)',
  'var(--speaker-3)',
  'var(--speaker-4)',
];

const LANGUAGES: { label: string; code: string }[] = [
  { label: 'Auto-detect (all 60+ languages)', code: '' },
  // ── A ──
  { label: 'Afrikaans',   code: 'af' },
  { label: 'Albanian',    code: 'sq' },
  { label: 'Arabic',      code: 'ar' },
  { label: 'Azerbaijani', code: 'az' },
  // ── B ──
  { label: 'Basque',      code: 'eu' },
  { label: 'Belarusian',  code: 'be' },
  { label: 'Bengali',     code: 'bn' },
  { label: 'Bosnian',     code: 'bs' },
  { label: 'Bulgarian',   code: 'bg' },
  // ── C ──
  { label: 'Catalan',     code: 'ca' },
  { label: 'Chinese',     code: 'zh' },
  { label: 'Croatian',    code: 'hr' },
  { label: 'Czech',       code: 'cs' },
  // ── D ──
  { label: 'Danish',      code: 'da' },
  { label: 'Dutch',       code: 'nl' },
  // ── E ──
  { label: 'English',     code: 'en' },
  { label: 'Estonian',    code: 'et' },
  // ── F ──
  { label: 'Finnish',     code: 'fi' },
  { label: 'French',      code: 'fr' },
  // ── G ──
  { label: 'Galician',    code: 'gl' },
  { label: 'German',      code: 'de' },
  { label: 'Greek',       code: 'el' },
  { label: 'Gujarati',    code: 'gu' },
  // ── H ──
  { label: 'Hebrew',      code: 'he' },
  { label: 'Hindi',       code: 'hi' },
  { label: 'Hungarian',   code: 'hu' },
  // ── I ──
  { label: 'Indonesian',  code: 'id' },
  { label: 'Italian',     code: 'it' },
  // ── J ──
  { label: 'Japanese',    code: 'ja' },
  // ── K ──
  { label: 'Kannada',     code: 'kn' },
  { label: 'Kazakh',      code: 'kk' },
  { label: 'Korean',      code: 'ko' },
  // ── L ──
  { label: 'Latvian',     code: 'lv' },
  { label: 'Lithuanian',  code: 'lt' },
  // ── M ──
  { label: 'Macedonian',  code: 'mk' },
  { label: 'Malay',       code: 'ms' },
  { label: 'Malayalam',   code: 'ml' },
  { label: 'Marathi',     code: 'mr' },
  // ── N ──
  { label: 'Norwegian',   code: 'no' },
  // ── P ──
  { label: 'Persian',     code: 'fa' },
  { label: 'Polish',      code: 'pl' },
  { label: 'Portuguese',  code: 'pt' },
  { label: 'Punjabi',     code: 'pa' },
  // ── R ──
  { label: 'Romanian',    code: 'ro' },
  { label: 'Russian',     code: 'ru' },
  // ── S ──
  { label: 'Serbian',     code: 'sr' },
  { label: 'Slovak',      code: 'sk' },
  { label: 'Slovenian',   code: 'sl' },
  { label: 'Spanish',     code: 'es' },
  { label: 'Swahili',     code: 'sw' },
  { label: 'Swedish',     code: 'sv' },
  // ── T ──
  { label: 'Tagalog',     code: 'tl' },
  { label: 'Tamil',       code: 'ta' },
  { label: 'Telugu',      code: 'te' },
  { label: 'Thai',        code: 'th' },
  { label: 'Turkish',     code: 'tr' },
  // ── U ──
  { label: 'Ukrainian',   code: 'uk' },
  { label: 'Urdu',        code: 'ur' },
  // ── V ──
  { label: 'Vietnamese',  code: 'vi' },
  // ── W ──
  { label: 'Welsh',       code: 'cy' },
];


/* ─── Types ─────────────────────────────────────────────────────────── */

/** A stable finalized segment grouped by speaker. */
type FinalSegment = { speaker?: string; color: string; text: string };

/* ─── Helpers ───────────────────────────────────────────────────────── */

/**
 * Build stable final segments from finalized tokens only.
 * Tokens with the same speaker are merged into one segment.
 * Mutates speakerMap — call only inside event handlers, never during render.
 */
function buildFinalSegments(
  finalTokens: RealtimeToken[],
  speakerMap: Map<string, number>,
): FinalSegment[] {
  const segments: FinalSegment[] = [];
  let current: FinalSegment | null = null;

  for (const t of finalTokens) {
    const speaker = t.speaker;
    let color = SPEAKER_COLORS[0];
    if (speaker) {
      if (!speakerMap.has(speaker)) {
        speakerMap.set(speaker, speakerMap.size % SPEAKER_COLORS.length);
      }
      color = SPEAKER_COLORS[speakerMap.get(speaker)!];
    }
    if (!current || current.speaker !== speaker) {
      current = { speaker, color, text: t.text };
      segments.push(current);
    } else {
      current.text += t.text;
    }
  }
  return segments;
}

/* ─── Component ─────────────────────────────────────────────────────── */

export default function TranscriptionStudio() {
  // ── UI state ───────────────────────────────────────────────────────
  const [isRecording, setIsRecording]     = useState(false);
  const [isStopping, setIsStopping]       = useState(false);
  const [status, setStatus]               = useState('');
  const [error, setError]                 = useState<string | null>(null);
  const [saved, setSaved]                 = useState(false);
  const [language, setLanguage]           = useState('');
  // Used only for the footer display — updated from event handlers
  const [finalCharCount, setFinalCharCount] = useState(0);
  const [durationSecs, setDurationSecs]     = useState(0);

  // ── Transcript display state ───────────────────────────────────────
  // finalSegments: stable, ONLY grows; non-finals never go here
  const [finalSegments, setFinalSegments] = useState<FinalSegment[]>([]);
  // currentHypothesis: current non-final hypothesis text (replaces itself)
  const [hypothesis, setHypothesis]       = useState('');

  // ── Refs (never read during render) ───────────────────────────────
  const recordingRef  = useRef<Recording | null>(null);
  const speakerMapRef = useRef<Map<string, number>>(new Map());
  /**
   * Accumulates ONLY finalized text across all result frames.
   * Updated on every result event. Used for saving — never set in state.
   * This is more reliable than reading state inside the finished event.
   */
  const finalTextRef  = useRef('');

  /* ── Start recording ─────────────────────────────────────────────── */
  // sessionStart is passed in from the onClick handler (where Date.now() is
  // called) so this function body stays pure and satisfies react-hooks/purity.
  const startRecording = (sessionStart: number) => {
    setError(null);
    setSaved(false);
    setFinalSegments([]);
    setHypothesis('');
    setStatus('Starting…');
    setFinalCharCount(0);
    setDurationSecs(0);
    finalTextRef.current  = '';
    speakerMapRef.current = new Map();

    const client = new SonioxClient({
      config: async () => {
        setStatus('Fetching token…');
        const res = await fetch('/api/token', { method: 'POST' });
        if (!res.ok) throw new Error(`Token fetch failed (${res.status})`);
        return (await res.json()) as { api_key: string };
      },
    });

    // record() is synchronous — listeners must be attached before any await
    const recording = client.realtime.record({
      model: 'stt-rt-v4',                     // multilingual, 60+ languages
      enable_speaker_diarization: true,
      enable_language_identification: true,
      ...(language
        ? { language_hints: [language], language_hints_strict: true }
        : {}),
    });

    recording.on('state_change', ({ new_state }) => setStatus(new_state));
    recording.on('connected', () => setStatus('recording'));

    /**
     * result.tokens is a COMPLETE SNAPSHOT of all tokens from session start.
     *
     * Strategy:
     *   - Split tokens into finals vs non-finals
     *   - Finals → rebuild stable segment list (only grows)
     *   - Non-finals → join as plain hypothesis string (replaces itself)
     *   - finalTextRef accumulates plain text of all finals for reliable save
     */
    recording.on('result', (result) => {
      const finals    = result.tokens.filter(t => t.is_final);
      const nonFinals = result.tokens.filter(t => !t.is_final);

      // Accumulate final plain text for saving
      finalTextRef.current = finals.map(t => t.text).join('').trim();

      // Update stable final segments
      setFinalSegments(buildFinalSegments(finals, speakerMapRef.current));

      // Update current hypothesis (non-final, ephemeral)
      setHypothesis(nonFinals.map(t => t.text).join(''));
    });

    recording.on('error', (err) => {
      console.error('[Soniox] error:', err);
      trySave(sessionStart);
      setError(err.message);
      setStatus('error');
      setIsRecording(false);
      setIsStopping(false);
      recordingRef.current = null;
    });

    recording.on('finished', () => {
      setHypothesis('');
      trySave(sessionStart);
      setStatus('stopped');
      setIsRecording(false);
      setIsStopping(false);
      recordingRef.current = null;
    });

    recordingRef.current = recording;
    setDurationSecs(0);
    setIsRecording(true);
  };

  /**
   * Save whatever final text has accumulated so far.
   * Reads from the ref (not state) so it always sees the latest value.
   * Safe to call multiple times — setSaved(true) is idempotent in practice.
   */
  const trySave = (sessionStartTime: number) => {
    const text = finalTextRef.current.trim();
    if (!text) return;
    const durationSeconds = Math.round((Date.now() - sessionStartTime) / 1000);
    setDurationSecs(durationSeconds);
    setFinalCharCount(text.length);
    saveTranscript({ text, durationSeconds });
    setSaved(true);
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
  const hasContent  = finalSegments.length > 0 || hypothesis.length > 0;

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>

      {/* ── Heading ── */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="section-heading">Live Transcription Studio</h1>
        <p className="section-sub">
          Real-time speech-to-text · 60+ languages · multi-speaker diarization
        </p>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="alert-error" style={{ marginBottom: '1.5rem' }}>
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
          disabled={isRecording}
          className="lang-select"
        >
          {LANGUAGES.map(l => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>

        {/* Record / Stop button */}
        {!isRecording ? (
          <button
            id="btn-start-recording"
            onClick={() => startRecording(Date.now())}
            className="btn-primary"
          >
            <span>🎙</span> Start Recording
          </button>
        ) : (
          <button
            id="btn-stop-recording"
            onClick={stopRecording}
            disabled={isStopping}
            className={`btn-danger${isStopping ? '' : ' pulse-ring'}`}
          >
            {isStopping
              ? <><div className="spinner" /> Stopping…</>
              : <><span>⏹</span> Stop Recording</>}
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
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div className="transcript-area">
          {!hasContent ? (
            <div className="transcript-placeholder">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
              </svg>
              <span>
                {!isRecording
                  ? 'Choose a language and click Start Recording'
                  : isListening
                    ? 'Waiting for speech…'
                    : status}
              </span>
            </div>
          ) : (
            <div className="transcript-content">

              {/* Finalized segments — never change once rendered */}
              {finalSegments.map((seg, i) => (
                <div key={i} className="transcript-segment">
                  {seg.speaker && (
                    <span className="speaker-label" style={{ color: seg.color }}>
                      {seg.speaker}
                    </span>
                  )}
                  <p className="segment-text">{seg.text}</p>
                </div>
              ))}

              {/* Current hypothesis — ephemeral non-final text */}
              {hypothesis && (
                <div className="transcript-segment hypothesis">
                  <p className="segment-text hypothesis-text">{hypothesis}</p>
                </div>
              )}

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

    </div>
  );
}
