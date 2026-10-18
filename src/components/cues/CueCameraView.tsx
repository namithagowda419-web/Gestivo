import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Camera,
  Sparkles,
  MessageSquare,
  PlusCircle,
  Activity,
  SlidersHorizontal,
  Bug,
  AlertTriangle,
  RefreshCw,
  Edit3,
  Trash2,
  RotateCcw,
  Plus,
} from 'lucide-react';

import { useCamera } from '../../lib/cues/useCamera';
import { useCueDetection } from '../../lib/cues/useCueDetection';
import { useSuggestions } from '../../lib/cues/useSuggestions';
import { CueClassifier } from '../../lib/cues/classifier';
import { FrameSignals, SuggestionCandidate, TrackingQuality, CueMapping } from '../../lib/cues/types';

import { useCueStore } from '../../store/useCueStore';
import { useGestivoStore } from '../../store/useGestivoStore';
import { playChime, speakText } from '../../utils/speech';

import { CameraFeedPanel } from './CameraFeedPanel';
import { SuggestionCard } from './SuggestionCard';
import { NotSureCard } from './NotSureCard';
import { RecentCuesTimeline } from './RecentCuesTimeline';
import {
  ConsentScreen,
  RequestingPermissionCard,
  PermissionDeniedCard,
  InsecureContextCard,
  ModelLoadingCard,
  CameraBusyCard,
  CameraNotFoundCard,
  CameraUnpluggedCard,
  CameraErrorCard,
} from './CameraStateCards';
import { TeachCueWizard } from './TeachCueWizard';
import { BaselineCalibrationModal } from './BaselineCalibrationModal';
import { CueCorrectionPickerModal } from './CueCorrectionPickerModal';
import { CueMappingEditorModal } from './CueMappingEditorModal';
import { CueCameraInsightsCard } from './CueCameraInsightsCard';
import { CueCameraErrorBoundary } from './CueCameraErrorBoundary';
import { CueCameraDebugPanel } from './CueCameraDebugPanel';

function getCueTriggerBadge(cue: CueMapping) {
  if (cue.trainedSamplesCount && cue.trainedSamplesCount > 0) {
    return { icon: '📹', label: `10s Camera (${cue.trainedSamplesCount} sample${cue.trainedSamplesCount > 1 ? 's' : ''})` };
  }
  if (cue.rules?.requireHandNearMouth) return { icon: '🥤', label: 'Hand near mouth' };
  if (cue.rules?.requireReaching) return { icon: '👉', label: 'Reaching / Pointing' };
  if (cue.rules?.requireWaving) return { icon: '👋', label: 'Hand waving' };
  if (cue.rules?.requireFlapping) return { icon: '🦋', label: 'Hand flapping' };
  if (cue.rules?.requireTurnAway) return { icon: '✋', label: 'Turn away' };
  if (cue.rules?.requireGaze) return { icon: '👀', label: 'Side gaze' };
  if (cue.rules?.requireLeanIn) return { icon: '🤝', label: 'Leaning in' };
  if (cue.rules?.requireStillness) return { icon: '😴', label: 'Stillness' };
  if (cue.rules?.minSmile !== undefined) return { icon: '😊', label: `Smile (${Math.round(cue.rules.minSmile * 100)}%)` };
  return { icon: '⚡', label: 'Movement' };
}

interface CueCameraViewProps {
  onNavigateToBoard: () => void;
}

export const CueCameraView: React.FC<CueCameraViewProps> = ({ onNavigateToBoard }) => {
  const {
    settings,
    updateSettings,
    giveConsent,
    mappings,
    toggleCueActive,
    deleteCue,
    resetToStarterCues,
    trainedSamples,
    baseline,
    decisionLogs,
    logDecision,
  } = useCueStore();

  const { voiceOutput, addActivity } = useGestivoStore();

  // Debug HUD toggle (via URL ?debug=1 or header button)
  const [isDebugOpen, setIsDebugOpen] = useState(() => {
    return typeof window !== 'undefined' && window.location.search.includes('debug=1');
  });

  // Dedicated canvas ref passed directly to useCueDetection and CameraFeedPanel
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Dedicated secondary canvas ref for modal live gesture detector camera
  const modalCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Throttled UI state (updated max 3-4 times/sec to prevent re-render storms)
  const [latestSignals, setLatestSignals] = useState<FrameSignals | null>(null);
  const latestSignalsRef = useRef<FrameSignals | null>(null);
  const lastStatePushTimeRef = useRef<number>(0);

  const [trackingQuality, setTrackingQuality] = useState<TrackingQuality>({
    score: 0.2,
    status: 'poor',
    faceFound: false,
    handsFound: 0,
    brightness: 65,
    faceDistance: 'too_far',
    guidanceMessage: 'Looking for child...',
  });
  const trackingQualityRef = useRef(trackingQuality);
  useEffect(() => {
    trackingQualityRef.current = trackingQuality;
  }, [trackingQuality]);

  // Modal states
  const [isTeachWizardOpen, setIsTeachWizardOpen] = useState(false);
  const [isBaselineModalOpen, setIsBaselineModalOpen] = useState(false);
  const [correctionTarget, setCorrectionTarget] = useState<SuggestionCandidate | null>(null);
  const [isHighAccuracy, setIsHighAccuracy] = useState(false);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [editingCue, setEditingCue] = useState<CueMapping | null>(null);
  const [cueFilterCategory, setCueFilterCategory] = useState<string>('all');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Filtered cue list for active mapping panel
  const filteredMappings = useMemo(() => {
    if (cueFilterCategory === 'all') return mappings;
    if (cueFilterCategory === 'active') return mappings.filter((m) => m.active);
    return mappings.filter(
      (m) => m.category.toLowerCase() === cueFilterCategory.toLowerCase()
    );
  }, [mappings, cueFilterCategory]);

  // 1. Camera Hook
  const {
    videoRef,
    stream,
    status: cameraStatus,
    errorMessage: cameraError,
    isVirtualCamera,
    startCamera,
    startVirtualCamera,
    triggerVirtualGesture,
    stopCamera,
    switchFacingMode,
  } = useCamera();

  // 2. Classifier Engine Instance
  const classifier = useMemo(() => {
    return new CueClassifier(mappings, trainedSamples, baseline);
  }, [mappings, trainedSamples, baseline]);

  // 3. Suggestions Hook
  const { currentResult, processFrame, notifyDecisionMade } = useSuggestions(
    classifier,
    mappings,
    {
      holdTimeMs: settings.holdTimeMs,
      cooldownMs: settings.cooldownMs,
      sensitivity: settings.sensitivity,
      pauseSuggestions: settings.pauseSuggestions,
    }
  );

  // 4. Cue Detection Hook: Process frame signals and throttle React UI state
  const handleFrameSignals = useCallback((signals: FrameSignals) => {
    latestSignalsRef.current = signals;
    processFrame(signals);

    // Throttle React state updates to ~3-4 Hz or when face detection state changes
    const now = performance.now();
    const faceFoundChanged = signals.quality.faceFound !== trackingQualityRef.current.faceFound;
    if (now - lastStatePushTimeRef.current > 300 || faceFoundChanged) {
      lastStatePushTimeRef.current = now;
      setLatestSignals(signals);
      setTrackingQuality(signals.quality);
    }
  }, [processFrame]);

  const {
    initModels,
    isModelLoading,
    modelProgress,
    modelStatusText,
    modelError,
    delegate,
    isPerformanceMode,
    setIsPerformanceMode,
    watchdogWarning,
    debugInfo,
  } = useCueDetection(videoRef, cameraStatus === 'active', handleFrameSignals, {
    canvasRef,
    secondaryCanvasRef: modalCanvasRef,
    showOverlay: settings.showOverlay,
    isMirrored: settings.isMirrored,
    stage: isHighAccuracy ? 'stage4_high_accuracy' : 'stage3_face_and_hands',
    highAccuracy: isHighAccuracy,
  });

  // StrictMode-resilient auto-start
  const hasStartedRef = useRef(false);
  useEffect(() => {
    if (settings.consentGiven && settings.featureEnabled && !hasStartedRef.current) {
      hasStartedRef.current = true;
      initModels();
      startCamera();
    }
    return () => {
      // Keep cleanup idempotent
    };
  }, [settings.consentGiven, settings.featureEnabled, initModels, startCamera]);

  // Confirm Suggestion handler
  const handleConfirm = (candidate: SuggestionCandidate) => {
    playChime('success');
    // Speak aloud using existing TTS
    speakText(candidate.cue.phrase, voiceOutput);

    // Log to GESTIVO Activity History as 'Cue Camera'
    addActivity(`Cue Camera confirmed: "${candidate.cue.phrase}"`, 'Cue Camera', candidate.cue.icon || '📷', {
      suggestedPhrase: candidate.cue.phrase,
      finalPhrase: candidate.cue.phrase,
      confidenceBucket: candidate.confidenceBucket,
      signalsSummary: candidate.matchedSignals.join(' • '),
      decision: 'confirmed',
    });

    // Log to Cue Decision History
    logDecision({
      suggestedPhrase: candidate.cue.phrase,
      finalPhrase: candidate.cue.phrase,
      decision: 'confirmed',
      confidence: candidate.confidence,
      confidenceBucket: candidate.confidenceBucket,
      signals: candidate.matchedSignals,
      cueId: candidate.cue.id,
    });

    notifyDecisionMade();
  };

  // Correct Suggestion handler
  const handleCorrect = (candidate: SuggestionCandidate) => {
    setCorrectionTarget(candidate);
  };

  const handleApplyCorrection = (correctedPhrase: string, icon: string = '💬') => {
    if (!correctionTarget) return;

    playChime('success');
    speakText(correctedPhrase, voiceOutput);

    addActivity(`Cue Camera corrected: "${correctedPhrase}"`, 'Cue Camera', icon, {
      suggestedPhrase: correctionTarget.cue.phrase,
      finalPhrase: correctedPhrase,
      confidenceBucket: correctionTarget.confidenceBucket,
      signalsSummary: correctionTarget.matchedSignals.join(' • '),
      decision: 'changed',
    });

    // Feed back vector into classifier learning
    if (latestSignals) {
      classifier.addCorrectionFeedback(latestSignals.featureVector, correctedPhrase);
    }

    logDecision({
      suggestedPhrase: correctionTarget.cue.phrase,
      finalPhrase: correctedPhrase,
      decision: 'changed',
      confidence: correctionTarget.confidence,
      confidenceBucket: correctionTarget.confidenceBucket,
      signals: correctionTarget.matchedSignals,
      cueId: correctionTarget.cue.id,
      correctedToPhrase: correctedPhrase,
    });

    setCorrectionTarget(null);
    notifyDecisionMade();
  };

  // Dismiss Suggestion handler
  const handleDismiss = (candidate: SuggestionCandidate) => {
    playChime('bubble');

    addActivity(`Cue Camera dismissed: "${candidate.cue.phrase}"`, 'Cue Camera', '✖️', {
      suggestedPhrase: candidate.cue.phrase,
      finalPhrase: '(Dismissed)',
      confidenceBucket: candidate.confidenceBucket,
      signalsSummary: candidate.matchedSignals.join(' • '),
      decision: 'dismissed',
    });

    logDecision({
      suggestedPhrase: candidate.cue.phrase,
      finalPhrase: '(Dismissed)',
      decision: 'dismissed',
      confidence: candidate.confidence,
      confidenceBucket: candidate.confidenceBucket,
      signals: candidate.matchedSignals,
      cueId: candidate.cue.id,
    });

    notifyDecisionMade();
  };

  // Feature flag check
  if (!settings.featureEnabled) {
    return (
      <div className="w-full card-light p-8 rounded-[32px] text-center max-w-lg mx-auto shadow-2xl my-8">
        <h3 className="text-2xl font-black font-heading text-indigo-950 mb-2">
          Cue Camera is Disabled
        </h3>
        <p className="text-sm text-slate-600 mb-6 font-semibold">
          Enable Cue Camera in Settings to use real-time cue observation.
        </p>
        <button
          onClick={onNavigateToBoard}
          className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-heading font-extrabold text-sm"
        >
          Return to Touch Board
        </button>
      </div>
    );
  }

  // Consent Screen
  if (!settings.consentGiven) {
    return (
      <CueCameraErrorBoundary onSwitchToBoard={onNavigateToBoard}>
        <ConsentScreen onAccept={giveConsent} onSwitchToBoard={onNavigateToBoard} />
      </CueCameraErrorBoundary>
    );
  }

  return (
    <CueCameraErrorBoundary onSwitchToBoard={onNavigateToBoard}>
      <div className="w-full space-y-6">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl glass-panel-glow border border-white/20">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-600 text-white flex items-center justify-center shadow-lg">
                <Camera size={22} />
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-heading text-white tracking-wide">
                Cue Camera
              </h2>
              <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-cyan-400/20 text-cyan-200 border border-cyan-400/30">
                Live Suggestion Hub
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-purple-200/90 mt-1">
              Suggestions based on movement and expressions. A caregiver always confirms before speech.
            </p>
          </div>

          {/* Quick Actions in Header */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Teach a Cue button */}
            <button
              onClick={() => {
                playChime('pop');
                setIsTeachWizardOpen(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-heading font-black text-xs shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <PlusCircle size={16} />
              <span>Teach a Cue</span>
            </button>

            {/* Baseline Calibration button */}
            <button
              onClick={() => {
                playChime('pop');
                setIsBaselineModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-heading font-extrabold text-xs border border-white/20 cursor-pointer flex items-center gap-1.5"
            >
              <Activity size={16} />
              <span>Calibrate Baseline</span>
            </button>

            {/* Switch to Touch Board button */}
            <button
              onClick={onNavigateToBoard}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-heading font-extrabold text-xs border border-white/20 cursor-pointer flex items-center gap-1.5"
            >
              <MessageSquare size={16} />
              <span>Touch Board</span>
            </button>

            {/* High Accuracy Mode toggle (Stage 4) */}
            <button
              onClick={() => {
                playChime('pop');
                setIsHighAccuracy((prev) => !prev);
              }}
              className={`px-3 py-2.5 rounded-2xl border text-xs font-heading font-black cursor-pointer flex items-center gap-1.5 transition-colors ${
                isHighAccuracy
                  ? 'bg-purple-500/25 text-purple-200 border-purple-400/50 shadow-md shadow-purple-500/20'
                  : 'bg-white/10 hover:bg-white/20 text-slate-300 border-white/20'
              }`}
              title="Toggle High Accuracy Mode (PoseLandmarker Lite every 3rd frame)"
            >
              <Sparkles size={15} className={isHighAccuracy ? 'text-amber-300' : 'text-slate-400'} />
              <span>{isHighAccuracy ? 'High Accuracy' : 'Standard'}</span>
            </button>

            {/* Debug HUD Toggle button */}
            <button
              onClick={() => {
                playChime('pop');
                setIsDebugOpen((prev) => !prev);
              }}
              className={`px-3 py-2.5 rounded-2xl border text-xs font-heading font-black cursor-pointer flex items-center gap-1.5 transition-colors ${
                isDebugOpen
                  ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50'
                  : 'bg-white/10 hover:bg-white/20 text-slate-300 border-white/20'
              }`}
              title="Toggle Diagnostic Debug Panel (?debug=1)"
            >
              <Bug size={15} />
              <span>Debug HUD</span>
            </button>
          </div>
        </div>

        {/* Diagnostic Dev-Only Debug HUD */}
        {isDebugOpen && (
          <CueCameraDebugPanel
            debugInfo={debugInfo}
            trackingQuality={trackingQuality}
            onTogglePerformanceMode={() => setIsPerformanceMode(!isPerformanceMode)}
            isOpenDefault={true}
          />
        )}

        {/* Watchdog Alert Banner if performance throttled or lag detected */}
        {watchdogWarning && (
          <div className="w-full p-3.5 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-200 flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-300 shrink-0" />
              <span>{watchdogWarning} Live camera preview remains fully functional.</span>
            </div>
            <button
              onClick={() => setIsPerformanceMode(false)}
              className="px-2.5 py-1 rounded-xl bg-amber-400/30 text-amber-100 hover:bg-amber-400/40 text-[11px] font-bold cursor-pointer"
            >
              Reset to Standard Mode
            </button>
          </div>
        )}

        {/* State Banners if model loading, permission requesting, or error */}
        {isModelLoading && (
          <ModelLoadingCard progress={modelProgress} statusText={modelStatusText} />
        )}

        {modelError && (
          <div className="w-full max-w-lg mx-auto card-light p-6 rounded-[32px] border-2 border-rose-300 shadow-2xl text-slate-900 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={24} />
            </div>
            <h4 className="text-lg font-black font-heading text-rose-950 mb-1">
              Computer Vision Model Error
            </h4>
            <p className="text-xs text-slate-600 mb-4 font-semibold">
              {modelError}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => initModels()}
                className="px-4 py-2 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-heading font-black text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>Retry Download</span>
              </button>
              <button
                onClick={onNavigateToBoard}
                className="px-4 py-2 rounded-2xl bg-slate-100 text-slate-700 font-heading font-bold text-xs border border-slate-300 cursor-pointer"
              >
                Touch Board
              </button>
            </div>
          </div>
        )}

        {cameraStatus === 'requesting' && <RequestingPermissionCard />}

        {cameraStatus === 'denied' && (
          <PermissionDeniedCard
            onRetry={() => startCamera()}
            onSwitchToBoard={onNavigateToBoard}
            onStartVirtual={() => startVirtualCamera()}
          />
        )}

        {cameraStatus === 'in_use' && (
          <CameraBusyCard
            onRetry={() => startCamera()}
            onSwitchToBoard={onNavigateToBoard}
          />
        )}

        {cameraStatus === 'not_found' && (
          <CameraNotFoundCard
            onRetry={() => startCamera()}
            onSwitchToBoard={onNavigateToBoard}
            onStartVirtual={() => startVirtualCamera()}
          />
        )}

        {cameraStatus === 'unplugged' && (
          <CameraUnpluggedCard
            onRetry={() => startCamera()}
            onSwitchToBoard={onNavigateToBoard}
          />
        )}

        {cameraStatus === 'insecure' && (
          <InsecureContextCard
            onSwitchToBoard={onNavigateToBoard}
            onStartVirtual={() => startVirtualCamera()}
          />
        )}

        {cameraStatus === 'error' && (
          <CameraErrorCard
            errorMessage={cameraError}
            onRetry={() => startCamera()}
            onSwitchToBoard={onNavigateToBoard}
            onStartVirtual={() => startVirtualCamera()}
          />
        )}

        {/* Main Observation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          {/* Left Column: Camera Feed Panel (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-4">
            <CameraFeedPanel
              videoRef={videoRef}
              canvasRef={canvasRef}
              isCameraActive={cameraStatus === 'active'}
              trackingQuality={trackingQuality}
              isMirrored={settings.isMirrored}
              showOverlay={settings.showOverlay}
              onToggleOverlay={() =>
                updateSettings({ showOverlay: !settings.showOverlay })
              }
              onToggleMirror={() =>
                updateSettings({ isMirrored: !settings.isMirrored })
              }
              onSwitchCamera={switchFacingMode}
              onStopCamera={stopCamera}
              onStartCamera={startCamera}
              activityLevel={latestSignals?.body?.upperBodyEnergy || 'calm'}
              isVirtualCamera={isVirtualCamera}
              onStartVirtualCamera={startVirtualCamera}
              onTriggerVirtualGesture={triggerVirtualGesture}
            />

            {/* Detection Controls Panel */}
            <div className="glass-panel p-4 rounded-3xl border border-white/15 text-xs text-slate-200 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10 font-heading font-black">
                <span className="flex items-center gap-1.5 text-white">
                  <SlidersHorizontal size={16} className="text-cyan-300" />
                  Observation Sensitivity & Hold Settings
                </span>
                <span className="text-[11px] text-purple-200">Delegate: {delegate}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Hold Time Slider */}
                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span>Hold Time:</span>
                    <span className="text-amber-300">{(settings.holdTimeMs / 1000).toFixed(1)}s</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="2500"
                    step="100"
                    value={settings.holdTimeMs}
                    onChange={(e) =>
                      updateSettings({ holdTimeMs: Number(e.target.value) })
                    }
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>

                {/* Cooldown Slider */}
                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span>Cooldown:</span>
                    <span className="text-sky-300">{(settings.cooldownMs / 1000).toFixed(1)}s</span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="6000"
                    step="500"
                    value={settings.cooldownMs}
                    onChange={(e) =>
                      updateSettings({ cooldownMs: Number(e.target.value) })
                    }
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                </div>

                {/* Sensitivity Slider */}
                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span>Sensitivity:</span>
                    <span className="text-purple-300">{settings.sensitivity.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.1"
                    value={settings.sensitivity}
                    onChange={(e) =>
                      updateSettings({ sensitivity: Number(e.target.value) })
                    }
                    className="w-full accent-purple-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Pause Toggle */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <span className="font-bold">Pause Live Suggestions:</span>
                <button
                  onClick={() =>
                    updateSettings({ pauseSuggestions: !settings.pauseSuggestions })
                  }
                  className={`px-3 py-1 rounded-xl text-xs font-black font-heading transition-colors cursor-pointer ${
                    settings.pauseSuggestions
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-white/10 text-slate-200 hover:bg-white/20'
                  }`}
                >
                  {settings.pauseSuggestions ? 'Suggestions Paused' : 'Active'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Suggestion / Not Sure / Cues List (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Live Suggestion Card or Not Sure State */}
            <AnimatePresence mode="wait">
              {currentResult.status === 'suggestion' || currentResult.status === 'dual_choice' ? (
                currentResult.primaryCandidate && (
                  <SuggestionCard
                    key="suggestion-card"
                    primaryCandidate={currentResult.primaryCandidate}
                    secondaryCandidate={currentResult.secondaryCandidate}
                    holdProgress={currentResult.holdProgress}
                    onConfirm={handleConfirm}
                    onCorrect={handleCorrect}
                    onDismiss={handleDismiss}
                  />
                )
              ) : (
                <NotSureCard
                  key="not-sure-card"
                  reason={currentResult.notSureReason}
                  detectedSignals={currentResult.detectedSignalsSummary}
                />
              )}
            </AnimatePresence>

            {/* Active Cue Mappings Panel (Editable & Configurable) */}
            <div className="card-light p-4 sm:p-5 rounded-[28px] shadow-xl border border-slate-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-200">
                <div>
                  <h4 className="text-base font-black font-heading text-indigo-950 flex items-center gap-2">
                    <span>Cue Gesture Mappings</span>
                    <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {mappings.filter((m) => m.active).length} / {mappings.length} Active
                    </span>
                  </h4>
                  <p className="text-[11px] font-bold text-slate-500">
                    Map physical cues to spoken phrases • Click <strong>Edit</strong> on any cue
                  </p>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    onClick={() => {
                      setEditingCue(null);
                      setIsEditorModalOpen(true);
                      playChime('pop');
                    }}
                    className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-heading font-extrabold text-xs shadow-md shadow-indigo-500/20 cursor-pointer flex items-center gap-1 transition-all"
                  >
                    <Plus size={14} />
                    <span>+ Add Mapping</span>
                  </button>

                  <button
                    onClick={() => setIsTeachWizardOpen(true)}
                    className="py-1.5 px-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-heading font-bold text-xs border border-purple-200 cursor-pointer flex items-center gap-1 transition-colors"
                    title="Record and train custom video samples"
                  >
                    <Sparkles size={13} />
                    <span>Train</span>
                  </button>

                  <button
                    onClick={() => setShowResetConfirm(!showResetConfirm)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                    title="Reset to default starter cues"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              </div>

              {/* Reset to starter cues confirmation alert */}
              {showResetConfirm && (
                <div className="my-2.5 p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs flex items-center justify-between gap-2">
                  <span className="font-bold text-amber-900">
                    Reset all mappings back to the original 8 starter gestures?
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        resetToStarterCues();
                        setShowResetConfirm(false);
                        playChime('pop');
                      }}
                      className="py-1 px-2.5 rounded-lg bg-amber-600 text-white font-heading font-bold text-[11px] cursor-pointer"
                    >
                      Reset All
                    </button>
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="py-1 px-2 rounded-lg bg-slate-200 text-slate-700 font-bold text-[11px] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 my-2.5 overflow-x-auto pb-1 scrollbar-thin">
                {['all', 'active', 'needs', 'requests', 'social', 'feelings', 'rejection'].map((cat) => {
                  const isSelected = cueFilterCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setCueFilterCategory(cat)}
                      className={`py-1 px-2.5 rounded-xl font-heading font-bold text-[11px] whitespace-nowrap transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  );
                })}
              </div>

              {/* Cue List */}
              <div className="divide-y divide-slate-100 max-h-[320px] overflow-y-auto mt-1 scrollbar-thin">
                {filteredMappings.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 font-bold italic">
                    No cue mappings in this category. Click "+ Add Mapping" to create one!
                  </div>
                ) : (
                  filteredMappings.map((cue) => {
                    const triggerInfo = getCueTriggerBadge(cue);
                    return (
                      <div
                        key={cue.id}
                        className="py-2.5 px-1.5 flex items-center justify-between gap-2.5 text-xs hover:bg-slate-50/80 rounded-2xl transition-colors"
                      >
                        {/* Cue Details */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-100 to-indigo-100 text-indigo-900 flex items-center justify-center text-xl shrink-0 border border-purple-200 shadow-sm">
                            {cue.icon}
                          </div>
                          <div className="min-w-0">
                            <span
                              className={`font-heading font-black block text-xs sm:text-sm truncate ${
                                cue.active ? 'text-slate-900' : 'text-slate-400 line-through'
                              }`}
                            >
                              "{cue.phrase}"
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              {/* Trigger Gesture Badge */}
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-800 border border-cyan-200">
                                <span>{triggerInfo.icon}</span>
                                <span>{triggerInfo.label}</span>
                              </span>

                              {/* Category Badge */}
                              <span className="text-[10px] font-bold text-slate-500">
                                {cue.category}
                              </span>

                              {/* Personalization Tag */}
                              {cue.isPersonalized && (
                                <span className="text-[9px] font-black uppercase text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                                  ⭐ Custom
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Controls */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Active Toggle */}
                          <button
                            onClick={() => toggleCueActive(cue.id)}
                            className={`text-[10px] font-black uppercase px-2 py-1 rounded-xl cursor-pointer transition-colors ${
                              cue.active
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                            }`}
                            title={cue.active ? 'Cue is active' : 'Cue is paused'}
                          >
                            {cue.active ? 'Active' : 'Off'}
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => {
                              setEditingCue(cue);
                              setIsEditorModalOpen(true);
                              playChime('pop');
                            }}
                            className="py-1 px-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-heading font-extrabold text-[11px] border border-indigo-200 cursor-pointer flex items-center gap-1 transition-colors"
                            title="Edit phrase, icon, or triggering gesture"
                          >
                            <Edit3 size={12} />
                            <span>Edit</span>
                          </button>

                          {/* Delete Button (Allowed for all cues or custom cues) */}
                          <button
                            onClick={() => {
                              deleteCue(cue.id);
                              playChime('pop');
                            }}
                            className="p-1 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                            title="Remove cue"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Baseline status note */}
            {baseline?.isCalibrated && (
              <div className="p-3 rounded-2xl bg-white/10 border border-white/15 text-xs text-purple-200 flex items-center justify-between">
                <span className="font-bold">Child Neutral Baseline: Active</span>
                <span className="text-[11px] text-cyan-300">
                  Smile: {Math.round(baseline.smileBaseline * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section: Recent Timeline & Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 pt-2">
          {/* Recent Cues Timeline */}
          <RecentCuesTimeline logs={decisionLogs} />

          {/* Caregiver Insights Card */}
          <CueCameraInsightsCard />
        </div>

        {/* Modals */}
        <TeachCueWizard
          isOpen={isTeachWizardOpen}
          onClose={() => setIsTeachWizardOpen(false)}
          latestSignals={latestSignals}
        />

        <BaselineCalibrationModal
          isOpen={isBaselineModalOpen}
          onClose={() => setIsBaselineModalOpen(false)}
          latestSignals={latestSignals}
        />

        <CueCorrectionPickerModal
          isOpen={Boolean(correctionTarget)}
          onClose={() => setCorrectionTarget(null)}
          originalPhrase={correctionTarget?.cue.phrase || ''}
          onSelectCorrection={handleApplyCorrection}
        />

        <CueMappingEditorModal
          isOpen={isEditorModalOpen}
          onClose={() => {
            setIsEditorModalOpen(false);
            setEditingCue(null);
          }}
          cueToEdit={editingCue}
          latestSignals={latestSignals}
          latestSignalsRef={latestSignalsRef}
          isCameraActive={cameraStatus === 'active'}
          onStartCamera={startCamera}
          trackingQuality={trackingQuality}
          stream={stream}
          modalCanvasRef={modalCanvasRef}
          isMirrored={settings.isMirrored}
          activeSuggestion={currentResult.primaryCandidate}
        />
      </div>
    </CueCameraErrorBoundary>
  );
};
