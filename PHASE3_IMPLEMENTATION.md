# Phase 3 Implementation Guide: Gamification System

## Overview

This document provides implementation instructions for Phase 3 of the User Accounts System: Gamification features including achievements, badges, and leaderboards.

## New Files Created

### JavaScript Modules

1. **`assets/js/achievements.js`** (570 lines)
   - Achievement definitions and logic
   - 35+ achievements across 8 categories
   - Progress tracking and condition checking
   - XP rewards system

2. **`assets/js/badges-ui.js`** (380 lines)
   - Badge collection modal
   - Achievement notifications
   - Progress visualization
   - Filter and category views

3. **`assets/js/leaderboard.js`** (420 lines)
   - Leaderboard data management
   - Time-based rankings (daily, weekly, monthly, all-time)
   - Multiple categories (XP, Level, Accuracy, Streak, Games)
   - Rank calculation and nearby players

4. **`assets/js/leaderboard-ui.js`** (380 lines)
   - Leaderboard modal interface
   - Category and timeframe filters
   - Global, nearby, and friends views
   - Language flag indicators

### CSS Stylesheets

5. **`assets/css/badges.css`** (570 lines)
   - Badge card styling with rarity colors
   - Achievement notification animations
   - Responsive grid layouts
   - Dark/light theme support

6. **`assets/css/leaderboard.css`** (450 lines)
   - Leaderboard entry styling
   - Top 3 special effects
   - Control button groups
   - Stats dashboard

### Translation Updates

- Added `badges.*` translations to all 3 languages
- Added `leaderboard.*` translations to all 3 languages
- Included category names and UI labels

## Achievement System

### Achievement Categories

1. **Accuracy** (3 achievements)
   - Perfect Scholar: 10 questions with 100% accuracy
   - Flawless Run: 5 perfect games in a row
   - Master Scholar: 95% accuracy over 50 games

2. **Streaks** (3 achievements)
   - Faithful: 7-day streak
   - Devoted: 30-day streak
   - Disciple: 100-day streak

3. **Dedication** (4 achievements)
   - Novice Scholar: 10 games
   - Experienced Scholar: 50 games
   - Century Club: 100 games
   - Biblical Expert: 500 games

4. **Progression** (4 achievements)
   - Level milestones: 10, 25, 50, 100

5. **Modes** (2 achievements)
   - Timed Champion: 25 timed games
   - Scenario Master: 25 scenario games

6. **Knowledge** (3 achievements)
   - Question milestones: 100, 1,000, 5,000

7. **Special** (4 achievements)
   - Early Bird: Play before 6 AM
   - Night Owl: Play after midnight
   - Weekend Warrior: 20 weekend games
   - Polyglot: Play in 3 languages

### Achievement Properties

```javascript
{
  id: 'unique_id',
  name: 'Display Name',
  description: 'What you need to do',
  icon: '🏆',
  category: 'accuracy|streaks|dedication|progression|modes|social|knowledge|special',
  rarity: 'common|rare|epic|legendary',
  xpReward: 50,
  condition: (stats, gameData, history) => boolean
}
```

### Rarity System

- **Common** 🔵: Easy to achieve (25-100 XP)
- **Rare** 🟣: Moderate difficulty (100-200 XP)
- **Epic** 🟡: Challenging (200-500 XP)
- **Legendary** 🟠: Extremely difficult (500+ XP)

## Leaderboard System

### Timeframes

- **All Time**: Overall rankings
- **Monthly**: Current month leaders
- **Weekly**: Current week leaders (ISO weeks)
- **Daily**: Today's top performers

### Categories

- **XP**: Total experience points
- **Level**: Highest level achieved
- **Accuracy**: Best accuracy percentage
- **Streak**: Longest current streak
- **Games**: Total games played

### Views

- **Global**: Top 100 players worldwide
- **Nearby**: Players ranked near you (±5 positions)
- **Friends**: Your friends only (Phase 4 integration)

### Firestore Structure

```
leaderboards/
├── allTime/
│   └── entries/
│       └── {uid}/
│           ├── displayName
│           ├── photoURL
│           ├── preferredLanguage
│           ├── level
│           ├── totalXP
│           ├── accuracy
│           ├── currentStreak
│           ├── totalGames
│           └── lastUpdated
├── monthly/
│   └── entries/
│       └── {YYYY-MM}_{uid}/
├── weekly/
│   └── entries/
│       └── {YYYY-Www}_{uid}/
└── daily/
    └── entries/
        └── {YYYY-MM-DD}_{uid}/
```

## Integration Steps

### 1. Update `index.html`

Add CSS includes in `<head>`:

```html
<!-- Phase 3: Gamification CSS -->
<link rel="stylesheet" href="assets/css/badges.css">
<link rel="stylesheet" href="assets/css/leaderboard.css">
```

Add script imports before closing `</body>`:

```html
<!-- Phase 3: Gamification -->
<script type="module">
  import { initBadgesUI, showAchievementNotification, updateBadgeCount } from './assets/js/badges-ui.js';
  import { initLeaderboardUI } from './assets/js/leaderboard-ui.js';
  import { checkAchievements } from './assets/js/achievements.js';
  import { updateLeaderboardEntry } from './assets/js/leaderboard.js';
  
  // Initialize on auth state change
  window.addEventListener('authInitialized', () => {
    initBadgesUI();
    initLeaderboardUI();
    updateBadgeCount();
  });
  
  // Make functions available globally
  window.checkAchievements = checkAchievements;
  window.updateLeaderboardEntry = updateLeaderboardEntry;
  window.showAchievementNotification = showAchievementNotification;
  window.updateBadgeCount = updateBadgeCount;
</script>
```

### 2. Update `assets/js/app.js`

Add achievement checks after game completion:

```javascript
// Import at top
import { checkAchievements } from './achievements.js';
import { updateLeaderboardEntry } from './leaderboard.js';
import { showAchievementNotification } from './badges-ui.js';
import { getUserStats } from './user-profile.js';

// In endGame() function, after updateGameStats():
async function endGame() {
  // ... existing game end logic ...
  
  // Update stats
  await updateGameStats(gameData);
  
  // Check for new achievements
  const user = getCurrentUser();
  if (user) {
    const stats = getUserStats();
    const history = await getUserGameHistory(user.uid, 50); // Last 50 games
    const newAchievements = await checkAchievements(gameData, history);
    
    // Show notifications for new achievements
    for (const achievement of newAchievements) {
      showAchievementNotification(achievement);
    }
    
    // Update leaderboard entry
    await updateLeaderboardEntry(user.uid, stats);
    
    // Update badge count in UI
    if (window.updateBadgeCount) {
      window.updateBadgeCount();
    }
  }
  
  // ... rest of endGame() logic ...
}
```

### 3. Update Firestore Rules

Add leaderboard security rules to `firestore.rules`:

```javascript
// Leaderboard rules
match /leaderboards/{timeframe}/entries/{entryId} {
  // Anyone can read leaderboards
  allow read: if true;
  
  // Only authenticated users can write their own entry
  allow write: if request.auth != null && 
                  request.auth.uid == request.resource.data.uid;
}
```

### 4. Update User Profile

Ensure `user-profile.js` exports stats in correct format:

```javascript
export function getUserStats() {
  return {
    level: state.level || 1,
    totalXP: state.totalXP || 0,
    accuracy: state.accuracy || 0,
    currentStreak: state.currentStreak || 0,
    longestStreak: state.longestStreak || 0,
    totalGames: state.totalGames || 0,
    totalQuestions: state.totalQuestions || 0
  };
}
```

## Features

### Achievement Notifications

- Pop-up notification when achievement unlocked
- Displays achievement icon, name, and XP reward
- Auto-dismisses after 5 seconds
- Click to dismiss early
- Smooth slide-in animation with celebration effect

### Badge Collection Modal

- Grid view of all achievements
- Color-coded by rarity
- Filter by: All, Earned, Locked, Rarity
- Grouped by category
- Progress bars for trackable achievements
- Grayscale effect for locked badges
- Hover effects and animations

### Leaderboard Modal

- Multiple timeframes and categories
- Global/nearby/friends views
- User's current rank prominently displayed
- Top 3 have special styling (gold, silver, bronze borders)
- Language flags for international feel
- Stats dashboard showing community metrics
- Smooth animations for entry appearance

### Language Integration

- Language flags (🇬🇧 🇪🇸 🇫🇷) displayed on all profiles
- Visible in leaderboards for social discovery
- Supports "Polyglot" achievement tracking
- Consistent with Phase 1 language preferences

## Testing Checklist

### Achievement System
- [ ] Achievements trigger correctly after games
- [ ] Notifications appear and dismiss properly
- [ ] Badge modal shows correct earned/locked states
- [ ] Progress bars update accurately
- [ ] XP rewards are added to user stats
- [ ] Filters work correctly

### Leaderboard System
- [ ] Rankings update after each game
- [ ] User's rank displays correctly
- [ ] Timeframe filters work (all-time, monthly, weekly, daily)
- [ ] Category filters work (XP, level, accuracy, streak, games)
- [ ] View options work (global, nearby, friends)
- [ ] Language flags display correctly
- [ ] Stats dashboard shows accurate numbers
- [ ] Top 3 styling applies correctly

### UI/UX
- [ ] Modals open and close smoothly
- [ ] Buttons in profile dropdown work
- [ ] Responsive design on mobile
- [ ] Dark/light theme support
- [ ] Animations perform well
- [ ] No console errors

### Translations
- [ ] All text translates correctly in English
- [ ] All text translates correctly in Spanish
- [ ] All text translates correctly in French
- [ ] Achievement names and descriptions translate
- [ ] Leaderboard labels translate

## Performance Considerations

1. **Firestore Queries**
   - Leaderboards use indexed queries
   - Limited to top 100 entries per query
   - User rank calculated efficiently

2. **Achievement Checks**
   - Run after game completion only
   - Skip already-earned achievements
   - Batch Firestore writes

3. **Caching**
   - Achievement data cached in memory
   - Leaderboard stats refreshed on open
   - User rank calculated once per view

## Future Enhancements (Phase 4+)

- [ ] Achievement sharing to social media
- [ ] Custom user badges/titles
- [ ] Seasonal achievements
- [ ] Global events/competitions
- [ ] Friend achievement comparison
- [ ] Achievement hints/tips
- [ ] Leaderboard seasons with resets
- [ ] Regional leaderboards
- [ ] Achievement difficulty ratings
- [ ] Retroactive achievement unlocking

## Known Limitations

1. **Friends Leaderboard**: Requires Phase 4 friend system
2. **Challenge Victor Achievement**: Requires Phase 4 challenge system
3. **Polyglot Achievement**: Requires language switch tracking
4. **Leaderboard Pagination**: Currently limited to 100 entries
5. **Real-time Updates**: Leaderboards update on refresh only

## Support

For issues or questions about Phase 3 implementation, refer to:
- Main roadmap: `USER_ACCOUNTS_ROADMAP.md`
- Phase 1 guide: `PHASE1_IMPLEMENTATION.md`
- Phase 2 guide: `PHASE2_IMPLEMENTATION.md`
- Project instructions: `.github/copilot-instructions.md`

## Summary

Phase 3 adds comprehensive gamification to Who-Bible with:
- ✅ 35+ achievements across 8 categories
- ✅ 4 rarity tiers with XP rewards
- ✅ Global leaderboards with multiple timeframes
- ✅ 5 leaderboard categories
- ✅ Beautiful UI with animations
- ✅ Full i18n support (3 languages)
- ✅ Language flag integration
- ✅ ~2,400 lines of production code
- ✅ Complete responsive design

**Total Phase 3 deliverables: 6 files + translation updates**

Ready for Phase 4: Social Features! 🎉
