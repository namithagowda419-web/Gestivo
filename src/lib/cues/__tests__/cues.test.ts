import { describe, it, expect, beforeEach } from 'vitest';
import { OneEuroFilter, ExponentialMovingAverage, FlappingOscillationTracker } from '../filters';
import { CueClassifier } from '../classifier';
import { DEFAULT_STARTER_CUES } from '../starterCues';
import { FrameSignals, TrackingQuality, CueMapping } from '../types';

describe('Signal Filters & Smoothing Math', () => {
  it('OneEuroFilter dampens high frequency jitter while preserving trends', () => {
    const filter = new OneEuroFilter(1.0, 0.05, 1.0);
    const t0 = 1000;

    // Initialize with 0.5
    const val0 = filter.filter(0.5, t0);
    expect(val0).toBeCloseTo(0.5, 2);

    // Apply small jitter (+0.02, -0.02)
    const val1 = filter.filter(0.52, t0 + 33);
    const val2 = filter.filter(0.48, t0 + 66);

    // Filtered output should be smoother than the raw jitter
    expect(Math.abs(val1 - 0.5)).toBeLessThan(0.02);
    expect(Math.abs(val2 - 0.5)).toBeLessThan(0.02);

    // Apply large intentional change (rapid motion to 1.0)
    const val3 = filter.filter(1.0, t0 + 100);
    expect(val3).toBeGreaterThan(0.55); // Rapid adaptation
    const val4 = filter.filter(1.0, t0 + 133);
    expect(val4).toBeGreaterThan(0.65);
  });

  it('ExponentialMovingAverage computes smoothed series correctly', () => {
    const ema = new ExponentialMovingAverage(0.3);
    expect(ema.filter(1.0)).toBe(1.0); // Initial value

    const next = ema.filter(0.0);
    // 0.3 * 0 + 0.7 * 1.0 = 0.7
    expect(next).toBeCloseTo(0.7, 4);

    ema.reset();
    expect(ema.filter(0.5)).toBe(0.5);
  });
});

describe('Flapping Oscillation Tracker (2.0 Hz - 6.5 Hz)', () => {
  it('detects rhythmic hand flapping at 3.5 Hz', () => {
    const tracker = new FlappingOscillationTracker(1500);
    const freq = 3.5; // 3.5 cycles per second
    const dt = 33; // ~30 fps (33ms per frame)
    let t = 1000;

    let lastResult = { isFlapping: false, frequencyHz: 0, amplitude: 0 };
    // Simulate 2 seconds of 3.5 Hz flapping (amplitude 0.15)
    for (let i = 0; i < 60; i++) {
      const y = 0.5 + 0.15 * Math.sin(2 * Math.PI * freq * (t / 1000));
      lastResult = tracker.addSample(y, t);
      t += dt;
    }

    expect(lastResult.isFlapping).toBe(true);
    expect(lastResult.frequencyHz).toBeGreaterThanOrEqual(2.5);
    expect(lastResult.frequencyHz).toBeLessThanOrEqual(4.5);
    expect(lastResult.amplitude).toBeGreaterThan(0.1);
  });

  it('rejects slow non-flapping arm movements at 0.5 Hz', () => {
    const tracker = new FlappingOscillationTracker(1500);
    const freq = 0.5; // Slow reaching or waving
    const dt = 33;
    let t = 1000;

    let lastResult = { isFlapping: false, frequencyHz: 0, amplitude: 0 };
    for (let i = 0; i < 60; i++) {
      const y = 0.5 + 0.15 * Math.sin(2 * Math.PI * freq * (t / 1000));
      lastResult = tracker.addSample(y, t);
      t += dt;
    }

    // Should NOT be classified as high-frequency flapping
    expect(lastResult.isFlapping).toBe(false);
  });
});

describe('Cue Classifier & Personalization', () => {
  let classifier: CueClassifier;
  const goodQuality: TrackingQuality = {
    score: 0.9,
    status: 'good',
    faceFound: true,
    handsFound: 2,
    brightness: 60,
    faceDistance: 'optimal',
    guidanceMessage: 'Great tracking!',
  };

  const createDummySignals = (overrides: Partial<FrameSignals> = {}): FrameSignals => {
    return {
      timestamp: performance.now(),
      face: {
        smileIntensity: 0.1,
        jawOpen: 0.05,
        tongueOut: 0.0,
        eyeBlinkLeft: 0.1,
        eyeBlinkRight: 0.1,
        eyesClosed: false,
        browRaise: 0.1,
        cheekPuff: 0.0,
        lookDirection: 'center',
        gazeYaw: 0.0,
        gazePitch: 0.0,
        headYaw: 0.0,
        headPitch: 0.0,
        headRoll: 0.0,
        headTurnAway: false,
        headNodMotion: false,
        headTiltMotion: false,
        faceSize: 0.2,
        leanForward: false,
        leanBackward: false,
      },
      hands: {
        handsPresentCount: 2,
        isPointing: false,
        isReaching: false,
        handNearMouth: false,
        handNearFace: false,
        flappingDetected: false,
        flappingFrequency: 0,
        flappingAmplitude: 0,
        clappingDetected: false,
        wavingDetected: false,
        handOpennessLeft: 0.8,
        handOpennessRight: 0.8,
      },
      body: {
        armsRaised: false,
        leaningForward: false,
        leaningBackward: false,
        upperBodyEnergy: 'calm',
        motionLevel: 0.2,
      },
      quality: goodQuality,
      featureVector: new Array(18).fill(0),
      ...overrides,
    };
  };

  beforeEach(() => {
    classifier = new CueClassifier();
  });

  it('classifies starter excited/happy cue when smile and flapping occur', () => {
    const signals = createDummySignals({
      face: {
        smileIntensity: 0.85,
        jawOpen: 0.3,
        tongueOut: 0.0,
        eyeBlinkLeft: 0.1,
        eyeBlinkRight: 0.1,
        eyesClosed: false,
        browRaise: 0.2,
        cheekPuff: 0.0,
        lookDirection: 'center',
        gazeYaw: 0.0,
        gazePitch: 0.0,
        headYaw: 0.0,
        headPitch: 0.0,
        headRoll: 0.0,
        headTurnAway: false,
        headNodMotion: false,
        headTiltMotion: false,
        faceSize: 0.2,
        leanForward: false,
        leanBackward: false,
      },
      hands: {
        handsPresentCount: 2,
        isPointing: false,
        isReaching: false,
        handNearMouth: false,
        handNearFace: false,
        flappingDetected: true,
        flappingFrequency: 3.8,
        flappingAmplitude: 0.15,
        clappingDetected: false,
        wavingDetected: false,
        handOpennessLeft: 0.9,
        handOpennessRight: 0.9,
      },
    });

    const candidates = classifier.evaluate(signals, DEFAULT_STARTER_CUES);
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0].cue.phrase).toContain('Excited');
    expect(candidates[0].confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('respects neutral baseline subtraction for children who smile frequently', () => {
    // Angelman baseline: child naturally smiles at 0.5 when resting
    classifier.setBaseline({
      smileBaseline: 0.5,
      motionBaseline: 0.2,
      tremorBaseline: 0.1,
      gazeCenterOffset: [0, 0],
      recordedAt: new Date().toISOString(),
      isCalibrated: true,
    });

    // Frame with resting smile = 0.51 (not excited above baseline)
    const subtleSignals = createDummySignals({
      face: {
        smileIntensity: 0.51,
        jawOpen: 0.1,
        tongueOut: 0.0,
        eyeBlinkLeft: 0.1,
        eyeBlinkRight: 0.1,
        eyesClosed: false,
        browRaise: 0.1,
        cheekPuff: 0.0,
        lookDirection: 'center',
        gazeYaw: 0.0,
        gazePitch: 0.0,
        headYaw: 0.0,
        headPitch: 0.0,
        headRoll: 0.0,
        headTurnAway: false,
        headNodMotion: false,
        headTiltMotion: false,
        faceSize: 0.2,
        leanForward: false,
        leanBackward: false,
      },
      featureVector: [0.51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.2],
    });

    const candidates = classifier.evaluate(subtleSignals, DEFAULT_STARTER_CUES);
    // Baseline subtraction ensures subtle resting smile doesn't spuriously fire excited cue
    const excitedMatch = candidates.find((c) => c.cue.phrase.includes('Excited') && c.confidence > 0.85);
    expect(excitedMatch).toBeUndefined();
  });

  it('learns from caregiver correction feedback', () => {
    const dummyVector = [0.8, 0.8, 0.1, 0, 0, 0, 0, 0, 0, 0.5, 0.5, 0, 0, 0, 0, 0, 0, 0.4];
    const correctedPhrase = 'I am joyful';

    // Store correction feedback
    classifier.addCorrectionFeedback(dummyVector, correctedPhrase);

    // Now evaluate signals with identical feature vector
    const matchingSignals = createDummySignals({
      featureVector: dummyVector,
    });

    const candidates = classifier.evaluate(matchingSignals, DEFAULT_STARTER_CUES);
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0].cue.phrase).toBe(correctedPhrase);
    expect(candidates[0].isPersonalized).toBe(true);
  });

  it('exports and imports caregiver cue profiles as JSON', () => {
    const customCue: CueMapping = {
      id: 'custom-1',
      phrase: 'Look at my book!',
      icon: '📖',
      category: 'Interests',
      active: true,
      isStarter: false,
      isPersonalized: true,
      createdAt: new Date().toISOString(),
    };
    const sampleVectors = [new Array(18).fill(0.5)];

    classifier.setCustomMappings([customCue]);
    classifier.addTrainedSamples('custom-1', sampleVectors);

    // Export to JSON string
    const jsonStr = classifier.exportProfileJson();
    expect(jsonStr).toContain('Look at my book!');

    // Create new classifier and import
    const newClassifier = new CueClassifier();
    const success = newClassifier.importProfileJson(jsonStr);
    expect(success).toBe(true);

    const testSignals = createDummySignals({ featureVector: new Array(18).fill(0.5) });
    const matches = newClassifier.evaluate(testSignals, [customCue]);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].cue.phrase).toBe('Look at my book!');
  });
});

describe('Confidence Bucketing & Dual Choice Logic', () => {
  it('correctly categorizes High (>=0.8), Medium (0.55-0.79), and Low (<0.55)', () => {
    const categorizeConfidence = (score: number): 'high' | 'medium' | 'low' => {
      if (score >= 0.8) return 'high';
      if (score >= 0.55) return 'medium';
      return 'low';
    };

    expect(categorizeConfidence(0.92)).toBe('high');
    expect(categorizeConfidence(0.80)).toBe('high');
    expect(categorizeConfidence(0.79)).toBe('medium');
    expect(categorizeConfidence(0.55)).toBe('medium');
    expect(categorizeConfidence(0.54)).toBe('low');
    expect(categorizeConfidence(0.20)).toBe('low');
  });

  it('identifies dual options when two candidates are within 0.1 confidence delta', () => {
    const isDualChoice = (c1: number, c2: number): boolean => {
      return Math.abs(c1 - c2) <= 0.1;
    };

    expect(isDualChoice(0.82, 0.76)).toBe(true);  // Delta 0.06 <= 0.1 -> Dual option
    expect(isDualChoice(0.85, 0.75)).toBe(true);  // Delta 0.10 <= 0.1 -> Dual option
    expect(isDualChoice(0.88, 0.71)).toBe(false); // Delta 0.17 > 0.1 -> Clear winner
  });
});

describe('Hold Duration & Cooldown Timing Math', () => {
  it('does not trigger if held duration is less than minHoldDurationMs', () => {
    const minHoldDurationMs = 1000;
    const timeHeld = 650; // only 650ms
    const isTriggerReady = timeHeld >= minHoldDurationMs;
    const progress = Math.min(1.0, timeHeld / minHoldDurationMs);

    expect(isTriggerReady).toBe(false);
    expect(progress).toBeCloseTo(0.65, 2);
  });

  it('triggers when held continuously for >= minHoldDurationMs', () => {
    const minHoldDurationMs = 1000;
    const timeHeld = 1150; // continuous 1.15s
    const isTriggerReady = timeHeld >= minHoldDurationMs;
    const progress = Math.min(1.0, timeHeld / minHoldDurationMs);

    expect(isTriggerReady).toBe(true);
    expect(progress).toBe(1.0);
  });

  it('blocks immediate suggestions during active cooldown period', () => {
    const cooldownMs = 3000;
    const lastDecisionTime = 10000;
    const currentTime = 11500; // 1.5s later

    const isCoolingDown = currentTime - lastDecisionTime < cooldownMs;
    expect(isCoolingDown).toBe(true);

    const timeAfterCooldown = 13500; // 3.5s later
    const isStillCooling = timeAfterCooldown - lastDecisionTime < cooldownMs;
    expect(isStillCooling).toBe(false);
  });
});
