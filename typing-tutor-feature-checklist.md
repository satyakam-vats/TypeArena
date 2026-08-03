# Typing Tutor Platform — Feature-by-Feature Build Checklist

Use this alongside the executive summary. Each feature has its own checklist — work through them one at a time, don't try to build categories 5-12 before category 1 is solid.

---

## 1. Core Typing Exercises

### Structured Touch-Typing Lessons
- [ ] Define lesson data model (lesson id, ordered text/key sequence, difficulty tier)
- [ ] Decide the key-introduction order (home row → top row → bottom row → numbers/symbols)
- [ ] Build the lesson-rendering component (shows current target character/word)
- [ ] Track per-keystroke correctness against expected text
- [ ] Store per-user lesson completion + accuracy per attempt
- [ ] Add a "stars" or completion indicator per lesson
- [ ] Seed the first 10-15 lessons as content before building anything further

### Timed Typing Tests
- [ ] Build random word/passage generator (or curated passage bank)
- [ ] Build countdown timer component (30s/1min/2min/5min options)
- [ ] Live-highlight correct vs incorrect characters as user types
- [ ] Compute WPM and accuracy on test end
- [ ] Save result to backend (user id, wpm, accuracy, timestamp)
- [ ] Show a results screen with WPM/accuracy/errors summary

### Adaptive Drill Practices
- [x] Track per-key/per-letter error counts per user
- [x] Define a threshold rule for "this key is a weak spot"
- [x] Build a drill generator that biases text toward weak keys
- [x] Surface these drills as a suggested/recommended practice option
- [x] Re-evaluate weak-key list periodically as new data comes in

### Variable Difficulty Modes
- [x] Build/curate word lists tagged by difficulty (easy/medium/hard)
- [x] Add a mode toggle in the test UI (random words vs paragraphs vs difficulty tiers)
- [x] Make sure WPM/accuracy calculation works the same across all modes
- [x] Persist the user's last-selected mode as a preference

---

## 2. Lesson & Curriculum Systems

### Comprehensive Course Library
- [ ] Define a "course" entity that groups multiple lessons
- [ ] Build a course list/catalog page
- [ ] Track per-user progress through a course (% complete, current lesson)
- [ ] Support at least 2-3 course tracks to start (e.g. beginner, advanced, alternate layout)

### Custom Lesson Builder
- [ ] Build a text-input form for pasting/writing custom content
- [ ] Sanitize and validate submitted text (length limits, character checks)
- [ ] Split submitted text into practiceable chunks/lessons
- [ ] Save custom lessons under the user's account
- [ ] Let the user select a custom lesson as a practice source

### Cross-Curricular Content
- [ ] Curate or source themed text sets (science, literature, etc.)
- [ ] Tag lessons by theme/subject in the data model
- [ ] Add a theme filter/selector to the lesson browser

### Progressive Skill Assessment
- [ ] Build an initial placement test flow for new users
- [ ] Define WPM/accuracy thresholds that map to skill levels
- [ ] Auto-assign starting lesson/course based on placement result
- [ ] Re-assess periodically and allow moving users up a level

---

## 3. Adaptive Learning & Skill Assessment

### Error Tracking & Analysis
- [ ] Capture per-keystroke correctness in real time
- [ ] Aggregate error counts per key/letter/word per user
- [ ] Store this aggregated data in a queryable form (not just raw logs)

### Adaptive Lesson Selection
- [ ] Build a rule (or simple scoring algorithm) that ranks lessons by relevance to current weak spots
- [ ] Wire this into "recommended next lesson" logic
- [ ] Add a manual override so users can ignore the suggestion

### Skill Level Badges/Levels
- [ ] Define milestone thresholds (speed, accuracy, streaks) that trigger a badge/level
- [ ] Build the check that runs after each session to see if a threshold was crossed
- [ ] Design badge/level icons and a place to display them (profile)

### AI-Driven Content Generation
- [ ] Decide which AI provider/API will generate practice text (future scope — flag as v2+)
- [ ] Design the prompt template that requests text emphasizing specific target keys/words
- [ ] Add content filtering/validation before showing AI-generated text to users
- [ ] Cache generated content so it isn't regenerated on every request

---

## 4. UI/UX Elements

### Virtual Keyboard Display
- [ ] Build/source a keyboard layout graphic (SVG or component-based)
- [ ] Highlight the currently pressed key in real time
- [ ] Highlight the next expected key during lessons
- [ ] Optional: add finger-placement overlay per key

### Responsive, Minimal Design
- [ ] Pick a CSS framework/approach (Tailwind or similar)
- [ ] Design mobile-first, then scale up to desktop
- [ ] Remove non-essential UI chrome from the active typing screen
- [ ] Test on at least one small screen and one large screen

### Real-Time Feedback Display
- [ ] Build a live WPM counter that updates as the user types
- [ ] Build a live accuracy counter
- [ ] Build a live error counter
- [ ] Make sure these update without noticeable lag

### Replay/Playback Feature
- [ ] Store keystroke timestamps + text during a session
- [ ] Build a playback UI that replays the session at original speed
- [ ] Add playback controls (pause, speed up, restart)
- [ ] Flag as a later-phase feature — not needed for MVP

### Interactive Hand/Posture Guide
- [ ] Source/design hand-position images per key or key group
- [ ] Show the relevant image when a new key is introduced in a lesson
- [ ] Add a toggle to hide this once a user no longer needs it

### Custom Themes and Contrast Options
- [ ] Build light/dark theme using CSS variables
- [ ] Add a high-contrast theme variant
- [ ] Add a settings panel with a theme switcher
- [ ] Check contrast ratios meet accessibility guidelines

### Localized UI Strings
- [ ] Pick an i18n library/approach
- [ ] Extract all UI text into resource/translation files
- [ ] Build a language selector in the UI
- [ ] Start with 2-3 languages, structure it so more can be added later

---

## 5. Gamification

### Points, XP and Levels
- [ ] Define how points are earned (per practice second, per test completed, etc.)
- [ ] Add a points/XP field to the user profile
- [ ] Build the level-up formula (XP thresholds per level)
- [ ] Show current points/level somewhere visible (profile, header)

### Achievements/Badges/Trophies
- [ ] Define a list of achievement criteria (first 100 WPM, 10-day streak, etc.)
- [ ] Build the check that runs after sessions to award achievements
- [ ] Store awarded achievements per user
- [ ] Design badge/trophy icons and a display area (profile page)

### Leaderboards & Skill Rating
- [ ] Decide leaderboard scope (global, friends-only, per-course)
- [ ] Build the ranking query (e.g. best WPM per user)
- [ ] Decide refresh frequency (real-time vs periodic/cached)
- [ ] Build the leaderboard UI with rank, name, score

### Time-Limited Competitions
- [ ] Define competition data model (start time, end time, scoring rule)
- [ ] Build a scheduler/trigger for starting and ending competitions
- [ ] Build the join/participate flow
- [ ] Build a results/winners view after a competition ends

### Multiplayer Typing Races
- [ ] Set up a real-time connection layer (WebSockets)
- [ ] Build matchmaking or room-joining logic
- [ ] Sync typing progress between all players in a race
- [ ] Build the race UI (avatars/progress bars moving in real time)
- [ ] Handle disconnects/reconnects gracefully
- [ ] Flag as a later-phase feature — high complexity, don't attempt in MVP

### Avatars and Customization
- [ ] Design or source a set of avatar options
- [ ] Store selected avatar on the user profile
- [ ] Build an avatar selection/customization screen
- [ ] Optional: tie unlocks to achievements or currency

### In-Game Currency & Shop
- [ ] Define how currency is earned
- [ ] Build a currency balance field per user
- [ ] Build a simple shop/catalog of purchasable cosmetic items
- [ ] Build the purchase/transaction flow
- [ ] Flag as a later-phase feature

---

## 6. Social Features

### Friend/Team System
- [ ] Build a friend-request/accept flow
- [ ] Build a friends list view
- [ ] Build a team/club entity that groups multiple users
- [ ] Add team-level stats or a team page

### Private Races/Challenges
- [ ] Build a private room/invite-code system
- [ ] Restrict race access to invited users only
- [ ] Reuse the multiplayer race infrastructure for this

### Chat/Comments
- [ ] Decide on scope (race lobby chat vs lesson comments, or both)
- [ ] Build the chat/comment UI
- [ ] Add a moderation/content filter before shipping this publicly
- [ ] Flag as lower priority — needs the most safety work relative to its value

### User Profiles & Social Sharing
- [ ] Build a public/semi-public profile page (stats, achievements, avatar)
- [ ] Add share-to-social buttons for milestone results
- [ ] Decide what's visible to others vs private

### Classroom/Group Management
- [ ] Add teacher/student roles to the user model
- [ ] Build class creation and student-enrollment flow
- [ ] Build a class-level dashboard (average stats, individual standings)
- [ ] Add privacy controls appropriate for a classroom setting
- [ ] Flag as a later-phase feature — needed only if targeting schools

### Competitions & Tournaments
- [ ] Build on top of the time-limited competitions feature
- [ ] Add scheduling for recurring/seasonal events
- [ ] Add notifications for upcoming tournaments
- [ ] Build an awards/recognition view after tournaments end

---

## 7. Analytics & Dashboard

### User Progress Dashboard
- [ ] Aggregate a user's historical WPM/accuracy over time
- [ ] Build a progress chart (line graph over time)
- [ ] Show current streak, best score, recent activity
- [ ] Design the dashboard layout as the "home base" after login

### Key-Heatmap Visualization
- [ ] Aggregate per-key error counts per user
- [ ] Build a color-coded overlay on the keyboard graphic
- [ ] Update the heatmap as new data comes in

### Class/Group Analytics
- [ ] Aggregate stats across all students in a class/group
- [ ] Build average/distribution views for a teacher
- [ ] Add export options (CSV/PDF) if needed
- [ ] Depends on Classroom/Group Management being built first

### Session Logging
- [ ] Log every test/lesson attempt with full detail (wpm, accuracy, errors, timestamp)
- [ ] Add a "download my results" option for the user
- [ ] Make sure logs are queryable for the dashboard features above

### Global Usage Stats
- [ ] Decide what site-wide metrics matter (active users, races run, tests completed)
- [ ] Set up basic analytics tracking (custom counters or an analytics tool)
- [ ] Build an internal-only view if needed (not user-facing)

---

## 8. Accessibility

### Screen-Reader Compatibility
- [ ] Add ARIA labels/roles to all interactive elements
- [ ] Use semantic HTML wherever possible
- [ ] Test with an actual screen reader, not just visually

### Enhanced Keyboard Navigation
- [ ] Make every interactive element reachable via Tab
- [ ] Add visible focus indicators
- [ ] Add skip links for repetitive navigation
- [ ] Test the entire flow without touching a mouse

### High Contrast Themes
- [ ] Verify color combinations meet WCAG AA contrast ratios
- [ ] Add a dedicated high-contrast theme option
- [ ] Re-check contrast after any design changes

### Zoom/Reflow Support
- [ ] Avoid fixed pixel widths where layout should reflow
- [ ] Test the site at 200% and 400% browser zoom
- [ ] Fix any overlapping or cut-off elements at high zoom

### Voice Guidance
- [ ] Integrate the Web Speech API for reading words/instructions aloud
- [ ] Add a toggle to enable/disable voice guidance
- [ ] Test pronunciation on a sample of lesson content

### No Required PII/Email
- [ ] Support username-only account creation
- [ ] Avoid requiring email at signup (make it optional)
- [ ] Encrypt any stored personal data in transit and at rest

---

## 9. Performance & Tech Stack

### Scalable Real-Time Backend
- [ ] Choose the real-time layer (Socket.IO, native WebSockets, etc.)
- [ ] Design for horizontal scaling (sticky sessions or pub/sub via Redis)
- [ ] Load-test the real-time layer before relying on it for races

### Responsive Front End Framework
- [ ] Choose the framework (React/Vue/Svelte) and commit to it project-wide
- [ ] Set up the build tooling and project structure early
- [ ] Establish a component library/pattern before features multiply

### RESTful/API Design
- [ ] Define clear, consistent endpoint naming conventions
- [ ] Document each endpoint (input, output, auth requirements)
- [ ] Version the API from the start if long-term growth is expected

### Database & Caching
- [ ] Design the core schema (users, results, lessons, badges) before writing features against it
- [ ] Add a caching layer (Redis) for frequently-read data like leaderboards
- [ ] Set up backups/migrations discipline early

### Content Delivery
- [ ] Move static assets (images, scripts) to a CDN
- [ ] Set appropriate cache headers for static content
- [ ] Revisit this only once there's real traffic — not urgent for MVP

### Automated Testing & CI/CD
- [ ] Set up a test framework (Jest/Mocha or equivalent)
- [ ] Write tests for core logic first (WPM calc, lesson progression)
- [ ] Set up a CI pipeline that runs tests on every push
- [ ] Add a deployment step once tests are reliable

---

## 10. Security & Privacy

### TLS Encryption
- [ ] Obtain and configure an SSL certificate
- [ ] Enforce HTTPS everywhere (redirect HTTP to HTTPS)

### Authentication/Sessions
- [ ] Choose an auth approach (sessions vs JWT)
- [ ] Hash passwords properly (bcrypt or equivalent)
- [ ] Add session expiry and secure cookie settings

### Data Privacy Policy
- [ ] Draft a plain-language privacy policy
- [ ] State clearly what data is collected and that it isn't sold
- [ ] Link the policy from the site footer

### Rate Limiting & Abuse Prevention
- [ ] Add rate limiting to public/auth endpoints
- [ ] Add CAPTCHA or equivalent on signup
- [ ] Monitor for bot-like typing patterns if competitive features are live

### Age/GDPR Compliance
- [ ] Determine if the target audience includes minors
- [ ] Add parental consent flow if needed
- [ ] Review data retention/deletion policy against relevant regulations

---

## 11. Monetization Models

### Freemium with Premium Subscriptions
- [ ] Decide which features are free vs premium
- [ ] Integrate a payment provider (Stripe or similar)
- [ ] Build subscription management (upgrade/downgrade/cancel)

### Advertisements
- [ ] Decide ad placement that doesn't disrupt the typing experience
- [ ] Integrate an ad network
- [ ] Ensure ads are disabled for premium users

### School Licenses/Partnerships
- [ ] Design an institutional/bulk account structure
- [ ] Build an invoicing or licensing flow
- [ ] Flag as a later-phase feature, dependent on Classroom Management

### Sponsored Content/Events
- [ ] Flag as a later-phase, low-priority feature
- [ ] Design sponsorship as a themed event/UI variant when it comes up

### Merchandise/Affiliates
- [ ] Flag as a later-phase, low-priority feature
- [ ] Integrate affiliate links or a simple storefront if pursued

---

## 12. Localization

### Multi-language Support
- [ ] Confirm i18n framework is in place (shared with UI Elements section)
- [ ] Translate core UI strings into initial target languages
- [ ] Set up a process for community or crowd-sourced translation later

### Unicode/Multilingual Text
- [ ] Ensure the database and text fields fully support UTF-8/Unicode
- [ ] Build or source word lists for non-Latin-script languages
- [ ] Test typing tests in at least one non-English language end-to-end

### Localized Content
- [ ] Curate culturally relevant text/lesson examples per locale
- [ ] Tag content by locale in the data model
- [ ] Treat as an ongoing content task, not a one-time build

---

## Suggested Build Order (matching MVP → v1 → v2)

**MVP:** Core Typing Exercises → basic UI/UX (keyboard, feedback, responsive design) → User accounts → basic Analytics dashboard → basic Accessibility → Security/Privacy fundamentals (TLS, auth).

**v1:** Lesson & Curriculum systems → Gamification (points, badges, leaderboards) → Adaptive Learning → Localization basics.

**v2:** Multiplayer races → Social features → Classroom management → Monetization → advanced Performance/scaling work.

Don't start a later-phase checklist until the one before it is functionally complete — most of these features depend on data (users, results, error tracking) that earlier phases are responsible for generating.
