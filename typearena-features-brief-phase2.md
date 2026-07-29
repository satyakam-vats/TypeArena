# TypeArena — Feature Brief, Phase 2 (Remaining Features)

This is a continuation of the earlier features brief (heatmap, leaderboards,
analytics dashboard, profile pages). Add the following features. Figure out
data model/schema changes yourself, and propose them before writing code so
I can review.

## Quick wins

### Public / Quick-Match Races
Let users join a live race with strangers without needing a room code —
a "Join Race" button that queues them and auto-starts a race once enough
players join (or after a short timeout with fewer players / bots as filler
if needed).

### Custom Test Length
Let users type a custom duration or word count instead of only picking from
the fixed presets.

### Sound Effects Toggle
Add optional sound effects — keystroke clicks, error sound, race countdown
beep. Include a mute/settings toggle, off by default or on, your call, but
persist the preference.

## Medium effort

### Text Categories / Word Lists
Multiple text sources to type from: common words, quotes, punctuation-heavy
text, numbers, code snippets. Let the user pick a category before starting
a test.

### Practice Mode (Weak Keys)
A practice mode that generates text weighted toward the specific keys/letters
the user mistypes most often, based on their own error history.

### Streaks & Daily Challenge
- Daily login/practice streak counter.
- A "challenge of the day" — same text for every user that day, so everyone
  is racing the same content (shown separately from the regular leaderboard,
  e.g. a daily challenge leaderboard).

### Ghost Racing
Let a user race against a replay of their own past run (shown as a ghost
cursor moving through the text at their previous pace), for solo practice
against themselves.

### Spectator Mode
Allow non-participants to watch a multiplayer room's race live without
joining as a racer.

## Bigger swings

### Ranked / ELO Matchmaking
A skill rating for public races (separate from casual quick-match), with
matchmaking that pairs similarly-rated players, and the rating shown on
profile.

### Tournament Mode
Bracket-style tournaments, ideally with sign-ups and scheduled start times.

### Multiplayer Reactions
Lightweight emoji reactions during a live race (e.g. 🔥 👍 😤) — no full
chat, just quick low-distraction reactions.

### Achievements / Badges System
A small set of achievements (5-8 to start) — e.g. "100 WPM club," "perfect
accuracy run," "10-race win streak" — awarded automatically and shown on
profile.

### Shareable Race Card
Generate a shareable image/card summarizing a completed run or race result
(WPM, accuracy, rank) that users can download or share externally.

## Polish

### Onboarding
A brief first-time-user walkthrough instead of dropping new users straight
into a blank test.

### Graceful Edge Cases
Handle and design proper states for: empty leaderboard, no active public
rooms, a player disconnecting mid-race, an opponent leaving a room, failed
matchmaking timeout, etc. — don't let these fall back to blank/broken UI.

## Notes
- Keep visual style consistent with the existing app theme.
- Don't break existing functionality (solo tests, multiplayer rooms, auth,
  personal bests, and the features from Phase 1).
- Reasonable build order: quick wins first, then medium-effort features,
  then bigger swings, with polish items woven in wherever they naturally fit
  (e.g. edge-case handling as each feature is built, not saved for the end).
