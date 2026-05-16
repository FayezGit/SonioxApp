"use client";

import type { TranscriptSegment } from '@/lib/storage';

type Props = {
  segments: TranscriptSegment[];
};

export default function TranscriptView({ segments }: Props) {
  let lastSpeaker: string | undefined;

  return (
    <div className="transcript-content">
      {segments.map((seg, i) => {
        const showSpeaker = seg.speaker && seg.speaker !== lastSpeaker;
        if (seg.speaker) lastSpeaker = seg.speaker;
        
        return (
          <div key={i} className="transcript-segment">
            {showSpeaker && (
              <span className="speaker-label" style={{ color: seg.color }}>
                {seg.speaker}
              </span>
            )}
            <p className="segment-text">{seg.text}</p>
          </div>
        );
      })}
    </div>
  );
}
