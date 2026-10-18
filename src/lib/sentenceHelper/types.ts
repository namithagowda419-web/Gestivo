export interface SentenceCandidate {
  id: string;
  phrase: string;
  confidence: 'High' | 'Medium' | 'Low';
  reason: string;
  source: 'local-rules' | 'history-frequency' | 'ai-proxy';
}

export interface SentenceHelperContext {
  tappedWords: string[];
  recentHistory?: string[];
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'bedtime';
  cameraCue?: string | { phrase: string; confidence?: number };
  childInterests?: string[];
}

export interface LearnedCorrection {
  inputTokens: string; // e.g. "water no"
  correctedPhrase: string; // e.g. "I don't want water now"
  timestamp: string;
  count: number;
}
