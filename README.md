# GESTIVO — Play • Learn • Grow 💜
### Animated, Child-Friendly, Sci-Fi AAC Communication & Learning Web App

**GESTIVO** is an Augmentative & Alternative Communication (AAC) and interactive learning web application designed for children with Angelman syndrome and other complex communication needs, their caregivers, speech therapists, and educators. Built with an enchanted glowing magical-forest theme, glassmorphism cards, child-friendly 3D chunky buttons, and lovable mascots, GESTIVO empowers non-verbal and speech-developing children to communicate their needs, emotions, and thoughts freely.

---

## 🌟 Key Application Architecture & Features

### 1. Visual Design & Layout (Exact Screenshot Match)
- **Left Glass Sidebar**: GESTIVO logo (star mascot, *"Play • Learn • Grow"*), glowing active navigation pills for *Home*, *Cue Camera*, *Child Mode*, *Caregiver Mode*, *Communication Board*, *Play & Learn*, *History*, *Profile*, and *Settings*, plus quick Mode switcher and *Log Out* button.
- **Top Header**: Real-time updating date & clock (`Tue, 16 Oct 2026 10:24 AM`), personalized child greeting (*"Hello, Little Explorer! Small steps... Big dreams! 💜"*), live AAC sentence strip with Speak / Clear / Backspace controls, and instant Voice Output mute toggle.
- **Hero Area**: Kids-with-pets hero artwork over the glowing crystal cavern with floating stars and the golden ribbon `⭐ Explore & Play`.
- **Quick-Communication Carousel**: 6 chunky 3D buttons with category dots (*I want*, *I'm hungry*, *I'm thirsty*, *I want to play*, *I feel*, *Yes / No*). Tapping speaks the phrase, logs to history, and adds to sentence strip.
- **Voice Bar**: Microphone pill with live animated waveform, Voice Output toggle, and Nimo speech bubble (*"Hi! I'm Nimo! Your learning buddy! Let's explore! 💙"*).
- **Communication Board Card**: Pastel card with girl avatar in the top-right, category tabs (*Basics*, *Feelings*, *Needs*, *More*), and a 4×3 grid of chunky speech tiles.
- **Quick Actions Panel**: *View History*, *Manage Goals*, *Set Reminder*, gold *Play & Learn* button, accompanied by the pink cat mascot holding the wooden *"You can do it!"* sign.
- **Recent Activity & Profile Cards**: Live 4-entry activity stream and Aarvi's child profile card (*Age 6*, chips `Brave • Kind • Smart`, personal info rows).
- **Bottom Row (5 Modular Hubs + Mobile Preview)**:
  1. *Caregiver Dashboard*: Today's activities, communications count, mood, progress bar, goal chips, and encouragement note.
  2. *History Panel*: Filter tabs (*All*, *Communication*, *Activities*, *Mood*, *Cue Camera*), 5 rows per page, pagination.
  3. *Profile & Settings*: Name, age, mode, preferred language, communication style, and edit controls.
  4. *Play & Learn Panel*: Games, stories, puzzles, video links.
  5. *Mobile Responsive Preview*: Interactive iPhone mockup showing GESTIVO's single-column mobile view with speech bubble *"Different abilities... Same big dreams! 💙"*.
- **Footer Strip**: *"More Than an App..."* with 5 pillars (*Builds Communication · Improves Focus · Encourages Independence · Supports Families · Creates Happy Moments*) and sticky note *"Small steps... Make big dreams! 💜"*.

---

### 2. Login, Security & Instant Demo Mode
- **Local Prototype Authentication**: Caregiver accounts are stored locally with passwords hashed using the **Web Crypto API (PBKDF2 with SHA-256 and unique cryptographic salts)**. No passwords are ever stored in plain text.
- **Local-Only Notice**: This is a local-first prototype. True multi-user production environments require a dedicated backend.
- **Forgot Password**: Password reset flow verified via the caregiver's 4-digit PIN.
- **Caregiver PIN**: 4-digit security PIN (default `1234` in demo) protecting Caregiver Mode, settings editing, and cue training.
- **Instant Demo Mode**:
  - Tapping **"Try Demo"** signs in instantly without typing.
  - Automatically loads the demo child **Aarvi** (Age 6, avatar `girl-bunny.png`) with realistic pre-filled data.
  - Triggers a welcome modal from the **Pink Cat** mascot (*"Welcome to GESTIVO! This is a demo."*).
  - Displays a persistent glowing **Demo Mode badge** in the sidebar with **Reset Demo Data** and **Exit Demo** actions.

---

### 3. Real-Time Camera Cue Detection (Offline MediaPipe)
- **Principle**: The system **only suggests** and never speaks until a caregiver taps *"Yes, say it"*. It detects measurable signals and maps them to messages through caregiver-taught, per-child mappings.
- **Signals Detected**:
  - Face: gaze direction, smile, mouth open, tongue out, blink/eyes closed, head tilt/turn/nod.
  - Hands: presence, open/closed, pointing, reaching, hand near mouth, flapping (wrist oscillation), clapping, waving.
  - Tracking quality: distance, lighting, face presence score.
- **Signal Smoothing**: One Euro and Exponential Moving Average (EMA) filters to tolerate tremor and ataxia.
- **Confidence Buckets**:
  - High (≥ 0.8)
  - Medium (0.55 – 0.8)
  - Low (< 0.55) -> shows *"Not sure yet"* card with the pink cat.
- **Teach a Cue Wizard**: Allows caregivers to record 10–30 neutral and active signal samples to train an in-browser k-NN classifier per child.
- **Local Models & Offline WASM**: Bundled in `/public/models` and `/public/wasm` with automatic CDN fallback.
- **Performance Watchdog**: Automatically scales back heavy models if FPS drops below 10 or latency exceeds 150ms.
- **Debug HUD**: Accessible anytime by appending `?debug=1` to the URL.

---

### 4. Interactive Mini-Games (Play & Learn)
- **Memory Game**: Animal pair matching with card flipping, move tracking, and confetti celebration.
- **Shape Match**: Shape and color identification with voice feedback.
- **Animal Sounds**: Interactive animal cards with realistic audio and speech synthesis.
- **Story Time**: Illustrated multi-page storybook (*"The Enchanted Forest of Friends"*) with read-aloud narration.

---

## 🚀 Commands to Run

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) (or the port displayed in your terminal).

### 3. Full Health Check (Typecheck + Lint + Build)
```bash
npm run check
```
Runs:
- `npm run typecheck` (`tsc --noEmit`)
- `npm run lint` (`oxlint src`)
- `npm run build` (`tsc -b && vite build`)

### 4. Optional Model Download Script
```bash
npm run download-models
```
(All models `face_landmarker.task`, `hand_landmarker.task`, `pose_landmarker_lite.task` and WASM binaries are already bundled in `public/models` and `public/wasm`).

### 5. Optional Image Cutout Script
```bash
npm run make-cutouts
```
(Uses Sharp to generate clean PNG cutouts for character assets).

### 6. Optional AI Proxy Server (for External LLMs)
If you wish to connect an external AI provider for the Sentence Helper:
```bash
cd server
npm install
cp .env.example .env
# Add your API key in server/.env
npm start
```
*Note: GESTIVO includes a fully offline, local rule-based Sentence Helper that works out of the box with zero configuration.*

---

## 📋 What You Should Know

1. **Local Prototype Mode**: Accounts, activities, and custom tiles persist in `localStorage`.
2. **Camera Permissions**: When testing the Cue Camera, allow webcam permissions in your browser. GESTIVO processes every frame locally—no video or images are ever stored or uploaded.
3. **Caregiver PIN**: Default PIN in demo mode is **`1234`**.
4. **Debug HUD**: Add `?debug=1` to any URL (e.g. `http://localhost:5173/?debug=1`) to view live FPS, inference latency, and tracking quality metrics.
