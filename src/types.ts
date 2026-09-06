export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface ReflectionMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  createdAt: number;
}

export interface AIAnalysis {
  summary: string;
  keyThemes: string[];
  emotionalTone: string;
  mindfulInsight: string;
  actionItems: string[];
  followUpQuestions: string[];
  analyzedAt: number;
  modelUsed?: string;
}

export type ReflectionMode = 'gentle' | 'practical' | 'patterns' | 'socratic';

export interface EntryLocation {
  name: string;
  latitude?: number;
  longitude?: number;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood?: 'gratitude' | 'calm' | 'energized' | 'anxious' | 'reflective' | 'frustrated' | 'motivated';
  tags: string[];
  location?: EntryLocation | null;
  analysis?: AIAnalysis | null;
  messages: ReflectionMessage[];
  createdAt: number;
  updatedAt: number;
  wordCount: number;
  lockedUntil?: number;
}

export interface PromptInspiration {
  id: string;
  category: 'Mindfulness' | 'Growth & Goals' | 'Daily Reflection' | 'Problem Solving' | 'Gratitude';
  text: string;
  guidance: string;
}

export interface AIDigest {
  timeRange: string;
  entryCount: number;
  executiveSummary: string;
  emotionalTrajectory: string;
  recurringThemes: string[];
  growthMilestones: string[];
  unresolvedTensions: string[];
  guidingIntention: string;
  generatedAt: number;
  modelUsed?: string;
}

export interface SuggestedMetadata {
  suggestedTitle: string;
  suggestedMood: JournalEntry['mood'];
  suggestedTags: string[];
  modelUsed?: string;
}

export interface VoiceStructuredEntry {
  title: string;
  content: string;
  mood: JournalEntry['mood'];
  tags: string[];
  modelUsed?: string;
}
