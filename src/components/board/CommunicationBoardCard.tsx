import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BoardTile } from '../../types';
import { useGestivoStore } from '../../store/useGestivoStore';
import { Sparkles } from 'lucide-react';
import { playChime } from '../../utils/speech';
import { AddCustomTileModal } from '../modals/AddCustomTileModal';

export const CommunicationBoardCard: React.FC = () => {
  const { addToSentenceStrip } = useGestivoStore();
  const [activeTab, setActiveTab] = useState<'basics' | 'feelings' | 'needs' | 'play' | 'people' | 'more'>('basics');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Exact 4x3 grids matching prompt specification
  const basicsTiles: BoardTile[] = [
    // Row 1: I want, I'am hungry, I'am thirsty, I want to play
    {
      id: 'b-want',
      label: 'I want',
      phrase: 'I want',
      icon: '✋',
      bgGradient: 'from-orange-100 to-amber-200',
      borderColor: 'border-orange-300',
      textColor: 'text-amber-950',
      shadowColor: 'rgba(251, 146, 60, 0.25)',
      category: 'basics',
    },
    {
      id: 'b-hungry',
      label: "I'am hungry",
      phrase: "I am hungry, I want food",
      icon: '🍔',
      bgGradient: 'from-rose-100 to-orange-200',
      borderColor: 'border-rose-300',
      textColor: 'text-rose-950',
      shadowColor: 'rgba(251, 113, 133, 0.25)',
      category: 'basics',
    },
    {
      id: 'b-thirsty',
      label: "I'am thirsty",
      phrase: "I am thirsty, I want water",
      icon: '🥤',
      bgGradient: 'from-sky-100 to-blue-200',
      borderColor: 'border-sky-300',
      textColor: 'text-sky-950',
      shadowColor: 'rgba(56, 189, 248, 0.25)',
      category: 'basics',
    },
    {
      id: 'b-play',
      label: 'I want to play',
      phrase: 'I want to play',
      icon: '🎮',
      bgGradient: 'from-emerald-100 to-green-200',
      borderColor: 'border-emerald-300',
      textColor: 'text-emerald-950',
      shadowColor: 'rgba(52, 211, 153, 0.25)',
      category: 'basics',
    },

    // Row 2: Yes, No, Help, Thank you
    {
      id: 'b-yes',
      label: 'Yes',
      phrase: 'Yes',
      icon: '✅',
      bgGradient: 'from-emerald-100 to-teal-200',
      borderColor: 'border-emerald-400',
      textColor: 'text-emerald-950',
      shadowColor: 'rgba(16, 185, 129, 0.25)',
      category: 'basics',
    },
    {
      id: 'b-no',
      label: 'No',
      phrase: 'No',
      icon: '❌',
      bgGradient: 'from-rose-100 to-red-200',
      borderColor: 'border-red-300',
      textColor: 'text-red-950',
      shadowColor: 'rgba(244, 63, 94, 0.25)',
      category: 'basics',
    },
    {
      id: 'b-help',
      label: 'Help',
      phrase: 'Help me please',
      icon: '🙋',
      bgGradient: 'from-purple-100 to-violet-200',
      borderColor: 'border-purple-300',
      textColor: 'text-purple-950',
      shadowColor: 'rgba(168, 85, 247, 0.25)',
      category: 'basics',
    },
    {
      id: 'b-thankyou',
      label: 'Thank you',
      phrase: 'Thank you very much',
      icon: '💖',
      bgGradient: 'from-pink-100 to-rose-200',
      borderColor: 'border-pink-300',
      textColor: 'text-pink-950',
      shadowColor: 'rgba(244, 114, 182, 0.25)',
      category: 'basics',
    },

    // Row 3: I am happy, I am sad, I am tired, I love you
    {
      id: 'b-happy',
      label: 'I am happy',
      phrase: 'I am happy and smiling',
      icon: '😊',
      bgGradient: 'from-yellow-100 to-amber-200',
      borderColor: 'border-yellow-300',
      textColor: 'text-amber-950',
      shadowColor: 'rgba(250, 204, 21, 0.25)',
      category: 'basics',
    },
    {
      id: 'b-sad',
      label: 'I am sad',
      phrase: 'I am feeling sad',
      icon: '😢',
      bgGradient: 'from-blue-100 to-indigo-200',
      borderColor: 'border-blue-300',
      textColor: 'text-blue-950',
      shadowColor: 'rgba(96, 165, 250, 0.25)',
      category: 'basics',
    },
    {
      id: 'b-tired',
      label: 'I am tired',
      phrase: 'I am feeling sleepy and tired',
      icon: '😴',
      bgGradient: 'from-amber-100 to-orange-200',
      borderColor: 'border-amber-300',
      textColor: 'text-amber-950',
      shadowColor: 'rgba(251, 191, 36, 0.25)',
      category: 'basics',
    },
    {
      id: 'b-loveyou',
      label: 'I love you',
      phrase: 'I love you with all my heart',
      icon: '❤️',
      bgGradient: 'from-pink-100 to-red-200',
      borderColor: 'border-pink-300',
      textColor: 'text-rose-950',
      shadowColor: 'rgba(244, 63, 94, 0.25)',
      category: 'basics',
    },
  ];

  const feelingsTiles: BoardTile[] = [
    { id: 'f-1', label: 'Excited', phrase: 'I feel super excited!', icon: '🤩', bgGradient: 'from-amber-100 to-yellow-200', borderColor: 'border-amber-300', textColor: 'text-amber-950', shadowColor: 'rgba(251, 191, 36, 0.25)', category: 'feelings' },
    { id: 'f-2', label: 'Silly', phrase: 'I am feeling silly and playful!', icon: '🤪', bgGradient: 'from-pink-100 to-purple-200', borderColor: 'border-pink-300', textColor: 'text-purple-950', shadowColor: 'rgba(192, 132, 252, 0.25)', category: 'feelings' },
    { id: 'f-3', label: 'Proud', phrase: 'I am proud of myself!', icon: '🌟', bgGradient: 'from-yellow-100 to-amber-200', borderColor: 'border-yellow-300', textColor: 'text-amber-950', shadowColor: 'rgba(250, 204, 21, 0.25)', category: 'feelings' },
    { id: 'f-4', label: 'Calm', phrase: 'I feel peaceful and calm', icon: '🌸', bgGradient: 'from-teal-100 to-emerald-200', borderColor: 'border-teal-300', textColor: 'text-teal-950', shadowColor: 'rgba(45, 212, 191, 0.25)', category: 'feelings' },
    { id: 'f-5', label: 'Frustrated', phrase: 'I am feeling frustrated', icon: '😤', bgGradient: 'from-orange-100 to-red-200', borderColor: 'border-orange-300', textColor: 'text-orange-950', shadowColor: 'rgba(251, 146, 60, 0.25)', category: 'feelings' },
    { id: 'f-6', label: 'Scared', phrase: 'I feel a little scared', icon: '😨', bgGradient: 'from-indigo-100 to-blue-200', borderColor: 'border-indigo-300', textColor: 'text-indigo-950', shadowColor: 'rgba(129, 140, 248, 0.25)', category: 'feelings' },
    { id: 'f-7', label: 'Surprised', phrase: 'Wow, I am surprised!', icon: '😲', bgGradient: 'from-cyan-100 to-sky-200', borderColor: 'border-cyan-300', textColor: 'text-sky-950', shadowColor: 'rgba(56, 189, 248, 0.25)', category: 'feelings' },
    { id: 'f-8', label: 'Shy', phrase: 'I feel shy right now', icon: '🙈', bgGradient: 'from-purple-100 to-pink-200', borderColor: 'border-purple-300', textColor: 'text-purple-950', shadowColor: 'rgba(192, 132, 252, 0.25)', category: 'feelings' },
    { id: 'f-9', label: 'Loved', phrase: 'I feel so loved and safe', icon: '🥰', bgGradient: 'from-rose-100 to-pink-200', borderColor: 'border-rose-300', textColor: 'text-rose-950', shadowColor: 'rgba(251, 113, 133, 0.25)', category: 'feelings' },
    { id: 'f-10', label: 'Confused', phrase: 'I do not understand, please explain', icon: '🤔', bgGradient: 'from-slate-100 to-sky-200', borderColor: 'border-slate-300', textColor: 'text-slate-900', shadowColor: 'rgba(148, 163, 184, 0.25)', category: 'feelings' },
    { id: 'f-11', label: 'Brave', phrase: 'I am strong and brave!', icon: '🦁', bgGradient: 'from-amber-100 to-orange-200', borderColor: 'border-amber-300', textColor: 'text-amber-950', shadowColor: 'rgba(251, 146, 60, 0.25)', category: 'feelings' },
    { id: 'f-12', label: 'Relaxed', phrase: 'I want to relax and breathe', icon: '🍃', bgGradient: 'from-green-100 to-emerald-200', borderColor: 'border-green-300', textColor: 'text-emerald-950', shadowColor: 'rgba(74, 222, 128, 0.25)', category: 'feelings' },
  ];

  const needsTiles: BoardTile[] = [
    { id: 'n-1', label: 'Water', phrase: 'May I please have water?', icon: '💧', bgGradient: 'from-sky-100 to-blue-200', borderColor: 'border-sky-300', textColor: 'text-sky-950', shadowColor: 'rgba(56, 189, 248, 0.25)', category: 'needs' },
    { id: 'n-2', label: 'Bathroom', phrase: 'I need to use the bathroom', icon: '🚻', bgGradient: 'from-emerald-100 to-teal-200', borderColor: 'border-emerald-300', textColor: 'text-emerald-950', shadowColor: 'rgba(52, 211, 153, 0.25)', category: 'needs' },
    { id: 'n-3', label: 'Snack', phrase: 'I would like a yummy snack', icon: '🍎', bgGradient: 'from-red-100 to-rose-200', borderColor: 'border-red-300', textColor: 'text-red-950', shadowColor: 'rgba(244, 63, 94, 0.25)', category: 'needs' },
    { id: 'n-4', label: 'Quiet Time', phrase: 'Too loud, I need quiet time', icon: '🎧', bgGradient: 'from-purple-100 to-indigo-200', borderColor: 'border-purple-300', textColor: 'text-purple-950', shadowColor: 'rgba(168, 85, 247, 0.25)', category: 'needs' },
    { id: 'n-5', label: 'Hug', phrase: 'Can I have a warm hug please?', icon: '🫂', bgGradient: 'from-pink-100 to-rose-200', borderColor: 'border-pink-300', textColor: 'text-pink-950', shadowColor: 'rgba(244, 114, 182, 0.25)', category: 'needs' },
    { id: 'n-6', label: 'Go Outside', phrase: 'I want to go outside in nature', icon: '🌳', bgGradient: 'from-lime-100 to-green-200', borderColor: 'border-lime-300', textColor: 'text-lime-950', shadowColor: 'rgba(132, 204, 22, 0.25)', category: 'needs' },
    { id: 'n-7', label: 'Jacket', phrase: 'I am cold, I need my jacket', icon: '🧥', bgGradient: 'from-cyan-100 to-blue-200', borderColor: 'border-cyan-300', textColor: 'text-blue-950', shadowColor: 'rgba(6, 182, 212, 0.25)', category: 'needs' },
    { id: 'n-8', label: 'Nap', phrase: 'I want to lie down and rest', icon: '🛌', bgGradient: 'from-amber-100 to-orange-200', borderColor: 'border-amber-300', textColor: 'text-amber-950', shadowColor: 'rgba(251, 191, 36, 0.25)', category: 'needs' },
    { id: 'n-9', label: 'Wash Hands', phrase: 'Let us wash hands', icon: '🧼', bgGradient: 'from-teal-100 to-cyan-200', borderColor: 'border-teal-300', textColor: 'text-teal-950', shadowColor: 'rgba(20, 184, 166, 0.25)', category: 'needs' },
    { id: 'n-10', label: 'Medicine', phrase: 'I do not feel well, need help', icon: '🩹', bgGradient: 'from-rose-100 to-red-200', borderColor: 'border-rose-300', textColor: 'text-rose-950', shadowColor: 'rgba(244, 63, 94, 0.25)', category: 'needs' },
    { id: 'n-11', label: 'Read Book', phrase: 'Can we read a story together?', icon: '📚', bgGradient: 'from-yellow-100 to-amber-200', borderColor: 'border-yellow-300', textColor: 'text-amber-950', shadowColor: 'rgba(245, 158, 11, 0.25)', category: 'needs' },
    { id: 'n-12', label: 'All Done', phrase: 'I am finished and all done!', icon: '✨', bgGradient: 'from-violet-100 to-purple-200', borderColor: 'border-violet-300', textColor: 'text-violet-950', shadowColor: 'rgba(139, 92, 246, 0.25)', category: 'needs' },
  ];

  const moreTiles: BoardTile[] = [
    { id: 'm-1', label: 'Hello', phrase: 'Hello there, how are you?', icon: '👋', bgGradient: 'from-amber-100 to-yellow-200', borderColor: 'border-amber-300', textColor: 'text-amber-950', shadowColor: 'rgba(251, 191, 36, 0.25)', category: 'more' },
    { id: 'm-2', label: 'Goodbye', phrase: 'Goodbye, see you soon!', icon: '🙋‍♂️', bgGradient: 'from-sky-100 to-blue-200', borderColor: 'border-sky-300', textColor: 'text-sky-950', shadowColor: 'rgba(56, 189, 248, 0.25)', category: 'more' },
    { id: 'm-3', label: 'Please', phrase: 'Please', icon: '🙏', bgGradient: 'from-emerald-100 to-teal-200', borderColor: 'border-emerald-300', textColor: 'text-emerald-950', shadowColor: 'rgba(52, 211, 153, 0.25)', category: 'more' },
    { id: 'm-4', label: 'Wait', phrase: 'Please wait a moment', icon: '⏳', bgGradient: 'from-orange-100 to-amber-200', borderColor: 'border-orange-300', textColor: 'text-orange-950', shadowColor: 'rgba(251, 146, 60, 0.25)', category: 'more' },
    { id: 'm-5', label: 'Music', phrase: 'I want to listen to music', icon: '🎵', bgGradient: 'from-pink-100 to-purple-200', borderColor: 'border-pink-300', textColor: 'text-purple-950', shadowColor: 'rgba(244, 114, 182, 0.25)', category: 'more' },
    { id: 'm-6', label: 'Drawing', phrase: 'Let us color and draw!', icon: '🎨', bgGradient: 'from-yellow-100 to-rose-200', borderColor: 'border-yellow-300', textColor: 'text-rose-950', shadowColor: 'rgba(250, 204, 21, 0.25)', category: 'more' },
    { id: 'm-7', label: 'Animals', phrase: 'I love cute animals', icon: '🐰', bgGradient: 'from-cyan-100 to-sky-200', borderColor: 'border-cyan-300', textColor: 'text-sky-950', shadowColor: 'rgba(56, 189, 248, 0.25)', category: 'more' },
    { id: 'm-8', label: 'Puzzle', phrase: 'Let us solve a fun puzzle', icon: '🧩', bgGradient: 'from-indigo-100 to-purple-200', borderColor: 'border-indigo-300', textColor: 'text-indigo-950', shadowColor: 'rgba(129, 140, 248, 0.25)', category: 'more' },
    { id: 'm-9', label: 'Good Job', phrase: 'You did a great job!', icon: '👏', bgGradient: 'from-lime-100 to-emerald-200', borderColor: 'border-lime-300', textColor: 'text-emerald-950', shadowColor: 'rgba(132, 204, 22, 0.25)', category: 'more' },
    { id: 'm-10', label: 'My Turn', phrase: 'It is my turn now!', icon: '👉', bgGradient: 'from-blue-100 to-indigo-200', borderColor: 'border-blue-300', textColor: 'text-blue-950', shadowColor: 'rgba(59, 130, 246, 0.25)', category: 'more' },
    { id: 'm-11', label: 'Your Turn', phrase: 'Now it is your turn!', icon: '🤝', bgGradient: 'from-teal-100 to-cyan-200', borderColor: 'border-teal-300', textColor: 'text-teal-950', shadowColor: 'rgba(20, 184, 166, 0.25)', category: 'more' },
    { id: 'm-12', label: 'I did it!', phrase: 'Hooray, I did it!', icon: '🎉', bgGradient: 'from-amber-100 to-pink-200', borderColor: 'border-amber-300', textColor: 'text-amber-950', shadowColor: 'rgba(251, 191, 36, 0.25)', category: 'more' },
  ];

  // Play & Fun Tiles
  const playTiles: BoardTile[] = [
    { id: 'p-1', label: 'Bubbles', phrase: 'I want to blow bubbles please!', icon: '🫧', bgGradient: 'from-sky-100 to-cyan-200', borderColor: 'border-sky-300', textColor: 'text-sky-950', shadowColor: 'rgba(56, 189, 248, 0.25)', category: 'play' },
    { id: 'p-2', label: 'Music', phrase: 'Can we listen to cheerful music?', icon: '🎵', bgGradient: 'from-purple-100 to-pink-200', borderColor: 'border-purple-300', textColor: 'text-purple-950', shadowColor: 'rgba(168, 85, 247, 0.25)', category: 'play' },
    { id: 'p-3', label: 'Blocks', phrase: 'I want to build tall blocks!', icon: '🧱', bgGradient: 'from-amber-100 to-orange-200', borderColor: 'border-amber-300', textColor: 'text-amber-950', shadowColor: 'rgba(251, 146, 60, 0.25)', category: 'play' },
    { id: 'p-4', label: 'Swing', phrase: 'Push me on the swing please!', icon: '🎪', bgGradient: 'from-emerald-100 to-teal-200', borderColor: 'border-emerald-300', textColor: 'text-emerald-950', shadowColor: 'rgba(16, 185, 129, 0.25)', category: 'play' },
    { id: 'p-5', label: 'Dancing', phrase: 'Let us dance and wiggle together!', icon: '💃', bgGradient: 'from-rose-100 to-pink-200', borderColor: 'border-rose-300', textColor: 'text-rose-950', shadowColor: 'rgba(244, 114, 182, 0.25)', category: 'play' },
    { id: 'p-6', label: 'Playground', phrase: 'I want to go play outside on the playground', icon: '🛝', bgGradient: 'from-lime-100 to-green-200', borderColor: 'border-lime-300', textColor: 'text-lime-950', shadowColor: 'rgba(132, 204, 22, 0.25)', category: 'play' },
    { id: 'p-7', label: 'Coloring', phrase: 'I want to draw and color pictures', icon: '🎨', bgGradient: 'from-orange-100 to-amber-200', borderColor: 'border-orange-300', textColor: 'text-amber-950', shadowColor: 'rgba(251, 146, 60, 0.25)', category: 'play' },
    { id: 'p-8', label: 'Toy Car', phrase: 'Zoom zoom! Let us race toy cars', icon: '🚗', bgGradient: 'from-blue-100 to-indigo-200', borderColor: 'border-blue-300', textColor: 'text-blue-950', shadowColor: 'rgba(59, 130, 246, 0.25)', category: 'play' },
    { id: 'p-9', label: 'Ball', phrase: 'Throw the ball to me please!', icon: '⚽', bgGradient: 'from-teal-100 to-emerald-200', borderColor: 'border-teal-300', textColor: 'text-teal-950', shadowColor: 'rgba(20, 184, 166, 0.25)', category: 'play' },
    { id: 'p-10', label: 'Reading', phrase: 'Can you read me a picture storybook?', icon: '📖', bgGradient: 'from-violet-100 to-purple-200', borderColor: 'border-violet-300', textColor: 'text-purple-950', shadowColor: 'rgba(139, 92, 246, 0.25)', category: 'play' },
    { id: 'p-11', label: 'Water Play', phrase: 'I want to splash and play with water', icon: '🌊', bgGradient: 'from-cyan-100 to-sky-200', borderColor: 'border-cyan-300', textColor: 'text-cyan-950', shadowColor: 'rgba(6, 182, 212, 0.25)', category: 'play' },
    { id: 'p-12', label: 'Stuffed Toy', phrase: 'Give me my cozy stuffed cuddle friend', icon: '🧸', bgGradient: 'from-pink-100 to-rose-200', borderColor: 'border-pink-300', textColor: 'text-pink-950', shadowColor: 'rgba(244, 63, 94, 0.25)', category: 'play' },
  ];

  // People & Family Tiles
  const peopleTiles: BoardTile[] = [
    { id: 'pp-1', label: 'Mum', phrase: 'I want my Mum please', icon: '👩', bgGradient: 'from-pink-100 to-rose-200', borderColor: 'border-pink-300', textColor: 'text-pink-950', shadowColor: 'rgba(244, 114, 182, 0.25)', category: 'people' },
    { id: 'pp-2', label: 'Dad', phrase: 'I want my Dad please', icon: '👨', bgGradient: 'from-blue-100 to-indigo-200', borderColor: 'border-blue-300', textColor: 'text-blue-950', shadowColor: 'rgba(59, 130, 246, 0.25)', category: 'people' },
    { id: 'pp-3', label: 'Teacher', phrase: 'Teacher, can you help me please?', icon: '🧑‍🏫', bgGradient: 'from-emerald-100 to-teal-200', borderColor: 'border-emerald-300', textColor: 'text-emerald-950', shadowColor: 'rgba(16, 185, 129, 0.25)', category: 'people' },
    { id: 'pp-4', label: 'Therapist', phrase: 'Time for fun speech and motor practice', icon: '🩺', bgGradient: 'from-purple-100 to-violet-200', borderColor: 'border-purple-300', textColor: 'text-purple-950', shadowColor: 'rgba(168, 85, 247, 0.25)', category: 'people' },
    { id: 'pp-5', label: 'Grandma', phrase: 'I love you Grandma, give me a warm hug', icon: '👵', bgGradient: 'from-amber-100 to-orange-200', borderColor: 'border-amber-300', textColor: 'text-amber-950', shadowColor: 'rgba(251, 146, 60, 0.25)', category: 'people' },
    { id: 'pp-6', label: 'Grandpa', phrase: 'I love you Grandpa, let us talk', icon: '👴', bgGradient: 'from-cyan-100 to-blue-200', borderColor: 'border-cyan-300', textColor: 'text-cyan-950', shadowColor: 'rgba(6, 182, 212, 0.25)', category: 'people' },
    { id: 'pp-7', label: 'Friend', phrase: 'I want to play together with my friend', icon: '👫', bgGradient: 'from-lime-100 to-emerald-200', borderColor: 'border-lime-300', textColor: 'text-emerald-950', shadowColor: 'rgba(132, 204, 22, 0.25)', category: 'people' },
    { id: 'pp-8', label: 'Sister / Brother', phrase: 'Come play with me, sister or brother!', icon: '👧', bgGradient: 'from-rose-100 to-pink-200', borderColor: 'border-rose-300', textColor: 'text-rose-950', shadowColor: 'rgba(244, 63, 94, 0.25)', category: 'people' },
    { id: 'pp-9', label: 'Doctor', phrase: 'Checkup time with the friendly doctor', icon: '👨‍⚕️', bgGradient: 'from-sky-100 to-teal-200', borderColor: 'border-sky-300', textColor: 'text-teal-950', shadowColor: 'rgba(14, 165, 233, 0.25)', category: 'people' },
    { id: 'pp-10', label: 'Doggy', phrase: 'I want to pet the happy friendly doggy', icon: '🐶', bgGradient: 'from-orange-100 to-amber-200', borderColor: 'border-orange-300', textColor: 'text-amber-950', shadowColor: 'rgba(249, 115, 22, 0.25)', category: 'people' },
    { id: 'pp-11', label: 'Kitty', phrase: 'I want to pet the gentle fluffy kitten', icon: '🐱', bgGradient: 'from-pink-100 to-purple-200', borderColor: 'border-pink-300', textColor: 'text-pink-950', shadowColor: 'rgba(236, 72, 153, 0.25)', category: 'people' },
    { id: 'pp-12', label: 'Me', phrase: 'Look at me, I am proud and happy!', icon: '🌟', bgGradient: 'from-yellow-100 to-amber-200', borderColor: 'border-yellow-400', textColor: 'text-amber-950', shadowColor: 'rgba(245, 158, 11, 0.25)', category: 'people' },
  ];

  const baseTiles =
    activeTab === 'basics'
      ? basicsTiles
      : activeTab === 'feelings'
      ? feelingsTiles
      : activeTab === 'needs'
      ? needsTiles
      : activeTab === 'play'
      ? playTiles
      : activeTab === 'people'
      ? peopleTiles
      : moreTiles;

  const { customTiles = [], mode } = useGestivoStore();
  const matchingCustom = customTiles.filter((t) => t.category === activeTab);
  const currentTiles = [...baseTiles, ...matchingCustom];

  const handleTileClick = (tile: BoardTile) => {
    addToSentenceStrip({
      label: tile.label,
      icon: tile.icon,
      phrase: tile.phrase,
    });
  };

  const tabs: Array<{ id: 'basics' | 'feelings' | 'needs' | 'play' | 'people' | 'more'; label: string }> = [
    { id: 'basics', label: 'Basics' },
    { id: 'feelings', label: 'Feelings' },
    { id: 'needs', label: 'Needs' },
    { id: 'play', label: 'Play' },
    { id: 'people', label: 'People' },
    { id: 'more', label: 'More' },
  ];

  return (
    <div className="card-light p-4 sm:p-5 rounded-[28px] shadow-2xl relative overflow-hidden">
      {/* Top Header matching screenshot: Title + Subtitle + Girl Avatar at top right */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-indigo-950 font-heading tracking-wide flex items-center gap-2">
            <span>Communication Board</span>
            <Sparkles size={16} className="text-amber-500" />
          </h2>
          <p className="text-xs sm:text-sm font-bold text-slate-500 mt-0.5">
            Tap a button to communicate
          </p>
        </div>

        {/* Girl avatar at top right matching screenshot */}
        <div className="relative">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-purple-400 shadow-md shadow-purple-500/20 bg-gradient-to-br from-purple-200 to-pink-200">
            <img
              src="/assets/girl-bunny.png"
              alt="Aarvi Child Avatar"
              width={56}
              height={56}
              loading="lazy"
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/assets/girl-bunny.jpeg';
              }}
            />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
        </div>
      </div>

      {/* Tabs matching screenshot: Basics (active) | Feelings | Needs | More */}
      <div className="flex items-center gap-1.5 sm:gap-2 my-3 p-1 rounded-2xl bg-slate-100 border border-slate-200 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                playChime('pop');
                setActiveTab(tab.id);
              }}
              className={`flex-1 min-w-[70px] py-1.5 sm:py-2 px-3 rounded-xl font-heading font-extrabold text-xs sm:text-sm transition-all duration-200 text-center cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-500/30 scale-[1.02]'
                  : 'text-slate-600 hover:text-indigo-900 hover:bg-white/80'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 4x3 Grid of pastel tiles */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3"
      >
        {currentTiles.map((tile) => (
          <motion.button
            key={tile.id}
            id={`tile-${tile.id}`}
            onClick={() => handleTileClick(tile)}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95, y: 2 }}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-b ${tile.bgGradient} border-2 ${tile.borderColor} ${tile.textColor} text-center cursor-pointer transition-shadow shadow-md select-none min-h-[82px] sm:min-h-[88px]`}
            style={{
              boxShadow: `0 4px 12px ${tile.shadowColor}`,
            }}
          >
            <span className="text-2xl sm:text-3xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] mb-1">
              {tile.icon}
            </span>
            <span className="font-heading font-black text-xs sm:text-sm tracking-wide leading-tight line-clamp-1">
              {tile.label}
            </span>
          </motion.button>
        ))}

        {/* Caregiver Add Tile Button */}
        {mode === 'caregiver' && (
          <motion.button
            onClick={() => {
              playChime('pop');
              setIsAddModalOpen(true);
            }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95, y: 2 }}
            className="flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-dashed border-purple-400 bg-purple-50/80 hover:bg-purple-100/90 text-purple-900 text-center cursor-pointer transition-all shadow-sm select-none min-h-[82px] sm:min-h-[88px]"
          >
            <span className="text-2xl sm:text-3xl text-purple-600 mb-1">➕</span>
            <span className="font-heading font-black text-xs sm:text-sm tracking-wide leading-tight">
              Add Tile
            </span>
          </motion.button>
        )}
      </motion.div>

      {/* Add Custom Tile Modal */}
      <AddCustomTileModal
        isOpen={isAddModalOpen}
        defaultCategory={activeTab}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};
