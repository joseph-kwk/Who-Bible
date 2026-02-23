# 📖 Who-Bible

> **An interactive Bible quiz application for learning about biblical figures through engaging game modes, community features, and comprehensive study tools.**

Who-Bible is a client-side web application built with vanilla HTML, CSS, and JavaScript. It offers multiple quiz modes, a community platform for live multiplayer games, content moderation for a safe environment, and powerful study tools—all while supporting multiple languages.

---

## ✨ Features Overview

### 🎮 Quiz Modes

**Five distinct game modes** to test and expand your biblical knowledge:

1. **Classic Mode** – Identify Bible people from clues about their family, occupation, and events
2. **Timed Mode** – Race against the clock with a countdown timer for each question
3. **Challenge Mode** – Two-player competition with separate scoring and turn-based gameplay
4. **Scenario Mode** – Understand biblical narratives through contextual scenarios
5. **Relationship Mode** – Test your knowledge of family connections and relationships between Bible figures

### 🏆 Difficulty Levels

- **Beginner** – Well-known figures with clear clues
- **Intermediate** – Moderately known figures requiring deeper knowledge
- **Expert** – Obscure figures and challenging questions

### 📚 Study Mode

A comprehensive reference tool featuring:
- **Searchable database** of 400+ Bible people
- **Expandable cards** with detailed information
- **Family trees** showing relationships
- **Notable events** with scripture references
- **Testament filtering** (Old Testament / New Testament)
- **Importance filtering** (1-5 scale)

### 👥 Community Features

Access via [community.html](community.html):

**🌍 Explore Tab**
- Browse Bible people from the database
- Filter by testament and importance
- View detailed profiles with relationships

**🎲 Live Rooms Tab**
- Create multiplayer quiz rooms (Kahoot-style)
- Join existing rooms with unique codes
- Real-time player joining and host controls
- Configure questions, difficulty, and game settings

**💡 Concepts Tab**
- Explore biblical concepts and themes
- Search by keyword
- Filter by difficulty

**👤 Profile Tab**
- Customizable display name and bio
- Avatar with initials and color themes
- Personal statistics (quizzes played, best score, accuracy)
- Learning progress tracking

**📋 Guidelines Tab**
- Community standards and expectations
- Content policy and reporting information

### 🛡️ Security & Moderation

**Comprehensive content filtering** to maintain a safe, friendly environment:

- **Profanity Filter** – Blocks 27+ inappropriate words with L33tspeak normalization
- **PII Detection** – Prevents sharing of emails, phone numbers, addresses, SSN, credit cards
- **Spam Protection** – Detects repeated characters, excessive caps, promotional content
- **URL Filtering** – Blocks unauthorized links and social media handles
- **XSS Prevention** – All user content sanitized before display

**Input validation** applied to:
- Profile usernames (2-20 chars, alphanumeric, must start with letter, reserved words blocked)
- Profile bios (max 200 chars)
- Live room names
- Feedback submissions
- Report details

### 📣 Reporting System

Users can report issues with questions, answers, or content:

**Report Types:**
- Wrong Answer
- Wrong Question
- Poor Wording
- Biblical Accuracy
- Other Issues

**Features:**
- 🚩 Flag buttons appear next to questions and answers
- Context capture (question, answers, user info, timestamp)
- Dual storage (Firebase Realtime Database + localStorage fallback)
- Admin review dashboard

### 🔧 Admin Dashboard

Access via [admin.html](admin.html) (requires authentication):

- **Feedback Management** – View and respond to user feedback
- **Reports Dashboard** – Review content reports with filtering by status/type
- **Status Management** – Mark reports as reviewed, resolved, or dismissed
- **Detailed Context** – View full question context, user info, timestamps

### 🏫 Host/Classroom Mode

Access via [host.html](host.html):

Create Kahoot-style quiz sessions for classrooms or groups:
- Generate unique room codes
- Real-time player lobby
- Live scoreboard and leaderboard
- Timed questions with automatic progression
- Final results and awards

### 🌐 Internationalization (i18n)

**Three languages supported:**
- 🇺🇸 English (default)
- 🇫🇷 Français
- 🇪🇸 Español

**Translation system:**
- Language files in `assets/i18n/{en,fr,es}.json`
- Dynamic content translation (events, occupations, relationships)
- Persistent language preference (`localStorage`)
- Fallback to English for missing keys
- Mid-quiz language switching preserves game state

### 📊 Score & Statistics

- Per-game scoring with streak tracking
- Historical results stored in `localStorage`
- Best score and accuracy calculations
- Perfect game tracking
- Mode-specific statistics
- Two-player separate scores in Challenge mode

### ⌨️ Keyboard Navigation

- **Arrow keys** – Navigate through answer options
- **Enter** – Select highlighted answer
- **1-4** – Quick select answers
- **N** – Next question (after answering)
- **Q** – Quit to menu
- **Tab** – Cycle through UI elements

### 🎨 Theming

- **Dark theme** (default) – Eye-friendly for extended play
- **Light theme** – Bright, clean interface
- Smooth theme transitions
- Persistent theme preference

---

## 🚀 Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- HTTP server (for full functionality)

### Quick Start

**Option A – Python 3 (built-in server):**

```powershell
cd path\to\Who-Bible
python -m http.server 5500
```

**Option B – Node.js (via npx):**

```powershell
cd path\to\Who-Bible
npx http-server -p 5500 -c-1
```

**Option C – VS Code Live Server:**

1. Install the "Live Server" extension
2. Right-click `index.html`
3. Select "Open with Live Server"

Then visit:
```
http://localhost:5500/index.html
```

### Why serve over HTTP?

- Language bundles load via JSON fetch
- Firebase integration requires HTTP/HTTPS
- Avoids CORS restrictions with `file://` protocol
- English fallback works without server, but translations may not load

---

## 📁 Project Structure

```
Who-Bible/
├── index.html              # Main quiz application
├── community.html          # Community features (live rooms, profiles)
├── admin.html              # Admin dashboard (feedback and reports)
├── host.html               # Host view for classroom mode
├── maintenance.html        # Maintenance mode page
│
├── assets/
│   ├── css/
│   │   ├── styles.css         # Main application styles
│   │   └── report-modal.css   # Report modal styling
│   │
│   ├── js/
│   │   ├── app.js             # Core quiz logic and game modes
│   │   ├── community.js       # Community page functionality
│   │   ├── translations.js    # i18n system
│   │   ├── reports.js         # Reporting system
│   │   ├── content-filter.js  # Content moderation and validation
│   │   └── firebase-config.js # Firebase configuration
│   │
│   ├── i18n/
│   │   ├── en.json            # English translations
│   │   ├── fr.json            # French translations
│   │   └── es.json            # Spanish translations
│   │
│   ├── data/
│   │   └── people.json        # Bible people dataset (optional)
│   │
│   └── images/
│       └── logo.png           # Who-Bible logo
│
├── tools/
│   ├── validate_import_sample.js  # Test import validation
│   ├── export_default_people.js   # Export data utility
│   ├── enhance_relationships.js   # Add relationship data
│   └── ...                        # Other development tools
│
├── firebase.json           # Firebase hosting configuration
├── firestore.rules         # Firestore security rules
├── database.rules.json     # Realtime Database security rules
├── package.json            # Node.js dependencies (dev only)
│
└── Documentation/
    ├── REPORTING_SYSTEM.md              # Reporting feature docs
    ├── CONTENT_SECURITY_REVIEW.md       # Security implementation
    ├── KAHOOT_CLASSROOM_MODE.md         # Host mode guide
    ├── RELATIONSHIP_INTEGRATION_COMPLETE.md
    └── ...                              # Additional guides
```

---

## 📦 Data Format

Bible people are stored as JSON objects with this structure:

```json
{
  "name": "Moses",
  "aliases": ["Moshe"],
  "father": "Amram",
  "mother": "Jochebed",
  "spouse": "Zipporah",
  "children": ["Gershom", "Eliezer"],
  "siblings": ["Aaron", "Miriam"],
  "occupation": "Leader, prophet, lawgiver",
  "age_notes": "Lived 120 years",
  "notable_events": [
    "Led the Israelites out of Egypt",
    "Received the Ten Commandments",
    "Parted the Red Sea"
  ],
  "verses": ["Exodus 2-40", "Deuteronomy 34"],
  "short_bio": "Moses led the Israelites out of Egyptian slavery...",
  "testament": "OT",
  "importance": 5,
  "relationships": {
    "father": "Amram",
    "mother": "Jochebed",
    "siblings": ["Aaron", "Miriam"],
    "spouse": "Zipporah",
    "children": ["Gershom", "Eliezer"]
  }
}
```

### Import/Export

- **Export** – Download your custom dataset as JSON
- **Import** – Upload a JSON file (validated before import)
- **Reset** – Restore to default 400+ people dataset
- **Validation** – Ensures proper structure and required fields

---

## 🛠️ Development

### Testing Import Validation

A Node.js script tests the import validation logic:

```powershell
npm install
npm run validate-sample
```

This runs `tools/validate_import_sample.js` and prints validation results.

### Available Tools

Located in `tools/` directory:

- `export_default_people.js` – Export default dataset
- `enhance_relationships.js` – Add relationship metadata
- `merge_relationships.js` – Merge relationship data
- `import_new_people.js` – Import new people from CSV
- `contrast_check.js` – Verify color contrast ratios

### Firebase Integration

The app uses Firebase for:
- **Realtime Database** – Live rooms, feedback, reports
- **Hosting** – Production deployment

To deploy:

```powershell
firebase deploy
```

Configuration files:
- `firebase.json` – Hosting settings
- `database.rules.json` – Database security rules
- `firestore.rules` – Firestore security rules

---

## 🔒 Security & Privacy

### Client-Side Only

- **No server required** – All logic runs in the browser
- **No account creation** – Anonymous by default
- **Local storage** – Data persists in your browser

### Data Collection

When using community features:
- Optional display name and bio (validated)
- Anonymous feedback and reports
- No personal information collected
- Firebase stores: room data, feedback, reports (minimal info)

### Content Moderation

- All user inputs validated before processing
- Profanity automatically filtered
- PII (emails, phones, etc.) blocked
- Spam detection active
- XSS protection via output sanitization

For detailed security measures, see [CONTENT_SECURITY_REVIEW.md](CONTENT_SECURITY_REVIEW.md).

---

## 🎯 Use Cases

### Personal Study
- Learn Bible figures at your own pace
- Study mode for reference and research
- Track your progress and accuracy

### Classroom/Group Settings
- Host mode for interactive lessons
- Live multiplayer competition
- Engaging way to teach biblical history

### Family/Friends
- Challenge mode for friendly competition
- Multiple difficulty levels for all ages
- Relationship mode for family connections

### Church/Ministry
- Educational tool for youth groups
- Bible study supplement
- Community engagement platform

---

## 🤝 Contributing

### Reporting Issues

Use the in-app reporting system:
1. Click the 🚩 flag icon next to any question/answer
2. Select report type
3. Provide details
4. Submit for admin review

### Content Suggestions

Feedback welcome via:
- In-app feedback modal
- Community guidelines tab
- Admin contact (see admin dashboard)

### Development Guidelines

See [.github/copilot-instructions.md](.github/copilot-instructions.md) for:
- Biblical content standards
- Code conventions
- State management patterns
- i18n best practices

---

## 📚 Documentation

Comprehensive guides available:

- **[REPORTING_SYSTEM.md](REPORTING_SYSTEM.md)** – Report feature implementation
- **[CONTENT_SECURITY_REVIEW.md](CONTENT_SECURITY_REVIEW.md)** – Security and moderation
- **[KAHOOT_CLASSROOM_MODE.md](KAHOOT_CLASSROOM_MODE.md)** – Host mode guide
- **[RELATIONSHIP_INTEGRATION_COMPLETE.md](RELATIONSHIP_INTEGRATION_COMPLETE.md)** – Relationship system
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** – Testing procedures
- **[FIREBASE_HOSTING_GUIDE.md](FIREBASE_HOSTING_GUIDE.md)** – Deployment guide

---

## 🗺️ Roadmap

### Current Focus
- ✅ Content moderation and filtering
- ✅ Reporting system
- ✅ Admin dashboard
- ✅ Host/Classroom mode

### Future Enhancements
- User authentication (optional)
- Enhanced analytics
- More game modes
- Mobile app (PWA)
- Expanded language support
- Advanced study tools

---

## 📱 Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

**Requires:**
- ES6+ JavaScript support
- localStorage API
- Fetch API
- CSS Grid/Flexbox

---

## 📄 License

This project is provided as-is for educational purposes. Biblical content is sourced from public domain scripture references.

---

## 🙏 Acknowledgments

- Biblical data curated from scripture references
- Community feedback and testing
- Open source tools and libraries

---

## 📞 Support

For issues, questions, or feedback:
- Use the in-app feedback system
- Check documentation in the project root
- Review community guidelines

---

**© 2026 Who-Bible | Building biblical knowledge through interactive learning** 📖✨

