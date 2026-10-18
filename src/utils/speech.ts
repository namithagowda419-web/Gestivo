// Web Audio Synthesizer and Web Speech API utilities for GESTIVO

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Play delightful sound effects for buttons, cards, goals
export function playChime(type: 'pop' | 'success' | 'card' | 'magic' | 'star' | 'bubble' | 'error' = 'pop') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'pop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'card') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(560, now + 0.15);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'bubble') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.08);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'success' || type === 'star') {
      // Arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.connect(subGain);
        subGain.connect(ctx.destination);
        subOsc.type = 'triangle';
        subOsc.frequency.setValueAtTime(freq, now + idx * 0.08);
        subGain.gain.setValueAtTime(0.2, now + idx * 0.08);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
        subOsc.start(now + idx * 0.08);
        subOsc.stop(now + idx * 0.08 + 0.25);
      });
    } else if (type === 'magic') {
      const freqs = [400, 600, 800, 1200, 1600];
      freqs.forEach((freq, idx) => {
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.connect(subGain);
        subGain.connect(ctx.destination);
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(freq, now + idx * 0.06);
        subGain.gain.setValueAtTime(0.15, now + idx * 0.06);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.3);
        subOsc.start(now + idx * 0.06);
        subOsc.stop(now + idx * 0.06 + 0.3);
      });
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.setValueAtTime(220, now + 0.1);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch (err) {
    console.warn('Audio chime play error:', err);
  }
}

// Speech synthesis queue and status tracking
interface SpeechQueueItem {
  text: string;
  pitch: number;
  rate: number;
  voiceName?: string;
  onStart?: () => void;
  onEnd?: () => void;
}

const speechQueue: SpeechQueueItem[] = [];
let isQueueProcessing = false;
let selectedVoiceName: string | null = null;
const statusListeners = new Set<(isSpeaking: boolean) => void>();

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function addSpeechStatusListener(listener: (isSpeaking: boolean) => void): () => void {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}

function notifyStatus(speaking: boolean) {
  statusListeners.forEach((fn) => {
    try {
      fn(speaking);
    } catch {}
  });
}

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) return [];
  return window.speechSynthesis.getVoices();
}

export function setSelectedVoice(voiceName: string | null): void {
  selectedVoiceName = voiceName;
}

export function getSelectedVoice(): string | null {
  return selectedVoiceName;
}

function processNextQueueItem() {
  if (!isSpeechSynthesisSupported() || speechQueue.length === 0) {
    isQueueProcessing = false;
    notifyStatus(false);
    return;
  }

  isQueueProcessing = true;
  notifyStatus(true);
  const item = speechQueue.shift()!;

  try {
    const utterance = new SpeechSynthesisUtterance(item.text);
    utterance.pitch = item.pitch;
    utterance.rate = item.rate;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    let chosenVoice: SpeechSynthesisVoice | undefined;

    if (item.voiceName || selectedVoiceName) {
      const targetName = item.voiceName || selectedVoiceName;
      chosenVoice = voices.find((v) => v.name === targetName);
    }

    if (!chosenVoice) {
      // Pick best English voice if available
      chosenVoice =
        voices.find(
          (v) =>
            (v.name.includes('Natural') ||
              v.name.includes('Google') ||
              v.name.includes('Samantha') ||
              v.name.includes('Zira') ||
              v.name.includes('Karen')) &&
            v.lang.startsWith('en')
        ) ||
        voices.find((v) => v.lang.startsWith('en')) ||
        voices[0];
    }

    if (chosenVoice) {
      utterance.voice = chosenVoice;
    }

    utterance.onstart = () => {
      notifyStatus(true);
      if (item.onStart) item.onStart();
    };

    utterance.onend = () => {
      if (item.onEnd) item.onEnd();
      processNextQueueItem();
    };

    utterance.onerror = (e) => {
      console.warn('Utterance playback error:', e);
      if (item.onEnd) item.onEnd();
      processNextQueueItem();
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
    processNextQueueItem();
  }
}

// Child-friendly text-to-speech with Web Speech API and queuing
export function speakText(
  text: string,
  enabled: boolean = true,
  pitch: number = 1.25,
  rate: number = 0.95,
  voiceName?: string,
  priority: boolean = false
): void {
  if (!enabled) return;

  if (!isSpeechSynthesisSupported()) {
    console.info('[SpeechSynthesis] Web Speech API is not supported in this browser.');
    return;
  }

  const cleanText = text.trim();
  if (!cleanText) return;

  if (priority) {
    window.speechSynthesis.cancel();
    speechQueue.length = 0;
  }

  speechQueue.push({
    text: cleanText,
    pitch,
    rate,
    voiceName,
  });

  if (!isQueueProcessing) {
    processNextQueueItem();
  }
}

export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
    speechQueue.length = 0;
    isQueueProcessing = false;
    notifyStatus(false);
  }
}

// Speech Recognition helper for "Tap to speak..."
interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

export function createSpeechRecognition(): SpeechRecognitionInstance | null {
  if (typeof window === 'undefined') return null;

  const SpeechRecognitionClass =
    (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;

  if (!SpeechRecognitionClass) {
    return null;
  }

  const recognition = new SpeechRecognitionClass();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';
  return recognition;
}

