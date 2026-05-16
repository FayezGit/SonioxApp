"use client";

import React, { useEffect, useState } from 'react';
import TranscriptView from '@/components/TranscriptView';
import { Transcript, getTranscripts, deleteTranscript, migrateFromLocalStorage } from '@/lib/storage';
import {
  formatTranscriptPlainText,
  getTranscriptSegments,
  transcriptPreviewText,
} from '@/lib/transcript';

type Props = {
  /** Changes whenever the parent wants Library to re-sync with localStorage. */
  refreshKey?: string;
};

export default function Library({ refreshKey }: Props) {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [activeTranscript, setActiveTranscript] = useState<Transcript | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTranscripts = async () => {
    try {
      const data = await getTranscripts();
      setTranscripts(data);
      setError(null);
    } catch (err) {
      setError("Failed to load transcripts from local storage.");
      console.error(err);
    }
  };

  // Re-read storage whenever the parent signals a refresh (e.g. tab becomes active)
  useEffect(() => {
    const init = async () => {
      await migrateFromLocalStorage();
      await loadTranscripts();
    };
    init();
  }, [refreshKey]);

  const handleDelete = async (id: string) => {
    await deleteTranscript(id);
    await loadTranscripts();
    if (activeTranscript?.id === id) setActiveTranscript(null);
  };

  const handleDownload = (transcript: Transcript) => {
    const body = formatTranscriptPlainText(transcript);
    if (!body.trim()) {
      alert("This transcript is empty and cannot be downloaded.");
      return;
    }
    const blob = new Blob([body], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `transcript_${new Date(transcript.date).toISOString().replace(/[:.]/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));

  const formatDuration = (s: number) =>
    s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;

  useEffect(() => {
    if (!activeTranscript) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveTranscript(null);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [activeTranscript]);

  const stopCardClick = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div>
      <div className="section-header-row">
        <div className="flex-1">
          <h1 className="section-heading">Transcription Library</h1>
          <p className="section-sub mb-0">
            Your saved recordings — stored locally in your browser
          </p>
        </div>
        {transcripts.length > 0 && (
          <span className="badge badge-blue">
            {transcripts.length} {transcripts.length === 1 ? 'transcript' : 'transcripts'}
          </span>
        )}
      </div>

      <div className="spacer-2rem" />

      {error ? (
        <div className="alert-error">
          ⚠️ {error}
        </div>
      ) : transcripts.length === 0 ? (
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
        <div className="library-list">
          {transcripts.map((t) => (
            <div
              key={t.id}
              className="library-card"
              role="button"
              tabIndex={0}
              onClick={() => setActiveTranscript(t)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveTranscript(t);
                }
              }}
            >
              <div className="library-card-content">
                <div className="library-card-meta">
                  <span className="library-card-date">
                    {formatDate(t.date)}
                  </span>
                  <span className="badge badge-blue">{formatDuration(t.durationSeconds)}</span>
                </div>
                <p className="library-card-preview">
                  {transcriptPreviewText(t)}
                </p>
              </div>

              <div
                className="library-card-actions"
                onClick={stopCardClick}
              >
                <button
                  type="button"
                  onClick={() => handleDownload(t)}
                  className="btn-secondary"
                  title="Download as .txt"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(t.id)}
                  className="btn-secondary btn-danger-soft"
                  title="Delete transcript"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTranscript && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="transcript-modal-title"
          onClick={() => setActiveTranscript(null)}
        >
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setActiveTranscript(null)}
              aria-label="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="modal-header">
              <h2 id="transcript-modal-title" className="modal-title">
                Transcript
              </h2>
              <div className="modal-meta">
                <span>{formatDate(activeTranscript.date)}</span>
                <span className="badge badge-blue">
                  {formatDuration(activeTranscript.durationSeconds)}
                </span>
              </div>
            </div>

            <div className="modal-body">
              <TranscriptView segments={getTranscriptSegments(activeTranscript)} />
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleDownload(activeTranscript)}
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
                type="button"
                className="btn-secondary btn-danger-soft"
                onClick={() => handleDelete(activeTranscript.id)}
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
        </div>
      )}
    </div>
  );
}
