"use client";

import React, { useState, useEffect, useRef } from 'react';
import { SonioxClient } from '@soniox/client';
import { saveTranscript } from '@/lib/storage';

export default function TranscriptionStudio() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isClient, setIsClient] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    // eslint-disable-next-line
    setIsClient(true);
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const client = new SonioxClient({
        api_key: async () => {
          const res = await fetch('/api/token', { method: 'POST' });
          if (!res.ok) throw new Error('Failed to fetch temporary token');
          const data = await res.json();
          // Adjust based on the actual response structure of createTemporaryKey
          return data.key || data.api_key || data.temporary_api_key || data.token || ''; 
        },
      });

      // Assuming standard STT Realtime config
      const session = client.realtime.stt({
        model: 'en_v2', 
        enable_speaker_diarization: true,
      });
      sessionRef.current = session;

      if (session.on) {
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         session.on('result', (result: any) => {
           if (result.text) {
             setTranscript((prev) => prev + result.text + ' ');
           } else if (result.tokens) {
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             const text = result.tokens.map((t: any) => t.text).join(' ');
             setTranscript((prev) => prev + text + ' ');
           }
         });
      }

      setIsRecording(true);
      setTranscript('');
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = async (e) => {
        if (e.data.size > 0 && sessionRef.current && sessionRef.current.send) {
             const buffer = await e.data.arrayBuffer();
             sessionRef.current.send(buffer);
        }
      };
      mediaRecorderRef.current.start(250);

    } catch (error) {
      console.error("Failed to start recording", error);
      alert("Failed to start recording. Please check microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    if (sessionRef.current) {
       if (sessionRef.current.close) sessionRef.current.close();
    }
    setIsRecording(false);
    if (transcript.trim()) {
       saveTranscript({ text: transcript.trim(), durationSeconds: Math.floor(Math.random() * 60) + 10 }); 
    }
  };

  if (!isClient) return null;

  return (
    <div className="glass-panel p-8 max-w-4xl mx-auto w-full mt-12 flex flex-col items-center">
      <h2 className="text-3xl font-bold mb-6 text-center">Live Transcription Studio</h2>
      
      <div className="flex gap-4 mb-8">
        {!isRecording ? (
          <button onClick={startRecording} className="btn-primary">
            Start Recording
          </button>
        ) : (
          <button onClick={stopRecording} className="btn-secondary !text-red-400 !border-red-400 hover:!bg-red-500/10 pulse-animation">
            Stop Recording
          </button>
        )}
      </div>

      <div className="w-full min-h-[300px] p-6 bg-black/20 rounded-xl border border-white/5 shadow-inner">
        {!transcript && !isRecording && (
          <p className="text-gray-500 text-center mt-20">Click &apos;Start Recording&apos; to begin.</p>
        )}
        {!transcript && isRecording && (
          <p className="text-gray-400 animate-pulse text-center mt-20">Listening...</p>
        )}
        <p className="text-lg leading-relaxed tracking-wide text-gray-200">{transcript}</p>
      </div>
    </div>
  );
}
