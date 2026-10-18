import { useState, useRef, useCallback } from 'react';
import { CueClassifier } from './classifier';
import { CueMapping, FrameSignals, SuggestionCandidate, SuggestionResult } from './types';

interface UseSuggestionsOptions {
  holdTimeMs?: number;
  cooldownMs?: number;
  sensitivity?: number;
  pauseSuggestions?: boolean;
}

export function useSuggestions(
  classifier: CueClassifier,
  mappings: CueMapping[],
  options: UseSuggestionsOptions = {}
) {
  const {
    holdTimeMs = 800,
    cooldownMs = 3000,
    sensitivity = 1.0,
    pauseSuggestions = false,
  } = options;

  const [currentResult, setCurrentResult] = useState<SuggestionResult>({
    status: 'idle',
    primaryCandidate: null,
    secondaryCandidate: null,
    holdProgress: 0,
    timeHeldMs: 0,
    detectedSignalsSummary: [],
  });

  const activeHoldCueIdRef = useRef<string | null>(null);
  const holdStartTimeRef = useRef<number | null>(null);
  const lastTriggeredTimeRef = useRef<number>(0);
  const lastUiPushTimeRef = useRef<number>(0);
  const lastResultRef = useRef<SuggestionResult>(currentResult);

  const processFrame = useCallback(
    (frameSignals: FrameSignals): SuggestionResult => {
      const now = performance.now();

      // If suggestions are paused
      if (pauseSuggestions) {
        const res: SuggestionResult = {
          status: 'idle',
          primaryCandidate: null,
          secondaryCandidate: null,
          holdProgress: 0,
          timeHeldMs: 0,
          detectedSignalsSummary: [],
          notSureReason: 'Suggestions paused by caregiver.',
        };
        if (lastResultRef.current.status !== 'idle') {
          lastResultRef.current = res;
          setCurrentResult(res);
        }
        return res;
      }

      // Check if distinct hand gestures are present
      const hasHandGesture =
        frameSignals.hands.handsPresentCount > 0 &&
        (frameSignals.hands.isPointing ||
          frameSignals.hands.isReaching ||
          frameSignals.hands.flappingDetected ||
          frameSignals.hands.wavingDetected ||
          frameSignals.hands.handNearMouth);

      // If tracking quality is poor and no clear hand gestures are present
      if (frameSignals.quality.status === 'poor' && !hasHandGesture) {
        holdStartTimeRef.current = null;
        activeHoldCueIdRef.current = null;
        const res: SuggestionResult = {
          status: 'not_sure',
          primaryCandidate: null,
          secondaryCandidate: null,
          holdProgress: 0,
          timeHeldMs: 0,
          detectedSignalsSummary: [],
          notSureReason: frameSignals.quality.guidanceMessage,
        };
        // Update at most 4 times a second
        if (
          lastResultRef.current.status !== 'not_sure' ||
          now - lastUiPushTimeRef.current >= 250
        ) {
          lastUiPushTimeRef.current = now;
          lastResultRef.current = res;
          setCurrentResult(res);
        }
        return res;
      }

      // Check cooldown
      if (now - lastTriggeredTimeRef.current < cooldownMs) {
        const remainingSec = ((cooldownMs - (now - lastTriggeredTimeRef.current)) / 1000).toFixed(1);
        const res: SuggestionResult = {
          status: 'idle',
          primaryCandidate: null,
          secondaryCandidate: null,
          holdProgress: 0,
          timeHeldMs: 0,
          detectedSignalsSummary: [],
          notSureReason: `Cooling down (${remainingSec}s)...`,
        };
        if (now - lastUiPushTimeRef.current >= 250) {
          lastUiPushTimeRef.current = now;
          lastResultRef.current = res;
          setCurrentResult(res);
        }
        return res;
      }

      // Classify signals against active mappings
      const candidates = classifier.evaluate(frameSignals, mappings);

      if (candidates.length === 0) {
        holdStartTimeRef.current = null;
        activeHoldCueIdRef.current = null;
        const res: SuggestionResult = {
          status: 'not_sure',
          primaryCandidate: null,
          secondaryCandidate: null,
          holdProgress: 0,
          timeHeldMs: 0,
          detectedSignalsSummary: [],
          notSureReason: "I'm watching carefully... I'm not sure yet 🤔",
        };
        if (
          lastResultRef.current.status !== 'not_sure' ||
          now - lastUiPushTimeRef.current >= 250
        ) {
          lastUiPushTimeRef.current = now;
          lastResultRef.current = res;
          setCurrentResult(res);
        }
        return res;
      }

      // Top candidate
      const top = candidates[0];
      const scaledConfidence = Math.min(1.0, top.confidence * sensitivity);

      // Low confidence (< 0.55) -> Not sure yet
      if (scaledConfidence < 0.55) {
        holdStartTimeRef.current = null;
        activeHoldCueIdRef.current = null;
        const res: SuggestionResult = {
          status: 'not_sure',
          primaryCandidate: null,
          secondaryCandidate: null,
          holdProgress: 0,
          timeHeldMs: 0,
          detectedSignalsSummary: top.matchedSignals,
          notSureReason: "Signals are subtle or mixed. I'm not sure yet 🤔",
        };
        if (
          lastResultRef.current.status !== 'not_sure' ||
          now - lastUiPushTimeRef.current >= 250
        ) {
          lastUiPushTimeRef.current = now;
          lastResultRef.current = res;
          setCurrentResult(res);
        }
        return res;
      }

      // Hold time logic: must be held continuously for holdTimeMs
      if (activeHoldCueIdRef.current !== top.cue.id) {
        activeHoldCueIdRef.current = top.cue.id;
        holdStartTimeRef.current = now;
      }

      const timeHeld = holdStartTimeRef.current ? now - holdStartTimeRef.current : 0;
      const progress = Math.min(1.0, timeHeld / holdTimeMs);

      // Check if second candidate is within 0.1 confidence -> Dual choice
      let secondCandidate: SuggestionCandidate | null = null;
      if (candidates.length > 1) {
        const second = candidates[1];
        if (Math.abs(top.confidence - second.confidence) <= 0.1) {
          secondCandidate = second;
        }
      }

      const isReadyToSuggest = progress >= 1.0;
      const bucket = scaledConfidence >= 0.8 ? 'high' : 'medium';

      const nextStatus = isReadyToSuggest ? (secondCandidate ? 'dual_choice' : 'suggestion') : 'idle';

      const res: SuggestionResult = {
        status: nextStatus,
        primaryCandidate: {
          ...top,
          confidence: Number(scaledConfidence.toFixed(2)),
          confidenceBucket: bucket,
        },
        secondaryCandidate: secondCandidate,
        holdProgress: progress,
        timeHeldMs: timeHeld,
        detectedSignalsSummary: top.matchedSignals,
      };

      // Push to React UI state only when:
      // 1. Status changes (e.g. idle -> suggestion)
      // 2. Candidate changes
      // 3. Or at throttled rate of ~4 times per second (250ms) to smoothly update progress
      const shouldPushUi =
        nextStatus !== lastResultRef.current.status ||
        top.cue.id !== lastResultRef.current.primaryCandidate?.cue.id ||
        now - lastUiPushTimeRef.current >= 250;

      if (shouldPushUi) {
        lastUiPushTimeRef.current = now;
        lastResultRef.current = res;
        setCurrentResult(res);
      }

      return res;
    },
    [classifier, mappings, pauseSuggestions, cooldownMs, sensitivity, holdTimeMs]
  );

  const notifyDecisionMade = useCallback(() => {
    lastTriggeredTimeRef.current = performance.now();
    holdStartTimeRef.current = null;
    activeHoldCueIdRef.current = null;
    const idleRes: SuggestionResult = {
      status: 'idle',
      primaryCandidate: null,
      secondaryCandidate: null,
      holdProgress: 0,
      timeHeldMs: 0,
      detectedSignalsSummary: [],
    };
    lastResultRef.current = idleRes;
    setCurrentResult(idleRes);
  }, []);

  return {
    currentResult,
    processFrame,
    notifyDecisionMade,
  };
}
