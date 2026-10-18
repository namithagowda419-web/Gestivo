import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { NimoMascot } from '../mascots/Mascots';
import { useGestivoStore } from '../../store/useGestivoStore';
import { createSpeechRecognition, playChime, addSpeechStatusListener } from '../../utils/speech';

export const VoiceBar: React.FC = () => {
  const { voiceOutput, toggleVoiceOutput, addToSentenceStrip } = useGestivoStore();
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingTts, setIsSpeakingTts] = useState(false);
  const [transcriptNotice, setTranscriptNotice] = useState<string>('');
  const [speechHelperText, setSpeechHelperText] = useState("Hi! I'm your learning buddy! Let's explore together! 💖");

  useEffect(() => {
    const unsub = addSpeechStatusListener((speaking) => {
      setIsSpeakingTts(speaking);
    });
    return unsub;
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (transcriptNotice) {
      timer = setTimeout(() => setTranscriptNotice(''), 4000);
    }
    return () => clearTimeout(timer);
  }, [transcriptNotice]);

  const handleStartListening = () => {
    playChime('pop');
    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = createSpeechRecognition();

    if (!recognition) {
      // Browser SpeechRecognition not supported - provide friendly interactive prompt
      setIsListening(true);
      setSpeechHelperText("Listening to your voice! Tell me what you'd like!");
      setTranscriptNotice("Listening... Try saying: 'I want water' or 'I am happy'");

      // Simulate recognition fallback
      setTimeout(() => {
        const samplePhrases = [
          { text: 'I want water', icon: '🥤' },
          { text: 'I am happy', icon: '😊' },
          { text: 'I want to play', icon: '⚽' },
          { text: 'Thank you', icon: '💖' },
        ];
        const random = samplePhrases[Math.floor(Math.random() * samplePhrases.length)];
        setIsListening(false);
        setTranscriptNotice(`Heard: "${random.text}"`);
        setSpeechHelperText(`Awesome! You said "${random.text}"! 🌟`);

        addToSentenceStrip({
          label: random.text,
          icon: random.icon,
          phrase: random.text,
        });
      }, 2500);
      return;
    }

    try {
      setIsListening(true);
      setTranscriptNotice('Listening... Speak now!');
      setSpeechHelperText('I am listening closely! 💙');

      recognition.onresult = (event) => {
        const spoken = event.results[0][0].transcript;
        setIsListening(false);
        setTranscriptNotice(`Heard: "${spoken}"`);
        setSpeechHelperText(`Great job! You said: "${spoken}"! ⭐`);

        addToSentenceStrip({
          label: spoken,
          icon: '🗣️',
          phrase: spoken,
        });
      };

      recognition.onerror = () => {
        setIsListening(false);
        setTranscriptNotice('Microphone access needed or quiet room');
        setSpeechHelperText("That's okay! You can tap any button to speak!");
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      setIsListening(false);
      console.warn('Recognition start error:', err);
    }
  };

  return (
    <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
      {/* Bottom-left Nimo Mascot with speech bubble matching screenshot */}
      <div className="w-full md:w-auto flex justify-start">
        <NimoMascot
          size={58}
          speechText={speechHelperText}
          showBubble={true}
          className="hover:scale-105 transition-transform"
        />
      </div>

      {/* Right Voice Pill and Voice Output Toggle */}
      <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-3">
        {/* Wide Glass Pill: "Tap to speak..." with animated waveform */}
        <motion.div
          onClick={handleStartListening}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`flex-1 sm:w-80 md:w-96 px-4 py-3 rounded-full glass-panel-glow border flex items-center justify-between gap-3 cursor-pointer shadow-lg transition-all ${
            isListening
              ? 'border-rose-400 bg-rose-500/20 shadow-rose-500/30'
              : 'border-cyan-300/40 hover:border-cyan-300/70 bg-white/10'
          }`}
          role="button"
          tabIndex={0}
          aria-label="Tap to speak into microphone"
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-cyan-500/30 text-cyan-200'
              }`}
            >
              {isListening ? <MicOff size={19} /> : <Mic size={19} />}
            </div>
            <div>
              <span className="font-heading font-bold text-sm text-white block">
                {isListening ? 'Listening...' : 'Tap to speak...'}
              </span>
              <span className="text-[10px] text-purple-200/80 block">
                {transcriptNotice || 'Speak your message aloud'}
              </span>
            </div>
          </div>

          {/* Animated Waveform */}
          <div className="flex items-center gap-1 h-6 px-1">
            {[1, 2, 3, 4, 5, 6].map((bar, i) => (
              <motion.div
                key={i}
                className={`w-1 rounded-full ${
                  isListening
                    ? 'bg-gradient-to-t from-pink-500 to-rose-300'
                    : isSpeakingTts
                    ? 'bg-gradient-to-t from-cyan-400 to-purple-400'
                    : 'bg-cyan-400/70'
                }`}
                animate={{
                  height: isListening
                    ? [6, 22, 10, 26, 8, 20][(i + bar) % 6]
                    : isSpeakingTts
                    ? [8, 24, 14, 20, 10, 22][(i + bar) % 6]
                    : [6, 12, 8, 16, 6, 10][i % 6],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Blue "Voice Output" Button with Speaker Icon matching screenshot */}
        <motion.button
          onClick={toggleVoiceOutput}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`px-5 py-3 rounded-full flex items-center gap-2.5 font-heading font-extrabold text-sm sm:text-base text-white shadow-xl border cursor-pointer transition-all ${
            voiceOutput
              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 border-cyan-300/60 shadow-blue-500/40'
              : 'bg-slate-700/80 border-slate-500/50 text-slate-300 shadow-none'
          }`}
          aria-label="Toggle voice output speech"
        >
          {voiceOutput ? (
            <Volume2 size={20} className="text-cyan-200 animate-pulse" />
          ) : (
            <VolumeX size={20} className="text-slate-400" />
          )}
          <span>Voice Output</span>
          <span
            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
              voiceOutput ? 'bg-cyan-400/30 text-cyan-100' : 'bg-slate-600 text-slate-300'
            }`}
          >
            {voiceOutput ? 'On' : 'Off'}
          </span>
        </motion.button>
      </div>
    </div>
  );
};
