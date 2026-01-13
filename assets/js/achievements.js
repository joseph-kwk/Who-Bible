/**
 * Achievements & Badge System
 * Gamification engine for Who-Bible
 */

import { db } from './firebase-config.js';
import { 
    doc, 
    getDoc, 
    setDoc,
    collection,
    query,
    where,
    getDocs,
    updateDoc,
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import { getCurrentUser } from './auth.js';
import { getUserStats } from './user-profile.js';

/**
 * Achievement definitions
 */
export const ACHIEVEMENTS = {
    // Accuracy Achievements
    'perfect_scholar': {
        id: 'perfect_scholar',
        name: 'Perfect Scholar',
        description: 'Score 100% accuracy on 10 questions',
        icon: '💯',
        category: 'accuracy',
        rarity: 'common',
        xpReward: 50,
        condition: (stats, gameData) => {
            return gameData.correctAnswers === gameData.totalQuestions && gameData.totalQuestions >= 10;
        }
    },
    'flawless_run': {
        id: 'flawless_run',
        name: 'Flawless Run',
        description: '5 perfect games in a row',
        icon: '⭐',
        category: 'accuracy',
        rarity: 'rare',
        xpReward: 100,
        condition: (stats, gameData, history) => {
            const last5 = history.slice(0, 5);
            return last5.length === 5 && last5.every(g => parseFloat(g.accuracy) === 100);
        }
    },
    'master_scholar': {
        id: 'master_scholar',
        name: 'Master Scholar',
        description: 'Maintain 95% accuracy over 50 games',
        icon: '🎓',
        category: 'accuracy',
        rarity: 'epic',
        xpReward: 250,
        condition: (stats) => {
            return stats.totalGames >= 50 && stats.accuracy >= 95;
        }
    },

    // Streak Achievements
    'faithful': {
        id: 'faithful',
        name: 'Faithful',
        description: 'Maintain a 7-day streak',
        icon: '🔥',
        category: 'streaks',
        rarity: 'common',
        xpReward: 75,
        condition: (stats) => stats.currentStreak >= 7
    },
    'devoted': {
        id: 'devoted',
        name: 'Devoted',
        description: 'Maintain a 30-day streak',
        icon: '⚡',
        category: 'streaks',
        rarity: 'rare',
        xpReward: 200,
        condition: (stats) => stats.currentStreak >= 30
    },
    'disciple': {
        id: 'disciple',
        name: 'Disciple',
        description: 'Maintain a 100-day streak',
        icon: '👑',
        category: 'streaks',
        rarity: 'legendary',
        xpReward: 500,
        condition: (stats) => stats.currentStreak >= 100
    },

    // Game Count Achievements
    'novice_scholar': {
        id: 'novice_scholar',
        name: 'Novice Scholar',
        description: 'Complete 10 games',
        icon: '📚',
        category: 'dedication',
        rarity: 'common',
        xpReward: 25,
        condition: (stats) => stats.totalGames >= 10
    },
    'experienced_scholar': {
        id: 'experienced_scholar',
        name: 'Experienced Scholar',
        description: 'Complete 50 games',
        icon: '📖',
        category: 'dedication',
        rarity: 'common',
        xpReward: 100,
        condition: (stats) => stats.totalGames >= 50
    },
    'century_club': {
        id: 'century_club',
        name: 'Century Club',
        description: 'Complete 100 games',
        icon: '💯',
        category: 'dedication',
        rarity: 'rare',
        xpReward: 250,
        condition: (stats) => stats.totalGames >= 100
    },
    'biblical_expert': {
        id: 'biblical_expert',
        name: 'Biblical Expert',
        description: 'Complete 500 games',
        icon: '🏆',
        category: 'dedication',
        rarity: 'epic',
        xpReward: 1000,
        condition: (stats) => stats.totalGames >= 500
    },

    // Level Achievements
    'level_10_master': {
        id: 'level_10_master',
        name: 'Ascending Scholar',
        description: 'Reach Level 10',
        icon: '🌟',
        category: 'progression',
        rarity: 'common',
        xpReward: 100,
        condition: (stats) => stats.level >= 10
    },
    'level_25_master': {
        id: 'level_25_master',
        name: 'Advanced Scholar',
        description: 'Reach Level 25',
        icon: '✨',
        category: 'progression',
        rarity: 'rare',
        xpReward: 250,
        condition: (stats) => stats.level >= 25
    },
    'level_50_master': {
        id: 'level_50_master',
        name: 'Elite Scholar',
        description: 'Reach Level 50',
        icon: '💎',
        category: 'progression',
        rarity: 'epic',
        xpReward: 500,
        condition: (stats) => stats.level >= 50
    },
    'level_100_master': {
        id: 'level_100_master',
        name: 'Legendary Scholar',
        description: 'Reach Level 100',
        icon: '👑',
        category: 'progression',
        rarity: 'legendary',
        xpReward: 2000,
        condition: (stats) => stats.level >= 100
    },

    // Mode-Specific Achievements
    'timed_champion': {
        id: 'timed_champion',
        name: 'Speed Reader',
        description: 'Complete 25 timed games',
        icon: '⏱️',
        category: 'modes',
        rarity: 'common',
        xpReward: 75,
        condition: (stats, gameData, history) => {
            return history.filter(g => g.mode === 'timed').length >= 25;
        }
    },
    'scenario_master': {
        id: 'scenario_master',
        name: 'Wisdom Seeker',
        description: 'Complete 25 scenario games',
        icon: '🧠',
        category: 'modes',
        rarity: 'common',
        xpReward: 75,
        condition: (stats, gameData, history) => {
            return history.filter(g => g.mode === 'scenario').length >= 25;
        }
    },
    'challenge_victor': {
        id: 'challenge_victor',
        name: 'Challenge Victor',
        description: 'Win 10 challenge games',
        icon: '⚔️',
        category: 'social',
        rarity: 'rare',
        xpReward: 150,
        condition: (stats, gameData, history) => {
            // Will check challenge wins when that data is available
            return false; // Placeholder
        }
    },

    // Question Milestones
    'question_100': {
        id: 'question_100',
        name: 'Curious Mind',
        description: 'Answer 100 questions',
        icon: '❓',
        category: 'knowledge',
        rarity: 'common',
        xpReward: 50,
        condition: (stats) => stats.totalQuestions >= 100
    },
    'question_1000': {
        id: 'question_1000',
        name: 'Knowledge Seeker',
        description: 'Answer 1,000 questions',
        icon: '❔',
        category: 'knowledge',
        rarity: 'rare',
        xpReward: 200,
        condition: (stats) => stats.totalQuestions >= 1000
    },
    'question_5000': {
        id: 'question_5000',
        name: 'Wisdom Hunter',
        description: 'Answer 5,000 questions',
        icon: '💡',
        category: 'knowledge',
        rarity: 'epic',
        xpReward: 500,
        condition: (stats) => stats.totalQuestions >= 5000
    },

    // Special Achievements
    'early_bird': {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Play a game before 6 AM',
        icon: '🌅',
        category: 'special',
        rarity: 'rare',
        xpReward: 100,
        condition: (stats, gameData) => {
            const hour = new Date().getHours();
            return hour >= 4 && hour < 6;
        }
    },
    'night_owl': {
        id: 'night_owl',
        name: 'Night Owl',
        description: 'Play a game after midnight',
        icon: '🦉',
        category: 'special',
        rarity: 'rare',
        xpReward: 100,
        condition: (stats, gameData) => {
            const hour = new Date().getHours();
            return hour >= 0 && hour < 4;
        }
    },
    'weekend_warrior': {
        id: 'weekend_warrior',
        name: 'Weekend Warrior',
        description: 'Play 20 games on weekends',
        icon: '🎮',
        category: 'special',
        rarity: 'rare',
        xpReward: 150,
        condition: (stats, gameData, history) => {
            const weekendGames = history.filter(g => {
                const day = g.timestamp.toDate().getDay();
                return day === 0 || day === 6;
            });
            return weekendGames.length >= 20;
        }
    },
    'polyglot': {
        id: 'polyglot',
        name: 'Polyglot',
        description: 'Play in 3 different languages',
        icon: '🌍',
        category: 'special',
        rarity: 'epic',
        xpReward: 200,
        condition: (stats, gameData, history, profile) => {
            // Will track language switches
            return false; // Placeholder
        }
    }
};

/**
 * Check and award achievements after a game
 */
export async function checkAchievements(gameData, history = []) {
    const user = getCurrentUser();
    if (!user) return [];

    try {
        const stats = getUserStats();
        const userAchievements = await getUserAchievements(user.uid);
        const newAchievements = [];

        // Check each achievement
        for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
            // Skip if already earned
            if (userAchievements.some(a => a.id === id)) continue;

            // Check condition
            if (achievement.condition(stats, gameData, history)) {
                await awardAchievement(user.uid, achievement);
                newAchievements.push(achievement);
            }
        }

        return newAchievements;
    } catch (error) {
        console.error('Error checking achievements:', error);
        return [];
    }
}

/**
 * Award an achievement to a user
 */
async function awardAchievement(uid, achievement) {
    try {
        const achievementRef = doc(db, 'users', uid, 'achievements', achievement.id);
        await setDoc(achievementRef, {
            ...achievement,
            earnedAt: serverTimestamp(),
            condition: undefined // Don't store the function
        });

        // Update user stats with bonus XP
        const statsRef = doc(db, 'users', uid, 'data', 'stats');
        const statsDoc = await getDoc(statsRef);
        if (statsDoc.exists()) {
            const currentXP = statsDoc.data().totalXP || 0;
            await updateDoc(statsRef, {
                totalXP: currentXP + achievement.xpReward
            });
        }

        console.log(`Achievement earned: ${achievement.name} (+${achievement.xpReward} XP)`);
    } catch (error) {
        console.error('Error awarding achievement:', error);
    }
}

/**
 * Get all user achievements
 */
export async function getUserAchievements(uid) {
    try {
        const achievementsRef = collection(db, 'users', uid, 'achievements');
        const snapshot = await getDocs(achievementsRef);
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting achievements:', error);
        return [];
    }
}

/**
 * Get achievement progress
 */
export function getAchievementProgress(achievementId, stats, history = []) {
    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) return null;

    // Calculate progress based on achievement type
    let current = 0;
    let target = 0;

    switch (achievementId) {
        case 'faithful':
            current = stats?.currentStreak || 0;
            target = 7;
            break;
        case 'devoted':
            current = stats?.currentStreak || 0;
            target = 30;
            break;
        case 'disciple':
            current = stats?.currentStreak || 0;
            target = 100;
            break;
        case 'novice_scholar':
            current = stats?.totalGames || 0;
            target = 10;
            break;
        case 'experienced_scholar':
            current = stats?.totalGames || 0;
            target = 50;
            break;
        case 'century_club':
            current = stats?.totalGames || 0;
            target = 100;
            break;
        case 'biblical_expert':
            current = stats?.totalGames || 0;
            target = 500;
            break;
        case 'level_10_master':
            current = stats?.level || 1;
            target = 10;
            break;
        case 'level_25_master':
            current = stats?.level || 1;
            target = 25;
            break;
        case 'level_50_master':
            current = stats?.level || 1;
            target = 50;
            break;
        case 'level_100_master':
            current = stats?.level || 1;
            target = 100;
            break;
        case 'question_100':
            current = stats?.totalQuestions || 0;
            target = 100;
            break;
        case 'question_1000':
            current = stats?.totalQuestions || 0;
            target = 1000;
            break;
        case 'question_5000':
            current = stats?.totalQuestions || 0;
            target = 5000;
            break;
        case 'timed_champion':
            current = history.filter(g => g.mode === 'timed').length;
            target = 25;
            break;
        case 'scenario_master':
            current = history.filter(g => g.mode === 'scenario').length;
            target = 25;
            break;
        case 'weekend_warrior':
            current = history.filter(g => {
                const day = g.timestamp.toDate().getDay();
                return day === 0 || day === 6;
            }).length;
            target = 20;
            break;
        default:
            return null;
    }

    return {
        current: Math.min(current, target),
        target,
        percentage: Math.min((current / target) * 100, 100)
    };
}

/**
 * Get achievements by category
 */
export function getAchievementsByCategory(category) {
    return Object.values(ACHIEVEMENTS).filter(a => a.category === category);
}

/**
 * Get achievements by rarity
 */
export function getAchievementsByRarity(rarity) {
    return Object.values(ACHIEVEMENTS).filter(a => a.rarity === rarity);
}

/**
 * Get rarity color
 */
export function getRarityColor(rarity) {
    const colors = {
        'common': '#95a5a6',
        'rare': '#3498db',
        'epic': '#9b59b6',
        'legendary': '#f39c12'
    };
    return colors[rarity] || colors.common;
}

/**
 * Get category icon
 */
export function getCategoryIcon(category) {
    const icons = {
        'accuracy': '🎯',
        'streaks': '🔥',
        'dedication': '📚',
        'progression': '⭐',
        'modes': '🎮',
        'social': '👥',
        'knowledge': '💡',
        'special': '✨'
    };
    return icons[category] || '🏆';
}
