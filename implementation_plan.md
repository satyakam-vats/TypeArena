# TypeArena MVP implementation plan

## Scope and delivery boundary

This plan covers the resume-project MVP only: solo tests, results, Firebase Google sign-in, personal history/best score, and share-code multiplayer races. The AI coach, ghosts, custom lists, spectators, leaderboards, matchmaking, achievements, streaks, and mobile-specific UX are deliberately **not** implemented. The data model and module boundaries leave room for them without coupling the MVP to speculative features.

## Proposed stack

- React + TypeScript, built with Vite
- Tailwind CSS for the responsive light/dark UI
- Firebase Authentication (Google provider)
- Cloud Firestore for user data and real-time room/race state
- Firebase JS SDK only; no custom server is needed for the MVP
- Vercel hosting, with Firebase configuration in Vercel environment variables
- Recharts for the results WPM-over-time chart
- `@fontsource/jetbrains-mono` (or a system monospace fallback) for typing text

## Project structure

```text
TypeArena/
├── implementation_plan.md
├── architecture.eraser
├── .env.example
├── .gitignore
├── firebase.json                         # optional local emulator configuration
├── firestore.rules                       # authenticated ownership/room access rules
├── firestore.indexes.json                # history/race query indexes if required
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── assets/
    ├── components/
    │   ├── layout/
    │   │   ├── AppShell.tsx
    │   │   ├── Header.tsx
    │   │   └── ThemeToggle.tsx
    │   ├── typing/
    │   │   ├── TestControls.tsx
    │   │   ├── TypingViewport.tsx
    │   │   ├── TypingInput.tsx
    │   │   ├── LiveMetrics.tsx
    │   │   └── CharacterState.tsx
    │   ├── results/
    │   │   ├── ResultsSummary.tsx
    │   │   ├── WpmTimelineChart.tsx
    │   │   └── CharacterBreakdown.tsx
    │   ├── race/
    │   │   ├── RoomLobby.tsx
    │   │   ├── RaceCountdown.tsx
    │   │   ├── RacerProgressList.tsx
    │   │   ├── RacerProgressBar.tsx
    │   │   └── Leaderboard.tsx
    │   └── auth/
    │       └── AuthButton.tsx
    ├── features/
    │   ├── solo/
    │   │   ├── SoloTestPage.tsx
    │   │   ├── useSoloTest.ts
    │   │   └── soloTestMachine.ts
    │   ├── results/
    │   │   └── ResultsPage.tsx
    │   ├── race/
    │   │   ├── RaceLandingPage.tsx
    │   │   ├── RoomPage.tsx
    │   │   ├── useRaceRoom.ts
    │   │   ├── useRaceProgress.ts
    │   │   └── raceMachine.ts
    │   └── profile/
    │       └── ProfilePage.tsx
    ├── lib/
    │   ├── firebase.ts
    │   ├── auth.ts
    │   ├── firestore/
    │   │   ├── users.ts
    │   │   ├── testRuns.ts
    │   │   └── rooms.ts
    │   ├── typing/
    │   │   ├── metrics.ts
    │   │   ├── diff.ts
    │   │   ├── wordSources.ts
    │   │   └── testText.ts
    │   ├── race/
    │   │   ├── roomCode.ts
    │   │   ├── clock.ts
    │   │   └── standings.ts
    │   └── utils/
    │       ├── dates.ts
    │       └── formatters.ts
    ├── hooks/
    │   ├── useAuth.ts
    │   ├── useTheme.ts
    │   └── useServerOffset.ts
    ├── context/
    │   ├── AuthContext.tsx
    │   └── ThemeContext.tsx
    ├── types/
    │   ├── user.ts
    │   ├── typing.ts
    │   ├── testRun.ts
    │   └── room.ts
    └── data/
        └── commonEnglishWords.ts
```

### Architecture decisions

- **Feature folders own screens and state transitions; reusable components stay presentation-focused.** This keeps solo and race timing rules testable and prevents the race screen from becoming a large monolith.
- **Typing logic is framework-independent.** `metrics.ts` and `diff.ts` take strings/events and return typed results. The UI only renders those results.
- **Text comes from a `WordSource` interface.** The initial `common-en` source is local and seeded, while later code/quote/language/custom sources can implement the same interface.
- **Firebase data access is isolated in `lib/firestore`.** Components do not issue direct Firestore queries or writes.
- **Room documents represent a generic session container.** `roomType`, `settings`, `content`, `lifecycle`, and extensible `metadata` fields prevent a schema rewrite for private matchmaking, spectator, or other future room modes.
- **The client computes local typing feedback; Firestore receives throttled race snapshots.** This gives responsive character highlighting while keeping real-time traffic controlled. Race finishing and host actions use Firestore transactions and server timestamps.

## Core domain types

```ts
type TestMode = "time" | "words";
type TestSettings = {
  mode: TestMode;
  value: 15 | 30 | 60 | 120 | 10 | 25 | 50 | 100;
  wordSourceId: "common-en";
};

type RunMetrics = {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  extraChars: number;
  missedChars: number;
  durationMs: number;
  samples: Array<{ elapsedMs: number; wpm: number; rawWpm: number }>;
};

type WordSource = {
  id: string;
  getText(input: { wordCount: number; seed: string }): string;
};
```

## Firestore schema

All timestamps are Firestore `Timestamp` values. A field documented as an object is intentionally extensible; only the listed MVP keys are required.

```text
users/{uid}
  displayName: string
  photoURL: string | null
  email: string | null
  createdAt: Timestamp
  updatedAt: Timestamp
  preferences: {
    theme: "light" | "dark" | "system"
  }
  stats: {
    personalBestWpm: number
    testsCompleted: number
    racesCompleted: number
    ...future aggregated stats
  }
  featureData: { ...future user-owned data }

users/{uid}/recentRuns/{runId}
  runId: string                         # same id as testRuns/{runId}
  kind: "solo" | "race"
  wpm: number
  accuracy: number
  completedAt: Timestamp
  roomId: string | null

testRuns/{runId}
  ownerId: string
  kind: "solo" | "race"
  settings: {
    mode: "time" | "words"
    value: number
    wordSourceId: string
    ...future test/race options
  }
  content: {
    sourceId: string
    seed: string
    text: string
    version: 1
  }
  metrics: RunMetrics
  roomId: string | null
  race: { placement: number | null, finishedAt: Timestamp | null }
  createdAt: Timestamp
  completedAt: Timestamp
  metadata: { ...future analysis references }

rooms/{roomId}
  roomCode: string                      # short, unique, shareable code
  roomType: "race"                      # expansion point: private/public/matchmade/etc.
  hostId: string
  status: "waiting" | "countdown" | "racing" | "finished" | "cancelled"
  settings: {
    mode: "time" | "words"
    value: number
    maxPlayers: number
    wordSourceId: string
    raceTimeoutMs: number
    ...future room options
  }
  content: {
    sourceId: string
    seed: string
    text: string
    version: 1
  }
  lifecycle: {
    createdAt: Timestamp
    countdownStartedAt: Timestamp | null
    raceStartedAt: Timestamp | null
    endsAt: Timestamp | null
    finishedAt: Timestamp | null
  }
  metadata: { ...future room-level configuration }

rooms/{roomId}/players/{uid}
  uid: string
  displayName: string
  photoURL: string | null
  role: "host" | "player"             # extension point: spectator/moderator
  joinedAt: Timestamp
  presence: "joined" | "ready" | "left"
  progress: {
    typedChars: number
    totalChars: number
    percent: number
    liveWpm: number
    accuracy: number
    updatedAt: Timestamp
  }
  result: {
    status: "pending" | "finished" | "timed_out"
    finishedAt: Timestamp | null
    finishElapsedMs: number | null
    finalWpm: number | null
    rawWpm: number | null
    accuracy: number | null
    testRunId: string | null
  }
```

### Firestore querying and retention

- The profile queries `users/{uid}/recentRuns` ordered by `completedAt desc`, limited to 20. A transaction/Cloud Function is unnecessary for the MVP: on each completed run, the client writes the summary and removes documents older than the newest 20 in the same authenticated owner scope.
- `testRuns` holds complete immutable result records for the current product. `recentRuns` is an optimized denormalized profile index.
- Race participants are a subcollection rather than an array so each player can update only their own progress document, avoiding room-document contention and size growth.
- The room document has the canonical shared test text. Every participant uses this exact text.

### Security rules design

- Require authentication for all writes and for user/race reads.
- A user may read/write only their own `users/{uid}` and `recentRuns` documents.
- A user may create `testRuns` only with `ownerId == request.auth.uid`; completed records are immutable to the owner.
- Players can create/update only `rooms/{roomId}/players/{theirUid}` and only safe progress/result fields. They cannot alter other players, `hostId`, source text, or lifecycle.
- Host-only transitions (`waiting → countdown`) are validated with `hostId == request.auth.uid`. Race start/end transitions should be validated against allowed statuses and server time. Firestore transactions protect against concurrent joins, starts, and duplicated finish writes.

## MVP screens and flows

1. **Solo test:** choose time/word mode and preset, generate seeded text, begin on first printable input, render character state and live metrics, end on timer or word target.
2. **Results:** calculate final metrics and character diff, render the sampled WPM line chart, persist the authenticated user’s run and updated aggregate stats, and offer restart with unchanged settings.
3. **Race landing/lobby:** authenticated user creates a room or joins using a code/link; the lobby subscribes to the room and players subcollection, lists waiting players, and lets the host start.
4. **Race:** host writes a server-timestamped countdown start. All clients derive countdown/race time from the server clock offset, then subscribe to player progress. Each client throttles its own progress write (for example, 4 writes per second) and atomically locks its final result once finished.
5. **Leaderboard:** finish when all joined players are terminal or `endsAt` is reached. Sort finished racers by finish elapsed time, then display the canonical results and persist each authenticated participant’s own run.

## Implementation order after approval

1. Scaffold Vite/React/TypeScript/Tailwind and configure Firebase/Vercel environment variables.
2. Add shared types, word-source abstraction, deterministic text generation, diffing, metrics, and unit tests for calculations.
3. Build the solo test UI, timer/word state machine, and results/chart flow.
4. Add Google sign-in, user document initialization, run persistence, best WPM, and recent-history query.
5. Add Firestore rules/indexes and Firebase Emulator checks.
6. Implement create/join/lobby lifecycle, synchronized countdown, throttled progress, race completion, and leaderboard.
7. Add responsive polish, accessibility/keyboard checks, empty/error/loading states, and deploy to Vercel.

## Verification plan

- Unit-test WPM, raw WPM, accuracy, and correct/incorrect/extra/missed-character calculation.
- Verify each allowed solo duration and word preset, restart behavior, and chart samples.
- Test auth persistence and that only the 20 most recent summary records are shown.
- Use two browser sessions (and Firebase Emulator where possible) to validate create/join, late join restrictions, synchronized countdown, live progress updates, host start permissions, finish ordering, and timeout completion.
- Confirm Firestore rules reject cross-user writes and non-host lifecycle changes.
- Test keyboard-only operation, readable dark/light contrast, and narrow mobile layouts before deployment.

## Configuration needed later

```text
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Firebase Authorized Domains must include the deployed Vercel domain before Google sign-in will work.
