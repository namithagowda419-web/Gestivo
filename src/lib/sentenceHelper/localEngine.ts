import { SentenceCandidate, SentenceHelperContext, LearnedCorrection } from './types';

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'bedtime' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'evening';
  return 'bedtime';
}

export function generateLocalInterpretations(
  context: SentenceHelperContext,
  learnedCorrections: LearnedCorrection[] = []
): SentenceCandidate[] {
  const words = context.tappedWords.map((w) => w.toLowerCase().trim()).filter(Boolean);
  if (words.length === 0) return [];

  const timeOfDay = context.timeOfDay || getTimeOfDay();
  const joinedKey = words.join(' ');
  const candidates: SentenceCandidate[] = [];

  // 1. Check for caregiver learned corrections first (Highest priority & confidence)
  const exactLearned = learnedCorrections.find((c) => c.inputTokens === joinedKey);
  if (exactLearned) {
    candidates.push({
      id: `learned-${Date.now()}-1`,
      phrase: exactLearned.correctedPhrase,
      confidence: 'High',
      reason: `Caregiver-taught preference for "${joinedKey}" (used ${exactLearned.count} time${exactLearned.count > 1 ? 's' : ''})`,
      source: 'local-rules',
    });
  }

  // 2. Rules based on common Angelman AAC communication patterns
  const hasNo = words.some((w) => ['no', 'not', 'stop', 'finished', 'dont'].includes(w));
  const hasWater = words.some((w) => ['water', 'drink', 'thirsty', 'juice', 'cup'].includes(w));
  const hasFood = words.some((w) => ['hungry', 'food', 'snack', 'eat', 'cookie', 'lunch', 'dinner'].includes(w));
  const hasHelp = words.some((w) => ['help', 'please', 'assist'].includes(w));
  const hasMum = words.some((w) => ['mum', 'mom', 'mommy', 'mama'].includes(w));
  const hasDad = words.some((w) => ['dad', 'daddy', 'papa'].includes(w));
  const hasPlay = words.some((w) => ['play', 'game', 'bubbles', 'toy', 'music', 'swing', 'blocks'].includes(w));
  const hasPain = words.some((w) => ['hurt', 'pain', 'ouch', 'tired', 'sick'].includes(w));

  // Complex multi-token patterns
  if (hasWater && hasNo && hasMum) {
    candidates.push({
      id: `rule-no-water-mum`,
      phrase: "Maybe: 'Mum, I don't want water right now'",
      confidence: 'High',
      reason: "Combines 'no' with 'water' and addressing 'Mum'",
      source: 'local-rules',
    });
    candidates.push({
      id: `rule-water-finished`,
      phrase: "Or: 'I finished my drink, Mum'",
      confidence: 'Medium',
      reason: "Alternative meaning for 'no' when holding or done with a cup",
      source: 'local-rules',
    });
  } else if (hasWater && hasNo) {
    candidates.push({
      id: `rule-no-water-1`,
      phrase: "Maybe: 'I don't want water now'",
      confidence: 'High',
      reason: "Direct negation with beverage request",
      source: 'local-rules',
    });
    candidates.push({
      id: `rule-no-water-2`,
      phrase: "Or: 'No more water, I am all done'",
      confidence: 'Medium',
      reason: "'No' indicating completion of drink",
      source: 'local-rules',
    });
  } else if (hasWater) {
    const isAfternoon = timeOfDay === 'afternoon';
    candidates.push({
      id: `rule-want-water-1`,
      phrase: "Maybe: 'I would like a sip of water, please'",
      confidence: 'High',
      reason: `Common hydration need${isAfternoon ? ' during afternoon activity' : ''}`,
      source: 'local-rules',
    });
    candidates.push({
      id: `rule-want-water-2`,
      phrase: "Or: 'My mouth feels dry, I need my cup'",
      confidence: 'Medium',
      reason: "Tentative expression for thirst cue",
      source: 'local-rules',
    });
  }

  if (hasFood && hasNo) {
    candidates.push({
      id: `rule-no-food`,
      phrase: "Maybe: 'I am not hungry right now, no food please'",
      confidence: 'High',
      reason: "Negation combined with food tile",
      source: 'local-rules',
    });
    candidates.push({
      id: `rule-food-done`,
      phrase: "Or: 'All done eating, thank you'",
      confidence: 'Medium',
      reason: "Signals mealtime transition",
      source: 'local-rules',
    });
  } else if (hasFood) {
    const meal = timeOfDay === 'morning' ? 'breakfast' : timeOfDay === 'afternoon' ? 'a snack' : 'dinner';
    candidates.push({
      id: `rule-want-food-1`,
      phrase: `Maybe: 'I am feeling hungry, could I have ${meal}?'`,
      confidence: 'High',
      reason: `Matches ${timeOfDay} mealtime routine`,
      source: 'local-rules',
    });
    candidates.push({
      id: `rule-want-food-2`,
      phrase: "Or: 'I would like something yummy to eat'",
      confidence: 'Medium',
      reason: "General snack expression",
      source: 'local-rules',
    });
  }

  if (hasHelp && hasPlay) {
    candidates.push({
      id: `rule-help-play`,
      phrase: "Maybe: 'Can you help me play with this toy?'",
      confidence: 'High',
      reason: "Co-occurring help request with play activity",
      source: 'local-rules',
    });
  } else if (hasPlay) {
    candidates.push({
      id: `rule-want-play-1`,
      phrase: "Maybe: 'I want to play and have fun together'",
      confidence: 'High',
      reason: "Child-initiated engagement request",
      source: 'local-rules',
    });
  }

  if (hasMum && !hasWater && !hasFood) {
    candidates.push({
      id: `rule-want-mum`,
      phrase: "Maybe: 'I want to be near Mum'",
      confidence: 'High',
      reason: "Affection or comfort seeking",
      source: 'local-rules',
    });
  }

  if (hasDad && !hasWater && !hasFood) {
    candidates.push({
      id: `rule-want-dad`,
      phrase: "Maybe: 'I want to be near Dad'",
      confidence: 'High',
      reason: "Affection or comfort seeking",
      source: 'local-rules',
    });
  }

  if (hasPain) {
    candidates.push({
      id: `rule-pain`,
      phrase: "Maybe: 'I am not feeling comfortable right now'",
      confidence: 'High',
      reason: "Caregiver priority: check physical comfort",
      source: 'local-rules',
    });
  }

  // Camera cue correlation
  if (context.cameraCue && candidates.length < 4) {
    const cuePhrase = typeof context.cameraCue === 'string' ? context.cameraCue : context.cameraCue.phrase;
    candidates.push({
      id: `rule-camera-cue`,
      phrase: `Maybe: '${cuePhrase}'`,
      confidence: 'Medium',
      reason: `Camera cue: Correlated with visual signal ("${cuePhrase}")`,
      source: 'local-rules',
    });
  }

  // Fallback if no specific rule matched
  if (candidates.length === 0) {
    const phraseCapitalized = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    candidates.push({
      id: `fallback-1`,
      phrase: `Maybe: 'I am trying to tell you about: ${phraseCapitalized}'`,
      confidence: 'Medium',
      reason: `Direct interpretation of tapped tiles [${words.join(', ')}]`,
      source: 'local-rules',
    });
    candidates.push({
      id: `fallback-2`,
      phrase: `Or: 'Can you help me with ${phraseCapitalized}?'`,
      confidence: 'Low',
      reason: "General assisted request phrasing",
      source: 'local-rules',
    });
  }

  // Deduplicate and cap at 4 suggestions
  const uniquePhrases = new Set<string>();
  const results: SentenceCandidate[] = [];
  for (const c of candidates) {
    if (!uniquePhrases.has(c.phrase)) {
      uniquePhrases.add(c.phrase);
      results.push(c);
      if (results.length === 4) break;
    }
  }

  return results;
}
