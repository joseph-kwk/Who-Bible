# Bible People Challenge

Single-page quiz app about Bible people. This folder contains a structured version split into HTML, CSS, and JS files.

## Run

- Open `index.html` in any modern browser (no build required).
- If you open via `file://`, all features work (no external fetches).

## Features

- Solo, Timed, and two-player Challenge modes
- Difficulty filter (Beginner/Intermediate/Expert)
- Score and streak tracking; per-player scores in Challenge
- Keyboard navigation (arrows, Enter, 1-4, N for next, Q to quit)
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

## Original single-file

Your original single-file prototype remains at `bible_people_challenge_prd_prototype_single_file_html.html`.

