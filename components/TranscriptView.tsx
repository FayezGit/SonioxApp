"use client";

import type { TranscriptSegment } from '@/lib/storage';

type Props = {
  segments: TranscriptSegment[];
};

export default function TranscriptView({ segments }: Props) {
  // Track cumulative char offset so each segment has a stable, unique key
  // even when speaker labels are absent or repeated across sessions.
  let charOffset = 0;

  return (
    <div className="transcript-content">
      {segments.map((seg) => {
        const key = `${seg.speaker ?? '_'}:${charOffset}`;
        charOffset += seg.text.length;

        const prevSeg = segments[segments.indexOf(seg) - 1] ?? null;
        const showSpeaker = seg.speaker && (!prevSeg || prevSeg.speaker !== seg.speaker);
        
        return (
          <div key={key} className="transcript-segment">
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
