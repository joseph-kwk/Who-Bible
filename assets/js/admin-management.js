/**
 * Admin Management System
 * Backend for user management, permissions, and admin operations
 */

import { db } from './firebase-config.js';
import {
    doc,
    getDoc,
    setDoc,
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

import { getCurrentUser } from './auth.js';

/**
 * Admin roles
 */
export const ADMIN_ROLES = {
    SUPER_ADMIN: 'super_admin',     // Full access to everything
    MODERATOR: 'moderator',          // Content moderation only
    SUPPORT: 'support',              // User support only
    ANALYST: 'analyst'               // View analytics only
};

/**
 * Admin permissions by role
 */
const ROLE_PERMISSIONS = {
    [ADMIN_ROLES.SUPER_ADMIN]: [
        'manage_users', 'manage_admins', 'moderate_content', 
        'view_analytics', 'system_settings', 'delete_users',
        'ban_users', 'manage_reports'
    ],
    [ADMIN_ROLES.MODERATOR]: [
        'moderate_content', 'view_analytics', 'manage_reports',
        'ban_users'
    ],
    [ADMIN_ROLES.SUPPORT]: [
        'view_analytics', 'manage_reports'
    ],
    [ADMIN_ROLES.ANALYST]: [
        'view_analytics'
    ]
};

/**
 * Check if current user is admin
 */
export async function isAdmin() {
    const user = await getCurrentUser();
    if (!user) return false;

    try {
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        return adminDoc.exists();
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

/**
 * Get admin user details
 */
export async function getAdminUser() {
    const user = await getCurrentUser();
    if (!user) return null;

    try {
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        if (!adminDoc.exists()) return null;

        return {
            uid: user.uid,
            ...adminDoc.data()
        };
    } catch (error) {
        console.error('Error getting admin user:', error);
        return null;
    }
}

/**
 * Check if admin has permission
 */
export async function hasPermission(permission) {
    const admin = await getAdminUser();
    if (!admin) return false;

    const permissions = ROLE_PERMISSIONS[admin.role] || [];
    return permissions.includes(permission);
}

/**
 * Get all users with pagination
 */
export async function getAllUsers(options = {}) {
    const {
        limitCount = 50,
        orderByField = 'createdAt',
        orderDirection = 'desc',
        filterBy = null
    } = options;

    try {
        let q = query(
            collection(db, 'users'),
            orderBy(orderByField, orderDirection),
            limit(limitCount)
        );

        if (filterBy) {
            switch (filterBy.type) {
                case 'active':
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    q = query(q, where('lastActive', '>=', yesterday.toISOString()));
                    break;
                case 'inactive':
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    q = query(q, where('lastActive', '<', weekAgo.toISOString()));
                    break;
                case 'banned':
                    q = query(q, where('isBanned', '==', true));
                    break;
            }
        }

        const snapshot = await getDocs(q);
        const users = [];

        for (const doc of snapshot.docs) {
            users.push({
                uid: doc.id,
                ...doc.data()
            });
        }

        return users;
    } catch (error) {
        console.error('Error getting all users:', error);
        return [];
    }
}

/**
 * Get user details by UID
 */
export async function getUserDetails(uid) {
    try {
        const [userDoc, statsDoc, achievementsSnapshot] = await Promise.all([
            getDoc(doc(db, 'users', uid)),
            getDoc(doc(db, 'users', uid, 'data', 'stats')),
            getDocs(collection(db, 'users', uid, 'achievements'))
        ]);

        if (!userDoc.exists()) {
            throw new Error('User not found');
        }

        const achievements = [];
        achievementsSnapshot.forEach(doc => {
            achievements.push({ id: doc.id, ...doc.data() });
        });

        return {
            uid,
            ...userDoc.data(),
            stats: statsDoc.exists() ? statsDoc.data() : null,
            achievements
        };
    } catch (error) {
        console.error('Error getting user details:', error);
        throw error;
    }
}

/**
 * Ban/unban user
 */
export async function toggleUserBan(uid, reason = '') {
    if (!await hasPermission('ban_users')) {
        throw new Error('Insufficient permissions');
    }

    try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (!userDoc.exists()) {
            throw new Error('User not found');
        }

        const isBanned = userDoc.data().isBanned || false;
        const admin = await getAdminUser();

        await updateDoc(doc(db, 'users', uid), {
            isBanned: !isBanned,
            bannedAt: !isBanned ? serverTimestamp() : null,
            bannedBy: !isBanned ? admin.uid : null,
            banReason: !isBanned ? reason : null
        });

        // Log action
        await logAdminAction({
            action: isBanned ? 'unban_user' : 'ban_user',
            targetUid: uid,
            reason,
            adminUid: admin.uid
        });

        return !isBanned;
    } catch (error) {
        console.error('Error toggling user ban:', error);
        throw error;
    }
}

/**
 * Delete user (soft delete)
 */
export async function deleteUser(uid, reason = '') {
    if (!await hasPermission('delete_users')) {
        throw new Error('Insufficient permissions');
    }

    try {
        const admin = await getAdminUser();

        // Mark user as deleted
        await updateDoc(doc(db, 'users', uid), {
            isDeleted: true,
            deletedAt: serverTimestamp(),
            deletedBy: admin.uid,
            deleteReason: reason
        });

        // Log action
        await logAdminAction({
            action: 'delete_user',
            targetUid: uid,
            reason,
            adminUid: admin.uid
        });

        return true;
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
}

/**
 * Reset user password (send reset email)
 */
export async function resetUserPassword(email) {
    if (!await hasPermission('manage_users')) {
        throw new Error('Insufficient permissions');
    }

    try {
        // This would typically trigger Firebase Auth password reset
        // For now, we'll log the action
        const admin = await getAdminUser();

        await logAdminAction({
            action: 'reset_password',
            targetEmail: email,
            adminUid: admin.uid
        });

        return true;
    } catch (error) {
        console.error('Error resetting user password:', error);
        throw error;
    }
}

/**
 * Update user profile (admin override)
 */
export async function updateUserProfile(uid, updates) {
    if (!await hasPermission('manage_users')) {
        throw new Error('Insufficient permissions');
    }

    try {
        const admin = await getAdminUser();

        await updateDoc(doc(db, 'users', uid), {
            ...updates,
            updatedAt: serverTimestamp(),
            updatedBy: admin.uid
        });

        await logAdminAction({
            action: 'update_user_profile',
            targetUid: uid,
            changes: updates,
            adminUid: admin.uid
        });

        return true;
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
}

/**
 * Get all admins
 */
export async function getAllAdmins() {
    if (!await hasPermission('manage_admins')) {
        throw new Error('Insufficient permissions');
    }

    try {
        const snapshot = await getDocs(collection(db, 'admins'));
        const admins = [];

        for (const doc of snapshot.docs) {
            admins.push({
                uid: doc.id,
                ...doc.data()
            });
        }

        return admins;
    } catch (error) {
        console.error('Error getting admins:', error);
        return [];
    }
}

/**
 * Add admin
 */
export async function addAdmin(uid, role, addedBy) {
    if (!await hasPermission('manage_admins')) {
        throw new Error('Insufficient permissions');
    }

    try {
        await setDoc(doc(db, 'admins', uid), {
            role,
            addedAt: serverTimestamp(),
            addedBy
        });

        await logAdminAction({
            action: 'add_admin',
            targetUid: uid,
            role,
            adminUid: addedBy
        });

        return true;
    } catch (error) {
        console.error('Error adding admin:', error);
        throw error;
    }
}

/**
 * Remove admin
 */
export async function removeAdmin(uid) {
    if (!await hasPermission('manage_admins')) {
        throw new Error('Insufficient permissions');
    }

    try {
        const admin = await getAdminUser();

        await deleteDoc(doc(db, 'admins', uid));

        await logAdminAction({
            action: 'remove_admin',
            targetUid: uid,
            adminUid: admin.uid
        });

        return true;
    } catch (error) {
        console.error('Error removing admin:', error);
        throw error;
    }
}

/**
 * Update admin role
 */
export async function updateAdminRole(uid, newRole) {
    if (!await hasPermission('manage_admins')) {
        throw new Error('Insufficient permissions');
    }

    try {
        const admin = await getAdminUser();

        await updateDoc(doc(db, 'admins', uid), {
            role: newRole,
            updatedAt: serverTimestamp(),
            updatedBy: admin.uid
        });

        await logAdminAction({
            action: 'update_admin_role',
            targetUid: uid,
            newRole,
            adminUid: admin.uid
        });

        return true;
    } catch (error) {
        console.error('Error updating admin role:', error);
        throw error;
    }
}

/**
 * Get platform statistics
 */
export async function getPlatformStats() {
    if (!await hasPermission('view_analytics')) {
        throw new Error('Insufficient permissions');
    }

    try {
        const [
            usersSnapshot,
            activeUsersSnapshot,
            bannedUsersSnapshot,
            reportsSnapshot
        ] = await Promise.all([
            getDocs(collection(db, 'users')),
            getDocs(query(
                collection(db, 'users'),
                where('lastActive', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            )),
            getDocs(query(
                collection(db, 'users'),
                where('isBanned', '==', true)
            )),
            getDocs(query(
                collection(db, 'reports'),
                where('status', '==', 'pending')
            ))
        ]);

        return {
            totalUsers: usersSnapshot.size,
            activeUsers24h: activeUsersSnapshot.size,
            bannedUsers: bannedUsersSnapshot.size,
            pendingReports: reportsSnapshot.size
        };
    } catch (error) {
        console.error('Error getting platform stats:', error);
        return null;
    }
}

/**
 * Search users
 */
export async function searchUsers(searchTerm) {
    if (!await hasPermission('manage_users')) {
        throw new Error('Insufficient permissions');
    }

    try {
        // Get all users (in production, use Algolia or similar)
        const snapshot = await getDocs(query(
            collection(db, 'users'),
            limit(100)
        ));

        const results = [];
        const searchLower = searchTerm.toLowerCase();

        snapshot.forEach(doc => {
            const data = doc.data();
            const displayName = (data.displayName || '').toLowerCase();
            const email = (data.email || '').toLowerCase();

            if (displayName.includes(searchLower) || email.includes(searchLower)) {
                results.push({
                    uid: doc.id,
                    ...data
                });
            }
        });

        return results;
    } catch (error) {
        console.error('Error searching users:', error);
        return [];
    }
}

/**
 * Log admin action
 */
async function logAdminAction(actionData) {
    try {
        await setDoc(doc(collection(db, 'admin-logs')), {
            ...actionData,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error('Error logging admin action:', error);
    }
}

/**
 * Get admin action logs
 */
export async function getAdminLogs(limitCount = 50) {
    if (!await hasPermission('manage_admins')) {
        throw new Error('Insufficient permissions');
    }

    try {
        const q = query(
            collection(db, 'admin-logs'),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        const logs = [];

        snapshot.forEach(doc => {
            logs.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return logs;
    } catch (error) {
        console.error('Error getting admin logs:', error);
        return [];
    }
}

/**
 * Bulk operations
 */
export async function bulkBanUsers(uids, reason) {
    if (!await hasPermission('ban_users')) {
        throw new Error('Insufficient permissions');
    }

    const admin = await getAdminUser();
    const batch = writeBatch(db);

    try {
        for (const uid of uids) {
            const userRef = doc(db, 'users', uid);
            batch.update(userRef, {
                isBanned: true,
                bannedAt: serverTimestamp(),
                bannedBy: admin.uid,
                banReason: reason
            });
        }

        await batch.commit();

        await logAdminAction({
            action: 'bulk_ban_users',
            targetUids: uids,
            reason,
            adminUid: admin.uid
        });

        return true;
    } catch (error) {
        console.error('Error bulk banning users:', error);
        throw error;
    }
}

/**
 * Export user data
 */
export async function exportUserData(uid) {
    if (!await hasPermission('manage_users')) {
        throw new Error('Insufficient permissions');
    }

    try {
        const userDetails = await getUserDetails(uid);
        
        // Convert to JSON
        const json = JSON.stringify(userDetails, null, 2);
        
        // Create download
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `user-${uid}-export-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error('Error exporting user data:', error);
        throw error;
    }
}
