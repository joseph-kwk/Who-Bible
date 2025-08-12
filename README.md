# Who‑Bible

A lightweight quiz app about Bible people. The app is split into static HTML, CSS, and JS with client-side i18n.

## Run

- Open `index.html` in any modern browser.
- Recommended: serve over HTTP so language bundles load (JSON fetch). For example, VS Code Live Server or any simple static server.
- If you open via `file://`, the English fallback works, but translated bundles (fr/es) may not load in some browsers due to CORS/file fetch restrictions.

### How to run locally (Windows PowerShell)

Pick one of the options below, then open the printed URL in your browser.

Option A — Python 3 (built-in server):

```powershell
cd c:\Users\Owner\Documents\Projects\Who-Bible
python -m http.server 5500
```

Option B — Node.js (no install, via npx):

```powershell
cd c:\Users\Owner\Documents\Projects\Who-Bible
npx http-server -p 5500 -c-1
```

Then visit:

```
http://localhost:5500/index.html
```

Tip: If you use VS Code, the “Live Server” extension is an easy one-click way to serve this folder.

## Internationalization (i18n)

- Languages: English (default), Français, Español.
- Translations live in `assets/i18n/{en,fr,es}.json` and are loaded on demand.
- The language selector persists your choice (`localStorage`) and updates the UI immediately, then refreshes again after the JSON bundle is loaded.
- If a key is missing in a language, it falls back to English.

## Community page (in development)

- `community.html` is a separate page and currently considered “in dev”.
- It reuses the same header/footer and i18n. Features include tabs (Explore/Live/Profile/Guidelines), a simple profile (initials avatar + display name), and a local “Live Rooms” host/list prototype stored in `localStorage`.
- Expect changes; links may open in a new tab while the page is iterated on.

## Features (main app)

- Solo, Timed, and two-player Challenge modes
- Difficulty filter (Beginner/Intermediate/Expert)
- Score and streak tracking; per-player scores in Challenge
- Keyboard navigation (arrows, Enter, 1–4, N for next, Q to quit)
- Study mode with searchable, expandable person details
- Import/Export JSON; data persists in your browser; reset to defaults

## Data format

Each person object:

```
{
  "name": "Moses",
  "aliases": ["..."],
  "mother": "Jochebed",
  "occupation": "Leader, prophet",
  "age_notes": "...",
  "notable_events": ["..."],
  "verses": ["Exodus 3"],
  "short_bio": "..."
}
```

You can export, edit, and import a JSON array of these objects.

## Original single‑file prototype

The original prototype remains at `bible_people_challenge_prd_prototype_single_file_html.html`.

