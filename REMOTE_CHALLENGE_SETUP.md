# Remote Challenge Setup Guide

## Firebase Setup (One-time, 5 minutes)

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name: `who-bible` (or your choice)
4. Disable Google Analytics (optional)
5. Click "Create Project"

### Step 2: Enable Realtime Database
1. In your Firebase project, go to **Build > Realtime Database**
2. Click "Create Database"
3. Choose location (e.g., `us-central1`)
4. Start in **Test Mode** (for development)
   - This allows read/write for 30 days
   - Later, we'll add security rules

### Step 3: Get Configuration
1. Go to **Project Settings** (gear icon)
2. Scroll to "Your apps" section
3. Click the **Web** icon (`</>`)
4. Register app name: `Who-Bible Web`
5. **Copy the `firebaseConfig` object**

### Step 4: Update Configuration File
Open `assets/js/firebase-config.js` and replace the placeholder config:

```javascript
const firebaseConfig = {
  apiKey: "AIza...", // Paste your values here
  authDomain: "who-bible-xxxxx.firebaseapp.com",
  databaseURL: "https://who-bible-xxxxx-default-rtdb.firebaseio.com",
  projectId: "who-bible-xxxxx",
  storageBucket: "who-bible-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### Step 5: Security Rules (Production)
Go to **Realtime Database > Rules** and add:

```json
{
  "rules": {
    "rooms": {
      "$roomCode": {
        ".read": true,
        ".write": "!data.exists() || data.child('status').val() !== 'completed'",
        "players": {
          ".validate": "newData.hasChildren(['player1'])"
        }
      }
    }
  }
}
```

This allows:
- Anyone to read rooms
- Only create new rooms or update non-completed ones
- Prevents tampering with finished games

## Features

### Remote Challenge Mode
- **Create Room**: Host creates a room and gets a shareable link
- **Join Room**: Friend clicks link and joins with their name
- **Real-time Sync**: Both players answer same questions, scores update live
- **No Sign-in**: Just enter names, no authentication required
- **Room Codes**: Easy-to-share codes like `FAITH-247`

### Usage Flow
1. Player 1: Click "Remote Challenge" → Enter name → Share link
2. Player 2: Click link → Enter name → Click "Ready"
3. Both: Click "Ready" → Quiz starts automatically
4. Play: Answer questions, see opponent's score in real-time
5. Results: Winner announced when quiz completes

## Cost (Free Tier)
- **Simultaneous connections**: 100
- **Storage**: 1 GB
- **Download**: 10 GB/month
- **Cost**: $0 (stays free with normal usage)

## Future: Full Community Rooms (Phase 2)
Once Firebase is set up, we can easily add:
- **Tournaments**: Multi-player brackets
- **Leaderboards**: Global rankings
- **Persistent Rooms**: Save room history
- **Chat**: In-game messaging
- **Spectator Mode**: Watch others play
- **Room Lobbies**: Browse available rooms
- **Friend System**: Add friends, invite to games

All of this uses the same Firebase infrastructure!

## Testing Without Firebase
The app works fine without Firebase:
- Local Challenge mode still works (2 players on same device)
- Solo and Timed modes unaffected
- Remote Challenge button only shows if Firebase configured

## Troubleshooting

### "Firebase not available"
- Check that Firebase SDK is loaded in `index.html`
- Verify `firebaseConfig` has real values (not placeholders)
- Check browser console for errors

### "Room not found"
- Room codes expire after 24 hours of inactivity
- Check for typos in room code
- Create a new room if old one expired

### Database Permission Denied
- Check Firebase Console > Realtime Database > Rules
- Ensure rules allow read/write
- May need to re-publish rules

## Support
For issues, check:
1. Browser console (F12) for errors
2. Firebase Console > Realtime Database > Data (see room data)
3. Network tab (check Firebase requests)
