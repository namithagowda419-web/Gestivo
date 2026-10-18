import { BodySignals, FaceSignals, FrameSignals, HandSignals, LookDirection, TrackingQuality } from './types';
import { FlappingOscillationTracker, OneEuroFilter, ExponentialMovingAverage } from './filters';

export class SignalExtractor {
  // Smoothing filters for jitter / tremor tolerance
  private smileFilter = new OneEuroFilter(1.2, 0.05);
  private jawFilter = new OneEuroFilter(1.2, 0.05);
  private gazeYawFilter = new OneEuroFilter(1.5, 0.08);
  private gazePitchFilter = new OneEuroFilter(1.5, 0.08);
  private headYawFilter = new OneEuroFilter(1.0, 0.04);
  private headPitchFilter = new OneEuroFilter(1.0, 0.04);
  private motionFilter = new ExponentialMovingAverage(0.3);

  private flappingTracker = new FlappingOscillationTracker(1500);

  private lastFaceSize: number | null = null;
  private lastHeadPitch: number = 0;
  private nodCounter: number = 0;

  // Extract signals from MediaPipe detection outputs
  extract(
    faceResult: any,
    handResult: any,
    poseResult: any,
    timestampMs: number,
    _videoWidth: number,
    _videoHeight: number
  ): FrameSignals {
    const faceFound = Boolean(faceResult?.faceLandmarks && faceResult.faceLandmarks.length > 0);
    const handsCount = handResult?.landmarks ? handResult.landmarks.length : 0;

    // 1. Face Signals
    const face = this.extractFaceSignals(faceResult, timestampMs);

    // 2. Hand Signals
    const hands = this.extractHandSignals(handResult, faceResult, timestampMs);

    // 3. Body Signals
    const body = this.extractBodySignals(poseResult, face);

    // 4. Tracking Quality Score & Guidance
    const quality = this.computeTrackingQuality(faceFound, handsCount, face.faceSize);

    // 5. Standardized 18-D Feature Vector for Machine Learning / Classification
    const featureVector = [
      face.smileIntensity,
      face.jawOpen,
      face.tongueOut,
      face.browRaise,
      face.lookDirection === 'left' ? 1 : 0,
      face.lookDirection === 'right' ? 1 : 0,
      face.lookDirection === 'up' ? 1 : 0,
      face.lookDirection === 'down' ? 1 : 0,
      Math.abs(face.headYaw) / 45, // Normalized yaw
      face.headTurnAway ? 1 : 0,
      hands.handsPresentCount > 0 ? 1 : 0,
      hands.isReaching ? 1 : 0,
      hands.isPointing ? 1 : 0,
      hands.handNearMouth ? 1 : 0,
      hands.flappingDetected ? 1 : 0,
      hands.clappingDetected ? 1 : 0,
      body.leaningForward ? 1 : 0,
      body.motionLevel,
    ];

    return {
      timestamp: timestampMs,
      face,
      hands,
      body,
      quality,
      featureVector,
    };
  }

  private extractFaceSignals(faceResult: any, timestampMs: number): FaceSignals {
    if (!faceResult?.faceLandmarks || faceResult.faceLandmarks.length === 0) {
      return {
        smileIntensity: 0,
        jawOpen: 0,
        tongueOut: 0,
        eyeBlinkLeft: 0,
        eyeBlinkRight: 0,
        eyesClosed: false,
        browRaise: 0,
        cheekPuff: 0,
        lookDirection: 'center',
        gazeYaw: 0,
        gazePitch: 0,
        headYaw: 0,
        headPitch: 0,
        headRoll: 0,
        headTurnAway: false,
        headNodMotion: false,
        headTiltMotion: false,
        faceSize: 0,
        leanForward: false,
        leanBackward: false,
      };
    }

    const landmarks = faceResult.faceLandmarks[0];
    const blendshapes = faceResult.faceBlendshapes?.[0]?.categories || [];

    // Helper to find blendshape score
    const getScore = (name: string): number => {
      const b = blendshapes.find((cat: any) => cat.categoryName === name);
      return b ? b.score : 0;
    };

    // Blendshapes
    const rawSmile = (getScore('mouthSmileLeft') + getScore('mouthSmileRight')) / 2;
    const smileIntensity = this.smileFilter.filter(rawSmile, timestampMs);

    const rawJawOpen = getScore('jawOpen');
    const jawOpen = this.jawFilter.filter(rawJawOpen, timestampMs);

    const tongueOut = getScore('tongueOut');
    const eyeBlinkLeft = getScore('eyeBlinkLeft');
    const eyeBlinkRight = getScore('eyeBlinkRight');
    const eyesClosed = eyeBlinkLeft > 0.6 && eyeBlinkRight > 0.6;

    const browRaise = (getScore('browInnerUp') + getScore('browOuterUpLeft') + getScore('browOuterUpRight')) / 3;
    const cheekPuff = getScore('cheekPuff');

    // Eye look directions
    const eyeLookInL = getScore('eyeLookInLeft');
    const eyeLookOutL = getScore('eyeLookOutLeft');
    const eyeLookInR = getScore('eyeLookInRight');
    const eyeLookOutR = getScore('eyeLookOutRight');
    const eyeLookUp = (getScore('eyeLookUpLeft') + getScore('eyeLookUpRight')) / 2;
    const eyeLookDown = (getScore('eyeLookDownLeft') + getScore('eyeLookDownRight')) / 2;

    // Gaze horizontal: positive = right, negative = left
    const rawGazeX = (eyeLookOutR + eyeLookInL) / 2 - (eyeLookOutL + eyeLookInR) / 2;
    const gazeYaw = this.gazeYawFilter.filter(rawGazeX * 50, timestampMs);
    const gazePitch = this.gazePitchFilter.filter((eyeLookUp - eyeLookDown) * 45, timestampMs);

    // Head pose from transformation matrix or key landmark approximations
    let headYaw = 0;
    let headPitch = 0;
    let headRoll = 0;

    if (faceResult.facialTransformationMatrixes?.[0]?.data) {
      const m = faceResult.facialTransformationMatrixes[0].data;
      // Extract Euler angles from 4x4 matrix
      headPitch = Math.asin(Math.max(-1, Math.min(1, -m[6]))) * (180 / Math.PI);
      headYaw = Math.atan2(m[2], m[10]) * (180 / Math.PI);
      headRoll = Math.atan2(m[4], m[5]) * (180 / Math.PI);
    } else {
      // Landmark geometry fallback
      const noseTip = landmarks[1];
      const leftEar = landmarks[234];
      const rightEar = landmarks[454];
      const chin = landmarks[152];
      const forehead = landmarks[10];

      if (noseTip && leftEar && rightEar) {
        const earDist = Math.abs(rightEar.x - leftEar.x);
        headYaw = ((noseTip.x - leftEar.x) / (earDist || 1) - 0.5) * 80;
      }
      if (noseTip && chin && forehead) {
        const faceH = Math.abs(chin.y - forehead.y);
        headPitch = ((noseTip.y - forehead.y) / (faceH || 1) - 0.5) * 70;
      }
    }

    headYaw = this.headYawFilter.filter(headYaw, timestampMs);
    headPitch = this.headPitchFilter.filter(headPitch, timestampMs);

    // Combined gaze direction
    let lookDirection: LookDirection = 'center';
    if (gazeYaw + headYaw > 18) lookDirection = 'right';
    else if (gazeYaw + headYaw < -18) lookDirection = 'left';
    else if (gazePitch + headPitch > 18) lookDirection = 'up';
    else if (gazePitch + headPitch < -18) lookDirection = 'down';

    // Face size (for distance and leaning in)
    const chin = landmarks[152];
    const forehead = landmarks[10];
    const faceHeight = Math.abs(chin.y - forehead.y);
    const faceWidth = Math.abs(landmarks[454].x - landmarks[234].x);
    const faceSize = faceHeight * faceWidth;

    let leanForward = false;
    let leanBackward = false;
    if (this.lastFaceSize !== null) {
      if (faceSize > this.lastFaceSize * 1.15 && faceSize > 0.08) {
        leanForward = true;
      } else if (faceSize < this.lastFaceSize * 0.88) {
        leanBackward = true;
      }
    }
    this.lastFaceSize = faceSize;

    // Head nod
    const pitchDelta = Math.abs(headPitch - this.lastHeadPitch);
    if (pitchDelta > 6 && pitchDelta < 25) {
      this.nodCounter = Math.min(this.nodCounter + 1, 10);
    } else {
      this.nodCounter = Math.max(this.nodCounter - 1, 0);
    }
    this.lastHeadPitch = headPitch;
    const headNodMotion = this.nodCounter >= 3;

    return {
      smileIntensity,
      jawOpen,
      tongueOut,
      eyeBlinkLeft,
      eyeBlinkRight,
      eyesClosed,
      browRaise,
      cheekPuff,
      lookDirection,
      gazeYaw,
      gazePitch,
      headYaw,
      headPitch,
      headRoll,
      headTurnAway: Math.abs(headYaw) > 20 || Math.abs(headRoll) > 16,
      headNodMotion,
      headTiltMotion: Math.abs(headRoll) > 16,
      faceSize,
      leanForward,
      leanBackward,
    };
  }

  private extractHandSignals(handResult: any, faceResult: any, timestampMs: number): HandSignals {
    const handsPresentCount = handResult?.landmarks ? handResult.landmarks.length : 0;

    if (handsPresentCount === 0) {
      this.flappingTracker.addSample(0, timestampMs);
      return {
        handsPresentCount: 0,
        isPointing: false,
        isReaching: false,
        handNearMouth: false,
        handNearFace: false,
        flappingDetected: false,
        flappingFrequency: 0,
        flappingAmplitude: 0,
        clappingDetected: false,
        wavingDetected: false,
        handOpennessLeft: 0,
        handOpennessRight: 0,
      };
    }

    const firstHand = handResult.landmarks[0];
    const wrist = firstHand[0];
    const indexTip = firstHand[8];
    const indexMcp = firstHand[5];
    const middleTip = firstHand[12];

    // Flapping detection using wrist Y coordinates
    const { isFlapping, frequencyHz, amplitude } = this.flappingTracker.addSample(wrist.y, timestampMs);

    // Pointing / reaching: support both traditional index pointing and open reach
    const indexSpan = Math.hypot(indexTip.x - wrist.x, indexTip.y - wrist.y);
    const mcpSpan = Math.hypot(indexMcp.x - wrist.x, indexMcp.y - wrist.y);
    const middleSpan = Math.hypot(middleTip.x - wrist.x, middleTip.y - wrist.y);

    const indexExtended = indexSpan > mcpSpan * 1.3;
    const middleFolded = middleSpan < indexSpan * 0.88;
    const isPointing = indexExtended && middleFolded;

    // Reaching toward screen: hand appears large in frame and extended forward
    const isReaching = indexSpan > 0.22 || (wrist.z !== undefined && wrist.z < -0.10);

    // Proximity to mouth / face with adaptive facial scale
    let handNearMouth = false;
    let handNearFace = false;

    if (faceResult?.faceLandmarks?.[0]) {
      const faceLandmarks = faceResult.faceLandmarks[0];
      const mouth = faceLandmarks[13] || faceLandmarks[0];
      const nose = faceLandmarks[1];
      const chin = faceLandmarks[152];
      const forehead = faceLandmarks[10];
      const faceScale = chin && forehead ? Math.abs(chin.y - forehead.y) : 0.25;

      const distToMouth = Math.hypot(indexTip.x - mouth.x, indexTip.y - mouth.y);
      const distToNose = Math.hypot(wrist.x - nose.x, wrist.y - nose.y);

      const mouthThreshold = Math.max(0.14, faceScale * 0.48);
      const faceThreshold = Math.max(0.24, faceScale * 0.85);

      handNearMouth = distToMouth < mouthThreshold;
      handNearFace = distToNose < faceThreshold;
    }

    // Clapping: if 2 hands present and wrists are close together
    let clappingDetected = false;
    if (handsPresentCount >= 2 && handResult.landmarks[1]) {
      const secondWrist = handResult.landmarks[1][0];
      const distBetweenWrists = Math.hypot(wrist.x - secondWrist.x, wrist.y - secondWrist.y);
      clappingDetected = distBetweenWrists < 0.16;
    }

    // Waving: side-to-side wrist oscillation
    const wavingDetected = isFlapping && !clappingDetected;

    return {
      handsPresentCount,
      isPointing,
      isReaching,
      handNearMouth,
      handNearFace,
      flappingDetected: isFlapping,
      flappingFrequency: frequencyHz,
      flappingAmplitude: amplitude,
      clappingDetected,
      wavingDetected,
      handOpennessLeft: 0.8,
      handOpennessRight: 0.8,
    };
  }

  private extractBodySignals(poseResult: any, face: FaceSignals): BodySignals {
    let armsRaised = false;
    let motionLevel = 0.2;

    if (poseResult?.landmarks?.[0]) {
      const pose = poseResult.landmarks[0];
      const leftWrist = pose[15];
      const rightWrist = pose[16];
      const leftShoulder = pose[11];
      const rightShoulder = pose[12];

      if (leftWrist && leftShoulder && leftWrist.y < leftShoulder.y) {
        armsRaised = true;
      }
      if (rightWrist && rightShoulder && rightWrist.y < rightShoulder.y) {
        armsRaised = true;
      }
    }

    // Motion level smoothed
    const rawMotion = face.leanForward ? 0.8 : face.headTurnAway ? 0.6 : 0.25;
    motionLevel = this.motionFilter.filter(rawMotion);

    let upperBodyEnergy: 'still' | 'calm' | 'very_active' = 'calm';
    if (motionLevel < 0.2) upperBodyEnergy = 'still';
    else if (motionLevel > 0.6) upperBodyEnergy = 'very_active';

    return {
      armsRaised,
      leaningForward: face.leanForward,
      leaningBackward: face.leanBackward,
      upperBodyEnergy,
      motionLevel,
    };
  }

  private computeTrackingQuality(faceFound: boolean, handsCount: number, faceSize: number): TrackingQuality {
    let score = 0;
    let guidanceMessage = 'Looking for child...';
    let distance: 'too_far' | 'too_close' | 'optimal' = 'optimal';

    if (!faceFound) {
      if (handsCount > 0) {
        return {
          score: 0.65,
          status: 'ok',
          faceFound: false,
          handsFound: handsCount,
          brightness: 70,
          faceDistance: 'optimal',
          guidanceMessage: 'Hand gesture detected. Bring face closer to view expressions.',
        };
      }
      return {
        score: 0.2,
        status: 'poor',
        faceFound: false,
        handsFound: 0,
        brightness: 65,
        faceDistance: 'too_far',
        guidanceMessage: "I can't see the face right now. Position camera towards child.",
      };
    }

    score += 0.55; // Face found

    if (faceSize < 0.02) {
      distance = 'too_far';
      guidanceMessage = 'Move a little closer for better cue detection.';
    } else if (faceSize > 0.45) {
      distance = 'too_close';
      guidanceMessage = 'Step back slightly so upper body and hands are visible.';
    } else {
      distance = 'optimal';
      score += 0.25;
      guidanceMessage = 'Tracking quality is great! Watching for cues.';
    }

    if (handsCount > 0) {
      score += 0.2;
    }

    const finalScore = Math.min(1.0, score);
    const status: 'good' | 'ok' | 'poor' = finalScore >= 0.75 ? 'good' : finalScore >= 0.45 ? 'ok' : 'poor';

    return {
      score: finalScore,
      status,
      faceFound,
      handsFound: handsCount,
      brightness: 75,
      faceDistance: distance,
      guidanceMessage,
    };
  }

  reset() {
    this.smileFilter.reset();
    this.jawFilter.reset();
    this.gazeYawFilter.reset();
    this.gazePitchFilter.reset();
    this.headYawFilter.reset();
    this.headPitchFilter.reset();
    this.motionFilter.reset();
    this.flappingTracker.reset();
    this.lastFaceSize = null;
    this.lastHeadPitch = 0;
    this.nodCounter = 0;
  }
}
