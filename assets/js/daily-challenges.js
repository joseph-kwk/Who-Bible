/**
 * Daily Challenges System
 * Generates and manages daily Bible challenges for users
 */

import { auth, db } from './firebase-config.js';
import { getCurrentUser } from './auth.js';
import { addXP, checkAchievements } from './achievements.js';
import { createNotification, NOTIFICATION_TYPES } from './notifications.js';

// Challenge difficulties
export const CHALLENGE_DIFFICULTY = {
    BEGINNER: 'beginner',
    INTERMEDIATE: 'intermediate',
    EXPERT: 'expert'
};

// XP rewards by difficulty
const XP_REWARDS = {
    [CHALLENGE_DIFFICULTY.BEGINNER]: 50,
    [CHALLENGE_DIFFICULTY.INTERMEDIATE]: 100,
    [CHALLENGE_DIFFICULTY.EXPERT]: 200
};

// Streak bonuses
const STREAK_BONUS = {
    3: 50,   // 3-day streak
    7: 150,  // 7-day streak
    14: 300, // 14-day streak
    30: 750, // 30-day streak
    100: 2500 // 100-day streak!
};

/**
 * Get today's date key (YYYY-MM-DD)
 */
function getTodayKey() {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

/**
 * Get daily challenge for today
 */
export async function getTodayChallenge() {
    const todayKey = getTodayKey();

    try {
        const doc = await db.collection('daily-challenges').doc(todayKey).get();
        
        if (doc.exists) {
            return {
                id: doc.id,
                ...doc.data()
            };
        }

        // Generate new challenge if it doesn't exist
        // In production, this would be done by a Cloud Function
        return await generateDailyChallenge(todayKey);
    } catch (error) {
        console.error('Error getting daily challenge:', error);
        return null;
    }
}

/**
 * Generate daily challenge (placeholder - would be done server-side)
 */
async function generateDailyChallenge(dateKey) {
    // This is a simplified version. In production, use Cloud Functions
    // to generate challenges at midnight UTC
    
    const difficulties = Object.values(CHALLENGE_DIFFICULTY);
    const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    
    const numQuestions = {
        [CHALLENGE_DIFFICULTY.BEGINNER]: 5,
        [CHALLENGE_DIFFICULTY.INTERMEDIATE]: 10,
        [CHALLENGE_DIFFICULTY.EXPERT]: 15
    }[randomDifficulty];

    const challenge = {
        date: dateKey,
        difficulty: randomDifficulty,
        numQuestions,
        timeLimit: 300, // 5 minutes
        xpReward: XP_REWARDS[randomDifficulty],
        participants: 0,
        completions: 0,
        averageScore: 0,
        createdAt: new Date().toISOString()
    };

    try {
        await db.collection('daily-challenges').doc(dateKey).set(challenge);
        return { id: dateKey, ...challenge };
    } catch (error) {
        console.error('Error creating daily challenge:', error);
        return null;
    }
}

/**
 * Get user's daily challenge progress
 */
export async function getUserDailyChallengeProgress() {
    const user = await getCurrentUser();
    if (!user) return null;

    const todayKey = getTodayKey();

    try {
        const doc = await db.collection('users')
            .doc(user.uid)
            .collection('daily-challenges')
            .doc(todayKey)
            .get();

        if (doc.exists) {
            return doc.data();
        }

        return null;
    } catch (error) {
        console.error('Error getting daily challenge progress:', error);
        return null;
    }
}

/**
 * Check if user completed today's challenge
 */
export async function hasCompletedTodayChallenge() {
    const progress = await getUserDailyChallengeProgress();
    return progress && progress.completed === true;
}

/**
 * Complete daily challenge
 */
export async function completeDailyChallenge(score, correctAnswers, totalQuestions) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    const todayKey = getTodayKey();
    const challenge = await getTodayChallenge();
    
    if (!challenge) {
        throw new Error('No daily challenge available');
    }

    // Check if already completed
    const existing = await getUserDailyChallengeProgress();
    if (existing && existing.completed) {
        throw new Error('Already completed today\'s challenge');
    }

    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const xpEarned = challenge.xpReward;

    try {
        // Save user's completion
        await db.collection('users')
            .doc(user.uid)
            .collection('daily-challenges')
            .doc(todayKey)
            .set({
                completed: true,
                score,
                correctAnswers,
                totalQuestions,
                accuracy,
                xpEarned,
                completedAt: new Date().toISOString()
            });

        // Update global challenge stats
        await db.collection('daily-challenges').doc(todayKey).update({
            completions: firebase.firestore.FieldValue.increment(1),
            averageScore: firebase.firestore.FieldValue.increment(score / 100) // Simplified
        });

        // Award XP
        await addXP(xpEarned, 'Daily Challenge Completed');

        // Update streak
        const newStreak = await updateDailyChallengeStreak();

        // Check for streak bonuses
        if (STREAK_BONUS[newStreak]) {
            const bonus = STREAK_BONUS[newStreak];
            await addXP(bonus, `${newStreak}-Day Streak Bonus!`);
            
            // Send notification
            await createNotification(user.uid, {
                type: NOTIFICATION_TYPES.MILESTONE,
                title: `${newStreak}-Day Streak! 🔥`,
                message: `You earned ${bonus} bonus XP for your dedication!`
            });
        }

        // Check achievements
        await checkAchievements();

        return {
            xpEarned,
            streak: newStreak,
            streakBonus: STREAK_BONUS[newStreak] || 0
        };
    } catch (error) {
        console.error('Error completing daily challenge:', error);
        throw error;
    }
}

/**
 * Update daily challenge streak
 */
async function updateDailyChallengeStreak() {
    const user = await getCurrentUser();
    if (!user) return 0;

    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data() || {};
        
        const lastChallengeDate = userData.lastDailyChallengeDate;
        const currentStreak = userData.dailyChallengeStreak || 0;
        const todayKey = getTodayKey();

        let newStreak = 1;

        if (lastChallengeDate) {
            const lastDate = new Date(lastChallengeDate);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayKey = yesterday.toISOString().split('T')[0];

            if (lastChallengeDate === yesterdayKey) {
                // Streak continues!
                newStreak = currentStreak + 1;
            } else if (lastChallengeDate === todayKey) {
                // Already completed today
                newStreak = currentStreak;
            }
            // else: streak broken, reset to 1
        }

        // Update user record
        await db.collection('users').doc(user.uid).update({
            dailyChallengeStreak: newStreak,
            lastDailyChallengeDate: todayKey,
            longestDailyChallengeStreak: firebase.firestore.FieldValue.max(newStreak)
        });

        return newStreak;
    } catch (error) {
        console.error('Error updating streak:', error);
        return 0;
    }
}

/**
 * Get user's current daily challenge streak
 */
export async function getDailyChallengeStreak() {
    const user = await getCurrentUser();
    if (!user) return 0;

    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data() || {};
        
        const streak = userData.dailyChallengeStreak || 0;
        const lastDate = userData.lastDailyChallengeDate;
        const todayKey = getTodayKey();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = yesterday.toISOString().split('T')[0];

        // Check if streak is still active
        if (lastDate === todayKey || lastDate === yesterdayKey) {
            return streak;
        }

        // Streak broken
        return 0;
    } catch (error) {
        console.error('Error getting streak:', error);
        return 0;
    }
}

/**
 * Get daily challenge history
 */
export async function getDailyChallengeHistory(limit = 30) {
    const user = await getCurrentUser();
    if (!user) return [];

    try {
        const snapshot = await db.collection('users')
            .doc(user.uid)
            .collection('daily-challenges')
            .orderBy('completedAt', 'desc')
            .limit(limit)
            .get();

        const history = [];
        snapshot.forEach((doc) => {
            history.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return history;
    } catch (error) {
        console.error('Error getting challenge history:', error);
        return [];
    }
}

/**
 * Get daily challenge leaderboard for today
 */
export async function getTodayLeaderboard(limit = 10) {
    const todayKey = getTodayKey();

    try {
        // In a real implementation, this would query a leaderboard subcollection
        // For now, return empty array
        return [];
    } catch (error) {
        console.error('Error getting leaderboard:', error);
        return [];
    }
}

/**
 * Get daily challenge stats
 */
export async function getDailyChallengeStats() {
    const user = await getCurrentUser();
    if (!user) return null;

    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data() || {};

        const history = await getDailyChallengeHistory(365); // Last year

        const totalCompleted = history.length;
        const currentStreak = await getDailyChallengeStreak();
        const longestStreak = userData.longestDailyChallengeStreak || 0;
        
        const totalXPEarned = history.reduce((sum, h) => sum + (h.xpEarned || 0), 0);
        const averageAccuracy = history.length > 0
            ? history.reduce((sum, h) => sum + (h.accuracy || 0), 0) / history.length
            : 0;

        // Calculate completion rate (last 30 days)
        const last30Days = history.slice(0, 30);
        const completionRate = (last30Days.length / 30) * 100;

        return {
            totalCompleted,
            currentStreak,
            longestStreak,
            totalXPEarned,
            averageAccuracy: Math.round(averageAccuracy),
            completionRate: Math.round(completionRate)
        };
    } catch (error) {
        console.error('Error getting challenge stats:', error);
        return null;
    }
}

/**
 * Send daily challenge reminder notification
 * (Would be called by a Cloud Function/scheduler)
 */
export async function sendDailyChallengeReminder(userId) {
    try {
        const hasCompleted = await hasCompletedTodayChallenge();
        if (hasCompleted) return; // Don't remind if already completed

        await createNotification(userId, {
            type: NOTIFICATION_TYPES.DAILY_CHALLENGE,
            title: '📅 Daily Challenge Available!',
            message: 'Complete today\'s challenge to maintain your streak!'
        });
    } catch (error) {
        console.error('Error sending reminder:', error);
    }
}

/**
 * Format streak display
 */
export function formatStreak(streak) {
    if (streak === 0) return '0 days';
    if (streak === 1) return '1 day';
    return `${streak} days 🔥`;
}

/**
 * Get next streak milestone
 */
export function getNextStreakMilestone(currentStreak) {
    const milestones = Object.keys(STREAK_BONUS).map(Number).sort((a, b) => a - b);
    
    for (const milestone of milestones) {
        if (currentStreak < milestone) {
            return {
                days: milestone,
                bonus: STREAK_BONUS[milestone],
                remaining: milestone - currentStreak
            };
        }
    }

    return null; // Max streak reached
}
