/**
 * @fileoverview Client-side localStorage persistence layer for transcripts.
 *
 * All functions are SSR-safe — they short-circuit when `window` is unavailable
 * (e.g. during Next.js server-side rendering).
 *
 * Storage key: "soniox_transcripts"
 * Format:      JSON array of {@link Transcript}, newest first.
 */

/** One speaker-attributed block in a saved or live transcript. */
export interface TranscriptSegment {
  speaker?: string;
  color: string;
  text: string;
}

/**
 * A single saved transcript produced from a real-time recording session.
 */
export interface Transcript {
  /** UUID generated at save time via `crypto.randomUUID()`. */
  id: string;
  /** Flat text (preview / legacy); derived from segments when saving. */
  text: string;
  /** Speaker-diarized segments; preferred for display and download. */
  segments?: TranscriptSegment[];
  /** ISO 8601 timestamp of when the transcript was saved. */
  date: string;
  /** Total recording duration in whole seconds. */
  durationSeconds: number;
}

const STORAGE_KEY = 'soniox_transcripts';

/**
 * Read all saved transcripts from localStorage, newest first.
 *
 * @returns Array of transcripts, or `[]` if storage is empty, unavailable, or corrupt.
 */
export const getTranscripts = (): Transcript[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get transcripts from local storage', error);
    return [];
  }
};

/**
 * Persist a new transcript to localStorage.
 *
 * A unique `id` (UUID) and `date` (ISO timestamp) are generated automatically.
 * The new transcript is prepended so the list stays newest-first.
 *
 * @param transcript - Transcript data without the auto-generated `id` and `date`.
 */
export const saveTranscript = (transcript: Omit<Transcript, 'id' | 'date'>) => {
  if (typeof window === 'undefined') return;
  try {
    const transcripts = getTranscripts();
    const newTranscript: Transcript = {
      ...transcript,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
    };
    // Prepend so the list is always newest-first
    transcripts.unshift(newTranscript);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transcripts));
  } catch (error) {
    console.error('Failed to save transcript to local storage', error);
  }
};

/**
 * Remove a single transcript by its UUID.
 *
 * @param id - The `id` field of the transcript to delete.
 */
export const deleteTranscript = (id: string) => {
  if (typeof window === 'undefined') return;
  try {
    const transcripts = getTranscripts();
    const updated = transcripts.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to delete transcript', error);
  }
};
