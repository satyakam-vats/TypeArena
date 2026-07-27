# TypeArena

A focused typing-speed test with shareable real-time races. Built with React, TypeScript, Tailwind CSS, Firebase Authentication, and Cloud Firestore.

## MVP features

- Solo tests by time (15/30/60/120 seconds) or word count (10/25/50/100)
- Live WPM, accuracy, character-level correct/incorrect feedback, and restart controls
- Results view with final/raw WPM, accuracy, character breakdown, and a WPM timeline
- Google sign-in, personal best tracking, and persisted run records
- Private multiplayer rooms with shareable codes, synchronized countdowns, progress bars, live WPM, and a leaderboard
- Light/dark theme with a deliberately restrained, monospace-forward interface

## Project layout

```text
src/       React frontend: screens, components, hooks, domain logic, Firebase client
firebase/  Firestore security rules and indexes (the backend configuration)
```

The word-source abstraction, extensible user stats, generic room schema, and player subcollections are intentionally designed for later additions such as custom word lists, ghosts, coaching, spectators, and matchmaking.

## Local development

```bash
npm install
copy .env.example .env.local
npm run dev
```

Add your Firebase web-app configuration to `.env.local`. Google sign-in and races are disabled until those values are present.

```text
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Firebase setup

1. Create a Firebase project and enable Google as a Firebase Authentication provider.
2. Create a Cloud Firestore database.
3. Deploy the versioned rules and indexes from this repository:

   ```bash
   npx firebase-tools deploy --only firestore
   ```

4. Add the Vercel deployment domain under Firebase Authentication → Authorized domains.

## Deployment

Import the repository into Vercel, add the same `VITE_FIREBASE_*` environment variables, and deploy. Vercel automatically uses `npm run build`.
