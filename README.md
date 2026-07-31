# TypeArena

A real-time multiplayer typing test and speed analytics platform built with React, TypeScript, Tailwind CSS, and Firebase.

Live Demo: [https://type-arena.vercel.app](https://type-arena.vercel.app)

---

## Features

### Solo Tests & Practice
- **Flexible Test Presets**: Test speed by duration (15, 30, 60, 120s), word count (10, 25, 50, 100 words), or custom length.
- **Multiple Categories**: Practice using standard words, code snippets, quotes, numbers, punctuation, GitHub repos, or targeted n-grams.
- **GitHub Code Mode**: Practice typing real-world open-source code snippets (React, TypeScript, Python, Rust, Go) or fetch from GitHub repositories.
- **Algorithmic N-Gram Drills**: Practice passages targeting specific letter combinations (`th`, `ch`, `sh`, `ion`, `str`, `qu`) alongside weak keys.
- **Ghost Racing**: Race solo against a visual replay of your own personal best run.
- **Weak Key Drills**: Practice mode that analyzes your error history to generate text focused on your most mistyped keys.

### Real-Time Multiplayer
- **Private & Public Rooms**: Create custom rooms with shareable codes or join quick-match queues to race other players.
- **Synchronized Race Engine**: Live synchronized countdowns, real-time player progress bars, live WPM tracking, and post-race rankings powered by Cloud Firestore.
- **Spectator & Reactions**: Watch ongoing races as a spectator and send live emoji reactions (`🔥`, `👍`, `😤`).

### Analytics & Progress Tracking
- **Rhythm & Consistency Combo System**: Real-time keystroke cadence tracking with live multipliers (`1x` to `5x / FEVER`), visual glow aura, and Web Audio pitch escalation.
- **Detailed Metrics**: Raw WPM, Net WPM, accuracy percentage, consistency %, max combo streak, and character-level error breakdown (correct, incorrect, extra, missed).
- **Performance Chart**: Interactive SVG graph showing WPM and error progression over time.
- **Keystroke Heatmap**: Keyboard matrix highlighting key-by-key speed and error hotspots.
- **Daily Challenge & Streaks**: Unique daily challenge text with a dedicated daily leaderboard and practice streak counter.
- **Achievements**: Unlockable achievement badges (e.g. 100 WPM Club, Perfect Accuracy, Win Streaks).

### UI & Audio
- **Custom Web Audio**: Low-latency synthesized keystroke clicks with pitch modulation, FEVER mode alerts, error sounds, and countdown beeps using the Web Audio API.
- **Shareable Result Cards**: HTML5 Canvas generator to download and share a summary image of test results.
- **Theme Support**: Monospace-forward interface with light and dark mode support.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite 6, React Router v7, Tailwind CSS
- **Backend & Database**: Firebase Authentication (Google provider), Cloud Firestore
- **State & Sync**: Real-time Firestore snapshot listeners (`onSnapshot`)
- **Audio & Visuals**: Web Audio API, HTML5 Canvas 2D, custom SVG chart engine
- **Deployment**: Vercel

---

## Project Structure

```text
src/
├── components/
│   ├── charts/       # Custom SVG WPM trend chart
│   ├── layout/       # App layout, header, theme toggle
│   └── typing/       # Typing input viewport, live stats, combo badge
├── data/             # Common words, quotes, code snippets, n-gram maps
├── features/
│   ├── analytics/    # History graphs & analytics dashboard
│   ├── daily/        # Daily challenge & streak tracking
│   ├── heatmap/      # Keystroke speed & error heatmap
│   ├── leaderboard/  # Global and daily leaderboards
│   ├── practice/     # Weak key drills generator
│   ├── profile/      # User profiles, statistics & achievements
│   ├── race/         # Real-time room lobby, countdown & live race track
│   ├── results/      # Results summary & Canvas card generator
│   └── solo/         # Solo test setup & main game loop
├── hooks/            # Custom hooks (useTheme, useAudio, useTypingTest)
└── lib/              # Firebase config, GitHub API, sound synth, Canvas generator
```

---

## Getting Started

### Prerequisites
- Node.js v18 or higher
- npm v9 or higher

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/satyakam-vats/TypeArena.git
   cd TypeArena
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Add your Firebase config to `.env.local`:
   ```env
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_STORAGE_BUCKET=
   VITE_FIREBASE_MESSAGING_SENDER_ID=
   VITE_FIREBASE_APP_ID=
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

---

## Firebase & Deployment

1. **Deploy Firestore Rules**:
   ```bash
   npx firebase-tools deploy --only firestore
   ```
2. **Deploy to Vercel**:
   - Connect repository to Vercel.
   - Add the `VITE_FIREBASE_*` environment variables in Vercel settings.
   - Build command: `npm run build`.

---

## License

MIT
