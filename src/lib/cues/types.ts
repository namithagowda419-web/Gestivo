// Types and interfaces for the Cue Camera system in GESTIVO

export type LookDirection = 'left' | 'right' | 'up' | 'down' | 'center';
export type MovementEnergy = 'still' | 'calm' | 'very_active';
export type ConfidenceBucket = 'high' | 'medium' | 'low';
export type TrackingStatus = 'good' | 'ok' | 'poor';

export interface FaceSignals {
  smileIntensity: number; // 0 to 1 (mouthSmileLeft/Right combined)
  jawOpen: number; // 0 to 1
  tongueOut: number; // 0 to 1
  eyeBlinkLeft: number; // 0 to 1
  eyeBlinkRight: number; // 0 to 1
  eyesClosed: boolean;
  browRaise: number; // 0 to 1
  cheekPuff: number; // 0 to 1
  lookDirection: LookDirection;
  gazeYaw: number; // degrees approx
  gazePitch: number; // degrees approx
  headYaw: number; // head rotation left-right
  headPitch: number; // head tilt up-down
  headRoll: number; // tilt side to side
  headTurnAway: boolean;
  headNodMotion: boolean;
  headTiltMotion: boolean;
  faceSize: number; // normalized bounding area
  leanForward: boolean; // sudden increase in face size
  leanBackward: boolean;
}

export interface HandSignals {
  handsPresentCount: number; // 0, 1, or 2
  isPointing: boolean;
  isReaching: boolean;
  handNearMouth: boolean;
  handNearFace: boolean;
  flappingDetected: boolean;
  flappingFrequency: number; // Hz (e.g. 2.5 - 5 Hz)
  flappingAmplitude: number; // normalized pixel height
  clappingDetected: boolean;
  wavingDetected: boolean;
  handOpennessLeft: number; // 0 (fist) to 1 (open)
  handOpennessRight: number;
}

export interface BodySignals {
  armsRaised: boolean;
  leaningForward: boolean;
  leaningBackward: boolean;
  upperBodyEnergy: MovementEnergy;
  motionLevel: number; // 0 (completely still) to 1 (vigorous)
}

export interface TrackingQuality {
  score: number; // 0 to 1
  status: TrackingStatus;
  faceFound: boolean;
  handsFound: number;
  brightness: number; // 0 to 100 approx
  faceDistance: 'too_far' | 'too_close' | 'optimal';
  guidanceMessage: string;
}

export interface FrameSignals {
  timestamp: number;
  face: FaceSignals;
  hands: HandSignals;
  body: BodySignals;
  quality: TrackingQuality;
  featureVector: number[]; // Normalized vector for k-NN / distance classifier
}

export interface BaselineCalibration {
  smileBaseline: number;
  motionBaseline: number;
  tremorBaseline: number;
  gazeCenterOffset: [number, number];
  recordedAt: string;
  isCalibrated: boolean;
}

export interface CueMapping {
  id: string;
  phrase: string;
  icon: string;
  category: string;
  active: boolean;
  isStarter: boolean;
  isPersonalized?: boolean;
  rules?: {
    requiredSignals: string[];
    minSmile?: number;
    requireGaze?: LookDirection;
    requireFlapping?: boolean;
    requireReaching?: boolean;
    requireHandNearMouth?: boolean;
    requireTurnAway?: boolean;
    requireStillness?: boolean;
    requireLeanIn?: boolean;
    requireWaving?: boolean;
  };
  trainedSamplesCount?: number;
  createdAt: string;
}

export interface TrainedSample {
  id: string;
  cueId: string;
  vector: number[];
  timestamp: number;
}

export interface SuggestionCandidate {
  cue: CueMapping;
  confidence: number;
  confidenceBucket: ConfidenceBucket;
  matchedSignals: string[];
  explanation: string;
  isPersonalized: boolean;
}

export interface SuggestionResult {
  status: 'suggestion' | 'dual_choice' | 'not_sure' | 'idle';
  primaryCandidate: SuggestionCandidate | null;
  secondaryCandidate: SuggestionCandidate | null;
  holdProgress: number; // 0 to 1
  timeHeldMs: number;
  detectedSignalsSummary: string[];
  notSureReason?: string;
}

export interface CueDecisionLog {
  id: string;
  timestamp: string; // Formatted date string
  rawTimestamp: number;
  suggestedPhrase: string;
  finalPhrase: string;
  decision: 'confirmed' | 'changed' | 'dismissed';
  confidence: number;
  confidenceBucket: ConfidenceBucket;
  signals: string[];
  cueId?: string;
  correctedToPhrase?: string;
}

export interface CueCameraSettings {
  featureEnabled: boolean;
  consentGiven: boolean;
  activeDeviceId: string;
  isMirrored: boolean;
  showOverlay: boolean;
  sensitivity: number; // 0.5 to 1.5 multiplier
  holdTimeMs: number; // Default 1000ms
  cooldownMs: number; // Default 3000ms
  voiceConfirmEnabled: boolean; // Caregiver confirms before speech
  pauseSuggestions: boolean;
}
