"use client";

import type { TranscriptSegment } from '@/lib/storage';

type Props = {
  segments: TranscriptSegment[];
};

export default function TranscriptView({ segments }: Props) {
  return (
    <div className="transcript-content">
      {segments.map((seg, i) => {
        const prevSeg = i > 0 ? segments[i - 1] : null;
        const showSpeaker = seg.speaker && (!prevSeg || prevSeg.speaker !== seg.speaker);
        
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
