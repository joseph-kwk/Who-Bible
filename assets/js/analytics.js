/**
 * Analytics & Progress Tracking
 * Advanced statistics, insights, and learning analytics
 */

import { db } from './firebase-config.js';
import { 
    doc, 
    getDoc, 
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    Timestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import { getCurrentUser, getUserProfile } from './auth.js';
import { getUserStats } from './user-profile.js';

/**
 * Get comprehensive user analytics
 */
export async function getUserAnalytics(timeRange = 'all') {
    const user = getCurrentUser();
    if (!user) return null;

    const stats = getUserStats();
    const gameHistory = await getGameHistory(user.uid, timeRange);
    
    return {
        overview: calculateOverviewStats(stats, gameHistory),
        trends: calculateTrends(gameHistory),
        records: calculatePersonalRecords(gameHistory),
        insights: generateLearningInsights(stats, gameHistory),
        modePerformance: analyzeModePerformance(gameHistory),
        streakData: analyzeStreakData(stats, gameHistory),
        timeAnalysis: analyzeTimeSpent(gameHistory),
        accuracyTrend: analyzeAccuracyTrend(gameHistory)
    };
}

/**
 * Calculate overview statistics
 */
function calculateOverviewStats(stats, gameHistory) {
    const recentGames = gameHistory.slice(0, 10);
    const recentAccuracy = recentGames.length > 0
        ? recentGames.reduce((sum, g) => sum + parseFloat(g.accuracy), 0) / recentGames.length
        : 0;

    const totalTimeSpent = gameHistory.reduce((sum, g) => sum + (g.duration || 0), 0);
    const avgTimePerGame = gameHistory.length > 0 ? totalTimeSpent / gameHistory.length : 0;

    return {
        totalGames: stats?.totalGames || 0,
        totalQuestions: stats?.totalQuestions || 0,
        overallAccuracy: stats?.accuracy || 0,
        recentAccuracy: recentAccuracy.toFixed(2),
        accuracyTrend: recentAccuracy > (stats?.accuracy || 0) ? 'up' : 'down',
        currentStreak: stats?.currentStreak || 0,
        longestStreak: stats?.longestStreak || 0,
        totalXP: stats?.totalXP || 0,
        currentLevel: stats?.level || 1,
        totalTimeSpent: Math.floor(totalTimeSpent / 1000), // in seconds
        avgTimePerGame: Math.floor(avgTimePerGame / 1000), // in seconds
        perfectGames: gameHistory.filter(g => parseFloat(g.accuracy) === 100).length,
        gamesThisWeek: gameHistory.filter(g => isThisWeek(g.timestamp)).length,
        gamesThisMonth: gameHistory.filter(g => isThisMonth(g.timestamp)).length
    };
}

/**
 * Calculate performance trends
 */
function calculateTrends(gameHistory) {
    if (gameHistory.length < 2) {
        return { accuracy: [], gamesPerDay: [], xpPerDay: [] };
    }

    // Group by day for the last 30 days
    const last30Days = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const dayGames = gameHistory.filter(g => {
            const gameDate = g.timestamp.toDate();
            return gameDate >= date && gameDate < nextDate;
        });

        const dayAccuracy = dayGames.length > 0
            ? dayGames.reduce((sum, g) => sum + parseFloat(g.accuracy), 0) / dayGames.length
            : null;

        const dayXP = dayGames.reduce((sum, g) => sum + (g.xpGained || 0), 0);

        last30Days.push({
            date: date.toISOString().split('T')[0],
            gamesPlayed: dayGames.length,
            accuracy: dayAccuracy,
            xpEarned: dayXP
        });
    }

    return {
        daily: last30Days,
        weeklyAverage: calculateWeeklyAverage(last30Days),
        monthlyTotal: {
            games: last30Days.reduce((sum, d) => sum + d.gamesPlayed, 0),
            xp: last30Days.reduce((sum, d) => sum + d.xpEarned, 0),
            avgAccuracy: calculateAverage(last30Days.filter(d => d.accuracy !== null).map(d => d.accuracy))
        }
    };
}

/**
 * Calculate weekly averages
 */
function calculateWeeklyAverage(dailyData) {
    const weeks = [];
    for (let i = 0; i < dailyData.length; i += 7) {
        const week = dailyData.slice(i, i + 7);
        weeks.push({
            gamesPerDay: calculateAverage(week.map(d => d.gamesPlayed)),
            avgAccuracy: calculateAverage(week.filter(d => d.accuracy !== null).map(d => d.accuracy)),
            xpPerDay: calculateAverage(week.map(d => d.xpEarned))
        });
    }
    return weeks;
}

/**
 * Calculate personal records
 */
function calculatePersonalRecords(gameHistory) {
    if (gameHistory.length === 0) {
        return {
            highestScore: 0,
            bestAccuracy: 0,
            mostQuestionsInGame: 0,
            longestGameStreak: 0,
            mostXPInGame: 0,
            fastestPerfectGame: null,
            mostGamesInDay: 0,
            bestWeek: null
        };
    }

    // Highest score
    const highestScore = Math.max(...gameHistory.map(g => g.score || 0));
    const highScoreGame = gameHistory.find(g => g.score === highestScore);

    // Best accuracy (100% games, sorted by questions)
    const perfectGames = gameHistory.filter(g => parseFloat(g.accuracy) === 100);
    const bestAccuracyGame = perfectGames.sort((a, b) => b.totalQuestions - a.totalQuestions)[0];

    // Most questions in a single game
    const mostQuestions = Math.max(...gameHistory.map(g => g.totalQuestions || 0));
    const mostQuestionsGame = gameHistory.find(g => g.totalQuestions === mostQuestions);

    // Most XP in a single game
    const mostXP = Math.max(...gameHistory.map(g => g.xpGained || 0));
    const mostXPGame = gameHistory.find(g => g.xpGained === mostXP);

    // Fastest perfect game (if duration tracked)
    const timedPerfectGames = perfectGames.filter(g => g.duration);
    const fastestPerfect = timedPerfectGames.sort((a, b) => a.duration - b.duration)[0];

    // Most games in a day
    const gamesByDay = groupByDay(gameHistory);
    const mostGamesInDay = Math.max(...Object.values(gamesByDay).map(games => games.length), 0);

    // Best week (most XP)
    const bestWeek = findBestWeek(gameHistory);

    return {
        highestScore: {
            value: highestScore,
            game: highScoreGame,
            date: highScoreGame?.timestamp.toDate()
        },
        bestAccuracy: {
            value: 100,
            questions: bestAccuracyGame?.totalQuestions || 0,
            game: bestAccuracyGame,
            date: bestAccuracyGame?.timestamp.toDate()
        },
        mostQuestionsInGame: {
            value: mostQuestions,
            game: mostQuestionsGame,
            date: mostQuestionsGame?.timestamp.toDate()
        },
        mostXPInGame: {
            value: mostXP,
            game: mostXPGame,
            date: mostXPGame?.timestamp.toDate()
        },
        fastestPerfectGame: fastestPerfect ? {
            duration: fastestPerfect.duration,
            game: fastestPerfect,
            date: fastestPerfect.timestamp.toDate()
        } : null,
        mostGamesInDay: {
            value: mostGamesInDay,
            date: findDateWithMostGames(gamesByDay)
        },
        bestWeek: bestWeek
    };
}

/**
 * Generate learning insights
 */
function generateLearningInsights(stats, gameHistory) {
    const insights = [];

    // Accuracy insights
    const recentGames = gameHistory.slice(0, 20);
    const recentAccuracy = calculateAverage(recentGames.map(g => parseFloat(g.accuracy)));
    
    if (recentAccuracy > (stats?.accuracy || 0) + 5) {
        insights.push({
            type: 'positive',
            category: 'accuracy',
            message: `You're on fire! Your recent accuracy (${recentAccuracy.toFixed(1)}%) is higher than your overall average.`,
            icon: '🔥'
        });
    } else if (recentAccuracy < (stats?.accuracy || 0) - 5) {
        insights.push({
            type: 'improvement',
            category: 'accuracy',
            message: `Your recent accuracy (${recentAccuracy.toFixed(1)}%) has dipped. Try Study Mode to refresh your knowledge.`,
            icon: '📚'
        });
    }

    // Streak insights
    const currentStreak = stats?.currentStreak || 0;
    const longestStreak = stats?.longestStreak || 0;
    
    if (currentStreak >= 7) {
        insights.push({
            type: 'positive',
            category: 'consistency',
            message: `Amazing! You're on a ${currentStreak}-day streak. Keep the momentum going!`,
            icon: '⚡'
        });
    } else if (currentStreak === 0 && longestStreak > 7) {
        insights.push({
            type: 'motivational',
            category: 'consistency',
            message: `Your longest streak was ${longestStreak} days. You can do it again!`,
            icon: '💪'
        });
    }

    // Mode performance insights
    const modeStats = analyzeModePerformance(gameHistory);
    const bestMode = Object.entries(modeStats).sort((a, b) => b[1].avgAccuracy - a[1].avgAccuracy)[0];
    const worstMode = Object.entries(modeStats).sort((a, b) => a[1].avgAccuracy - b[1].avgAccuracy)[0];
    
    if (bestMode && worstMode && bestMode[0] !== worstMode[0]) {
        insights.push({
            type: 'insight',
            category: 'modes',
            message: `You excel at ${formatModeName(bestMode[0])} (${bestMode[1].avgAccuracy.toFixed(1)}% accuracy). Try focusing on ${formatModeName(worstMode[0])} to improve.`,
            icon: '🎯'
        });
    }

    // Progress insights
    const totalGames = stats?.totalGames || 0;
    if (totalGames >= 100) {
        insights.push({
            type: 'milestone',
            category: 'achievement',
            message: `You've completed ${totalGames} games! You're a dedicated scholar.`,
            icon: '🏆'
        });
    }

    // Time-based insights
    const gamesThisWeek = gameHistory.filter(g => isThisWeek(g.timestamp)).length;
    const lastWeekGames = gameHistory.filter(g => isLastWeek(g.timestamp)).length;
    
    if (gamesThisWeek > lastWeekGames && lastWeekGames > 0) {
        const increase = ((gamesThisWeek - lastWeekGames) / lastWeekGames * 100).toFixed(0);
        insights.push({
            type: 'positive',
            category: 'activity',
            message: `You're ${increase}% more active this week compared to last week!`,
            icon: '📈'
        });
    }

    // Learning velocity
    const last7Days = gameHistory.filter(g => {
        const daysDiff = (new Date() - g.timestamp.toDate()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7;
    });
    
    const questionsLast7Days = last7Days.reduce((sum, g) => sum + g.totalQuestions, 0);
    
    if (questionsLast7Days > 50) {
        insights.push({
            type: 'positive',
            category: 'learning',
            message: `You've answered ${questionsLast7Days} questions in the last 7 days. Outstanding dedication!`,
            icon: '🌟'
        });
    }

    return insights;
}

/**
 * Analyze performance by mode
 */
function analyzeModePerformance(gameHistory) {
    const modeStats = {};

    gameHistory.forEach(game => {
        const mode = game.mode || 'solo';
        if (!modeStats[mode]) {
            modeStats[mode] = {
                gamesPlayed: 0,
                totalQuestions: 0,
                correctAnswers: 0,
                totalXP: 0,
                avgAccuracy: 0,
                perfectGames: 0
            };
        }

        const stats = modeStats[mode];
        stats.gamesPlayed++;
        stats.totalQuestions += game.totalQuestions;
        stats.correctAnswers += game.correctAnswers;
        stats.totalXP += game.xpGained || 0;
        
        if (parseFloat(game.accuracy) === 100) {
            stats.perfectGames++;
        }
    });

    // Calculate averages
    Object.values(modeStats).forEach(stats => {
        stats.avgAccuracy = (stats.correctAnswers / stats.totalQuestions * 100) || 0;
        stats.avgXPPerGame = stats.totalXP / stats.gamesPlayed;
    });

    return modeStats;
}

/**
 * Analyze streak data for visualization
 */
function analyzeStreakData(stats, gameHistory) {
    const streakHistory = [];
    let currentStreak = 0;
    let lastDate = null;

    // Sort games by date
    const sortedGames = [...gameHistory].sort((a, b) => 
        a.timestamp.toDate() - b.timestamp.toDate()
    );

    sortedGames.forEach(game => {
        const gameDate = new Date(game.timestamp.toDate());
        gameDate.setHours(0, 0, 0, 0);

        if (!lastDate) {
            currentStreak = 1;
        } else {
            const daysDiff = Math.floor((gameDate - lastDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === 1) {
                currentStreak++;
            } else if (daysDiff > 1) {
                currentStreak = 1;
            }
        }

        streakHistory.push({
            date: gameDate.toISOString().split('T')[0],
            streak: currentStreak
        });

        lastDate = gameDate;
    });

    return {
        currentStreak: stats?.currentStreak || 0,
        longestStreak: stats?.longestStreak || 0,
        history: streakHistory,
        avgStreak: streakHistory.length > 0 
            ? streakHistory.reduce((sum, s) => sum + s.streak, 0) / streakHistory.length 
            : 0
    };
}

/**
 * Analyze time spent patterns
 */
function analyzeTimeSpent(gameHistory) {
    const gamesWithDuration = gameHistory.filter(g => g.duration);
    
    if (gamesWithDuration.length === 0) {
        return { totalTime: 0, avgTime: 0, byMode: {}, byHour: {} };
    }

    const totalTime = gamesWithDuration.reduce((sum, g) => sum + g.duration, 0);
    const avgTime = totalTime / gamesWithDuration.length;

    // Time by mode
    const byMode = {};
    gamesWithDuration.forEach(game => {
        const mode = game.mode || 'solo';
        if (!byMode[mode]) {
            byMode[mode] = { totalTime: 0, count: 0, avgTime: 0 };
        }
        byMode[mode].totalTime += game.duration;
        byMode[mode].count++;
    });

    Object.values(byMode).forEach(stats => {
        stats.avgTime = stats.totalTime / stats.count;
    });

    // Time by hour of day
    const byHour = {};
    gamesWithDuration.forEach(game => {
        const hour = game.timestamp.toDate().getHours();
        if (!byHour[hour]) {
            byHour[hour] = { gamesPlayed: 0, totalTime: 0 };
        }
        byHour[hour].gamesPlayed++;
        byHour[hour].totalTime += game.duration;
    });

    return {
        totalTime: Math.floor(totalTime / 1000), // seconds
        avgTime: Math.floor(avgTime / 1000), // seconds
        byMode,
        byHour,
        mostActiveHour: Object.entries(byHour).sort((a, b) => b[1].gamesPlayed - a[1].gamesPlayed)[0]?.[0]
    };
}

/**
 * Analyze accuracy trends over time
 */
function analyzeAccuracyTrend(gameHistory) {
    const dataPoints = [];
    const windowSize = 5; // Moving average window

    for (let i = 0; i < gameHistory.length; i++) {
        const game = gameHistory[i];
        const startIndex = Math.max(0, i - windowSize + 1);
        const window = gameHistory.slice(startIndex, i + 1);
        const movingAvg = calculateAverage(window.map(g => parseFloat(g.accuracy)));

        dataPoints.push({
            gameNumber: gameHistory.length - i,
            accuracy: parseFloat(game.accuracy),
            movingAverage: movingAvg,
            date: game.timestamp.toDate()
        });
    }

    return dataPoints.reverse();
}

/**
 * Get game history with optional time range filter
 */
async function getGameHistory(uid, timeRange = 'all') {
    try {
        const gamesRef = collection(db, 'users', uid, 'games');
        let q = query(gamesRef, orderBy('timestamp', 'desc'));

        // Apply time range filter
        if (timeRange !== 'all') {
            const now = new Date();
            let startDate = new Date();

            switch (timeRange) {
                case 'week':
                    startDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    startDate.setMonth(now.getMonth() - 1);
                    break;
                case '3months':
                    startDate.setMonth(now.getMonth() - 3);
                    break;
                case 'year':
                    startDate.setFullYear(now.getFullYear() - 1);
                    break;
            }

            q = query(q, where('timestamp', '>=', Timestamp.fromDate(startDate)));
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching game history:', error);
        return [];
    }
}

// Helper functions

function calculateAverage(arr) {
    return arr.length > 0 ? arr.reduce((sum, val) => sum + val, 0) / arr.length : 0;
}

function isThisWeek(timestamp) {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return timestamp.toDate() >= weekAgo;
}

function isThisMonth(timestamp) {
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return timestamp.toDate() >= monthAgo;
}

function isLastWeek(timestamp) {
    const now = new Date();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const gameDate = timestamp.toDate();
    return gameDate >= twoWeeksAgo && gameDate < weekAgo;
}

function groupByDay(gameHistory) {
    const byDay = {};
    gameHistory.forEach(game => {
        const date = game.timestamp.toDate().toISOString().split('T')[0];
        if (!byDay[date]) byDay[date] = [];
        byDay[date].push(game);
    });
    return byDay;
}

function findDateWithMostGames(gamesByDay) {
    let maxDate = null;
    let maxGames = 0;

    Object.entries(gamesByDay).forEach(([date, games]) => {
        if (games.length > maxGames) {
            maxGames = games.length;
            maxDate = date;
        }
    });

    return maxDate;
}

function findBestWeek(gameHistory) {
    const weeklyXP = {};

    gameHistory.forEach(game => {
        const weekKey = getWeekKey(game.timestamp.toDate());
        if (!weeklyXP[weekKey]) {
            weeklyXP[weekKey] = 0;
        }
        weeklyXP[weekKey] += game.xpGained || 0;
    });

    const bestWeekEntry = Object.entries(weeklyXP).sort((a, b) => b[1] - a[1])[0];
    
    return bestWeekEntry ? {
        week: bestWeekEntry[0],
        xp: bestWeekEntry[1]
    } : null;
}

function getWeekKey(date) {
    const year = date.getFullYear();
    const week = getWeekNumber(date);
    return `${year}-W${week}`;
}

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function formatModeName(mode) {
    const names = {
        'solo': 'Solo Mode',
        'timed': 'Timed Mode',
        'challenge': 'Challenge Mode',
        'scenario': 'Scenarios Mode',
        'relationship': 'Relationship Mode',
        'advanced': 'Advanced Mode'
    };
    return names[mode] || mode;
}

/**
 * Export analytics data as JSON
 */
export async function exportAnalyticsData(timeRange = 'all') {
    const analytics = await getUserAnalytics(timeRange);
    const profile = getUserProfile();
    
    const exportData = {
        exportDate: new Date().toISOString(),
        timeRange,
        user: {
            displayName: profile?.displayName,
            level: analytics.overview.currentLevel,
            totalXP: analytics.overview.totalXP
        },
        ...analytics
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `who-bible-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}
