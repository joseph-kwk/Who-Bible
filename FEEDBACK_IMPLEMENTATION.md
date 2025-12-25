# Feedback System Implementation

I have implemented a comprehensive feedback system for Who-Bible.

## Features

1.  **In-App Feedback Modal**:
    *   Accessible via a "Feedback" button in the navigation menu on both the main quiz page and the community page.
    *   Allows users to rate their experience (1-5 stars).
    *   Users can select feedback type (General, Bug, Feature, Content).
    *   Users can leave a message and optional email.
    *   **Firebase Integration**: The feedback is automatically saved to your Firebase Realtime Database under the `feedback` node.

2.  **Consistent UI**:
    *   The modal matches the existing theme (dark/light mode compatible).
    *   Uses the existing Toast notification system for success/error messages.

## Files Created/Modified

*   `assets/css/feedback-modal.css`: New styles for the feedback modal.
*   `index.html`: Added CSS link, Feedback button, and Modal HTML.
*   `community.html`: Added CSS link, Feedback button, and Modal HTML.
*   `assets/js/app.js`: Added `initFeedback()` logic.
*   `assets/js/community.js`: Added `initFeedback()` logic.

## Alternative: Google Forms

If you prefer not to use Firebase or want a simpler way to view responses without accessing the database console, you can replace the "Feedback" button link with a Google Form URL.

To do this:
1.  Create a Google Form.
2.  Get the "Send" link.
3.  Edit `index.html` and `community.html`:
    Change:
    ```html
    <button id="btn-feedback" ...>Feedback</button>
    ```
    To:
    ```html
    <a href="YOUR_GOOGLE_FORM_URL" target="_blank" class="nav-link">Feedback</a>
    ```

## Viewing Feedback

To view the feedback submitted via the new modal:
1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Select your project (`who-bible`).
3.  Go to **Realtime Database**.
4.  Look for the `feedback` node.
