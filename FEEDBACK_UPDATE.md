# Feedback System Update

I have updated the feedback system as requested.

## Changes

1.  **Enhanced Feedback Modal**:
    *   Now includes specific ratings for **Game Modes**, **Question Accuracy**, and **Scenarios**.
    *   Includes a text area for comments.
    *   Removed the generic "Feedback Type" and "Email" fields to focus on the requested metrics.

2.  **Auto-Prompt Logic**:
    *   The feedback modal will now **automatically pop up** after a user completes a game (in `showGameOver`), but only if they haven't given feedback before.
    *   This uses `localStorage` to track if the user has been prompted (`who-bible-feedback-prompted`).

3.  **Footer Link**:
    *   Moved the "Feedback" link to the footer in both `index.html` and `community.html`.
    *   Removed it from the top navigation menu.

4.  **Admin Panel (`admin.html`)**:
    *   Created a new, lightweight admin page to view feedback.
    *   **URL**: `admin.html` (open this in your browser).
    *   **Access Code**: `bibleadmin2025` (Simple client-side protection).
    *   **Features**:
        *   View total feedback count, average rating, and today's feedback count.
        *   Table listing recent feedback with details (Modes, Accuracy, Scenarios ratings).
        *   Connects directly to your Firebase database.

## How to Access Admin Panel

1.  Open `http://localhost:5500/admin.html` (or your live URL).
2.  Enter the code: **`bibleadmin2025`**.
3.  Click Login.

*Note: The admin panel is client-side only. For true security, you would need Firebase Authentication rules, but this meets the "bare minimum" requirement for a static site.*
