import { SentenceCandidate, SentenceHelperContext, LearnedCorrection } from './types';
import { generateLocalInterpretations } from './localEngine';

const LEARNED_STORAGE_KEY = 'gestivo-learned-sentence-corrections';

export function getLearnedCorrections(): LearnedCorrection[] {
  try {
    const raw = localStorage.getItem(LEARNED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLearnedCorrection(inputWords: string[], correctedPhrase: string) {
  try {
    const key = inputWords.map((w) => w.toLowerCase().trim()).filter(Boolean).join(' ');
    if (!key || !correctedPhrase) return;

    const existing = getLearnedCorrections();
    const index = existing.findIndex((c) => c.inputTokens === key);

    if (index >= 0) {
      existing[index].correctedPhrase = correctedPhrase;
      existing[index].count += 1;
      existing[index].timestamp = new Date().toISOString();
    } else {
      existing.push({
        inputTokens: key,
        correctedPhrase,
        count: 1,
        timestamp: new Date().toISOString(),
      });
    }

    localStorage.setItem(LEARNED_STORAGE_KEY, JSON.stringify(existing));
  } catch (err) {
    console.warn('Failed to save learned correction:', err);
  }
}

export function clearLearnedCorrections(): void {
  try {
    localStorage.removeItem(LEARNED_STORAGE_KEY);
  } catch {}
}

export async function interpretSentence(
  context: SentenceHelperContext
): Promise<{ candidates: SentenceCandidate[]; source: 'ai' | 'local' }> {
  const learned = getLearnedCorrections();

  // 1. Attempt optional backend proxy call at POST /api/interpret
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const response = await fetch('/api/interpret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tappedWords: context.tappedWords,
        timeOfDay: context.timeOfDay,
        cameraCue: context.cameraCue,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.interpretations) && data.interpretations.length > 0) {
        return {
          candidates: data.interpretations.slice(0, 4),
          source: 'ai',
        };
      }
    }
  } catch {
    // API unavailable, offline, or timed out - silently proceed to local-first engine
  }

  // 2. Local-first engine execution
  const localCandidates = generateLocalInterpretations(context, learned);
  return {
    candidates: localCandidates,
    source: 'local',
  };
}
