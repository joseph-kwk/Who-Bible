/**
 * Notifications System
 * Manages in-app notifications, preferences, and notification center
 */

import { auth, db } from './firebase-config.js';
import { getCurrentUser } from './auth.js';

// Notification types
export const NOTIFICATION_TYPES = {
    ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
    LEVEL_UP: 'level_up',
    FRIEND_REQUEST: 'friend_request',
    FRIEND_ACCEPTED: 'friend_accepted',
    CHALLENGE_RECEIVED: 'challenge_received',
    CHALLENGE_COMPLETED: 'challenge_completed',
    DAILY_CHALLENGE: 'daily_challenge',
    MILESTONE: 'milestone',
    DISCUSSION_REPLY: 'discussion_reply',
    LEADERBOARD_RANK: 'leaderboard_rank'
};

// Notification icons
const NOTIFICATION_ICONS = {
    [NOTIFICATION_TYPES.ACHIEVEMENT_UNLOCKED]: '🏆',
    [NOTIFICATION_TYPES.LEVEL_UP]: '⬆️',
    [NOTIFICATION_TYPES.FRIEND_REQUEST]: '👥',
    [NOTIFICATION_TYPES.FRIEND_ACCEPTED]: '✅',
    [NOTIFICATION_TYPES.CHALLENGE_RECEIVED]: '⚔️',
    [NOTIFICATION_TYPES.CHALLENGE_COMPLETED]: '🎯',
    [NOTIFICATION_TYPES.DAILY_CHALLENGE]: '📅',
    [NOTIFICATION_TYPES.MILESTONE]: '🌟',
    [NOTIFICATION_TYPES.DISCUSSION_REPLY]: '💬',
    [NOTIFICATION_TYPES.LEADERBOARD_RANK]: '📊'
};

let unsubscribeNotifications = null;
let notificationCallbacks = [];

/**
 * Initialize notifications system
 */
export async function initNotifications() {
    const user = await getCurrentUser();
    if (!user) return;

    // Subscribe to real-time notifications
    subscribeToNotifications(user.uid);
}

/**
 * Subscribe to real-time notifications
 */
function subscribeToNotifications(userId) {
    if (unsubscribeNotifications) {
        unsubscribeNotifications();
    }

    unsubscribeNotifications = db.collection('notifications')
        .doc(userId)
        .collection('messages')
        .where('read', '==', false)
        .orderBy('timestamp', 'desc')
        .limit(50)
        .onSnapshot((snapshot) => {
            const notifications = [];
            snapshot.forEach((doc) => {
                notifications.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // Notify all callbacks
            notificationCallbacks.forEach(callback => callback(notifications));
        }, (error) => {
            console.error('Error subscribing to notifications:', error);
        });
}

/**
 * Register callback for notification updates
 */
export function onNotificationsUpdate(callback) {
    notificationCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
        notificationCallbacks = notificationCallbacks.filter(cb => cb !== callback);
    };
}

/**
 * Get all notifications (read and unread)
 */
export async function getNotifications(limit = 50) {
    const user = await getCurrentUser();
    if (!user) return [];

    try {
        const snapshot = await db.collection('notifications')
            .doc(user.uid)
            .collection('messages')
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();

        const notifications = [];
        snapshot.forEach((doc) => {
            notifications.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return notifications;
    } catch (error) {
        console.error('Error getting notifications:', error);
        return [];
    }
}

/**
 * Get unread notifications count
 */
export async function getUnreadCount() {
    const user = await getCurrentUser();
    if (!user) return 0;

    try {
        const snapshot = await db.collection('notifications')
            .doc(user.uid)
            .collection('messages')
            .where('read', '==', false)
            .get();

        return snapshot.size;
    } catch (error) {
        console.error('Error getting unread count:', error);
        return 0;
    }
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId) {
    const user = await getCurrentUser();
    if (!user) return;

    try {
        await db.collection('notifications')
            .doc(user.uid)
            .collection('messages')
            .doc(notificationId)
            .update({
                read: true,
                readAt: new Date().toISOString()
            });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead() {
    const user = await getCurrentUser();
    if (!user) return;

    try {
        const snapshot = await db.collection('notifications')
            .doc(user.uid)
            .collection('messages')
            .where('read', '==', false)
            .get();

        const batch = db.batch();
        snapshot.forEach((doc) => {
            batch.update(doc.ref, {
                read: true,
                readAt: new Date().toISOString()
            });
        });

        await batch.commit();
    } catch (error) {
        console.error('Error marking all as read:', error);
        throw error;
    }
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId) {
    const user = await getCurrentUser();
    if (!user) return;

    try {
        await db.collection('notifications')
            .doc(user.uid)
            .collection('messages')
            .doc(notificationId)
            .delete();
    } catch (error) {
        console.error('Error deleting notification:', error);
        throw error;
    }
}

/**
 * Clear all read notifications
 */
export async function clearReadNotifications() {
    const user = await getCurrentUser();
    if (!user) return;

    try {
        const snapshot = await db.collection('notifications')
            .doc(user.uid)
            .collection('messages')
            .where('read', '==', true)
            .get();

        const batch = db.batch();
        snapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();
    } catch (error) {
        console.error('Error clearing read notifications:', error);
        throw error;
    }
}

/**
 * Create notification (internal use)
 */
export async function createNotification(userId, notification) {
    try {
        await db.collection('notifications')
            .doc(userId)
            .collection('messages')
            .add({
                ...notification,
                read: false,
                timestamp: new Date().toISOString()
            });
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
}

/**
 * Get notification preferences
 */
export async function getNotificationPreferences() {
    const user = await getCurrentUser();
    if (!user) return getDefaultPreferences();

    try {
        const doc = await db.collection('users')
            .doc(user.uid)
            .collection('data')
            .doc('preferences')
            .get();

        if (!doc.exists) {
            return getDefaultPreferences();
        }

        const prefs = doc.data().notifications || {};
        return { ...getDefaultPreferences(), ...prefs };
    } catch (error) {
        console.error('Error getting notification preferences:', error);
        return getDefaultPreferences();
    }
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(preferences) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    try {
        await db.collection('users')
            .doc(user.uid)
            .collection('data')
            .doc('preferences')
            .set({
                notifications: preferences
            }, { merge: true });

        return true;
    } catch (error) {
        console.error('Error updating notification preferences:', error);
        throw error;
    }
}

/**
 * Get default notification preferences
 */
function getDefaultPreferences() {
    return {
        achievements: true,
        levelUp: true,
        friendRequests: true,
        challenges: true,
        dailyChallenges: true,
        milestones: true,
        discussionReplies: true,
        leaderboardRanks: true,
        soundEnabled: true,
        emailEnabled: false // For future email notifications
    };
}

/**
 * Check if notification type is enabled
 */
export async function isNotificationEnabled(type) {
    const prefs = await getNotificationPreferences();
    
    const typeMap = {
        [NOTIFICATION_TYPES.ACHIEVEMENT_UNLOCKED]: prefs.achievements,
        [NOTIFICATION_TYPES.LEVEL_UP]: prefs.levelUp,
        [NOTIFICATION_TYPES.FRIEND_REQUEST]: prefs.friendRequests,
        [NOTIFICATION_TYPES.FRIEND_ACCEPTED]: prefs.friendRequests,
        [NOTIFICATION_TYPES.CHALLENGE_RECEIVED]: prefs.challenges,
        [NOTIFICATION_TYPES.CHALLENGE_COMPLETED]: prefs.challenges,
        [NOTIFICATION_TYPES.DAILY_CHALLENGE]: prefs.dailyChallenges,
        [NOTIFICATION_TYPES.MILESTONE]: prefs.milestones,
        [NOTIFICATION_TYPES.DISCUSSION_REPLY]: prefs.discussionReplies,
        [NOTIFICATION_TYPES.LEADERBOARD_RANK]: prefs.leaderboardRanks
    };

    return typeMap[type] !== false;
}

/**
 * Get notification icon
 */
export function getNotificationIcon(type) {
    return NOTIFICATION_ICONS[type] || '📢';
}

/**
 * Format notification timestamp
 */
export function formatNotificationTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Play notification sound
 */
export async function playNotificationSound() {
    const prefs = await getNotificationPreferences();
    if (!prefs.soundEnabled) return;

    try {
        // Simple beep using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
        console.error('Error playing notification sound:', error);
    }
}

/**
 * Show browser notification (if permission granted)
 */
export async function showBrowserNotification(title, options = {}) {
    if (!('Notification' in window)) return;
    
    const prefs = await getNotificationPreferences();
    if (!prefs.soundEnabled) return; // Use same preference for now

    if (Notification.permission === 'granted') {
        new Notification(title, {
            icon: 'assets/images/logo.png',
            badge: 'assets/images/logo.png',
            ...options
        });
    }
}

/**
 * Request browser notification permission
 */
export async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        return 'denied';
    }

    if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        return permission;
    }

    return Notification.permission;
}

/**
 * Cleanup notifications
 */
export function cleanupNotifications() {
    if (unsubscribeNotifications) {
        unsubscribeNotifications();
        unsubscribeNotifications = null;
    }
    notificationCallbacks = [];
}
