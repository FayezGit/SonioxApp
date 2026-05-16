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
 * Mutates speakerMap — call only inside event handlers, never during render.
 */
export function buildFinalSegments(
  finalTokens: FinalizedToken[],
  speakerMap: Map<string, number>,
): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  let current: TranscriptSegment | null = null;

  for (const t of finalTokens) {
    let speaker = t.speaker;
    if (speaker && !speaker.toLowerCase().startsWith('speaker')) {
      speaker = `Speaker ${speaker}`;
    }

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
