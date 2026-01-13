/**
 * Content Moderation System
 * Tools for moderating discussions, reports, and user-generated content
 */

import { db } from './firebase-config.js';
import {
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    serverTimestamp,
    writeBatch
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import { getAdminUser, hasPermission } from './admin-management.js';

/**
 * Report statuses
 */
export const REPORT_STATUS = {
    PENDING: 'pending',
    REVIEWING: 'reviewing',
    RESOLVED: 'resolved',
    DISMISSED: 'dismissed'
};

/**
 * Report types
 */
export const REPORT_TYPES = {
    SPAM: 'spam',
    HARASSMENT: 'harassment',
    INAPPROPRIATE: 'inappropriate',
    FALSE_INFO: 'false_information',
    OTHER: 'other'
};

/**
 * Moderation actions
 */
export const MOD_ACTIONS = {
    DELETE_MESSAGE: 'delete_message',
    BAN_USER: 'ban_user',
    WARN_USER: 'warn_user',
    DELETE_ROOM: 'delete_room',
    DISMISS: 'dismiss'
};

/**
 * Get all reports
 */
export async function getAllReports(options = {}) {
    if (!await hasPermission('manage_reports')) {
        throw new Error('Insufficient permissions');
    }

    const {
        status = null,
        type = null,
        limitCount = 50
    } = options;

    try {
        let q = query(
            collection(db, 'reports'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        if (status) {
            q = query(q, where('status', '==', status));
        }

        if (type) {
            q = query(q, where('type', '==', type));
        }

        const snapshot = await getDocs(q);
        const reports = [];

        for (const doc of snapshot.docs) {
            const reportData = doc.data();
            
            // Get additional context
            const [reporter, reported] = await Promise.all([
                getUserBasicInfo(reportData.reporterId),
                reportData.reportedUserId ? getUserBasicInfo(reportData.reportedUserId) : null
            ]);

            reports.push({
                id: doc.id,
                ...reportData,
                reporterInfo: reporter,
                reportedUserInfo: reported
            });
        }

        return reports;
    } catch (error) {
        console.error('Error getting reports:', error);
        return [];
    }
}

/**
 * Get report details
 */
export async function getReportDetails(reportId) {
    if (!await hasPermission('manage_reports')) {
        throw new Error('Insufficient permissions');
    }

    try {
        const reportDoc = await getDoc(doc(db, 'reports', reportId));
        
        if (!reportDoc.exists()) {
            throw new Error('Report not found');
        }

        const reportData = reportDoc.data();

        // Get full context
        const [reporter, reported, content] = await Promise.all([
            getUserBasicInfo(reportData.reporterId),
            reportData.reportedUserId ? getUserBasicInfo(reportData.reportedUserId) : null,
            reportData.contentType === 'message' ? getMessageContent(reportData.contentId) : null
        ]);

        return {
            id: reportId,
            ...reportData,
            reporterInfo: reporter,
            reportedUserInfo: reported,
            contentDetails: content
        };
    } catch (error) {
        console.error('Error getting report details:', error);
        throw error;
    }
}

/**
 * Update report status
 */
export async function updateReportStatus(reportId, status, notes = '') {
    if (!await hasPermission('manage_reports')) {
        throw new Error('Insufficient permissions');
    }

    try {
        const admin = await getAdminUser();

        await updateDoc(doc(db, 'reports', reportId), {
            status,
            reviewedBy: admin.uid,
            reviewedAt: serverTimestamp(),
            reviewNotes: notes
        });

        // Log action
        await logModerationAction({
            action: 'update_report_status',
            reportId,
            newStatus: status,
            notes,
            moderatorUid: admin.uid
        });

        return true;
    } catch (error) {
        console.error('Error updating report status:', error);
        throw error;
    }
}

/**
 * Take moderation action
 */
export async function takeModerationAction(reportId, action, reason = '') {
    if (!await hasPermission('moderate_content')) {
        throw new Error('Insufficient permissions');
    }

    try {
        const report = await getReportDetails(reportId);
        const admin = await getAdminUser();

        switch (action) {
            case MOD_ACTIONS.DELETE_MESSAGE:
                await deleteMessage(report.contentId);
                break;

            case MOD_ACTIONS.BAN_USER:
                if (!await hasPermission('ban_users')) {
                    throw new Error('Insufficient permissions to ban users');
                }
                await banUser(report.reportedUserId, reason);
                break;

            case MOD_ACTIONS.WARN_USER:
                await warnUser(report.reportedUserId, reason);
                break;

            case MOD_ACTIONS.DELETE_ROOM:
                await deleteRoom(report.roomId);
                break;

            case MOD_ACTIONS.DISMISS:
                // Just update status
                break;
        }

        // Update report
        await updateDoc(doc(db, 'reports', reportId), {
            status: REPORT_STATUS.RESOLVED,
            action,
            actionReason: reason,
            actionTakenBy: admin.uid,
            actionTakenAt: serverTimestamp()
        });

        // Log action
        await logModerationAction({
            action: 'moderation_action',
            reportId,
            moderationAction: action,
            reason,
            moderatorUid: admin.uid
        });

        return true;
    } catch (error) {
        console.error('Error taking moderation action:', error);
        throw error;
    }
}

/**
 * Delete message
 */
async function deleteMessage(messageId) {
    try {
        // Mark message as deleted
        const messageRef = doc(db, 'discussion-messages', messageId);
        await updateDoc(messageRef, {
            isDeleted: true,
            deletedAt: serverTimestamp(),
            deletedByModerator: true
        });
    } catch (error) {
        console.error('Error deleting message:', error);
        throw error;
    }
}

/**
 * Ban user (imported from admin-management.js)
 */
async function banUser(uid, reason) {
    const { toggleUserBan } = await import('./admin-management.js');
    return await toggleUserBan(uid, reason);
}

/**
 * Warn user
 */
async function warnUser(uid, reason) {
    try {
        // Add warning to user's record
        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
            const warnings = userDoc.data().warnings || [];
            warnings.push({
                reason,
                timestamp: serverTimestamp()
            });

            await updateDoc(userRef, { warnings });
        }

        // TODO: Send notification to user
    } catch (error) {
        console.error('Error warning user:', error);
        throw error;
    }
}

/**
 * Delete room
 */
async function deleteRoom(roomId) {
    try {
        const roomRef = doc(db, 'discussion-rooms', roomId);
        await updateDoc(roomRef, {
            isDeleted: true,
            deletedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error deleting room:', error);
        throw error;
    }
}

/**
 * Get message content
 */
async function getMessageContent(messageId) {
    try {
        const messageDoc = await getDoc(doc(db, 'discussion-messages', messageId));
        
        if (!messageDoc.exists()) {
            return null;
        }

        return messageDoc.data();
    } catch (error) {
        console.error('Error getting message content:', error);
        return null;
    }
}

/**
 * Get user basic info
 */
async function getUserBasicInfo(uid) {
    try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        
        if (!userDoc.exists()) {
            return { uid, displayName: 'Unknown User' };
        }

        const data = userDoc.data();
        return {
            uid,
            displayName: data.displayName,
            email: data.email,
            isBanned: data.isBanned || false
        };
    } catch (error) {
        console.error('Error getting user basic info:', error);
        return { uid, displayName: 'Unknown User' };
    }
}

/**
 * Get flagged content
 */
export async function getFlaggedContent(limitCount = 50) {
    if (!await hasPermission('moderate_content')) {
        throw new Error('Insufficient permissions');
    }

    try {
        // Get messages with high report count
        const q = query(
            collection(db, 'discussion-messages'),
            where('reportCount', '>=', 3),
            orderBy('reportCount', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        const flagged = [];

        for (const doc of snapshot.docs) {
            const messageData = doc.data();
            const author = await getUserBasicInfo(messageData.authorId);

            flagged.push({
                id: doc.id,
                ...messageData,
                authorInfo: author
            });
        }

        return flagged;
    } catch (error) {
        console.error('Error getting flagged content:', error);
        return [];
    }
}

/**
 * Bulk delete messages
 */
export async function bulkDeleteMessages(messageIds) {
    if (!await hasPermission('moderate_content')) {
        throw new Error('Insufficient permissions');
    }

    const batch = writeBatch(db);

    try {
        for (const messageId of messageIds) {
            const messageRef = doc(db, 'discussion-messages', messageId);
            batch.update(messageRef, {
                isDeleted: true,
                deletedAt: serverTimestamp(),
                deletedByModerator: true
            });
        }

        await batch.commit();

        const admin = await getAdminUser();
        await logModerationAction({
            action: 'bulk_delete_messages',
            messageIds,
            moderatorUid: admin.uid
        });

        return true;
    } catch (error) {
        console.error('Error bulk deleting messages:', error);
        throw error;
    }
}

/**
 * Get moderation statistics
 */
export async function getModerationStats() {
    if (!await hasPermission('view_analytics')) {
        throw new Error('Insufficient permissions');
    }

    try {
        const [
            pendingReports,
            resolvedReports,
            flaggedContent,
            bannedUsers
        ] = await Promise.all([
            getDocs(query(
                collection(db, 'reports'),
                where('status', '==', REPORT_STATUS.PENDING)
            )),
            getDocs(query(
                collection(db, 'reports'),
                where('status', '==', REPORT_STATUS.RESOLVED),
                where('reviewedAt', '>=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            )),
            getDocs(query(
                collection(db, 'discussion-messages'),
                where('reportCount', '>=', 3)
            )),
            getDocs(query(
                collection(db, 'users'),
                where('isBanned', '==', true)
            ))
        ]);

        return {
            pendingReports: pendingReports.size,
            resolvedThisWeek: resolvedReports.size,
            flaggedContent: flaggedContent.size,
            bannedUsers: bannedUsers.size
        };
    } catch (error) {
        console.error('Error getting moderation stats:', error);
        return null;
    }
}

/**
 * Get recent moderation actions
 */
export async function getRecentModerationActions(limitCount = 20) {
    if (!await hasPermission('manage_reports')) {
        throw new Error('Insufficient permissions');
    }

    try {
        const q = query(
            collection(db, 'moderation-logs'),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        const actions = [];

        for (const doc of snapshot.docs) {
            const actionData = doc.data();
            const moderator = await getUserBasicInfo(actionData.moderatorUid);

            actions.push({
                id: doc.id,
                ...actionData,
                moderatorInfo: moderator
            });
        }

        return actions;
    } catch (error) {
        console.error('Error getting recent moderation actions:', error);
        return [];
    }
}

/**
 * Log moderation action
 */
async function logModerationAction(actionData) {
    try {
        await doc(collection(db, 'moderation-logs')).set({
            ...actionData,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error('Error logging moderation action:', error);
    }
}

/**
 * Auto-moderate content (basic keyword filter)
 */
export async function autoModerate(content) {
    // Basic profanity/spam detection
    const bannedWords = [
        'spam', 'scam', 'hack', 'cheat',
        // Add more as needed
    ];

    const contentLower = content.toLowerCase();
    
    for (const word of bannedWords) {
        if (contentLower.includes(word)) {
            return {
                flagged: true,
                reason: 'Contains prohibited content',
                severity: 'medium'
            };
        }
    }

    // Check for excessive caps
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.7 && content.length > 20) {
        return {
            flagged: true,
            reason: 'Excessive capitalization',
            severity: 'low'
        };
    }

    // Check for spam patterns (repeated characters)
    const repeatedPattern = /(.)\1{5,}/;
    if (repeatedPattern.test(content)) {
        return {
            flagged: true,
            reason: 'Spam pattern detected',
            severity: 'medium'
        };
    }

    return {
        flagged: false,
        severity: 'none'
    };
}
