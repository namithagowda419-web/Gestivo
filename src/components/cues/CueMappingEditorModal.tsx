import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Check,
  Volume2,
  Trash2,
  RotateCcw,
  Smile,
  Video,
  VideoOff,
  Clock,
} from 'lucide-react';
import { CueMapping, FrameSignals, TrackingQuality, SuggestionCandidate } from '../../lib/cues/types';
import { useCueStore } from '../../store/useCueStore';
import { useGestivoStore } from '../../store/useGestivoStore';
import { playChime, speakText } from '../../utils/speech';
import { PinkCatMascot } from '../mascots/Mascots';

export type GestureTriggerType =
  | 'customCameraRecording'
  | 'handNearMouth'
  | 'requireReaching'
  | 'requireWaving'
  | 'minSmile'
  | 'requireFlapping'
  | 'requireTurnAway'
  | 'requireGaze'
  | 'requireLeanIn'
  | 'requireStillness';

interface TriggerOption {
  type: GestureTriggerType;
  title: string;
  icon: string;
  description: string;
  signalsLabel: string;
}

const TRIGGER_OPTIONS: TriggerOption[] = [
  {
    type: 'customCameraRecording',
    title: '10s Camera Gesture Recording',
    icon: '📹',
    description: "Record your child's unique motion with the webcam for 10 seconds to train custom AI recognition with live vision preview.",
    signalsLabel: "Child's personalized 10s camera gesture",
  },
  {
    type: 'handNearMouth',
    title: 'Hand Near Mouth',
    icon: '🥤',
    description: 'Child brings hand or fingers close to lips or chin (drinking, eating, pacifier cue)',
    signalsLabel: 'Hand near mouth',
  },
  {
    type: 'requireReaching',
    title: 'Reaching / Pointing',
    icon: '👉',
    description: 'Arm reaching forward or index finger pointing outward (requesting, wanting an object)',
    signalsLabel: 'Hand reaching / pointing',
  },
  {
    type: 'requireWaving',
    title: 'Hand Waving',
    icon: '👋',
    description: 'Side-to-side hand movement in front of camera (greeting, calling for attention, play)',
    signalsLabel: 'Hand waving',
  },
  {
    type: 'minSmile',
    title: 'Warm Smile',
    icon: '😊',
    description: 'Upward mouth corners and smiling expression (happiness, joy, feeling content)',
    signalsLabel: 'Warm smile',
  },
  {
    type: 'requireFlapping',
    title: 'Hand Flapping',
    icon: '🦋',
    description: 'Rhythmic wrist or hand flapping movement (high energy, intense happiness/excitement)',
    signalsLabel: 'Hand flapping',
  },
  {
    type: 'requireTurnAway',
    title: 'Head Turn Away',
    icon: '✋',
    description: 'Head rotated away from camera or leaning backwards (rejection, "No", overwhelmed, break)',
    signalsLabel: 'Head turned away',
  },
  {
    type: 'requireGaze',
    title: 'Side Gaze',
    icon: '👀',
    description: 'Sustained eye look toward the left or right (noticing an interesting toy or person)',
    signalsLabel: 'Sustained side gaze',
  },
  {
    type: 'requireLeanIn',
    title: 'Leaning Forward',
    icon: '🤝',
    description: 'Upper body or head moves closer into camera frame (eagerness to connect, engagement)',
    signalsLabel: 'Leaning toward camera',
  },
  {
    type: 'requireStillness',
    title: 'Low Movement / Stillness',
    icon: '😴',
    description: 'Calm or low movement body state (tiredness, winding down, quiet observation)',
    signalsLabel: 'Low movement',
  },
];

const QUICK_PHRASES = [
  { text: 'I want water', icon: '🥤', cat: 'Needs' },
  { text: 'More please', icon: '➕', cat: 'Requests' },
  { text: 'I want that', icon: '👉', cat: 'Requests' },
  { text: 'Hello / Play with me', icon: '👋', cat: 'Social' },
  { text: 'Excited / happy', icon: '😊', cat: 'Feelings' },
  { text: "No / I don't want that", icon: '✋', cat: 'Rejection' },
  { text: 'Look at that!', icon: '👀', cat: 'Attention' },
  { text: 'I am hungry', icon: '🍔', cat: 'Needs' },
  { text: 'Need a break', icon: '🛌', cat: 'Needs' },
  { text: 'Need bathroom', icon: '🚻', cat: 'Needs' },
  { text: 'All done', icon: '✨', cat: 'Requests' },
  { text: 'I love you', icon: '❤️', cat: 'Feelings' },
  { text: 'Maybe tired', icon: '😴', cat: 'State' },
];

const POPULAR_EMOJIS = [
  '🥤', '👉', '👋', '😊', '✋', '👀', '🤝', '😴', '🦋', '🍔', '🍼', '🍎',
  '🚻', '🛌', '✨', '❤️', '🧸', '🎵', '🚗', '🐶', '➕', '🙋', '✅', '💡',
];

const CATEGORIES = [
  'Needs',
  'Requests',
  'Feelings',
  'Social',
  'Attention',
  'Rejection',
  'State',
  'Play',
  'Personal',
];

function detectTriggerType(cue: CueMapping | null): GestureTriggerType {
  if (!cue) return 'customCameraRecording';
  if (cue.trainedSamplesCount && cue.trainedSamplesCount > 0) return 'customCameraRecording';
  if (!cue.rules) return 'requireReaching';
  const r = cue.rules;
  if (r.requireHandNearMouth) return 'handNearMouth';
  if (r.requireWaving) return 'requireWaving';
  if (r.requireFlapping) return 'requireFlapping';
  if (r.requireTurnAway) return 'requireTurnAway';
  if (r.requireGaze) return 'requireGaze';
  if (r.requireLeanIn) return 'requireLeanIn';
  if (r.requireStillness) return 'requireStillness';
  if (r.requireReaching) return 'requireReaching';
  if (r.minSmile !== undefined) return 'minSmile';
  return 'customCameraRecording';
}

interface CueMappingEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  cueToEdit: CueMapping | null;
  latestSignals?: FrameSignals | null;
  latestSignalsRef?: React.RefObject<FrameSignals | null>;
  isCameraActive?: boolean;
  onStartCamera?: () => void;
  trackingQuality?: TrackingQuality;
  stream?: MediaStream | null;
  modalCanvasRef?: React.RefObject<HTMLCanvasElement | null>;
  isMirrored?: boolean;
  activeSuggestion?: SuggestionCandidate | null;
}

const RECORDING_DURATION_MS = 10000;

const CueMappingEditorForm: React.FC<{
  cueToEdit: CueMapping | null;
  onClose: () => void;
  latestSignals?: FrameSignals | null;
  latestSignalsRef?: React.RefObject<FrameSignals | null>;
  isCameraActive?: boolean;
  onStartCamera?: () => void;
  trackingQuality?: TrackingQuality;
  stream?: MediaStream | null;
  modalCanvasRef?: React.RefObject<HTMLCanvasElement | null>;
  isMirrored?: boolean;
  activeSuggestion?: SuggestionCandidate | null;
}> = ({
  cueToEdit,
  onClose,
  latestSignals,
  latestSignalsRef,
  isCameraActive = false,
  onStartCamera,
  trackingQuality,
  stream,
  modalCanvasRef,
  isMirrored = true,
  activeSuggestion,
}) => {
  const { editCue, addCustomCue, addRuleCue, deleteCue, resetSingleCue } = useCueStore();
  const { voiceOutput } = useGestivoStore();

  const isEditing = Boolean(cueToEdit);
  const isStarter = Boolean(cueToEdit?.isStarter);

  const [phrase, setPhrase] = useState(() => cueToEdit?.phrase ?? '');
  const [icon, setIcon] = useState(() => cueToEdit?.icon ?? (cueToEdit ? '🌟' : '🥤'));
  const [category, setCategory] = useState(() => cueToEdit?.category ?? (cueToEdit ? 'Requests' : 'Needs'));
  const [active, setActive] = useState(() => cueToEdit?.active ?? true);
  const [triggerType, setTriggerType] = useState<GestureTriggerType>(() => detectTriggerType(cueToEdit));
  const [smileThreshold, setSmileThreshold] = useState(() => cueToEdit?.rules?.minSmile ?? 0.30);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 10-Second Camera Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingElapsed, setRecordingElapsed] = useState(0);
  const [recordingFramesCount, setRecordingFramesCount] = useState(0);
  const [recordedClips, setRecordedClips] = useState<number[][]>([]);
  const [recordingSuccessToast, setRecordingSuccessToast] = useState('');

  const currentClipVectorsRef = useRef<number[][]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const modalVideoRef = useRef<HTMLVideoElement | null>(null);

  // Bind live camera stream to modal video element
  useEffect(() => {
    if (modalVideoRef.current && stream) {
      if (modalVideoRef.current.srcObject !== stream) {
        modalVideoRef.current.srcObject = stream;
      }
      modalVideoRef.current.play().catch(() => {});
    }
  }, [stream, isCameraActive]);

  // Clean up interval timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  // Compute live detected gesture for the live detector HUD
  const detectedGestureLabel = useMemo(() => {
    if (activeSuggestion) {
      return {
        text: activeSuggestion.cue.phrase,
        icon: activeSuggestion.cue.icon || '✨',
        confidence: Math.round(activeSuggestion.confidence * 100),
        status: 'Active Gesture',
      };
    }
    const face = latestSignals?.face;
    const hands = latestSignals?.hands;
    if (face && face.smileIntensity > 0.3) {
      return {
        text: 'Warm Smile',
        icon: '😊',
        confidence: Math.round(face.smileIntensity * 100),
        status: 'Facial Expression',
      };
    }
    if (hands?.handNearMouth) {
      return {
        text: 'Hand Near Mouth',
        icon: '🥤',
        confidence: 92,
        status: 'Hand Gesture',
      };
    }
    if (hands?.wavingDetected) {
      return {
        text: 'Hand Waving',
        icon: '👋',
        confidence: 88,
        status: 'Hand Motion',
      };
    }
    if (hands?.flappingDetected) {
      return {
        text: 'Hand Flapping',
        icon: '🦋',
        confidence: 86,
        status: 'Rhythmic Motion',
      };
    }
    if (hands?.isPointing || hands?.isReaching) {
      return {
        text: 'Pointing / Reaching',
        icon: '👉',
        confidence: 84,
        status: 'Hand Gesture',
      };
    }
    if (face?.headTurnAway) {
      return {
        text: 'Head Turn Away',
        icon: '✋',
        confidence: 82,
        status: 'Head Pose',
      };
    }
    if (face?.lookDirection && face.lookDirection !== 'center') {
      return {
        text: `Looking ${face.lookDirection.toUpperCase()}`,
        icon: '👀',
        confidence: 80,
        status: 'Eye Gaze',
      };
    }
    if (trackingQuality?.faceFound) {
      return {
        text: 'Child Face Tracked',
        icon: '👤',
        confidence: 95,
        status: 'Tracking Live',
      };
    }
    return {
      text: 'Detecting Child Movement...',
      icon: '🔍',
      confidence: 0,
      status: 'Observing',
    };
  }, [activeSuggestion, latestSignals, trackingQuality]);

  const handleTestSpeech = () => {
    if (!phrase.trim()) return;
    playChime('pop');
    speakText(phrase.trim(), voiceOutput);
  };

  const handleSelectQuickPhrase = (qp: typeof QUICK_PHRASES[0]) => {
    playChime('pop');
    setPhrase(qp.text);
    setIcon(qp.icon);
    setCategory(qp.cat);
  };

  // Start 10-Second Camera Recording
  const start10SecondRecording = () => {
    if (!isCameraActive && onStartCamera) {
      onStartCamera();
    }

    if (isRecording) return;
    playChime('pop');
    setIsRecording(true);
    setRecordingElapsed(0);
    setRecordingFramesCount(0);
    setRecordingSuccessToast('');
    currentClipVectorsRef.current = [];

    const durationMs = RECORDING_DURATION_MS;
    const intervalMs = 100;
    let elapsed = 0;

    const timer = window.setInterval(() => {
      elapsed += intervalMs;
      setRecordingElapsed(Math.min(durationMs, elapsed));

      // Grab latest normalized vector from ref or state
      const sigs = latestSignalsRef?.current || latestSignals;
      if (sigs?.featureVector && sigs.featureVector.length > 0) {
        currentClipVectorsRef.current.push([...sigs.featureVector]);
        setRecordingFramesCount(currentClipVectorsRef.current.length);
      }

      if (elapsed >= durationMs) {
        window.clearInterval(timer);
        recordingTimerRef.current = null;
        setIsRecording(false);
        playChime('success');

        if (currentClipVectorsRef.current.length > 0) {
          const clipLength = currentClipVectorsRef.current.length;
          const vectorDim = currentClipVectorsRef.current[0].length;
          const avgVector = new Array(vectorDim).fill(0);

          for (const vec of currentClipVectorsRef.current) {
            for (let i = 0; i < vectorDim; i++) {
              avgVector[i] += vec[i] / clipLength;
            }
          }

          setRecordedClips((prev) => [...prev, avgVector]);
          setTriggerType('customCameraRecording');
          setRecordingSuccessToast(
            `Recorded 10-second sample (${clipLength} frames captured)! Saved to cue recognition.`
          );
        } else {
          setRecordingSuccessToast(
            'Recorded 10 seconds. Keep your camera pointed at the child to collect movement.'
          );
        }
      }
    }, intervalMs);

    recordingTimerRef.current = timer;
  };

  const stopRecordingEarly = () => {
    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);
    playChime('pop');

    if (currentClipVectorsRef.current.length > 5) {
      const clipLength = currentClipVectorsRef.current.length;
      const vectorDim = currentClipVectorsRef.current[0].length;
      const avgVector = new Array(vectorDim).fill(0);

      for (const vec of currentClipVectorsRef.current) {
        for (let i = 0; i < vectorDim; i++) {
          avgVector[i] += vec[i] / clipLength;
        }
      }

      setRecordedClips((prev) => [...prev, avgVector]);
      setTriggerType('customCameraRecording');
      setRecordingSuccessToast(
        `Saved 10s sample early (${clipLength} frames captured)! Saved to cue recognition.`
      );
    }
  };

  const handleSave = () => {
    if (!phrase.trim()) {
      setErrorMsg('Please enter a communication phrase (e.g., "I want water").');
      return;
    }

    const selectedTrigger = TRIGGER_OPTIONS.find((t) => t.type === triggerType);
    const signalsLabel = selectedTrigger?.signalsLabel || 'Physical movement';

    const rules: CueMapping['rules'] = {
      requiredSignals: [signalsLabel],
    };

    switch (triggerType) {
      case 'handNearMouth':
        rules.requireHandNearMouth = true;
        break;
      case 'requireReaching':
        rules.requireReaching = true;
        break;
      case 'requireWaving':
        rules.requireWaving = true;
        break;
      case 'minSmile':
        rules.minSmile = smileThreshold;
        break;
      case 'requireFlapping':
        rules.requireFlapping = true;
        rules.minSmile = smileThreshold;
        rules.requiredSignals = ['Warm smile', 'Hand flapping'];
        break;
      case 'requireTurnAway':
        rules.requireTurnAway = true;
        break;
      case 'requireGaze':
        rules.requireGaze = 'left';
        break;
      case 'requireLeanIn':
        rules.requireLeanIn = true;
        break;
      case 'requireStillness':
        rules.requireStillness = true;
        break;
      case 'customCameraRecording':
        // When using camera recording, also provide a fallback rule if available
        rules.requiredSignals = ["Child's 10-second camera gesture"];
        break;
    }

    const hasNewClips = recordedClips.length > 0;

    if (isEditing && cueToEdit) {
      editCue(
        cueToEdit.id,
        {
          phrase: phrase.trim(),
          icon,
          category,
          active,
          rules,
          isPersonalized: true,
        },
        hasNewClips ? recordedClips : undefined
      );
      playChime('success');
    } else {
      if (hasNewClips) {
        addCustomCue(
          {
            phrase: phrase.trim(),
            icon,
            category,
            active,
            isStarter: false,
            rules,
          },
          recordedClips
        );
      } else {
        addRuleCue({
          phrase: phrase.trim(),
          icon,
          category,
          active,
          isStarter: false,
          rules,
        });
      }
      playChime('success');
    }

    onClose();
  };

  const handleResetToDefault = () => {
    if (!cueToEdit) return;
    resetSingleCue(cueToEdit.id);
    playChime('pop');
    onClose();
  };

  const handleDelete = () => {
    if (!cueToEdit) return;
    deleteCue(cueToEdit.id);
    playChime('pop');
    onClose();
  };

  const totalSamples = (cueToEdit?.trainedSamplesCount || 0) + recordedClips.length;

  return (
    <motion.div
      initial={{ scale: 0.94, opacity: 0, y: 10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.94, opacity: 0, y: 10 }}
      className="w-full max-w-2xl bg-gradient-to-b from-[#1f1246] via-[#2d1761] to-[#12082b] rounded-[32px] p-5 sm:p-7 border-2 border-purple-400/40 shadow-2xl text-white relative my-auto max-h-[92vh] overflow-y-auto scrollbar-thin"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-white/15">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-2xl shadow-lg shadow-purple-500/30">
            {icon}
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black font-heading tracking-wide flex items-center gap-2">
              {isEditing ? 'Edit Cue Mapping' : 'Create New Cue Mapping'}
              {isStarter && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                  Starter Idea
                </span>
              )}
              {(cueToEdit?.isPersonalized || totalSamples > 0) && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  ⭐ {totalSamples > 0 ? `${totalSamples} 10s Sample(s)` : 'Customized'}
                </span>
              )}
            </h3>
            <p className="text-xs text-purple-200 font-semibold">
              Map your child's physical movement to spoken AAC communication
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
      </div>

      {/* Mascot Tip */}
      <div className="my-3 flex justify-center">
        <PinkCatMascot
          size={48}
          speechText="You can type what to say, pick a preset gesture, or record your child's movement with the camera for 10 seconds! 🎥✨"
        />
      </div>

      {/* Form Fields */}
      <div className="space-y-4 text-xs">
        {/* Spoken Phrase Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5 font-heading font-extrabold text-sm">
            <span className="text-amber-300 flex items-center gap-1.5">
              <span>1. Spoken AAC Phrase</span>
              <span className="text-rose-400">*</span>
            </span>
            <button
              type="button"
              onClick={handleTestSpeech}
              disabled={!phrase.trim()}
              className="text-xs text-cyan-300 hover:text-cyan-200 flex items-center gap-1 cursor-pointer disabled:opacity-40"
            >
              <Volume2 size={14} />
              <span>Test Voice</span>
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              value={phrase}
              onChange={(e) => {
                setPhrase(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="e.g., I want water, Hello, More please"
              maxLength={60}
              className="w-full py-3 px-4 rounded-2xl bg-white/10 border-2 border-white/20 focus:border-amber-400 text-white font-heading font-black text-base placeholder-white/30 focus:outline-none transition-all"
            />
            <span className="absolute right-3.5 bottom-3.5 text-[10px] text-white/40 font-mono">
              {phrase.length}/60
            </span>
          </div>
          {errorMsg && (
            <p className="text-rose-400 font-bold text-xs mt-1">{errorMsg}</p>
          )}

          {/* Quick Suggestion Chips */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="text-[10px] text-purple-300 font-bold self-center mr-1">
              Quick Ideas:
            </span>
            {QUICK_PHRASES.slice(0, 6).map((qp, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectQuickPhrase(qp)}
                className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-[11px] font-bold font-heading border border-white/10 transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>{qp.icon}</span>
                <span>{qp.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Icon & Category Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Emoji / Icon Selector */}
          <div>
            <label className="block font-heading font-bold text-slate-200 mb-1.5">
              2. Visual Icon / Emoji
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-2xl flex items-center justify-center shrink-0 cursor-pointer transition-all"
                title="Click to pick emoji"
              >
                {icon}
              </button>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value.slice(0, 4))}
                placeholder="Emoji"
                className="w-20 py-2.5 px-3 rounded-2xl bg-white/10 border border-white/20 text-center text-lg font-bold text-white focus:outline-none focus:border-purple-400"
              />
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-xs font-bold text-purple-300 hover:text-purple-200 cursor-pointer underline"
              >
                {showEmojiPicker ? 'Hide Picker' : 'Browse Icons'}
              </button>
            </div>

            {/* Emoji Picker Grid */}
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-2 p-2.5 rounded-2xl bg-black/40 border border-white/15 grid grid-cols-8 gap-1.5 overflow-hidden"
                >
                  {POPULAR_EMOJIS.map((emoji, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setIcon(emoji);
                        setShowEmojiPicker(false);
                        playChime('pop');
                      }}
                      className="w-8 h-8 rounded-xl hover:bg-white/20 text-lg flex items-center justify-center transition-transform hover:scale-115 cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block font-heading font-bold text-slate-200 mb-1.5">
              3. Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full py-3 px-3.5 rounded-2xl bg-white/10 border border-white/20 text-white font-heading font-bold text-xs focus:outline-none focus:border-purple-400 cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-slate-900 text-white">
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 10-SECOND CAMERA RECORDING & LIVE GESTURE DETECTOR SECTION */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-purple-900/60 via-indigo-900/60 to-purple-900/60 border-2 border-purple-400/50 shadow-xl space-y-3.5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2.5 border-b border-white/15">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 text-white flex items-center justify-center shadow-md">
                <Video size={19} />
              </div>
              <div>
                <h4 className="font-heading font-black text-sm sm:text-base text-white flex items-center gap-2">
                  <span>Record Gesture with Camera (10 Seconds)</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                    Live Detector
                  </span>
                </h4>
                <p className="text-[11px] text-purple-200">
                  Observe live child cam with gesture detector skeleton & record a 10s sample for custom recognition
                </p>
              </div>
            </div>

            {/* Camera Status Button / Badge */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              {isCameraActive ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 rounded-xl">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live Feed Active</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onStartCamera}
                  className="inline-flex items-center gap-1.5 text-[11px] font-black text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 px-3 py-1 rounded-xl cursor-pointer transition-colors shadow-sm"
                >
                  <VideoOff size={14} />
                  <span>Start Camera</span>
                </button>
              )}
            </div>
          </div>

          {/* LIVE CAM & GESTURE DETECTOR VIEWPORT */}
          <div className="relative w-full aspect-video sm:h-72 rounded-2xl overflow-hidden bg-slate-950 border-2 border-purple-400/40 shadow-2xl flex items-center justify-center">
            {isCameraActive && stream ? (
              <>
                {/* Live Camera Video Feed */}
                <video
                  ref={modalVideoRef}
                  playsInline
                  muted
                  autoPlay
                  className={`w-full h-full object-cover transition-transform ${
                    isMirrored ? 'scale-x-[-1]' : ''
                  }`}
                />

                {/* Overlaid Gesture Detector Canvas (Face landmarks + Hand skeleton neon overlay) */}
                <canvas
                  ref={modalCanvasRef}
                  className={`absolute inset-0 w-full h-full pointer-events-none object-cover ${
                    isMirrored ? 'scale-x-[-1]' : ''
                  }`}
                />

                {/* Real-time Gesture Detector HUD (Top-Left) */}
                <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 pointer-events-none">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-cyan-400/40 text-white shadow-xl">
                    <span className="text-lg shrink-0">{detectedGestureLabel.icon}</span>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-black tracking-wider text-cyan-300">
                        {detectedGestureLabel.status}
                      </span>
                      <span className="text-xs font-black text-white flex items-center gap-1.5">
                        <span>{detectedGestureLabel.text}</span>
                        {detectedGestureLabel.confidence > 0 && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-cyan-500/30 text-cyan-200 border border-cyan-400/30">
                            {detectedGestureLabel.confidence}%
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tracking Quality Chip (Top-Right) */}
                <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/20 text-[11px] font-bold text-white shadow-lg pointer-events-none">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      trackingQuality?.faceFound ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  <span>{trackingQuality?.faceFound ? 'Child Tracked' : 'Searching...'}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-purple-300 font-mono">{trackingQuality?.handsFound ?? 0}H</span>
                </div>

                {/* 10-Second Recording Active Overlay */}
                {isRecording && (
                  <div className="absolute inset-0 z-20 flex flex-col justify-between p-3.5 bg-rose-950/25 pointer-events-none">
                    {/* Top Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-rose-600/90 text-white font-heading font-black text-xs shadow-lg animate-pulse">
                        <span className="w-2.5 h-2.5 rounded-full bg-white" />
                        <span>RECORDING 10s</span>
                      </div>
                      <div className="px-2.5 py-1 rounded-xl bg-black/75 text-cyan-300 font-mono text-xs font-bold border border-cyan-400/30">
                        {recordingFramesCount} frames
                      </div>
                    </div>

                    {/* Big Countdown Timer */}
                    <div className="self-center flex flex-col items-center">
                      <div className="text-4xl sm:text-5xl font-black font-mono text-white drop-shadow-[0_0_24px_rgba(244,63,94,0.9)] tracking-tight">
                        {((RECORDING_DURATION_MS - recordingElapsed) / 1000).toFixed(1)}s
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-rose-200 bg-black/60 px-3 py-0.5 rounded-full mt-1 border border-rose-400/30">
                        Hold or repeat child gesture now
                      </span>
                    </div>

                    {/* Progress Bar at Bottom */}
                    <div className="w-full space-y-1">
                      <div className="w-full h-3 bg-black/70 rounded-full overflow-hidden border border-white/20">
                        <motion.div
                          className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 rounded-full shadow-[0_0_12px_rgba(52,211,153,0.8)]"
                          style={{
                            width: `${(recordingElapsed / RECORDING_DURATION_MS) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Camera Inactive Placeholder */
              <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-slate-300 border border-white/15">
                  <VideoOff size={28} />
                </div>
                <div className="space-y-1">
                  <p className="font-heading font-bold text-sm text-white">Camera is Currently Inactive</p>
                  <p className="text-xs text-purple-200 max-w-sm">
                    Turn on the webcam to view the live child camera and real-time gesture detector.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onStartCamera}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-heading font-black text-xs shadow-lg shadow-cyan-500/25 cursor-pointer flex items-center gap-2 transition-all"
                >
                  <Video size={15} />
                  <span>Start Camera Now</span>
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons: Start 10s Record / Stop Early */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {isRecording ? (
              <button
                type="button"
                onClick={stopRecordingEarly}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-heading font-black text-xs shadow-lg shadow-rose-600/30 cursor-pointer flex items-center justify-center gap-2 transition-all"
              >
                <div className="w-3 h-3 rounded-full bg-white animate-ping" />
                <span>Stop & Save 10s Recording Now</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={start10SecondRecording}
                className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-heading font-black text-xs shadow-lg shadow-rose-500/25 cursor-pointer flex items-center justify-center gap-2 transition-all"
              >
                <div className="w-3 h-3 rounded-full bg-white animate-ping" />
                <Clock size={16} />
                <span>Start 10-Second Camera Recording</span>
              </button>
            )}

            {recordedClips.length > 0 && !isRecording && (
              <button
                type="button"
                onClick={() => {
                  setRecordedClips([]);
                  setRecordingSuccessToast('');
                  playChime('pop');
                }}
                className="py-2.5 px-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-300 text-[11px] font-bold cursor-pointer transition-colors"
              >
                Clear Recorded Clips ({recordedClips.length})
              </button>
            )}
          </div>

          {/* Success Toast */}
          {recordingSuccessToast && (
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <Check size={16} className="text-emerald-400 shrink-0" />
              <span>{recordingSuccessToast}</span>
            </div>
          )}

          {/* Sample count badge */}
          <div className="flex items-center justify-between text-[11px] text-purple-300 pt-1 border-t border-white/10">
            <span>
              Trained 10s Samples for this cue:{' '}
              <strong className="text-white">{totalSamples} sample(s)</strong>
            </span>
            {totalSamples > 0 && (
              <span className="text-cyan-300 font-bold">
                ⭐ Custom 10s gesture recognition active
              </span>
            )}
          </div>
        </div>

        {/* Trigger Physical Gesture Selection (The Mapping!) */}
        <div>
          <div className="flex items-center justify-between mb-2 font-heading font-extrabold text-sm text-cyan-300">
            <span className="flex items-center gap-1.5">
              <span>4. Gesture Recognition Trigger</span>
              <span className="text-rose-400">*</span>
            </span>
            <span className="text-[11px] text-purple-300 font-bold">
              Select gesture or use 10s camera recording
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin">
            {TRIGGER_OPTIONS.map((trigger) => {
              const isSelected = triggerType === trigger.type;
              return (
                <div
                  key={trigger.type}
                  onClick={() => {
                    setTriggerType(trigger.type);
                    playChime('pop');
                  }}
                  className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-600/40 to-pink-600/40 border-cyan-400 shadow-lg shadow-cyan-500/20'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/25'
                  }`}
                >
                  <span className="text-2xl shrink-0 mt-0.5">{trigger.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h5 className="font-heading font-black text-xs text-white">
                        {trigger.title}
                      </h5>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shrink-0">
                          <Check size={11} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-purple-200 mt-0.5 leading-snug">
                      {trigger.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Special Fine-Tuning Slider for Smile / Flapping */}
        {(triggerType === 'minSmile' || triggerType === 'requireFlapping') && (
          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 space-y-2">
            <div className="flex items-center justify-between font-heading font-bold">
              <span className="text-amber-300 flex items-center gap-1.5">
                <Smile size={15} />
                <span>Smile Activation Sensitivity</span>
              </span>
              <span className="text-cyan-300 font-mono font-black">
                {Math.round(smileThreshold * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.15"
              max="0.65"
              step="0.05"
              value={smileThreshold}
              onChange={(e) => setSmileThreshold(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-purple-200 font-bold">
              <span>Gentle Smile (15%)</span>
              <span>Balanced (30%)</span>
              <span>Broad Grin (65%)</span>
            </div>
          </div>
        )}

        {/* Active Switch */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div>
            <span className="font-heading font-bold text-white block">
              Enable Cue in Live Camera
            </span>
            <span className="text-[11px] text-purple-200">
              When active, Gestivo will suggest this phrase when the cue gesture is observed.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActive(!active)}
            className={`px-3.5 py-1.5 rounded-xl font-heading font-black text-xs transition-all cursor-pointer ${
              active
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-white/10 text-white/50 hover:bg-white/20'
            }`}
          >
            {active ? 'Active' : 'Paused'}
          </button>
        </div>
      </div>

      {/* Modal Actions Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-4 border-t border-white/15">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isStarter && isEditing && (
            <button
              type="button"
              onClick={handleResetToDefault}
              className="py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/20 text-cyan-300 font-heading font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset this starter cue back to original phrase and rules"
            >
              <RotateCcw size={14} />
              <span>Reset to Starter</span>
            </button>
          )}

          {!isStarter && isEditing && (
            <>
              {confirmDelete ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="py-2.5 px-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-heading font-black text-xs cursor-pointer shadow-md"
                  >
                    Confirm Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="py-2.5 px-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="py-2.5 px-3 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-heading font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-initial py-2.5 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-heading font-bold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex-1 sm:flex-initial py-2.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-heading font-black text-xs shadow-lg shadow-emerald-500/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check size={16} strokeWidth={3} />
            <span>{isEditing ? 'Save Changes' : 'Create Mapping'}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export const CueMappingEditorModal: React.FC<CueMappingEditorModalProps> = ({
  isOpen,
  onClose,
  cueToEdit,
  latestSignals,
  latestSignalsRef,
  isCameraActive,
  onStartCamera,
  trackingQuality,
  stream,
  modalCanvasRef,
  isMirrored,
  activeSuggestion,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <CueMappingEditorForm
        key={cueToEdit?.id ?? 'create-new'}
        cueToEdit={cueToEdit}
        onClose={onClose}
        latestSignals={latestSignals}
        latestSignalsRef={latestSignalsRef}
        isCameraActive={isCameraActive}
        onStartCamera={onStartCamera}
        trackingQuality={trackingQuality}
        stream={stream}
        modalCanvasRef={modalCanvasRef}
        isMirrored={isMirrored}
        activeSuggestion={activeSuggestion}
      />
    </div>
  );
};
