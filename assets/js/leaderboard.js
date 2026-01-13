/**
 * Leaderboard System
 * Global and friend leaderboards with ranking
 */

import { db } from './firebase-config.js';
import { 
    collection, 
    query, 
    orderBy, 
    limit, 
    getDocs,
    where,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import { getCurrentUser } from './auth.js';
import { getUserStats } from './user-profile.js';
import { getText } from './translations.js';

/**
 * Leaderboard timeframes
 */
export const TIMEFRAMES = {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    ALL_TIME: 'allTime'
};

/**
 * Leaderboard categories
 */
export const CATEGORIES = {
    XP: 'xp',
    LEVEL: 'level',
    ACCURACY: 'accuracy',
    STREAK: 'streak',
    GAMES: 'games'
};

/**
 * Update user leaderboard entry
 */
export async function updateLeaderboardEntry(uid, stats) {
    try {
        const user = getCurrentUser();
        if (!user) return;

        // Get user profile for display info
        const profileRef = doc(db, 'users', uid, 'data', 'profile');
        const profileDoc = await getDoc(profileRef);
        const profile = profileDoc.data();

        const leaderboardEntry = {
            uid,
            displayName: profile?.displayName || 'Anonymous',
            photoURL: profile?.photoURL || null,
            preferredLanguage: profile?.preferredLanguage || 'en',
            
            // Stats
            level: stats.level || 1,
            totalXP: stats.totalXP || 0,
            accuracy: stats.accuracy || 0,
            currentStreak: stats.currentStreak || 0,
            totalGames: stats.totalGames || 0,
            
            // Timestamps
            lastUpdated: serverTimestamp()
        };

        // Update all-time leaderboard
        const allTimeRef = doc(db, 'leaderboards', 'allTime', 'entries', uid);
        await setDoc(allTimeRef, leaderboardEntry, { merge: true });

        // Update time-based leaderboards
        await updateTimeBasedLeaderboards(uid, leaderboardEntry);

    } catch (error) {
        console.error('Error updating leaderboard:', error);
    }
}

/**
 * Update time-based leaderboards (daily, weekly, monthly)
 */
async function updateTimeBasedLeaderboards(uid, entry) {
    const now = new Date();
    
    // Daily
    const dailyKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const dailyRef = doc(db, 'leaderboards', 'daily', 'entries', `${dailyKey}_${uid}`);
    await setDoc(dailyRef, { ...entry, date: dailyKey }, { merge: true });

    // Weekly (ISO week)
    const weekNumber = getISOWeek(now);
    const weeklyKey = `${now.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
    const weeklyRef = doc(db, 'leaderboards', 'weekly', 'entries', `${weeklyKey}_${uid}`);
    await setDoc(weeklyRef, { ...entry, week: weeklyKey }, { merge: true });

    // Monthly
    const monthlyKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthlyRef = doc(db, 'leaderboards', 'monthly', 'entries', `${monthlyKey}_${uid}`);
    await setDoc(monthlyRef, { ...entry, month: monthlyKey }, { merge: true });
}

/**
 * Get ISO week number
 */
function getISOWeek(date) {
    const target = new Date(date.valueOf());
    const dayNumber = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNumber + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
        target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - target) / 604800000);
}

/**
 * Get leaderboard data
 */
export async function getLeaderboard(timeframe = TIMEFRAMES.ALL_TIME, category = CATEGORIES.XP, limitCount = 100) {
    try {
        let orderByField = 'totalXP';
        switch (category) {
            case CATEGORIES.LEVEL:
                orderByField = 'level';
                break;
            case CATEGORIES.ACCURACY:
                orderByField = 'accuracy';
                break;
            case CATEGORIES.STREAK:
                orderByField = 'currentStreak';
                break;
            case CATEGORIES.GAMES:
                orderByField = 'totalGames';
                break;
        }

        const leaderboardRef = collection(db, 'leaderboards', timeframe, 'entries');
        const q = query(
            leaderboardRef,
            orderBy(orderByField, 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        const entries = [];
        let rank = 1;

        snapshot.forEach((doc) => {
            entries.push({
                rank: rank++,
                ...doc.data()
            });
        });

        return entries;
    } catch (error) {
        console.error('Error getting leaderboard:', error);
        return [];
    }
}

/**
 * Get user's rank in leaderboard
 */
export async function getUserRank(uid, timeframe = TIMEFRAMES.ALL_TIME, category = CATEGORIES.XP) {
    try {
        let orderByField = 'totalXP';
        switch (category) {
            case CATEGORIES.LEVEL:
                orderByField = 'level';
                break;
            case CATEGORIES.ACCURACY:
                orderByField = 'accuracy';
                break;
            case CATEGORIES.STREAK:
                orderByField = 'currentStreak';
                break;
            case CATEGORIES.GAMES:
                orderByField = 'totalGames';
                break;
        }

        // Get user's entry
        const userRef = doc(db, 'leaderboards', timeframe, 'entries', uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
            return null;
        }

        const userValue = userDoc.data()[orderByField];

        // Count how many entries have higher values
        const leaderboardRef = collection(db, 'leaderboards', timeframe, 'entries');
        const q = query(
            leaderboardRef,
            where(orderByField, '>', userValue)
        );

        const snapshot = await getDocs(q);
        const rank = snapshot.size + 1;

        return {
            rank,
            ...userDoc.data()
        };
    } catch (error) {
        console.error('Error getting user rank:', error);
        return null;
    }
}

/**
 * Get friends leaderboard
 * @param {string[]} friendUids - Array of friend UIDs
 */
export async function getFriendsLeaderboard(friendUids, category = CATEGORIES.XP) {
    try {
        if (!friendUids || friendUids.length === 0) {
            return [];
        }

        let orderByField = 'totalXP';
        switch (category) {
            case CATEGORIES.LEVEL:
                orderByField = 'level';
                break;
            case CATEGORIES.ACCURACY:
                orderByField = 'accuracy';
                break;
            case CATEGORIES.STREAK:
                orderByField = 'currentStreak';
                break;
            case CATEGORIES.GAMES:
                orderByField = 'totalGames';
                break;
        }

        const entries = [];
        
        // Fetch each friend's data
        for (const uid of friendUids) {
            const userRef = doc(db, 'leaderboards', 'allTime', 'entries', uid);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
                entries.push(userDoc.data());
            }
        }

        // Sort by the selected category
        entries.sort((a, b) => b[orderByField] - a[orderByField]);

        // Add ranks
        return entries.map((entry, index) => ({
            rank: index + 1,
            ...entry
        }));
    } catch (error) {
        console.error('Error getting friends leaderboard:', error);
        return [];
    }
}

/**
 * Get nearby players on leaderboard
 */
export async function getNearbyPlayers(uid, timeframe = TIMEFRAMES.ALL_TIME, category = CATEGORIES.XP, range = 5) {
    try {
        const userRank = await getUserRank(uid, timeframe, category);
        if (!userRank) return [];

        const startRank = Math.max(1, userRank.rank - range);
        const leaderboard = await getLeaderboard(timeframe, category, startRank + range * 2);

        return leaderboard.filter(entry => 
            entry.rank >= startRank && entry.rank <= userRank.rank + range
        );
    } catch (error) {
        console.error('Error getting nearby players:', error);
        return [];
    }
}

/**
 * Get leaderboard statistics
 */
export async function getLeaderboardStats(timeframe = TIMEFRAMES.ALL_TIME) {
    try {
        const leaderboardRef = collection(db, 'leaderboards', timeframe, 'entries');
        const snapshot = await getDocs(leaderboardRef);

        let totalXP = 0;
        let totalGames = 0;
        let totalPlayers = 0;
        let avgAccuracy = 0;
        let maxLevel = 0;
        let maxStreak = 0;

        snapshot.forEach((doc) => {
            const data = doc.data();
            totalXP += data.totalXP || 0;
            totalGames += data.totalGames || 0;
            avgAccuracy += data.accuracy || 0;
            maxLevel = Math.max(maxLevel, data.level || 0);
            maxStreak = Math.max(maxStreak, data.currentStreak || 0);
            totalPlayers++;
        });

        return {
            totalPlayers,
            totalXP,
            totalGames,
            avgAccuracy: totalPlayers > 0 ? avgAccuracy / totalPlayers : 0,
            maxLevel,
            maxStreak
        };
    } catch (error) {
        console.error('Error getting leaderboard stats:', error);
        return null;
    }
}

/**
 * Get top players by category
 */
export async function getTopPlayers(category = CATEGORIES.XP, count = 10) {
    return await getLeaderboard(TIMEFRAMES.ALL_TIME, category, count);
}

/**
 * Check if user made the top 10
 */
export async function checkTopTen(uid, timeframe = TIMEFRAMES.ALL_TIME, category = CATEGORIES.XP) {
    const userRank = await getUserRank(uid, timeframe, category);
    return userRank && userRank.rank <= 10;
}

/**
 * Get leaderboard medal emoji
 */
export function getRankMedal(rank) {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    if (rank <= 10) return '🏅';
    if (rank <= 100) return '⭐';
    return '';
}

/**
 * Format stat value
 */
export function formatStatValue(category, value) {
    switch (category) {
        case CATEGORIES.ACCURACY:
            return value.toFixed(1) + '%';
        case CATEGORIES.XP:
            return value.toLocaleString() + ' XP';
        case CATEGORIES.LEVEL:
            return 'Lv. ' + value;
        case CATEGORIES.STREAK:
            return value + ' 🔥';
        case CATEGORIES.GAMES:
            return value.toLocaleString();
        default:
            return value;
    }
}
