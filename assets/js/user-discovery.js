/**
 * User Discovery System
 * Help users find friends with similar interests and activity levels
 */

import { db } from './firebase-config.js';
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    doc,
    getDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import { getCurrentUser } from './auth.js';
import { getFriendsList, getBlockedUsers } from './friends.js';
import { getUserStats } from './user-profile.js';

/**
 * Discover users based on various criteria
 */
export async function discoverUsers(options = {}) {
    const {
        byActivity = false,
        byLevel = false,
        bySimilarStats = false,
        byLanguage = false,
        maxResults = 20
    } = options;

    const user = await getCurrentUser();
    if (!user) return [];

    try {
        // Get user's current friends and blocked users
        const [friends, blocked] = await Promise.all([
            getFriendsList(),
            getBlockedUsers()
        ]);

        const friendIds = new Set(friends.map(f => f.uid));
        const blockedIds = new Set(blocked.map(b => b.uid));
        const excludeIds = new Set([...friendIds, ...blockedIds, user.uid]);

        let discoveredUsers = [];

        if (byActivity) {
            const active = await getActiveUsers(maxResults);
            discoveredUsers.push(...active);
        }

        if (byLevel) {
            const userStats = await getUserStats(user.uid);
            const similar = await getUsersByLevel(userStats.level, maxResults);
            discoveredUsers.push(...similar);
        }

        if (byLanguage) {
            const sameLanguage = await getUsersByLanguage(user.preferredLanguage, maxResults);
            discoveredUsers.push(...sameLanguage);
        }

        if (bySimilarStats) {
            const userStats = await getUserStats(user.uid);
            const similar = await getUsersWithSimilarStats(userStats, maxResults);
            discoveredUsers.push(...similar);
        }

        // Remove duplicates and excluded users
        const uniqueUsers = [];
        const seenIds = new Set();

        for (const discoveredUser of discoveredUsers) {
            if (!excludeIds.has(discoveredUser.uid) && !seenIds.has(discoveredUser.uid)) {
                uniqueUsers.push(discoveredUser);
                seenIds.add(discoveredUser.uid);
            }
        }

        // Limit results
        return uniqueUsers.slice(0, maxResults);
    } catch (error) {
        console.error('Error discovering users:', error);
        return [];
    }
}

/**
 * Get active users (played recently)
 */
async function getActiveUsers(maxResults = 20) {
    try {
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        const usersRef = collection(db, 'users');
        const q = query(
            usersRef,
            where('lastActive', '>=', oneDayAgo.toISOString()),
            orderBy('lastActive', 'desc'),
            limit(maxResults * 2) // Get extra to account for filtering
        );

        const snapshot = await getDocs(q);
        const users = [];

        for (const doc of snapshot.docs) {
            const userData = doc.data();
            users.push({
                uid: doc.id,
                displayName: userData.displayName,
                preferredLanguage: userData.preferredLanguage,
                level: userData.level || 1,
                lastActive: userData.lastActive,
                discoveryReason: 'active'
            });
        }

        return users;
    } catch (error) {
        console.error('Error getting active users:', error);
        return [];
    }
}

/**
 * Get users by level range
 */
async function getUsersByLevel(userLevel, maxResults = 20) {
    try {
        const minLevel = Math.max(1, userLevel - 5);
        const maxLevel = userLevel + 5;

        const usersRef = collection(db, 'users');
        const q = query(
            usersRef,
            where('level', '>=', minLevel),
            where('level', '<=', maxLevel),
            limit(maxResults * 2)
        );

        const snapshot = await getDocs(q);
        const users = [];

        for (const doc of snapshot.docs) {
            const userData = doc.data();
            users.push({
                uid: doc.id,
                displayName: userData.displayName,
                preferredLanguage: userData.preferredLanguage,
                level: userData.level || 1,
                lastActive: userData.lastActive,
                discoveryReason: 'similarLevel'
            });
        }

        return users;
    } catch (error) {
        console.error('Error getting users by level:', error);
        return [];
    }
}

/**
 * Get users by language
 */
async function getUsersByLanguage(language, maxResults = 20) {
    try {
        const usersRef = collection(db, 'users');
        const q = query(
            usersRef,
            where('preferredLanguage', '==', language),
            limit(maxResults * 2)
        );

        const snapshot = await getDocs(q);
        const users = [];

        for (const doc of snapshot.docs) {
            const userData = doc.data();
            users.push({
                uid: doc.id,
                displayName: userData.displayName,
                preferredLanguage: userData.preferredLanguage,
                level: userData.level || 1,
                lastActive: userData.lastActive,
                discoveryReason: 'sameLanguage'
            });
        }

        return users;
    } catch (error) {
        console.error('Error getting users by language:', error);
        return [];
    }
}

/**
 * Get users with similar stats
 */
async function getUsersWithSimilarStats(userStats, maxResults = 20) {
    try {
        // Find users with similar accuracy (±10%)
        const minAccuracy = Math.max(0, userStats.accuracy - 10);
        const maxAccuracy = Math.min(100, userStats.accuracy + 10);

        const usersRef = collection(db, 'users');
        const q = query(
            usersRef,
            where('accuracy', '>=', minAccuracy),
            where('accuracy', '<=', maxAccuracy),
            limit(maxResults * 2)
        );

        const snapshot = await getDocs(q);
        const users = [];

        for (const doc of snapshot.docs) {
            const userData = doc.data();
            users.push({
                uid: doc.id,
                displayName: userData.displayName,
                preferredLanguage: userData.preferredLanguage,
                level: userData.level || 1,
                accuracy: userData.accuracy,
                lastActive: userData.lastActive,
                discoveryReason: 'similarStats'
            });
        }

        return users;
    } catch (error) {
        console.error('Error getting users with similar stats:', error);
        return [];
    }
}

/**
 * Get suggested friends (combines multiple discovery methods)
 */
export async function getSuggestedFriends(limit = 10) {
    const user = await getCurrentUser();
    if (!user) return [];

    try {
        // Use multiple discovery methods
        const discovered = await discoverUsers({
            byActivity: true,
            byLevel: true,
            byLanguage: true,
            maxResults: limit * 3
        });

        // Score each user based on multiple factors
        const scoredUsers = discovered.map(user => {
            let score = 0;

            // Prefer active users
            if (user.discoveryReason === 'active') score += 3;

            // Prefer similar level
            if (user.discoveryReason === 'similarLevel') score += 2;

            // Prefer same language
            if (user.discoveryReason === 'sameLanguage') score += 2;

            // Prefer similar stats
            if (user.discoveryReason === 'similarStats') score += 1;

            return { ...user, score };
        });

        // Sort by score and return top results
        return scoredUsers
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    } catch (error) {
        console.error('Error getting suggested friends:', error);
        return [];
    }
}

/**
 * Search users by displayName
 */
export async function searchUsers(searchTerm, limit = 20) {
    if (!searchTerm || searchTerm.trim().length < 2) return [];

    const user = await getCurrentUser();
    if (!user) return [];

    try {
        const [friends, blocked] = await Promise.all([
            getFriendsList(),
            getBlockedUsers()
        ]);

        const excludeIds = new Set([
            ...friends.map(f => f.uid),
            ...blocked.map(b => b.uid),
            user.uid
        ]);

        // Firestore doesn't support case-insensitive or partial string search
        // So we get all users and filter client-side (not ideal for large datasets)
        // In production, consider using Algolia or similar service

        const usersRef = collection(db, 'users');
        const q = query(usersRef, limit(100)); // Get first 100 users

        const snapshot = await getDocs(q);
        const results = [];

        const searchLower = searchTerm.toLowerCase();

        for (const doc of snapshot.docs) {
            if (excludeIds.has(doc.id)) continue;

            const userData = doc.data();
            const displayName = (userData.displayName || '').toLowerCase();

            if (displayName.includes(searchLower)) {
                results.push({
                    uid: doc.id,
                    displayName: userData.displayName,
                    preferredLanguage: userData.preferredLanguage,
                    level: userData.level || 1,
                    lastActive: userData.lastActive
                });

                if (results.length >= limit) break;
            }
        }

        return results;
    } catch (error) {
        console.error('Error searching users:', error);
        return [];
    }
}

/**
 * Get user recommendations based on mutual friends
 */
export async function getRecommendationsByMutualFriends(limit = 10) {
    const user = await getCurrentUser();
    if (!user) return [];

    try {
        const friends = await getFriendsList();
        if (friends.length === 0) return [];

        const recommendations = new Map();

        // Get friends of friends
        for (const friend of friends) {
            const friendsOfFriend = await getFriendsList(friend.uid);
            
            for (const fof of friendsOfFriend) {
                // Skip if it's the user or already a friend
                if (fof.uid === user.uid || friends.some(f => f.uid === fof.uid)) {
                    continue;
                }

                // Count mutual friends
                if (recommendations.has(fof.uid)) {
                    const existing = recommendations.get(fof.uid);
                    existing.mutualFriends++;
                    existing.mutualFriendNames.push(friend.displayName);
                } else {
                    recommendations.set(fof.uid, {
                        ...fof,
                        mutualFriends: 1,
                        mutualFriendNames: [friend.displayName],
                        discoveryReason: 'mutualFriends'
                    });
                }
            }
        }

        // Convert to array and sort by mutual friends count
        return Array.from(recommendations.values())
            .sort((a, b) => b.mutualFriends - a.mutualFriends)
            .slice(0, limit);
    } catch (error) {
        console.error('Error getting recommendations:', error);
        return [];
    }
}

/**
 * Get discovery reason text
 */
export function getDiscoveryReasonText(reason) {
    const reasons = {
        'active': '🟢 Active recently',
        'similarLevel': '📊 Similar level',
        'sameLanguage': '🌐 Same language',
        'similarStats': '📈 Similar stats',
        'mutualFriends': '👥 Mutual friends'
    };

    return reasons[reason] || '💡 Suggested';
}

/**
 * Render user discovery UI
 */
export async function renderUserDiscovery(container) {
    if (!container) return;

    container.innerHTML = '<div class="loading">Discovering users...</div>';

    try {
        const [suggested, byActivity, mutualFriends] = await Promise.all([
            getSuggestedFriends(5),
            discoverUsers({ byActivity: true, maxResults: 5 }),
            getRecommendationsByMutualFriends(5)
        ]);

        const html = `
            <div class="user-discovery">
                ${suggested.length > 0 ? renderDiscoverySection('Suggested For You', suggested) : ''}
                ${mutualFriends.length > 0 ? renderDiscoverySection('People You May Know', mutualFriends) : ''}
                ${byActivity.length > 0 ? renderDiscoverySection('Active Players', byActivity) : ''}
            </div>
        `;

        container.innerHTML = html;
        attachDiscoveryListeners();
    } catch (error) {
        container.innerHTML = '<div class="error">Failed to discover users</div>';
    }
}

/**
 * Render discovery section
 */
function renderDiscoverySection(title, users) {
    return `
        <div class="discovery-section">
            <h3 class="discovery-title">${title}</h3>
            <div class="discovery-list">
                ${users.map(user => `
                    <div class="discovery-card" data-uid="${user.uid}">
                        <div class="user-info">
                            <div class="user-name">
                                <span class="flag">${getLanguageFlag(user.preferredLanguage)}</span>
                                ${user.displayName}
                            </div>
                            <div class="user-meta">
                                Level ${user.level}
                                ${user.mutualFriends ? ` • ${user.mutualFriends} mutual` : ''}
                            </div>
                            <div class="discovery-reason">
                                ${getDiscoveryReasonText(user.discoveryReason)}
                            </div>
                        </div>
                        <button class="add-friend-btn" data-uid="${user.uid}">
                            ➕ Add Friend
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

/**
 * Attach discovery listeners
 */
function attachDiscoveryListeners() {
    document.querySelectorAll('.add-friend-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const uid = btn.dataset.uid;
            try {
                // Import friends module and send request
                const { sendFriendRequest } = await import('./friends.js');
                await sendFriendRequest(uid);
                btn.textContent = '✓ Sent';
                btn.disabled = true;
            } catch (error) {
                console.error('Error sending friend request:', error);
            }
        });
    });
}

/**
 * Get language flag
 */
function getLanguageFlag(lang) {
    const flags = { 'en': '🇬🇧', 'es': '🇪🇸', 'fr': '🇫🇷' };
    return flags[lang] || '🌐';
}
