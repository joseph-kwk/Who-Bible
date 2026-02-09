## 🎮 Guest User Quick Reference

### For Users

**Playing as Guest:**
- ✅ Full quiz access (all modes)
- ✅ Stats tracked on your device
- ⚠️ Data NOT synced across devices
- ⚠️ Lost if you clear browser data

**Create Account to Get:**
- 💾 Permanent cloud-saved progress
- 📱 Play on any device (sync)
- 🏆 Join global leaderboards
- 👥 Challenge friends online
- 🎖️ Earn permanent badges

### For Developers

**Quick Setup Test:**
```bash
# Run the app
python -m http.server 5500
# or
npx http-server -p 5500 -c-1

# Open browser
http://localhost:5500
```

**Test Guest Prompts:**
```javascript
// Check guest status
console.log(state.currentPlayer.isGuest); // true/false

// View session
console.log(window.GuestPrompts.getSessionInfo());

// Reset session (for testing)
window.GuestPrompts.resetSession();

// Trigger game completion
document.dispatchEvent(new CustomEvent('gameCompleted', {
  detail: { score: 800, streak: 5, correct: 10, total: 10, mode: 'solo' }
}));

// Trigger social feature block
document.dispatchEvent(new CustomEvent('socialFeatureAttempt', {
  detail: { feature: 'Leaderboard' }
}));
```

**Key Files:**
- `assets/js/guest-prompts.js` - Main logic
- `assets/css/guest-prompts.css` - Styling
- `assets/i18n/en.json` - English text (search "guest")

**Prompt Triggers:**
| Prompt Type | Trigger | Style |
|------------|---------|-------|
| Welcome | First visit | Compact |
| Performance | Score ≥600 after 5 games | Full Modal |
| Engagement | 10+ games | Full Modal |
| Reminder | Every 7 days | Compact |
| Social Block | Click social feature | Compact |

**Adjust Frequency:**
Edit `assets/js/guest-prompts.js`:
```javascript
const PROMPT_TRIGGERS = {
  GAMES_FOR_WARNING: 10,        // Change to 20 for less frequent
  GAMES_FOR_PERFORMANCE: 5,      // Change to 10 for less frequent
  DAYS_BETWEEN_REMINDERS: 7,     // Change to 14 for less frequent
  HIGH_PERFORMANCE_PERCENTILE: 0.8,
  MAX_DISMISSALS_BEFORE_DELAY: 3 // After 3 dismissals, reduce frequency
};
```

**Add New Translation:**
Edit `assets/i18n/en.json` (and fr.json, es.json):
```json
{
  "guest": {
    "yourNewKey": "Your new message here"
  }
}
```

Use in JS:
```javascript
const text = getText('guest.yourNewKey');
```

### Common Issues

**Problem:** Prompts not showing  
**Solution:** Check `localStorage` has `who-bible-guest-session` entry

**Problem:** Can't clear guest session  
**Solution:** 
```javascript
localStorage.removeItem('who-bible-guest-session');
window.GuestPrompts.resetSession();
```

**Problem:** Prompts showing too often  
**Solution:** Increase trigger thresholds in `PROMPT_TRIGGERS`

**Problem:** Translations not working  
**Solution:** Ensure `translations.js` loads before `guest-prompts.js`

### Badge Colors

**Guest Badge:** 🟨 Orange/Amber (#ffa000)  
**Member Badge:** 🟩 Green (#4caf50)  
**Device-Only:** 🟨 Orange (#ffa000)

Edit in `assets/css/guest-prompts.css` to customize colors.
