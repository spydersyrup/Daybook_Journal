import { getAuthToken } from './firebase';
import type {
  AIAnalysis,
  AIDigest,
  EntryLocation,
  PromptInspiration,
  ReflectionMessage,
  SuggestedMetadata,
  VoiceStructuredEntry,
  ReflectionMode,
} from '../types';

export async function fetchPromptInspirations(): Promise<PromptInspiration[]> {
  try {
    const res = await fetch('/api/journal/prompts');
    if (!res.ok) {
      throw new Error(`Failed to load prompts: ${res.statusText}`);
    }
    const data = await res.json();
    return data.prompts || [];
  } catch (err) {
    console.error('Error fetching prompts:', err);
    return [];
  }
}

export async function analyzeJournalEntry(params: {
  title: string;
  content: string;
  mood?: string;
  location?: EntryLocation | null;
  mode?: ReflectionMode;
}): Promise<AIAnalysis> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Please sign in to analyze your journal entry with Gemini.');
  }

  const res = await fetch('/api/journal/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Analysis failed (${res.status})`);
  }

  const data = await res.json();
  return data.analysis;
}

export async function chatWithGemini(params: {
  entryTitle: string;
  entryContent: string;
  messages: ReflectionMessage[];
  userMessage: string;
  location?: EntryLocation | null;
}): Promise<{ reply: string; modelUsed: string }> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Please sign in to converse with Gemini.');
  }

  const res = await fetch('/api/journal/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Conversation failed (${res.status})`);
  }

  return await res.json();
}

export async function generateAIDigest(params: {
  entries: Array<{
    title: string;
    content: string;
    mood?: string;
    createdAt: number;
    location?: EntryLocation | null;
  }>;
  timeRangeLabel?: string;
}): Promise<AIDigest> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Please sign in to generate an AI digest.');
  }

  const res = await fetch('/api/journal/digest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Digest generation failed (${res.status})`);
  }

  const data = await res.json();
  return data.digest;
}

export async function suggestEntryMetadata(content: string): Promise<SuggestedMetadata> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Please sign in to generate smart metadata.');
  }

  const res = await fetch('/api/journal/suggest-metadata', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Metadata generation failed (${res.status})`);
  }

  return await res.json();
}

export async function structureVoiceJournal(
  transcript: string,
  formatStyle: 'narrative' | 'bullets' | 'verbatim' = 'narrative'
): Promise<VoiceStructuredEntry> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Please sign in to process voice journal notes.');
  }

  const res = await fetch('/api/journal/voice-structure', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ transcript, formatStyle }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Voice transcription structuring failed (${res.status})`);
  }

  return await res.json();
}
