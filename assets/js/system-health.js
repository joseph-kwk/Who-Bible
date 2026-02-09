/**
 * System Health Monitoring
 * Monitor platform health, performance, and usage metrics
 */

import { db } from './firebase-config.js';
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    getDoc,
    doc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import { hasPermission } from './admin-management.js';

/**
 * Get system health overview
 */
export async function getSystemHealth() {
    if (!await hasPermission('view_analytics')) {
        throw new Error('Insufficient permissions');
    }

    try {
        const [
            userMetrics,
            activityMetrics,
            contentMetrics,
            errorMetrics
        ] = await Promise.all([
            getUserMetrics(),
            getActivityMetrics(),
            getContentMetrics(),
            getErrorMetrics()
        ]);

        // Calculate overall health score
        const healthScore = calculateHealthScore({
            userMetrics,
            activityMetrics,
            contentMetrics,
            errorMetrics
        });

        return {
            healthScore,
            status: getHealthStatus(healthScore),
            metrics: {
                users: userMetrics,
                activity: activityMetrics,
                content: contentMetrics,
                errors: errorMetrics
            },
            lastUpdated: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error getting system health:', error);
        throw error;
    }
}

/**
 * Get user metrics
 */
async function getUserMetrics() {
    try {
        const now = new Date();
        const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

        const [
            totalUsers,
            activeToday,
            activeThisWeek,
            activeThisMonth,
            newToday,
            newThisWeek
        ] = await Promise.all([
            getDocs(collection(db, 'users')),
            getDocs(query(
                collection(db, 'users'),
                where('lastActive', '>=', oneDayAgo.toISOString())
            )),
            getDocs(query(
                collection(db, 'users'),
                where('lastActive', '>=', sevenDaysAgo.toISOString())
            )),
            getDocs(query(
                collection(db, 'users'),
                where('lastActive', '>=', thirtyDaysAgo.toISOString())
            )),
            getDocs(query(
                collection(db, 'users'),
                where('createdAt', '>=', oneDayAgo.toISOString())
            )),
            getDocs(query(
                collection(db, 'users'),
                where('createdAt', '>=', sevenDaysAgo.toISOString())
            ))
        ]);

        return {
            total: totalUsers.size,
            activeToday: activeToday.size,
            activeThisWeek: activeThisWeek.size,
            activeThisMonth: activeThisMonth.size,
            newToday: newToday.size,
            newThisWeek: newThisWeek.size,
            retentionRate: totalUsers.size > 0 ? (activeThisMonth.size / totalUsers.size * 100).toFixed(1) : 0
        };
    } catch (error) {
        console.error('Error getting user metrics:', error);
        return null;
    }
}

/**
 * Get activity metrics
 */
async function getActivityMetrics() {
    try {
        const now = new Date();
        const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

        const [
            challengesToday,
            messagesToday,
            achievementsToday
        ] = await Promise.all([
            getDocs(query(
                collection(db, 'friend-challenges'),
                where('createdAt', '>=', oneDayAgo.toISOString())
            )),
            getDocs(query(
                collection(db, 'discussion-messages'),
                where('createdAt', '>=', oneDayAgo.toISOString())
            )),
            // Can't easily query subcollections, estimate
            Promise.resolve({ size: 0 })
        ]);

        return {
            challengesToday: challengesToday.size,
            messagesToday: messagesToday.size,
            achievementsToday: achievementsToday.size
        };
    } catch (error) {
        console.error('Error getting activity metrics:', error);
        return null;
    }
}

/**
 * Get content metrics
 */
async function getContentMetrics() {
    try {
        const [
            totalRooms,
            totalMessages,
            totalChallenges,
            pendingReports
        ] = await Promise.all([
            getDocs(collection(db, 'discussion-rooms')),
            getDocs(collection(db, 'discussion-messages')),
            getDocs(collection(db, 'friend-challenges')),
            getDocs(query(
                collection(db, 'reports'),
                where('status', '==', 'pending')
            ))
        ]);

        return {
            totalRooms: totalRooms.size,
            totalMessages: totalMessages.size,
            totalChallenges: totalChallenges.size,
            pendingReports: pendingReports.size
        };
    } catch (error) {
        console.error('Error getting content metrics:', error);
        return null;
    }
}

/**
 * Get error metrics
 */
async function getErrorMetrics() {
    try {
        // In a real system, you'd track errors in a separate collection
        // For now, return mock data
        return {
            errorsToday: 0,
            criticalErrors: 0,
            errorRate: 0
        };
    } catch (error) {
        console.error('Error getting error metrics:', error);
        return {
            errorsToday: 0,
            criticalErrors: 0,
            errorRate: 0
        };
    }
}

/**
 * Calculate overall health score (0-100)
 */
function calculateHealthScore(metrics) {
    let score = 100;

    // User health (30 points)
    if (metrics.userMetrics) {
        const retentionRate = parseFloat(metrics.userMetrics.retentionRate);
        if (retentionRate < 20) score -= 15;
        else if (retentionRate < 40) score -= 10;
        else if (retentionRate < 60) score -= 5;

        if (metrics.userMetrics.activeToday === 0) score -= 15;
    }

    // Activity health (30 points)
    if (metrics.activityMetrics) {
        if (metrics.activityMetrics.challengesToday === 0) score -= 10;
        if (metrics.activityMetrics.messagesToday === 0) score -= 10;
    }

    // Content health (20 points)
    if (metrics.contentMetrics) {
        if (metrics.contentMetrics.pendingReports > 10) score -= 10;
        else if (metrics.contentMetrics.pendingReports > 5) score -= 5;
    }

    // Error health (20 points)
    if (metrics.errorMetrics) {
        if (metrics.errorMetrics.criticalErrors > 0) score -= 20;
        else if (metrics.errorMetrics.errorsToday > 10) score -= 10;
        else if (metrics.errorMetrics.errorsToday > 5) score -= 5;
    }

    return Math.max(0, Math.min(100, score));
}

/**
 * Get health status from score
 */
function getHealthStatus(score) {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    if (score >= 40) return 'poor';
    return 'critical';
}

/**
 * Get database size estimate
 */
export async function getDatabaseStats() {
    if (!await hasPermission('view_analytics')) {
        throw new Error('Insufficient permissions');
    }

    try {
        const [
            usersCount,
            messagesCount,
            challengesCount,
            achievementsEstimate,
            reportsCount
        ] = await Promise.all([
            getDocs(collection(db, 'users')),
            getDocs(collection(db, 'discussion-messages')),
            getDocs(collection(db, 'friend-challenges')),
            // Estimate achievements (can't easily count subcollections)
            Promise.resolve({ size: 0 }),
            getDocs(collection(db, 'reports'))
        ]);

        const totalDocuments = 
            usersCount.size +
            messagesCount.size +
            challengesCount.size +
            achievementsEstimate.size +
            reportsCount.size;

        // Rough estimate: avg 2KB per document
        const estimatedSize = (totalDocuments * 2) / 1024; // in MB

        return {
            collections: {
                users: usersCount.size,
                messages: messagesCount.size,
                challenges: challengesCount.size,
                reports: reportsCount.size
            },
            totalDocuments,
            estimatedSizeMB: estimatedSize.toFixed(2),
            lastUpdated: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error getting database stats:', error);
        throw error;
    }
}

/**
 * Get performance metrics
 */
export async function getPerformanceMetrics() {
    if (!await hasPermission('view_analytics')) {
        throw new Error('Insufficient permissions');
    }

    try {
        // In a real system, you'd track these metrics over time
        // For now, return current performance snapshot
        const performance = window.performance || {};
        const navigation = performance.navigation || {};
        const timing = performance.timing || {};

        return {
            pageLoadTime: timing.loadEventEnd ? timing.loadEventEnd - timing.navigationStart : 0,
            domContentLoaded: timing.domContentLoadedEventEnd ? timing.domContentLoadedEventEnd - timing.navigationStart : 0,
            responseTime: timing.responseEnd ? timing.responseEnd - timing.requestStart : 0,
            memory: performance.memory ? {
                usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
                totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
                jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
            } : null
        };
    } catch (error) {
        console.error('Error getting performance metrics:', error);
        return null;
    }
}

/**
 * Get usage trends (last 30 days)
 */
export async function getUsageTrends() {
    if (!await hasPermission('view_analytics')) {
        throw new Error('Insufficient permissions');
    }

    try {
        const trends = [];
        const now = new Date();

        // Get data for last 30 days
        for (let i = 29; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const [activeUsers, newUsers] = await Promise.all([
                getDocs(query(
                    collection(db, 'users'),
                    where('lastActive', '>=', date.toISOString()),
                    where('lastActive', '<', nextDate.toISOString())
                )),
                getDocs(query(
                    collection(db, 'users'),
                    where('createdAt', '>=', date.toISOString()),
                    where('createdAt', '<', nextDate.toISOString())
                ))
            ]);

            trends.push({
                date: date.toISOString().split('T')[0],
                activeUsers: activeUsers.size,
                newUsers: newUsers.size
            });
        }

        return trends;
    } catch (error) {
        console.error('Error getting usage trends:', error);
        return [];
    }
}

/**
 * Get real-time stats
 */
export async function getRealTimeStats() {
    if (!await hasPermission('view_analytics')) {
        throw new Error('Insufficient permissions');
    }

    try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        const [
            activeNow,
            recentActivity
        ] = await Promise.all([
            getDocs(query(
                collection(db, 'users'),
                where('lastActive', '>=', fiveMinutesAgo.toISOString())
            )),
            getDocs(query(
                collection(db, 'discussion-messages'),
                where('createdAt', '>=', fiveMinutesAgo.toISOString())
            ))
        ]);

        return {
            usersOnline: activeNow.size,
            recentMessages: recentActivity.size,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error getting real-time stats:', error);
        return null;
    }
}

/**
 * Get top users by activity
 */
export async function getTopUsers(limitCount = 10) {
    if (!await hasPermission('view_analytics')) {
        throw new Error('Insufficient permissions');
    }

    try {
        // Get users with most XP
        const q = query(
            collection(db, 'users'),
            orderBy('totalXP', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        const topUsers = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            topUsers.push({
                uid: doc.id,
                displayName: data.displayName,
                level: data.level,
                totalXP: data.totalXP,
                totalGames: data.totalGames,
                accuracy: data.accuracy
            });
        });

        return topUsers;
    } catch (error) {
        console.error('Error getting top users:', error);
        return [];
    }
}

/**
 * Get system alerts
 */
export async function getSystemAlerts() {
    if (!await hasPermission('view_analytics')) {
        throw new Error('Insufficient permissions');
    }

    const alerts = [];

    try {
        // Check for high pending reports
        const pendingReports = await getDocs(query(
            collection(db, 'reports'),
            where('status', '==', 'pending')
        ));

        if (pendingReports.size > 10) {
            alerts.push({
                level: 'warning',
                message: `${pendingReports.size} pending reports require attention`,
                action: 'review_reports'
            });
        }

        // Check for low activity
        const activeToday = await getDocs(query(
            collection(db, 'users'),
            where('lastActive', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        ));

        if (activeToday.size === 0) {
            alerts.push({
                level: 'critical',
                message: 'No active users in the last 24 hours',
                action: 'investigate'
            });
        }

        // Check for banned users
        const bannedUsers = await getDocs(query(
            collection(db, 'users'),
            where('isBanned', '==', true)
        ));

        if (bannedUsers.size > 0) {
            alerts.push({
                level: 'info',
                message: `${bannedUsers.size} users currently banned`,
                action: 'review_bans'
            });
        }

        return alerts;
    } catch (error) {
        console.error('Error getting system alerts:', error);
        return alerts;
    }
}

/**
 * Export system report
 */
export async function exportSystemReport() {
    if (!await hasPermission('view_analytics')) {
        throw new Error('Insufficient permissions');
    }

    try {
        const [
            health,
            dbStats,
            performance,
            trends,
            topUsers,
            alerts
        ] = await Promise.all([
            getSystemHealth(),
            getDatabaseStats(),
            getPerformanceMetrics(),
            getUsageTrends(),
            getTopUsers(20),
            getSystemAlerts()
        ]);

        const report = {
            generatedAt: new Date().toISOString(),
            health,
            database: dbStats,
            performance,
            trends,
            topUsers,
            alerts
        };

        // Create downloadable JSON
        const json = JSON.stringify(report, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `system-report-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error('Error exporting system report:', error);
        throw error;
    }
}
