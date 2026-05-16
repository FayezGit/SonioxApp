"use client";

import React, { useState, useRef } from 'react';
import { SonioxClient, Recording, RealtimeToken } from '@soniox/client';
import { saveTranscript } from '@/lib/storage';

const SPEAKER_COLORS = [
  'var(--speaker-1)',
  'var(--speaker-2)',
  'var(--speaker-3)',
  'var(--speaker-4)',
];

type Segment = { speaker?: string; color: string; text: string; isFinal: boolean };

function buildSegments(tokens: RealtimeToken[], speakerMap: Map<string, number>): Segment[] {
  const segments: Segment[] = [];
  let current: Segment | null = null;

  for (const token of tokens) {
    const speaker = token.speaker;

    // Resolve speaker color (mutates the map, but this is called outside render)
    let color = SPEAKER_COLORS[0];
    if (speaker) {
      if (!speakerMap.has(speaker)) {
        speakerMap.set(speaker, speakerMap.size % SPEAKER_COLORS.length);
      }
      color = SPEAKER_COLORS[speakerMap.get(speaker)!];
    }

    if (!current || current.speaker !== speaker || current.isFinal !== token.is_final) {
      current = { speaker, color, text: token.text, isFinal: token.is_final };
      segments.push(current);
    } else {
      current.text += token.text;
    }
  }

  return segments;
}

export default function TranscriptionStudio() {
  const [isRecording, setIsRecording]     = useState(false);
  const [isStopping, setIsStopping]       = useState(false);
  const [segments, setSegments]           = useState<Segment[]>([]);
  const [finalCharCount, setFinalCharCount] = useState(0);
  const [error, setError]                 = useState<string | null>(null);
  const [saved, setSaved]                 = useState(false);

  const recordingRef = useRef<Recording | null>(null);
  const startTimeRef = useRef<number>(0);
  // Accumulate final tokens across result frames; never read during render
  const finalTokensRef = useRef<RealtimeToken[]>([]);
  // Stable speaker-to-color map; mutated only inside event handlers
  const speakerMapRef  = useRef<Map<string, number>>(new Map());

  const startRecording = () => {
    setError(null);
    setSaved(false);
    setSegments([]);
    setFinalCharCount(0);
    finalTokensRef.current = [];
    speakerMapRef.current  = new Map();

    const client = new SonioxClient({
      config: async () => {
        const res = await fetch('/api/token', { method: 'POST' });
        if (!res.ok) throw new Error('Failed to fetch temporary token');
        const data = await res.json() as { api_key: string };
        return { api_key: data.api_key };
      },
    });

    // record() is synchronous — attach listeners before any async work begins
    const recording = client.realtime.record({
      model: 'stt-rt-v4',
      enable_speaker_diarization: true,
    });

    recording.on('result', (result) => {
      // Each result is a snapshot: final + non-final tokens for this frame.
      // Accumulate finals; replace non-finals each frame.
      const incomingFinals    = result.tokens.filter(t => t.is_final);
      const incomingNonFinals = result.tokens.filter(t => !t.is_final);

      finalTokensRef.current = [...finalTokensRef.current, ...incomingFinals];

      const allTokens = [...finalTokensRef.current, ...incomingNonFinals];
      const newSegments = buildSegments(allTokens, speakerMapRef.current);

      setSegments(newSegments);
      setFinalCharCount(finalTokensRef.current.map(t => t.text).join('').trim().length);
    });

    recording.on('error', (err) => {
      console.error('Recording error:', err);
      setError(err.message);
      setIsRecording(false);
      setIsStopping(false);
      recordingRef.current = null;
    });

    recording.on('finished', () => {
      setIsRecording(false);
      setIsStopping(false);
      recordingRef.current = null;
    });

    recordingRef.current = recording;
    startTimeRef.current = Date.now();
    setIsRecording(true);
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;
    setIsStopping(true);

    const text = finalTokensRef.current.map(t => t.text).join('').trim();
    const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);

    try {
      await recordingRef.current.stop();
    } catch {
      // Recording may already be done; proceed to save
    }

    if (text) {
      saveTranscript({ text, durationSeconds });
      setSaved(true);
    }
  };

  const isListening = isRecording && !isStopping;

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      {/* Page heading */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="section-heading">Live Transcription Studio</h1>
        <p className="section-sub">
          Real-time speech-to-text with multi-speaker diarization
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="alert-error" style={{ marginBottom: '1.5rem' }}>
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Saved banner */}
      {saved && !isRecording && (
        <div style={{
          background: 'var(--green-dim)',
          border: '1px solid rgba(52,211,153,0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          color: 'var(--green)',
          fontSize: '0.875rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          ✓ Transcript saved to your Library
        </div>
      )}

      {/* Controls row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        {!isRecording ? (
          <button id="btn-start-recording" onClick={startRecording} className="btn-primary">
            <span>🎙</span> Start Recording
          </button>
        ) : (
          <button
            id="btn-stop-recording"
            onClick={stopRecording}
            disabled={isStopping}
            className={`btn-danger${isStopping ? '' : ' pulse-ring'}`}
          >
            {isStopping ? (
              <><div className="spinner" /> Stopping…</>
            ) : (
              <><span>⏹</span> Stop Recording</>
            )}
          </button>
        )}

        {/* Waveform indicator while listening */}
        {isListening && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <div className="waveform">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="waveform-bar" />
              ))}
            </div>
            Listening…
          </div>
        )}
      </div>

      {/* Transcript area */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div className="transcript-area" style={{ border: 'none', background: 'transparent', minHeight: '360px' }}>
          {segments.length === 0 ? (
            <div className="transcript-placeholder">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
              </svg>
              <span>{isRecording ? 'Waiting for speech…' : 'Click Start Recording to begin'}</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {segments.map((seg, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {seg.speaker && (
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: seg.color,
                    }}>
                      {seg.speaker}
                    </span>
                  )}
                  <p style={{
                    fontSize: '1.0625rem',
                    lineHeight: 1.7,
                    color: seg.isFinal ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontStyle: seg.isFinal ? 'normal' : 'italic',
                  }}>
                    {seg.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Character count — driven by state, not ref */}
      {finalCharCount > 0 && (
        <p style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'right' }}>
          {finalCharCount} chars finalized
        </p>
      )}
    </div>
  );
}
