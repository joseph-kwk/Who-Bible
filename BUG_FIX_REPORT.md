# Bug Fix Report: Uncaught TypeError in app.js

## Issue
User reported `Uncaught (in promise) TypeError: Cannot read properties of null (reading 'addEventListener')` at `app.js:507`.

## Cause
The code was attempting to attach event listeners to "Data Management" buttons (`btn-export`, `btn-import`, `btn-reset-data`, `file-input`) that are currently missing from the `index.html` file. Because `document.getElementById` returned `null` for these missing elements, calling `.addEventListener` on them threw an error.

## Fix Implemented
-   Added null checks (`if (element) ...`) before attaching event listeners for:
    -   `btnExport`
    -   `btnImport`
    -   `btnResetData`
    -   `fileInput`
-   This prevents the crash and allows the rest of the application (including the Theme and Share buttons fixed previously) to initialize correctly.

## Recommendation
If the Data Management features (Import/Export JSON) are still desired, the corresponding buttons need to be re-added to `index.html`. Currently, the logic exists in `app.js` but is dormant because the UI elements are missing.
