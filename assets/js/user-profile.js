/**
 * User Profile Management
 * Handles user stats, settings, and profile data
 */

import { db } from './firebase-config.js';
import { 
    doc, 
    getDoc, 
    updateDoc,
    setDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import { getCurrentUser, updateUserProfile } from './auth.js';

// Cache for user data
let userStats = null;
let userSettings = null;
let gameHistory = [];

/**
 * Load all user data
 */
export async function loadUserData() {
    const user = getCurrentUser();
    if (!user) return;

    await Promise.all([
        loadUserStats(user.uid),
        loadUserSettings(user.uid),
        loadRecentGameHistory(user.uid)
    ]);
}

/**
 * Load user statistics
 */
async function loadUserStats(uid) {
    try {
        const statsDoc = await getDoc(doc(db, 'users', uid, 'data', 'stats'));
        if (statsDoc.exists()) {
            userStats = statsDoc.data();
        }
    } catch (error) {
        console.error('Error loading user stats:', error);
    }
}

/**
 * Load user settings
 */
async function loadUserSettings(uid) {
    try {
        const settingsDoc = await getDoc(doc(db, 'users', uid, 'data', 'settings'));
        if (settingsDoc.exists()) {
            userSettings = settingsDoc.data();
            applyUserSettings();
        }
    } catch (error) {
        console.error('Error loading user settings:', error);
    }
}

/**
 * Load recent game history
 */
async function loadRecentGameHistory(uid, limitCount = 20) {
    try {
        const historyRef = collection(db, 'users', uid, 'games');
        const q = query(historyRef, orderBy('timestamp', 'desc'), limit(limitCount));
        const snapshot = await getDocs(q);
        
        gameHistory = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error loading game history:', error);
    }
}

/**
 * Apply user settings to the app
 */
function applyUserSettings() {
    if (!userSettings) return;

    // Apply theme
    if (userSettings.theme && typeof window.setTheme === 'function') {
        window.setTheme(userSettings.theme);
    }

    // Apply other settings as needed
    // This integrates with your existing app.js state management
}

/**
 * Update user statistics after a game
 */
export async function updateGameStats(gameData) {
    const user = getCurrentUser();
    if (!user) return;

    try {
        const statsRef = doc(db, 'users', user.uid, 'data', 'stats');
        
        // Calculate new stats
        const newTotalGames = (userStats?.totalGames || 0) + 1;
        const newTotalQuestions = (userStats?.totalQuestions || 0) + gameData.totalQuestions;
        const newCorrectAnswers = (userStats?.correctAnswers || 0) + gameData.correctAnswers;
        const newAccuracy = ((newCorrectAnswers / newTotalQuestions) * 100).toFixed(2);
        
        // Calculate XP gained
        const xpGained = calculateXPGained(gameData);
        const newTotalXP = (userStats?.totalXP || 0) + xpGained;
        const newLevel = calculateLevel(newTotalXP);

        // Check and update streak
        const streakData = await updateStreak(user.uid);

        const updates = {
            totalGames: newTotalGames,
            totalQuestions: newTotalQuestions,
            correctAnswers: newCorrectAnswers,
            accuracy: parseFloat(newAccuracy),
            totalXP: newTotalXP,
            level: newLevel,
            lastPlayedDate: serverTimestamp(),
            ...streakData
        };

        await updateDoc(statsRef, updates);
        
        // Update local cache
        userStats = { ...userStats, ...updates };

        // Save game to history
        await saveGameToHistory(user.uid, gameData, xpGained);

        // Check for achievements
        await checkAchievements(user.uid, updates, gameData);

        return { xpGained, leveledUp: newLevel > (userStats?.level || 1) };
    } catch (error) {
        console.error('Error updating game stats:', error);
        return { xpGained: 0, leveledUp: false };
    }
}

/**
 * Calculate XP gained from a game
 */
function calculateXPGained(gameData) {
    const baseXP = gameData.correctAnswers * 10;
    
    // Bonus multipliers
    let multiplier = 1;
    
    // Perfect game bonus (100% accuracy)
    if (gameData.correctAnswers === gameData.totalQuestions) {
        multiplier += 0.5; // +50%
    }
    
    // High accuracy bonus (>=90%)
    const accuracy = (gameData.correctAnswers / gameData.totalQuestions) * 100;
    if (accuracy >= 90) {
        multiplier += 0.25; // +25%
    }
    
    // Mode-specific multipliers
    const modeMultipliers = {
        'timed': 1.3,
        'scenario': 1.5,
        'relationship': 1.4,
        'advanced': 1.2
    };
    
    if (gameData.mode && modeMultipliers[gameData.mode]) {
        multiplier *= modeMultipliers[gameData.mode];
    }
    
    // Streak bonus
    if (userStats?.currentStreak >= 3) {
        multiplier += Math.min(userStats.currentStreak * 0.05, 0.5); // Up to +50%
    }

    return Math.floor(baseXP * multiplier);
}

/**
 * Calculate level from total XP
 */
function calculateLevel(totalXP) {
    // Level formula: Each level requires more XP
    // Level 1: 0-100 XP, Level 2: 100-250 XP, Level 3: 250-450 XP, etc.
    // Formula: XP for level N = 100 * N + 50 * N * (N-1) / 2
    
    let level = 1;
    let xpNeeded = 0;
    
    while (xpNeeded <= totalXP && level < 100) {
        level++;
        xpNeeded += 100 * level + 50 * (level - 1);
    }
    
    return level - 1;
}

/**
 * Get XP needed for next level
 */
export function getXPForNextLevel(currentLevel) {
    return 100 * (currentLevel + 1) + 50 * currentLevel;
}

/**
 * Update user's daily streak
 */
async function updateStreak(uid) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastPlayed = userStats?.lastPlayedDate?.toDate();
    
    if (!lastPlayed) {
        // First game ever
        return {
            currentStreak: 1,
            longestStreak: Math.max(userStats?.longestStreak || 0, 1),
            lastStreakDate: serverTimestamp()
        };
    }
    
    lastPlayed.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today - lastPlayed) / (1000 * 60 * 60 * 24));
    
    let currentStreak = userStats?.currentStreak || 0;
    
    if (daysDiff === 0) {
        // Same day, no streak change
        return {};
    } else if (daysDiff === 1) {
        // Consecutive day, increment streak
        currentStreak++;
    } else {
        // Streak broken, restart
        currentStreak = 1;
    }
    
    const longestStreak = Math.max(userStats?.longestStreak || 0, currentStreak);
    
    return {
        currentStreak,
        longestStreak,
        lastStreakDate: serverTimestamp()
    };
}

/**
 * Save game to history
 */
async function saveGameToHistory(uid, gameData, xpGained) {
    try {
        const gameRef = doc(collection(db, 'users', uid, 'games'));
        await setDoc(gameRef, {
            mode: gameData.mode,
            totalQuestions: gameData.totalQuestions,
            correctAnswers: gameData.correctAnswers,
            accuracy: ((gameData.correctAnswers / gameData.totalQuestions) * 100).toFixed(2),
            score: gameData.score,
            xpGained,
            timestamp: serverTimestamp(),
            duration: gameData.duration || null
        });
    } catch (error) {
        console.error('Error saving game to history:', error);
    }
}

/**
 * Check and award achievements
 */
async function checkAchievements(uid, stats, gameData) {
    // This will be expanded in Phase 3
    // For now, just log potential achievements
    
    const achievements = [];
    
    // Perfect game
    if (gameData.correctAnswers === gameData.totalQuestions && gameData.totalQuestions >= 10) {
        achievements.push('perfect_scholar');
    }
    
    // Streak milestones
    if (stats.currentStreak === 7) {
        achievements.push('faithful');
    } else if (stats.currentStreak === 30) {
        achievements.push('devoted');
    }
    
    // Game count milestones
    if (stats.totalGames === 10) {
        achievements.push('novice_scholar');
    } else if (stats.totalGames === 100) {
        achievements.push('century_club');
    }
    
    // Level milestones
    if (stats.level === 10 || stats.level === 25 || stats.level === 50 || stats.level === 100) {
        achievements.push(`level_${stats.level}_master`);
    }
    
    if (achievements.length > 0) {
        console.log('Achievements earned:', achievements);
        // TODO: Actually award achievements in Phase 3
    }
}

/**
 * Update user settings
 */
export async function updateSettings(settingUpdates) {
    const user = getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
        const settingsRef = doc(db, 'users', user.uid, 'data', 'settings');
        await updateDoc(settingsRef, settingUpdates);
        
        userSettings = { ...userSettings, ...settingUpdates };
        applyUserSettings();
        
        return { success: true };
    } catch (error) {
        console.error('Error updating settings:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get user statistics
 */
export function getUserStats() {
    return userStats;
}

/**
 * Get user settings
 */
export function getUserSettings() {
    return userSettings;
}

/**
 * Get game history
 */
export function getGameHistory() {
    return gameHistory;
}

/**
 * Migrate localStorage data to cloud
 */
export async function migrateLocalStorageData() {
    const user = getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
        // Get existing localStorage data
        const localStats = {
            totalGames: parseInt(localStorage.getItem('totalGames')) || 0,
            totalQuestions: parseInt(localStorage.getItem('totalQuestions')) || 0,
            correctAnswers: parseInt(localStorage.getItem('correctAnswers')) || 0,
            highScore: parseInt(localStorage.getItem('highScore')) || 0
        };

        // Only migrate if there's data
        if (localStats.totalGames > 0) {
            const statsRef = doc(db, 'users', user.uid, 'data', 'stats');
            const currentStats = await getDoc(statsRef);
            
            if (currentStats.exists()) {
                // Merge with existing cloud data
                const cloudStats = currentStats.data();
                const merged = {
                    totalGames: Math.max(cloudStats.totalGames, localStats.totalGames),
                    totalQuestions: cloudStats.totalQuestions + localStats.totalQuestions,
                    correctAnswers: cloudStats.correctAnswers + localStats.correctAnswers,
                    accuracy: ((cloudStats.correctAnswers + localStats.correctAnswers) / 
                              (cloudStats.totalQuestions + localStats.totalQuestions) * 100).toFixed(2)
                };
                
                await updateDoc(statsRef, merged);
            }

            // Clear localStorage after successful migration
            ['totalGames', 'totalQuestions', 'correctAnswers', 'highScore'].forEach(key => {
                localStorage.removeItem(key);
            });

            return { success: true, migrated: true };
        }

        return { success: true, migrated: false };
    } catch (error) {
        console.error('Error migrating data:', error);
        return { success: false, error: error.message };
    }
}

// Auto-load user data when authenticated
window.addEventListener('auth:login', () => {
    loadUserData();
});
