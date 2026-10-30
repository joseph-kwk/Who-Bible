# 📖 Who-Bible

> **Scripture Mastery Through Play** — An interactive Bible trivia, study, and live multiplayer web application featuring 170+ biblical figures, 70+ narrative scenarios, real-time online 1v1 challenges, and projector-ready Classroom / Kahoot sessions.

Live site: **https://who-bible.web.app**

---

## ✨ Features & Game Modes

### 👥 Multiplayer & Group Play
- **🌍 Remote Challenge (Live Online 1v1)** — Create an instant room PIN (`FAITH-731`), share a direct invite link or QR code, configure match level/question count/timer as Host, and compete with live score syncing via Firebase Realtime Database. No sign-in required.
- **🏫 Classroom / Kahoot Mode ([host.html](host.html) + Player Join)** — Big-screen projector view for Sunday school, youth groups, families, and classrooms:
  - Geometric Kahoot-style answer tiles (`▲`, `◆`, `●`, `■`), synced circular countdown timer, live response counter, and QR/PIN lobby.
  - **Who-Bible Twist**: Mid-round `📜 Scripture Clue` reveal + `🔥 Faith Streak` speed & accuracy bonuses.
  - **Same-Room Rematch**: Replay another round with all connected players without re-entering a new PIN.
- **⚔️ 2-Player Pass & Play** — Turn-based competition on a single device with saved player names, strictly fair/even question counts, custom difficulty, optional per-turn blitz timers (`15s` / `30s`), and 1-tap `⚔️ Rematch`.

### 🎯 Solo & Study Modes
- **✨ Daily Scripture Challenge** — Featured daily biblical figure with a 5-question spotlight quiz and bonus XP.
- **📖 Classic Solo** — Self-paced quiz across deeds, roles/occupations, mothers, fathers, and notable scriptural accounts with verse references.
- **⏱️ Timed Mode** — Race against the countdown clock with pause/resume support and streak multipliers.
- **🎭 Scenarios Mode** — 72 contextual biblical dilemmas and narrative decisions with randomized answer order, difficulty prioritization, tags, and full scriptural explanations.
- **🔍 Study Bible People** — Streamlined reference explorer for 170+ figures with instant search, Old/New Testament segmented tabs, Easy/Medium/Hard level chips, A–Z / Z–A sorting, shuffle, and detailed profile cards.

---

## 🌐 Internationalization, Profiles & Safety

- **Multi-Language Support (`i18n`)**: Seamless switching between **English (`en`)**, **Français (`fr`)**, and **Español (`es`)**, including mid-quiz re-localization.
- **Player Progression**: Customizable biblical avatars, XP bar, career accuracy/streak stats, and rank progression (*Scripture Seeker* → *Master Theologian*), plus optional Firebase Auth cloud accounts.
- **Security & Content Moderation**:
  - Input validation, HTML sanitization (XSS protection), and client-side rate limiting (`assets/js/security.js`, `assets/js/content-filter.js`).
  - Built-in question reporting (`🚩` flag in HUD) and feedback modals synced to Firebase with `localStorage` fallback, reviewable via [admin.html](admin.html).

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| `1`, `2`, `3`, `4` | Select answer choice 1–4 |
| `Enter` / `Space` | Skip auto-advance wait & jump immediately to next question |
| `P` | Pause / Resume timer (Timed Mode) |
| `M` | Mute / Unmute sound effects |
| `Escape` | Close active modal dialog |

---

## 🚀 Local Development & Testing

### 1. Run Locally
```bash
# Built-in Node development server (http://localhost:3000)
node tools/server.js

# Or via npx
npx serve . -l 3000
```
Then open:
- **Main App**: `http://localhost:3000/`
- **Classroom Host View**: `http://localhost:3000/host.html`

### 2. Run Automated Logic Tests
```bash
node tools/test-quiz-logic.js
node tools/test-multiplayer-logic.js
```

### 3. Deploy to Firebase Hosting
```bash
firebase deploy --only hosting
```

---

## 📁 Project Structure

```text
Who-Bible/
├── index.html                  # Main SPA (Solo, Timed, Daily, Scenarios, Pass & Play, Remote, Classroom Player, Study)
├── host.html                   # Big-screen Classroom / Kahoot Host application
├── community.html              # Community hub
├── admin.html                  # Admin dashboard for feedback & question reports
├── manifest.json               # Web App Manifest & icons
├── firebase.json               # Firebase Hosting & Security Headers config
├── database.rules.json         # Firebase Realtime Database security rules
├── firestore.rules             # Cloud Firestore security rules
├── assets/
│   ├── css/
│   │   ├── styles.css          # Core application & responsive UI styles
│   │   ├── host.css            # Classroom Host projector & lobby styles
│   │   ├── welcome-modal.css   # Onboarding modal styles
│   │   ├── feedback-modal.css  # Feedback dialog styles
│   │   ├── report-modal.css    # Issue reporting dialog styles
│   │   └── auth.css            # Authentication modal styles
│   ├── data/
│   │   ├── people.json         # 170+ Biblical figures dataset
│   │   ├── bible_scenarios.json# 72 Biblical narrative scenarios
│   │   ├── concepts.json       # Biblical themes & concepts
│   │   └── locations.json      # Biblical geography data
│   ├── i18n/
│   │   ├── en.json             # English translations
│   │   ├── fr.json             # French translations
│   │   └── es.json             # Spanish translations
│   ├── images/                 # App logos & favicons
│   └── js/
│       ├── app.js              # Core game engine, state, HUD, Study Mode & Classroom Player
│       ├── host.js             # Classroom Host state machine, scoring, audio & Firebase sync
│       ├── remote-challenge.js # Live 1v1 Remote Challenge Firebase room engine
│       ├── remote-challenge-ui.js # Remote Challenge modal & lobby UI controller
│       ├── scenarios.js        # Biblical scenarios loader & filter module
│       ├── translations.js     # Localization engine
│       ├── reports.js          # Question issue reporting controller
│       ├── security.js         # Sanitization, validation & rate limiting
│       ├── content-filter.js   # Profanity/spam moderation filter
│       ├── firebase-config.js  # Firebase SDK initialization
│       ├── auth.js             # Firebase Authentication service
│       └── auth-ui.js          # Authentication modal UI
└── tools/
    ├── server.js               # Lightweight local HTTP dev server (port 3000)
    ├── test-quiz-logic.js      # Unit tests for quiz & translation logic
    └── test-multiplayer-logic.js # Unit tests for difficulty pools & PIN generation
```

---

## 📜 License

Crafted for Scripture learners everywhere. All rights reserved.
