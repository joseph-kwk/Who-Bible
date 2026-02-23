# Player Name Display Issue - Debug Instructions

## Issue Description
User saved guest player name as "Jordana" but the display shows "Julia" instead.

## Troubleshooting Steps

### Step 1: Check localStorage in Browser Console

Open the browser console (F12) and run these commands:

```javascript
// Check what's stored in localStorage
console.log('Player data:', localStorage.getItem('who-bible-player'));
console.log('Community profile:', localStorage.getItem('communityProfile'));
console.log('Profile name:', localStorage.getItem('who-bible-profile-name'));

// Parse and display the actual player object
const player = JSON.parse(localStorage.getItem('who-bible-player'));
console.log('Player name from storage:', player?.name);

// Check what's in state
console.log('Current player in state:', state.currentPlayer);
console.log('State player name:', state.currentPlayer?.name);

// Check the DOM element
const nameEl = document.getElementById('current-player-name');
console.log('Name element text:', nameEl?.textContent);
```

### Step 2: Force Update the Player Name

If the localStorage has "Jordana" but the display shows "Julia", try forcing an update:

```javascript
// Manually set the player name
const player = JSON.parse(localStorage.getItem('who-bible-player'));
player.name = 'Jordana';
localStorage.setItem('who-bible-player', JSON.stringify(player));

// Force reload the player
state.currentPlayer = player;

// Update the display
const nameEl = document.getElementById('current-player-name');
if (nameEl) nameEl.textContent = player.name;

// Call the update function
if (typeof updatePlayerDisplayName === 'function') {
  updatePlayerDisplayName();
}
```

### Step 3: Clear Conflicting Data

The issue might be caused by conflicting localStorage entries. Try clearing them:

```javascript
// Option 1: Just clear the community profile (keeps main player data)
localStorage.removeItem('communityProfile');
localStorage.removeItem('who-bible-profile-name');

// Then reload the page
location.reload();

// Option 2: Clear all Who-Bible data (WARNING: loses all progress)
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('who-bible')) {
    localStorage.removeItem(key);
  }
});
localStorage.removeItem('communityProfile');
location.reload();
```

### Step 4: Test the Name Change Flow

1. Click on the player name display
2. Enter "Jordana" in the modal
3. Click Save
4. Open console and immediately check:
   ```javascript
   console.log('After save:', JSON.parse(localStorage.getItem('who-bible-player')).name);
   ```
5. If it says "Jordana" in console but still shows "Julia" in UI, there's a display update issue
6. If it says "Julia" in console, there's a save issue

## Possible Root Causes

### 1. Browser Cache Issue
**Symptoms:** localStorage has correct data but display is wrong
**Fix:** Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### 2. Multiple Browser Tabs
**Symptoms:** One tab has old data, another has new data
**Fix:** Close all tabs, open only one tab

### 3. Incognito/Private Mode
**Symptoms:** Data doesn't persist between sessions
**Fix:** Use normal browser mode

### 4. localStorage Quota Exceeded
**Symptoms:** Save appears to work but data isn't actually saved
**Fix:** Clear some localStorage data

### 5. Race Condition
**Symptoms:** Name briefly shows correct value then changes back
**Fix:** Check if translations.js is re-calling displayPlayerInfo with old state

## Temporary Workaround

Add this code to browser console to force the correct name:

```javascript
// Run this every time the page loads
setInterval(() => {
  const player = JSON.parse(localStorage.getItem('who-bible-player'));
  const nameEl = document.getElementById('current-player-name');
  if (nameEl && player && nameEl.textContent !== player.name) {
    console.warn('Name mismatch detected! Fixing...');
    nameEl.textContent = player.name;
  }
}, 1000);
```

## What the Code Should Do (Normal Flow)

1. **User clicks player name** → Opens modal
2. **User types "Jordana"** → Input value updates
3. **User clicks Save** → Calls `save()` function
4. **save() creates new player** → `createGuestPlayer('Jordana')`
5. **save() preserves stats** → Copies old stats to new player
6. **save() updates state** → `state.currentPlayer = newPlayer`
7. **save() saves to storage** → `savePlayer(newPlayer)` → `localStorage.setItem('who-bible-player', ...)`
8. **save() updates display** → Calls `displayPlayerInfo()` → Calls `updatePlayerDisplayName()`
9. **updatePlayerDisplayName()** → Sets `playerNameEl.textContent = state.currentPlayer.name`

## Expected localStorage Structure

```json
{
  "who-bible-player": {
    "id": "guest_1234567890",
    "name": "Jordana",
    "isGuest": true,
    "stats": {
      "gamesPlayed": 0,
      "totalScore": 0,
      "highestScore": 0,
      "bestStreak": 0,
      ...
    },
    "createdAt": "2026-02-22T..."
  },
  "communityProfile": {
    "displayName": "Profile Display Name",
    "bio": "...",
    "avatarText": "...",
    ...
  }
}
```

Note: `who-bible-player.name` and `communityProfile.displayName` are SEPARATE and should not interfere with each other.

## If Issue Persists

Please provide:
1. Output of Step 1 commands (what's in localStorage)
2. Screenshot of the player display showing "Julia"
3. Browser and version being used
4. Whether this happens in both normal and incognito mode

---

*Created: February 22, 2026*
