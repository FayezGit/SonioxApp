"use client";

import React, { useState, useEffect } from 'react';
import { Transcript, getTranscripts, deleteTranscript } from '@/lib/storage';

export default function Library() {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  
  useEffect(() => {
    // eslint-disable-next-line
    setTranscripts(getTranscripts());
  }, []);

  const handleDelete = (id: string) => {
    deleteTranscript(id);
    setTranscripts(getTranscripts());
  };

  const handleDownload = (transcript: Transcript) => {
    const blob = new Blob([transcript.text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript_${new Date(transcript.date).toISOString().replace(/[:.]/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      <h2 className="text-3xl font-bold mb-8">Transcription Library</h2>
      {transcripts.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No transcripts saved yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {transcripts.map((t) => (
            <div key={t.id} className="glass-panel p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-white/20 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-400 mb-2">
                  {new Date(t.date).toLocaleString()} • {t.durationSeconds}s
                </p>
                <p className="text-gray-200 truncate pr-4">{t.text}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => handleDownload(t)} className="btn-secondary text-sm">
                  Download
                </button>
                <button onClick={() => handleDelete(t.id)} className="btn-secondary text-sm !text-red-400 border-red-400/50 hover:!bg-red-500/10">
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
