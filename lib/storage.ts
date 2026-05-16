export interface Transcript {
  id: string;
  text: string;
  date: string;
  durationSeconds: number;
}

const STORAGE_KEY = 'soniox_transcripts';

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

export const saveTranscript = (transcript: Omit<Transcript, 'id' | 'date'>) => {
  if (typeof window === 'undefined') return;
  try {
    const transcripts = getTranscripts();
    const newTranscript: Transcript = {
      ...transcript,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
    };
    // Add the newest transcript to the beginning
    transcripts.unshift(newTranscript);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transcripts));
  } catch (error) {
    console.error('Failed to save transcript to local storage', error);
  }
};

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
