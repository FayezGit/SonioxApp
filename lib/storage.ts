import Dexie, { type Table } from 'dexie';

/** Minimal token shape from Soniox realtime `result` events. */
export interface TranscriptSegment {
  speaker?: string;
  color: string;
  text: string;
}

/**
 * A single saved transcript produced from a real-time recording session.
 */
export interface Transcript {
  /** UUID generated at save time. */
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

/**
 * Dexie Database Schema
 */
class SonioxDatabase extends Dexie {
  transcripts!: Table<Transcript>;

  constructor() {
    super('SonioxDatabase');
    this.version(1).stores({
      transcripts: 'id, date' // primary key and index
    });
  }
}

export const db = new SonioxDatabase();

/**
 * Read all saved transcripts from IndexedDB, newest first.
 */
export const getTranscripts = async (): Promise<Transcript[]> => {
  try {
    // Sort by date descending
    return await db.transcripts.orderBy('date').reverse().toArray();
  } catch (error) {
    console.error('Failed to get transcripts from IndexedDB', error);
    return [];
  }
};

/**
 * Persist a new transcript to IndexedDB.
 */
export const saveTranscript = async (transcript: Omit<Transcript, 'id' | 'date'>): Promise<boolean> => {
  try {
    const newTranscript: Transcript = {
      ...transcript,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
    };
    await db.transcripts.add(newTranscript);
    return true;
  } catch (error) {
    console.error('Failed to save transcript to IndexedDB', error);
    return false;
  }
};

/**
 * Remove a single transcript by its UUID.
 */
export const deleteTranscript = async (id: string): Promise<void> => {
  try {
    await db.transcripts.delete(id);
  } catch (error) {
    console.error('Failed to delete transcript', error);
  }
};

/**
 * Migration Utility: Move data from localStorage to IndexedDB.
 * Call this once during app initialization.
 */
export const migrateFromLocalStorage = async () => {
  if (typeof window === 'undefined') return;
  const STORAGE_KEY = 'soniox_transcripts';
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return;

  try {
    const legacyTranscripts: Transcript[] = JSON.parse(data);
    if (legacyTranscripts.length > 0) {
      console.log(`Migrating ${legacyTranscripts.length} transcripts to IndexedDB...`);
      // Use bulkAdd to import everything at once
      await db.transcripts.bulkAdd(legacyTranscripts);
      localStorage.removeItem(STORAGE_KEY);
      console.log('Migration complete. LocalStorage cleared.');
    }
  } catch (error) {
    console.error('Migration failed', error);
  }
};
