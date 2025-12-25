# Hosting Who-Bible on Firebase

This guide explains how to host your entire application (including the new Admin Panel) on Firebase Hosting and secure your database.

## Prerequisites

1.  **Node.js**: Ensure you have Node.js installed.
2.  **Firebase CLI**: Install the Firebase tools globally:
    ```powershell
    npm install -g firebase-tools
    ```

## Step 1: Initialize Firebase

1.  Open your terminal in the project root (`Who-Bible`).
2.  Login to Firebase:
    ```powershell
    firebase login
    ```
3.  Initialize the project:
    ```powershell
    firebase init
    ```
4.  **Select Features**:
    *   Use spacebar to select **Hosting: Configure files for Firebase Hosting and (optionally) set up GitHub Action deploys**.
    *   Also select **Database: Configure Realtime Database rules file** (if you want to manage rules locally).
    *   Press Enter.

5.  **Project Setup**:
    *   Select **Use an existing project**.
    *   Choose `who-bible` from the list.

6.  **Hosting Setup**:
    *   **What do you want to use as your public directory?** Type `.` (current directory) or just press Enter if it defaults to `public` (but since your files are in root, `.` is easier, OR move everything to a `public` folder. *Recommendation: Keep it simple for now, but usually moving `index.html`, `assets`, etc. to a `public` folder is cleaner. If you choose `.` (root), be careful not to deploy sensitive files.*)
    *   **Configure as a single-page app?** No (since you have `admin.html` and `community.html`).
    *   **Set up automatic builds and deploys with GitHub?** No (unless you want to).
    *   **File Overwrites**: If it asks to overwrite `index.html`, say **NO**.

## Step 2: Secure Your Database

To make the admin panel "solid" and secure, you need to set up Database Rules in the Firebase Console.

1.  Go to [Firebase Console > Realtime Database > Rules](https://console.firebase.google.com/project/who-bible/database/who-bible-default-rtdb/rules).
2.  Paste the following rules:

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "feedback": {
      // Anyone can write feedback (public)
      ".write": true,
      // Only authenticated users (Admin) can read feedback
      ".read": "auth != null"
    },
    "rooms": {
       // Existing rules for game rooms (if any)
       ".read": true,
       ".write": true
    }
  }
}
```

## Step 3: Enable Authentication

For the Admin Panel to work:

1.  Go to [Firebase Console > Authentication > Sign-in method](https://console.firebase.google.com/project/who-bible/authentication/providers).
2.  Enable **Email/Password**.
3.  Go to the **Users** tab.
4.  **Add user**: Create an account for yourself (e.g., `admin@whobible.com` with a strong password).
5.  **Use these credentials** to log in to `admin.html`.

## Step 4: Deploy

1.  Deploy your site:
    ```powershell
    firebase deploy
    ```
2.  Firebase will give you a hosting URL (e.g., `https://who-bible.web.app`).

## Accessing the Admin Panel

Once deployed, you can access your admin panel at:
`https://who-bible.web.app/admin.html`

Log in with the email/password you created in Step 3.
