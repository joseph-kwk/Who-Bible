# Timer Display Fix Report

## Issue
The user reported that in Timed Mode, the timer countdown text (e.g., "60 s") would freeze at the initial value, even though the timer was running internally (evidenced by color changes and warnings at 30s/10s).

## Root Cause Analysis
1.  **DOM Replacement**: The `assets/js/translations.js` file contains logic to translate the timer label. When it runs (e.g., on initialization), it replaces the `innerHTML` of the `#timer` element.
2.  **Stale Reference**: `assets/js/app.js` was storing a reference to the `#time-remaining` span in a constant `timeRemainingEl` at page load.
3.  **Disconnect**: When `translations.js` replaced the inner HTML, it destroyed the original span and created a new one. `app.js` continued to update the *old, detached* span, so the user saw no change on the screen.

## Fix Implemented
-   **Dynamic DOM Querying**: Modified `startTimer` in `assets/js/app.js` to dynamically query `document.getElementById('time-remaining')` inside the timer interval.
-   **Removed Stale Const**: Removed the global `const timeRemainingEl` declaration to prevent accidental usage of the stale reference.

## Verification
1.  **Start Timed Mode**: The timer should now visually count down (60, 59, 58...).
2.  **Color Changes**: The timer background should still change colors at 15s (yellow) and 5s (red).
3.  **Warnings**: The toast warnings at 30s and 10s should still appear.
