"use client";

import React, { useState } from 'react';
import { Transcript, getTranscripts, deleteTranscript } from '@/lib/storage';

export default function Library() {
  // Lazy initializer: runs only on the client (no SSR mismatch since this
  // component is "use client" and localStorage is only available client-side).
  const [transcripts, setTranscripts] = useState<Transcript[]>(() => {
    if (typeof window === 'undefined') return [];
    return getTranscripts();
  });

  // Re-read from localStorage whenever a delete is done (handled imperatively).

  const handleDelete = (id: string) => {
    deleteTranscript(id);
    setTranscripts(getTranscripts());
  };

  const handleDownload = (transcript: Transcript) => {
    const blob = new Blob([transcript.text], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `transcript_${new Date(transcript.date).toISOString().replace(/[:.]/g, '-')}.txt`;
    // Must append to DOM for Firefox, then remove after click
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revoke after a tick so the browser can start the download
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));

  const formatDuration = (s: number) =>
    s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;



  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="section-heading">Transcription Library</h1>
          <p className="section-sub">
            Your saved recordings — stored locally in your browser
          </p>
        </div>
        {transcripts.length > 0 && (
          <span className="badge badge-blue">
            {transcripts.length} {transcripts.length === 1 ? 'transcript' : 'transcripts'}
          </span>
        )}
      </div>

      {transcripts.length === 0 ? (
        <div className="glass-panel">
          <div className="empty-state">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <p style={{ fontSize: '1rem', fontWeight: 500 }}>No transcripts yet</p>
            <p style={{ fontSize: '0.875rem' }}>
              Go to Studio and record some audio to see it here.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {transcripts.map((t) => (
            <div key={t.id} className="library-card">
              {/* Left: text preview */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    {formatDate(t.date)}
                  </span>
                  <span className="badge badge-blue">{formatDuration(t.durationSeconds)}</span>
                </div>
                <p style={{
                  fontSize: '0.9375rem',
                  lineHeight: 1.6,
                  color: 'var(--text-secondary)',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}>
                  {t.text}
                </p>
              </div>

              {/* Right: actions */}
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, alignSelf: 'center' }}>
                <button
                  onClick={() => handleDownload(t)}
                  className="btn-secondary"
                  title="Download as .txt"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="btn-secondary"
                  style={{ color: 'var(--red)', borderColor: 'rgba(248,113,113,0.3)' }}
                  title="Delete transcript"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
