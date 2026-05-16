import type { Transcript, TranscriptSegment } from '@/lib/storage';

/** Minimal token shape from Soniox realtime `result` events. */
export type FinalizedToken = {
  text: string;
  speaker?: string;
};

export const SPEAKER_COLORS: string[] = [
  'var(--speaker-1)',
  'var(--speaker-2)',
  'var(--speaker-3)',
  'var(--speaker-4)',
];

/**
 * Build stable segments from finalized tokens (same speaker merged).
 *
 * Works on a local copy of `speakerMap` so it is safe to call multiple times
 * (e.g. under React Strict Mode double-invocation) without accumulating stale
 * entries. New speaker→color assignments are flushed back to the caller's ref
 * after iteration.
 */
export function buildFinalSegments(
  finalTokens: FinalizedToken[],
  speakerMap: Map<string, number>,
): TranscriptSegment[] {
  // Work on a snapshot so re-runs are idempotent
  const localMap = new Map(speakerMap);

  const segments: TranscriptSegment[] = [];
  let current: TranscriptSegment | null = null;

  for (const t of finalTokens) {
    let speaker = t.speaker;
    if (speaker && !speaker.toLowerCase().startsWith('speaker')) {
      speaker = `Speaker ${speaker}`;
    }

    let color = SPEAKER_COLORS[0];
    if (speaker) {
      if (!localMap.has(speaker)) {
        localMap.set(speaker, localMap.size % SPEAKER_COLORS.length);
      }
      color = SPEAKER_COLORS[localMap.get(speaker)!];
    }
    if (!current || current.speaker !== speaker) {
      current = { speaker, color, text: t.text };
      segments.push(current);
    } else {
      current.text += t.text;
    }
  }

  // Flush any newly discovered speakers back to the caller's map
  for (const [key, value] of localMap) {
    if (!speakerMap.has(key)) speakerMap.set(key, value);
  }

  return segments;
}

/** Segments for display; falls back to a single block for legacy saves. */
export function getTranscriptSegments(transcript: Transcript): TranscriptSegment[] {
  if (transcript.segments?.length) return transcript.segments;
  if (!transcript.text.trim()) return [];
  return [{ text: transcript.text, color: SPEAKER_COLORS[0] }];
}

/** Plain-text export with speaker labels when available. */
export function formatTranscriptPlainText(transcript: Transcript): string {
  return getTranscriptSegments(transcript)
    .map(seg => (seg.speaker ? `${seg.speaker}: ${seg.text.trim()}` : seg.text.trim()))
    .filter(Boolean)
    .join('\n\n');
}

/** One-line preview for library cards. */
export function transcriptPreviewText(transcript: Transcript, maxLen = 160): string {
  const flat = getTranscriptSegments(transcript)
    .map(seg => seg.text)
    .join('')
    .trim();
  if (flat.length <= maxLen) return flat;
  return `${flat.slice(0, maxLen)}…`;
}
