# Who-Bible AI Agent Instructions

This document provides guidance for AI agents working on the Who-Bible codebase.

## Project Overview & Architecture

Who-Bible is a client-side quiz application built with vanilla HTML, CSS, and JavaScript. It has no server-side components and relies entirely on the browser for its functionality. All data is stored in the user's `localStorage`.

The application is structured into two main pages:
1.  **`index.html`**: The main quiz application.
2.  **`community.html`**: A separate, in-development page for community features.

### Key Files and Directories

-   **`index.html`**: The main entry point for the quiz application.
-   **`community.html`**: The entry point for the community section.
-   **`assets/js/app.js`**: Contains the core logic for the quiz, including game modes, question generation, scoring, and state management. This is the most important file to understand.
-   **`assets/js/community.js`**: Holds the logic for the community page, including profile management and room interactions.
-   **`assets/js/translations.js`**: Manages the internationalization (i18n) functionality, loading language files and providing text translation.
-   **`assets/i18n/`**: This directory contains the JSON files for each supported language (`en.json`, `es.json`, `fr.json`).
-   **`assets/css/styles.css`**: The single stylesheet for the entire application, including theme definitions (dark/light) and responsive design.
-   **`tools/`**: Contains helper scripts for development, such as `validate_import_sample.js`.

## Developer Workflows

### Running the Application

The application is a static site. To run it, you need a simple HTTP server. The `README.md` provides two easy ways to do this:

1.  **Using Python:**
    ```powershell
    python -m http.server 5500
    ```
2.  **Using Node.js (with `npx`):**
    ```powershell
    npx http-server -p 5500 -c-1
    ```
Then, open `http://localhost:5500` in your browser. Using a server is important for the language bundles in `assets/i18n/` to load correctly due to browser security policies (CORS).

### Testing

There is a small validation script to test the import functionality. To run it:
```powershell
npm install
npm run validate-sample
```
This script, located at `tools/validate_import_sample.js`, checks the `validatePerson` function in `app.js`.

## Conventions and Patterns

### Biblical Ethics & Content Guidelines

-   **Accuracy & Respect:** Ensure all biblical content is accurate to scripture and presented with respect. Avoid trivializing serious biblical events.
-   **Neutrality:** When dealing with theological interpretations (like in Scenario Mode), stick to what is explicitly stated in the Bible or widely accepted historical context. Avoid denominational bias where possible.
-   **Edification:** The goal is to help users learn and grow in their knowledge of the Bible. Feedback (correct/incorrect messages) should be encouraging and educational.
-   **Appropriateness:** Ensure content is suitable for all ages. Avoid graphic descriptions of violence or sensitive topics unless necessary for the biblical narrative, and even then, handle with care.

### State Management

All application state is managed in a single `state` object at the top of `assets/js/app.js`. This object holds everything from the current game mode to the player's score. All functions should read from and write to this `state` object.

### Internationalization (i18n)

-   UI text is translated using the `getText(key, params)` function from `translations.js`.
-   Language files are in `assets/i18n/`. When adding new UI text, make sure to add the corresponding keys to all three files (`en.json`, `es.json`, `fr.json`).
-   Dynamic content, like notable events and occupations, is also translated. These translations are stored in `eventTranslations` and `occupationTranslations` objects within each language JSON file.
-   When a question is generated, it now stores the "raw" (untranslated) tokens in a `raw` object. This allows the question prompt to be re-localized correctly if the user switches languages mid-quiz. See the `renderQuestion` function in `app.js` for an example.

### Data Handling

-   The primary dataset of Bible people is `DEFAULT_PEOPLE_DATA` in `app.js`.
-   Users can import their own data. The `handleImportFile` function in `app.js` uses `validatePerson` to ensure the imported data has the correct structure. When modifying data structures, update this validator.
-   All user data (settings, custom people data, community profile) is persisted in `localStorage`.

### UI and Styling

-   The UI is composed of "panels" (`setup-panel`, `game-area`, `study-panel`) that are shown or hidden by toggling their `display` style.
-   The application uses a dark theme by default, with a light theme available. Theme-related CSS variables are defined at the top of `assets/css/styles.css`.
-   The design is intended to be responsive. Media queries at the bottom of `styles.css` handle mobile layouts.

## External Dependencies

The project has no runtime external dependencies. It uses vanilla JavaScript and CSS. For development, `npx` or `python` can be used to run a local server, as noted in the `README.md`.
