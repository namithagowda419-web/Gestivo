import { BaselineCalibration, CueMapping, FrameSignals, SuggestionCandidate, TrainedSample } from './types';

export class CueClassifier {
  private customMappings: CueMapping[] = [];
  private trainedSamples: TrainedSample[] = [];
  private baseline: BaselineCalibration | null = null;
  private correctionHistory: Array<{ vector: number[]; correctedPhrase: string; timestamp: number }> = [];

  constructor(
    customMappings: CueMapping[] = [],
    trainedSamples: TrainedSample[] = [],
    baseline: BaselineCalibration | null = null
  ) {
    this.customMappings = customMappings;
    this.trainedSamples = trainedSamples;
    this.baseline = baseline;
  }

  setBaseline(baseline: BaselineCalibration | null) {
    this.baseline = baseline;
  }

  setCustomMappings(mappings: CueMapping[]) {
    this.customMappings = mappings;
  }

  setTrainedSamples(samples: TrainedSample[]) {
    this.trainedSamples = samples;
  }

  addTrainedSamples(cueId: string, vectors: number[][]) {
    const newSamples: TrainedSample[] = vectors.map((v) => ({
      id: `sample-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      cueId,
      vector: v,
      timestamp: Date.now(),
    }));
    this.trainedSamples = [...this.trainedSamples, ...newSamples];
  }

  addCorrectionFeedback(vector: number[], correctedPhrase: string) {
    this.correctionHistory.push({
      vector,
      correctedPhrase,
      timestamp: Date.now(),
    });
    // Limit history to 50 items
    if (this.correctionHistory.length > 50) {
      this.correctionHistory.shift();
    }
  }

  // Baseline normalization: subtract child's natural smile or tremor baseline
  private normalizeVector(vector: number[]): number[] {
    if (!this.baseline || !this.baseline.isCalibrated) {
      return vector;
    }
    const adjusted = [...vector];
    // Smile intensity relative to baseline
    adjusted[0] = Math.max(0, adjusted[0] - this.baseline.smileBaseline * 0.7);
    // Motion level relative to baseline
    adjusted[17] = Math.max(0, adjusted[17] - this.baseline.motionBaseline * 0.6);
    return adjusted;
  }

  // Classify current frame signals against starter rules and trained personalized samples
  evaluate(frameSignals: FrameSignals, allMappings: CueMapping[]): SuggestionCandidate[] {
    const normVector = this.normalizeVector(frameSignals.featureVector);
    const candidates: SuggestionCandidate[] = [];

    // 0. Check Caregiver Correction History (Direct learned feedback)
    for (const corr of this.correctionHistory) {
      const dist = this.euclideanDistance(normVector, corr.vector);
      if (dist < 1.0) {
        const confidence = Math.min(0.98, Math.max(0.65, 1.0 - dist / 1.5));
        candidates.push({
          cue: {
            id: `learned-${corr.timestamp}`,
            phrase: corr.correctedPhrase,
            icon: '💡',
            category: 'Caregiver Feedback',
            active: true,
            isPersonalized: true,
            isStarter: false,
            createdAt: new Date(corr.timestamp).toISOString(),
          },
          confidence: Number(confidence.toFixed(2)),
          confidenceBucket: confidence >= 0.8 ? 'high' : 'medium',
          matchedSignals: ['Caregiver-corrected pattern', ...this.describeMatchedSignals(frameSignals)],
          explanation: `Matched a past caregiver correction for "${corr.correctedPhrase}".`,
          isPersonalized: true,
        });
      }
    }

    // 1. Evaluate Personalized Trained Cues (k-NN / Centroid distance)
    const personalizedCues = allMappings.filter((m) => m.active && m.isPersonalized);
    for (const cue of personalizedCues) {
      const cueSamples = this.trainedSamples.filter((s) => s.cueId === cue.id);
      if (cueSamples.length === 0) continue;

      // k-NN distance (k = 5)
      const distances = cueSamples.map((sample) => this.euclideanDistance(normVector, sample.vector));
      distances.sort((a, b) => a - b);
      const topK = distances.slice(0, Math.min(5, distances.length));
      const avgDist = topK.reduce((a, b) => a + b, 0) / topK.length;

      // Distance to confidence: distance 0 -> 1.0, distance > 2.0 -> < 0.2
      const confidence = Math.max(0, Math.min(1.0, 1.0 - avgDist / 2.2));

      if (confidence >= 0.45) {
        const matchedSignals = this.describeMatchedSignals(frameSignals);
        candidates.push({
          cue,
          confidence: Number(confidence.toFixed(2)),
          confidenceBucket: confidence >= 0.8 ? 'high' : confidence >= 0.55 ? 'medium' : 'low',
          matchedSignals,
          explanation: `Personalized cue taught for this child (${cueSamples.length} recorded examples).`,
          isPersonalized: true,
        });
      }
    }

    // 2. Evaluate Rule-based Cues (Starter cues, customized cues, and caregiver-defined rule cues)
    const ruleBasedCues = allMappings.filter((m) => m.active && m.rules);
    for (const cue of ruleBasedCues) {
      if (candidates.some((c) => c.cue.id === cue.id)) continue;

      const match = this.evaluateStarterRule(cue, frameSignals);
      if (match && match.confidence >= 0.45) {
        candidates.push({
          cue,
          confidence: Number(match.confidence.toFixed(2)),
          confidenceBucket: match.confidence >= 0.8 ? 'high' : match.confidence >= 0.55 ? 'medium' : 'low',
          matchedSignals: match.matchedSignals,
          explanation: match.explanation,
          isPersonalized: Boolean(cue.isPersonalized),
        });
      }
    }

    // Sort: Prefer personalized matches over starter ideas, then sort by confidence descending
    candidates.sort((a, b) => {
      if (a.isPersonalized !== b.isPersonalized) {
        return a.isPersonalized ? -1 : 1;
      }
      return b.confidence - a.confidence;
    });

    return candidates;
  }

  private evaluateStarterRule(
    cue: CueMapping,
    frame: FrameSignals
  ): { confidence: number; matchedSignals: string[]; explanation: string } | null {
    const { face, hands, body } = frame;
    const rules = cue.rules;
    if (!rules) return null;

    let confidence = 0;
    const matchedSignals: string[] = [];

    // Gaze side: sustained left or right gaze
    if (rules.requireGaze) {
      if (face.lookDirection === 'left' || face.lookDirection === 'right') {
        confidence = Math.min(0.85, 0.65 + Math.abs(face.gazeYaw) / 80);
        matchedSignals.push(`Looking ${face.lookDirection}`);
        if (Math.abs(face.headYaw) > 15) {
          matchedSignals.push('Head turned towards object');
        }
      }
    }

    // Reaching / Pointing
    if (rules.requireReaching) {
      if (hands.isReaching || hands.isPointing) {
        confidence = hands.isPointing ? 0.88 : 0.78;
        if (hands.isPointing) matchedSignals.push('Index finger pointing forward');
        if (hands.isReaching) matchedSignals.push('Hand reaching toward camera');
      }
    }

    // Turn away / No
    if (rules.requireTurnAway) {
      if (face.headTurnAway) {
        confidence = 0.82;
        matchedSignals.push('Head turned away');
        if (face.leanBackward) matchedSignals.push('Leaning back');
      }
    }

    // Hand to mouth
    if (rules.requireHandNearMouth) {
      if (hands.handNearMouth) {
        confidence = 0.86;
        matchedSignals.push('Hand near mouth');
        if (face.jawOpen > 0.3) matchedSignals.push('Mouth open');
      }
    }

    // Smile + Flapping (Excited / Happy)
    if (rules.minSmile !== undefined || rules.requireFlapping) {
      const minSmile = rules.minSmile !== undefined ? rules.minSmile : 0.30;
      if (face.smileIntensity >= minSmile && hands.flappingDetected) {
        confidence = 0.95;
        matchedSignals.push('Bright smile detected');
        matchedSignals.push(`Hand flapping (${hands.flappingFrequency.toFixed(1)} Hz)`);
      } else if (face.smileIntensity >= minSmile) {
        confidence = Math.min(0.90, 0.74 + (face.smileIntensity - minSmile) * 0.35);
        matchedSignals.push('Warm smile detected');
      } else if (hands.flappingDetected) {
        confidence = 0.76;
        matchedSignals.push('Hand flapping detected');
      }
    }

    // Waving / Social Gesture
    if (rules.requireWaving) {
      if (hands.wavingDetected) {
        confidence = 0.88;
        matchedSignals.push('Hand waving gesture');
        if (face.smileIntensity > 0.2) matchedSignals.push('Smiling expression');
      }
    }

    // Leaning in
    if (rules.requireLeanIn) {
      if (face.leanForward || body.leaningForward) {
        confidence = 0.85;
        matchedSignals.push('Leaning forward towards screen');
        if (face.smileIntensity > 0.2) matchedSignals.push('Smiling face');
      }
    }

    // Tired / Stillness
    if (rules.requireStillness) {
      if ((body.upperBodyEnergy === 'still' || face.eyesClosed) && face.lookDirection !== 'center') {
        confidence = 0.78;
        matchedSignals.push('Very still posture');
        matchedSignals.push('Gaze resting away');
        if (face.eyesClosed) matchedSignals.push('Eyes resting');
      }
    }

    if (confidence === 0) return null;

    return {
      confidence,
      matchedSignals,
      explanation: `Starter pattern rule matched: ${matchedSignals.join(' • ')}`,
    };
  }

  private describeMatchedSignals(frame: FrameSignals): string[] {
    const list: string[] = [];
    if (frame.face.smileIntensity > 0.4) list.push('Smiling expression');
    if (frame.face.lookDirection !== 'center') list.push(`Looking ${frame.face.lookDirection}`);
    if (frame.face.headTurnAway) list.push('Head turned');
    if (frame.hands.isReaching) list.push('Reaching gesture');
    if (frame.hands.isPointing) list.push('Pointing gesture');
    if (frame.hands.handNearMouth) list.push('Hand to mouth');
    if (frame.hands.flappingDetected) list.push('Hand flapping');
    if (frame.body.leaningForward) list.push('Leaning forward');
    if (list.length === 0) list.push('Subtle motion cue');
    return list;
  }

  private euclideanDistance(a: number[], b: number[]): number {
    let sum = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }

  exportProfileJson(): string {
    return JSON.stringify(
      {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        baseline: this.baseline,
        customMappings: this.customMappings,
        trainedSamples: this.trainedSamples,
      },
      null,
      2
    );
  }

  importProfileJson(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.customMappings && Array.isArray(data.customMappings)) {
        this.customMappings = data.customMappings;
      }
      if (data.trainedSamples && Array.isArray(data.trainedSamples)) {
        this.trainedSamples = data.trainedSamples;
      }
      if (data.baseline) {
        this.baseline = data.baseline;
      }
      return true;
    } catch {
      return false;
    }
  }
}
