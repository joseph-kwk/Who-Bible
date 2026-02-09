/**
 * Community Discussions
 * Public discussion rooms for Bible study, questions, and community engagement
 */

import { auth, db } from './firebase-config.js';
import { getCurrentUser } from './auth.js';
import { getText } from './translations.js';

// Discussion room categories
export const DISCUSSION_ROOMS = {
    genesis: {
        id: 'genesis',
        name: 'Genesis Discussions',
        icon: '📖',
        description: 'Creation, patriarchs, and the beginning',
        category: 'old-testament'
    },
    prophets: {
        id: 'prophets',
        name: 'Prophets Study',
        icon: '🔥',
        description: 'Major and minor prophets',
        category: 'old-testament'
    },
    gospels: {
        id: 'gospels',
        name: 'Gospel Discussions',
        icon: '✝️',
        description: 'Life and teachings of Jesus',
        category: 'new-testament'
    },
    epistles: {
        id: 'epistles',
        name: 'Epistles Study',
        icon: '✉️',
        description: 'Letters to the churches',
        category: 'new-testament'
    },
    questions: {
        id: 'questions',
        name: 'Bible Questions',
        icon: '❓',
        description: 'Ask and answer Bible questions',
        category: 'general'
    },
    prayer: {
        id: 'prayer',
        name: 'Prayer Requests',
        icon: '🙏',
        description: 'Share prayer requests and encouragement',
        category: 'general'
    },
    achievements: {
        id: 'achievements',
        name: 'Achievements & Milestones',
        icon: '🏆',
        description: 'Celebrate quiz achievements together',
        category: 'general'
    },
    general: {
        id: 'general',
        name: 'General Discussion',
        icon: '💬',
        description: 'General Bible study and fellowship',
        category: 'general'
    }
};

let activeRoom = null;
let unsubscribeRoom = null;
let messageCache = new Map();

/**
 * Initialize discussion system
 */
export async function initDiscussions() {
    console.log('Community discussions initialized');
}

/**
 * Get messages from a discussion room
 */
export async function getRoomMessages(roomId, limit = 50) {
    try {
        const messagesRef = db.collection('discussion-rooms')
            .doc(roomId)
            .collection('messages')
            .orderBy('timestamp', 'desc')
            .limit(limit);

        const snapshot = await messagesRef.get();
        const messages = [];

        for (const doc of snapshot.docs) {
            messages.push({
                id: doc.id,
                ...doc.data()
            });
        }

        return messages.reverse(); // Show oldest first
    } catch (error) {
        console.error('Error getting room messages:', error);
        return [];
    }
}

/**
 * Send message to discussion room
 */
export async function sendRoomMessage(roomId, content) {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error('Must be logged in to post');
    }

    // Validate content
    if (!content || content.trim().length === 0) {
        throw new Error('Message cannot be empty');
    }

    if (content.length > 500) {
        throw new Error('Message too long (max 500 characters)');
    }

    // Check for spam (rate limiting)
    const lastMessageTime = messageCache.get(`${user.uid}-last-message`);
    if (lastMessageTime && Date.now() - lastMessageTime < 3000) {
        throw new Error('Please wait a few seconds between messages');
    }

    const message = {
        content: sanitizeMessage(content),
        userId: user.uid,
        displayName: user.displayName || 'Anonymous',
        preferredLanguage: user.preferredLanguage || 'en',
        timestamp: new Date().toISOString(),
        reported: false,
        likes: 0
    };

    try {
        const docRef = await db.collection('discussion-rooms')
            .doc(roomId)
            .collection('messages')
            .add(message);

        // Update room metadata
        await db.collection('discussion-rooms').doc(roomId).set({
            lastMessage: message.content.substring(0, 100),
            lastMessageTime: message.timestamp,
            lastMessageUser: message.displayName,
            messageCount: firebase.firestore.FieldValue.increment(1)
        }, { merge: true });

        // Cache last message time
        messageCache.set(`${user.uid}-last-message`, Date.now());

        return {
            id: docRef.id,
            ...message
        };
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
}

/**
 * Subscribe to room messages (real-time)
 */
export function subscribeToRoom(roomId, onMessagesUpdate) {
    // Unsubscribe from previous room
    if (unsubscribeRoom) {
        unsubscribeRoom();
    }

    activeRoom = roomId;

    unsubscribeRoom = db.collection('discussion-rooms')
        .doc(roomId)
        .collection('messages')
        .orderBy('timestamp', 'desc')
        .limit(100)
        .onSnapshot((snapshot) => {
            const messages = [];
            snapshot.forEach((doc) => {
                messages.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            onMessagesUpdate(messages.reverse()); // Oldest first
        }, (error) => {
            console.error('Error subscribing to room:', error);
        });

    return unsubscribeRoom;
}

/**
 * Report inappropriate message
 */
export async function reportMessage(roomId, messageId, reason) {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error('Must be logged in to report');
    }

    try {
        await db.collection('reports').add({
            type: 'discussion-message',
            roomId,
            messageId,
            reportedBy: user.uid,
            reason,
            timestamp: new Date().toISOString(),
            status: 'pending'
        });

        // Mark message as reported
        await db.collection('discussion-rooms')
            .doc(roomId)
            .collection('messages')
            .doc(messageId)
            .update({
                reported: true,
                reportCount: firebase.firestore.FieldValue.increment(1)
            });

        return true;
    } catch (error) {
        console.error('Error reporting message:', error);
        throw error;
    }
}

/**
 * Like/unlike a message
 */
export async function toggleMessageLike(roomId, messageId) {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error('Must be logged in to like');
    }

    try {
        const likeRef = db.collection('discussion-rooms')
            .doc(roomId)
            .collection('messages')
            .doc(messageId)
            .collection('likes')
            .doc(user.uid);

        const likeDoc = await likeRef.get();

        if (likeDoc.exists) {
            // Unlike
            await likeRef.delete();
            await db.collection('discussion-rooms')
                .doc(roomId)
                .collection('messages')
                .doc(messageId)
                .update({
                    likes: firebase.firestore.FieldValue.increment(-1)
                });
            return false;
        } else {
            // Like
            await likeRef.set({
                userId: user.uid,
                timestamp: new Date().toISOString()
            });
            await db.collection('discussion-rooms')
                .doc(roomId)
                .collection('messages')
                .doc(messageId)
                .update({
                    likes: firebase.firestore.FieldValue.increment(1)
                });
            return true;
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        throw error;
    }
}

/**
 * Get user's liked messages in room
 */
export async function getUserLikes(roomId) {
    const user = await getCurrentUser();
    if (!user) return new Set();

    try {
        const messagesSnapshot = await db.collection('discussion-rooms')
            .doc(roomId)
            .collection('messages')
            .limit(100)
            .get();

        const likedMessages = new Set();

        for (const messageDoc of messagesSnapshot.docs) {
            const likeDoc = await db.collection('discussion-rooms')
                .doc(roomId)
                .collection('messages')
                .doc(messageDoc.id)
                .collection('likes')
                .doc(user.uid)
                .get();

            if (likeDoc.exists) {
                likedMessages.add(messageDoc.id);
            }
        }

        return likedMessages;
    } catch (error) {
        console.error('Error getting user likes:', error);
        return new Set();
    }
}

/**
 * Get room statistics
 */
export async function getRoomStats(roomId) {
    try {
        const roomDoc = await db.collection('discussion-rooms').doc(roomId).get();
        if (!roomDoc.exists) {
            return {
                messageCount: 0,
                activeUsers: 0,
                lastMessageTime: null
            };
        }

        const data = roomDoc.data();
        return {
            messageCount: data.messageCount || 0,
            lastMessageTime: data.lastMessageTime || null,
            lastMessageUser: data.lastMessageUser || null
        };
    } catch (error) {
        console.error('Error getting room stats:', error);
        return {
            messageCount: 0,
            activeUsers: 0,
            lastMessageTime: null
        };
    }
}

/**
 * Delete own message (within 5 minutes)
 */
export async function deleteMessage(roomId, messageId) {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error('Must be logged in');
    }

    try {
        const messageDoc = await db.collection('discussion-rooms')
            .doc(roomId)
            .collection('messages')
            .doc(messageId)
            .get();

        if (!messageDoc.exists) {
            throw new Error('Message not found');
        }

        const message = messageDoc.data();
        
        // Check if user owns the message
        if (message.userId !== user.uid) {
            throw new Error('Cannot delete other users\' messages');
        }

        // Check if within 5 minutes
        const messageTime = new Date(message.timestamp).getTime();
        const now = Date.now();
        if (now - messageTime > 5 * 60 * 1000) {
            throw new Error('Can only delete messages within 5 minutes');
        }

        await messageDoc.ref.delete();

        // Update room message count
        await db.collection('discussion-rooms').doc(roomId).update({
            messageCount: firebase.firestore.FieldValue.increment(-1)
        });

        return true;
    } catch (error) {
        console.error('Error deleting message:', error);
        throw error;
    }
}

/**
 * Sanitize message content
 */
function sanitizeMessage(content) {
    // Remove HTML tags
    const div = document.createElement('div');
    div.textContent = content;
    let sanitized = div.innerHTML;

    // Basic profanity filter (extend as needed)
    const profanityList = ['damn', 'hell', 'crap'];
    profanityList.forEach(word => {
        const regex = new RegExp(word, 'gi');
        sanitized = sanitized.replace(regex, '*'.repeat(word.length));
    });

    return sanitized.trim();
}

/**
 * Format timestamp for display
 */
export function formatMessageTime(timestamp) {
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
 * Cleanup subscriptions
 */
export function cleanupDiscussions() {
    if (unsubscribeRoom) {
        unsubscribeRoom();
        unsubscribeRoom = null;
    }
    activeRoom = null;
    messageCache.clear();
}
