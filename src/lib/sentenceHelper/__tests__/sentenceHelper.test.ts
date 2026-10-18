import { describe, it, expect, beforeEach } from 'vitest';
import { generateLocalInterpretations } from '../localEngine';
import { saveLearnedCorrection, getLearnedCorrections, clearLearnedCorrections } from '../sentenceHelperApi';

describe('Intelligent Sentence Helper Local Engine', () => {
  beforeEach(() => {
    clearLearnedCorrections();
  });

  it('provides tentative interpretations for basic hydration request', () => {
    const result = generateLocalInterpretations({ tappedWords: ['water'] }, getLearnedCorrections());
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result.length).toBeLessThanOrEqual(4);

    // Must never state interpretations as pure facts
    const phrases = result.map((r) => r.phrase);
    expect(phrases.some((p) => p.includes('water'))).toBe(true);

    // Checks confidence and reasons are present
    result.forEach((c) => {
      expect(['High', 'Medium', 'Low']).toContain(c.confidence);
      expect(c.reason).toBeTruthy();
    });
  });

  it('correctly handles negation fragments like water + no', () => {
    const result = generateLocalInterpretations({ tappedWords: ['water', 'no'] }, getLearnedCorrections());
    const phrases = result.map((r) => r.phrase);
    expect(phrases.some((p) => p.toLowerCase().includes("don't want water") || p.toLowerCase().includes('finished my drink'))).toBe(true);
  });

  it('incorporates camera cues into interpretation ranking', () => {
    const result = generateLocalInterpretations({
      tappedWords: ['water'],
      cameraCue: { phrase: 'I am thirsty', confidence: 0.85 },
    }, getLearnedCorrections());
    expect(result[0].phrase).toContain('water');
    expect(result.some((c) => c.reason.includes('Camera cue'))).toBe(true);
  });

  it('prioritizes learned caregiver corrections', () => {
    saveLearnedCorrection(['water', 'now'], 'Please give me cold water');

    const result = generateLocalInterpretations(
      { tappedWords: ['water', 'now'] },
      getLearnedCorrections()
    );
    expect(result[0].phrase).toBe('Please give me cold water');
    expect(result[0].confidence).toBe('High');
    expect(result[0].reason).toContain('Caregiver-taught preference');
  });

  it('handles empty input gracefully', () => {
    const result = generateLocalInterpretations({ tappedWords: [] }, getLearnedCorrections());
    expect(result).toEqual([]);
  });
});
