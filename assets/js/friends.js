/**
 * Friend System
 * Manage friend requests, friendships, and social connections
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
    deleteDoc,
    serverTimestamp,
    arrayUnion,
    arrayRemove 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import { getCurrentUser } from './auth.js';
import { getText } from './translations.js';

/**
 * Friend request statuses
 */
export const FRIEND_STATUS = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    DECLINED: 'declined',
    BLOCKED: 'blocked'
};

/**
 * Send a friend request
 */
export async function sendFriendRequest(recipientUid) {
    const user = getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    
    if (user.uid === recipientUid) {
        throw new Error("You can't send a friend request to yourself");
    }

    try {
        // Check if already friends or request exists
        const existingRequest = await getFriendRequest(user.uid, recipientUid);
        if (existingRequest) {
            throw new Error('Friend request already exists');
        }

        // Check if already friends
        const areFriends = await checkFriendship(user.uid, recipientUid);
        if (areFriends) {
            throw new Error('Already friends');
        }

        // Get sender profile
        const senderProfile = await getUserProfile(user.uid);

        // Create friend request
        const requestId = `${user.uid}_${recipientUid}`;
        const requestRef = doc(db, 'friend-requests', requestId);
        
        await setDoc(requestRef, {
            senderId: user.uid,
            senderName: senderProfile.displayName,
            senderPhoto: senderProfile.photoURL || null,
            senderLanguage: senderProfile.preferredLanguage || 'en',
            recipientId: recipientUid,
            status: FRIEND_STATUS.PENDING,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        // Add notification for recipient
        await createNotification(recipientUid, {
            type: 'friend_request',
            senderId: user.uid,
            senderName: senderProfile.displayName,
            message: `${senderProfile.displayName} sent you a friend request`,
            createdAt: serverTimestamp()
        });

        return { success: true, requestId };
    } catch (error) {
        console.error('Error sending friend request:', error);
        throw error;
    }
}

/**
 * Accept a friend request
 */
export async function acceptFriendRequest(senderId) {
    const user = getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    try {
        const requestId = `${senderId}_${user.uid}`;
        const requestRef = doc(db, 'friend-requests', requestId);
        
        // Update request status
        await updateDoc(requestRef, {
            status: FRIEND_STATUS.ACCEPTED,
            updatedAt: serverTimestamp()
        });

        // Get both user profiles
        const [senderProfile, recipientProfile] = await Promise.all([
            getUserProfile(senderId),
            getUserProfile(user.uid)
        ]);

        // Add to both users' friend lists
        const friendship1Ref = doc(db, 'users', user.uid, 'friends', senderId);
        const friendship2Ref = doc(db, 'users', senderId, 'friends', user.uid);

        await Promise.all([
            setDoc(friendship1Ref, {
                uid: senderId,
                displayName: senderProfile.displayName,
                photoURL: senderProfile.photoURL || null,
                preferredLanguage: senderProfile.preferredLanguage || 'en',
                friendsSince: serverTimestamp(),
                lastInteraction: serverTimestamp()
            }),
            setDoc(friendship2Ref, {
                uid: user.uid,
                displayName: recipientProfile.displayName,
                photoURL: recipientProfile.photoURL || null,
                preferredLanguage: recipientProfile.preferredLanguage || 'en',
                friendsSince: serverTimestamp(),
                lastInteraction: serverTimestamp()
            })
        ]);

        // Send notification to sender
        await createNotification(senderId, {
            type: 'friend_accepted',
            senderId: user.uid,
            senderName: recipientProfile.displayName,
            message: `${recipientProfile.displayName} accepted your friend request`,
            createdAt: serverTimestamp()
        });

        // Delete the friend request
        await deleteDoc(requestRef);

        return { success: true };
    } catch (error) {
        console.error('Error accepting friend request:', error);
        throw error;
    }
}

/**
 * Decline a friend request
 */
export async function declineFriendRequest(senderId) {
    const user = getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    try {
        const requestId = `${senderId}_${user.uid}`;
        const requestRef = doc(db, 'friend-requests', requestId);
        
        // Update status or delete
        await deleteDoc(requestRef);

        return { success: true };
    } catch (error) {
        console.error('Error declining friend request:', error);
        throw error;
    }
}

/**
 * Remove a friend
 */
export async function removeFriend(friendUid) {
    const user = getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    try {
        // Remove from both users' friend lists
        const friendship1Ref = doc(db, 'users', user.uid, 'friends', friendUid);
        const friendship2Ref = doc(db, 'users', friendUid, 'friends', user.uid);

        await Promise.all([
            deleteDoc(friendship1Ref),
            deleteDoc(friendship2Ref)
        ]);

        return { success: true };
    } catch (error) {
        console.error('Error removing friend:', error);
        throw error;
    }
}

/**
 * Block a user
 */
export async function blockUser(userUid) {
    const user = getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    try {
        // Remove friendship if exists
        await removeFriend(userUid);

        // Add to blocked list
        const blockRef = doc(db, 'users', user.uid, 'blocked', userUid);
        await setDoc(blockRef, {
            uid: userUid,
            blockedAt: serverTimestamp()
        });

        return { success: true };
    } catch (error) {
        console.error('Error blocking user:', error);
        throw error;
    }
}

/**
 * Unblock a user
 */
export async function unblockUser(userUid) {
    const user = getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    try {
        const blockRef = doc(db, 'users', user.uid, 'blocked', userUid);
        await deleteDoc(blockRef);

        return { success: true };
    } catch (error) {
        console.error('Error unblocking user:', error);
        throw error;
    }
}

/**
 * Get user's friends list
 */
export async function getFriendsList(uid) {
    try {
        const friendsRef = collection(db, 'users', uid, 'friends');
        const snapshot = await getDocs(friendsRef);
        
        const friends = [];
        snapshot.forEach((doc) => {
            friends.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Sort by last interaction
        friends.sort((a, b) => {
            const aTime = a.lastInteraction?.toMillis() || 0;
            const bTime = b.lastInteraction?.toMillis() || 0;
            return bTime - aTime;
        });

        return friends;
    } catch (error) {
        console.error('Error getting friends list:', error);
        return [];
    }
}

/**
 * Get pending friend requests (received)
 */
export async function getPendingRequests(uid) {
    try {
        const requestsRef = collection(db, 'friend-requests');
        const q = query(
            requestsRef,
            where('recipientId', '==', uid),
            where('status', '==', FRIEND_STATUS.PENDING)
        );

        const snapshot = await getDocs(q);
        const requests = [];
        
        snapshot.forEach((doc) => {
            requests.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Sort by creation date
        requests.sort((a, b) => {
            const aTime = a.createdAt?.toMillis() || 0;
            const bTime = b.createdAt?.toMillis() || 0;
            return bTime - aTime;
        });

        return requests;
    } catch (error) {
        console.error('Error getting pending requests:', error);
        return [];
    }
}

/**
 * Get sent friend requests
 */
export async function getSentRequests(uid) {
    try {
        const requestsRef = collection(db, 'friend-requests');
        const q = query(
            requestsRef,
            where('senderId', '==', uid),
            where('status', '==', FRIEND_STATUS.PENDING)
        );

        const snapshot = await getDocs(q);
        const requests = [];
        
        snapshot.forEach((doc) => {
            requests.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return requests;
    } catch (error) {
        console.error('Error getting sent requests:', error);
        return [];
    }
}

/**
 * Search for users by display name
 */
export async function searchUsers(searchTerm, limit = 20) {
    const user = getCurrentUser();
    if (!user) return [];

    try {
        // Get all users (Firestore doesn't support case-insensitive search)
        // In production, use Algolia or similar for better search
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(query(usersRef));
        
        const results = [];
        const searchLower = searchTerm.toLowerCase();

        snapshot.forEach((doc) => {
            if (doc.id === user.uid) return; // Skip current user
            
            const userData = doc.data();
            const displayName = userData.displayName?.toLowerCase() || '';
            
            if (displayName.includes(searchLower)) {
                results.push({
                    uid: doc.id,
                    displayName: userData.displayName,
                    photoURL: userData.photoURL || null,
                    preferredLanguage: userData.preferredLanguage || 'en',
                    level: userData.level || 1
                });
            }
        });

        return results.slice(0, limit);
    } catch (error) {
        console.error('Error searching users:', error);
        return [];
    }
}

/**
 * Get friend request between two users
 */
async function getFriendRequest(senderId, recipientId) {
    try {
        // Check both directions
        const requestId1 = `${senderId}_${recipientId}`;
        const requestId2 = `${recipientId}_${senderId}`;
        
        const [doc1, doc2] = await Promise.all([
            getDoc(doc(db, 'friend-requests', requestId1)),
            getDoc(doc(db, 'friend-requests', requestId2))
        ]);

        if (doc1.exists()) return { id: doc1.id, ...doc1.data() };
        if (doc2.exists()) return { id: doc2.id, ...doc2.data() };
        
        return null;
    } catch (error) {
        console.error('Error getting friend request:', error);
        return null;
    }
}

/**
 * Check if two users are friends
 */
export async function checkFriendship(uid1, uid2) {
    try {
        const friendRef = doc(db, 'users', uid1, 'friends', uid2);
        const friendDoc = await getDoc(friendRef);
        return friendDoc.exists();
    } catch (error) {
        console.error('Error checking friendship:', error);
        return false;
    }
}

/**
 * Get user profile data
 */
async function getUserProfile(uid) {
    try {
        const profileRef = doc(db, 'users', uid, 'data', 'profile');
        const profileDoc = await getDoc(profileRef);
        
        if (profileDoc.exists()) {
            return profileDoc.data();
        }
        
        // Fallback to top-level user doc
        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);
        
        return userDoc.exists() ? userDoc.data() : { displayName: 'Unknown User' };
    } catch (error) {
        console.error('Error getting user profile:', error);
        return { displayName: 'Unknown User' };
    }
}

/**
 * Create a notification
 */
async function createNotification(uid, notification) {
    try {
        const notificationsRef = collection(db, 'notifications', uid, 'messages');
        await setDoc(doc(notificationsRef), {
            ...notification,
            read: false
        });
    } catch (error) {
        console.error('Error creating notification:', error);
    }
}

/**
 * Update last interaction timestamp
 */
export async function updateLastInteraction(friendUid) {
    const user = getCurrentUser();
    if (!user) return;

    try {
        const friendRef = doc(db, 'users', user.uid, 'friends', friendUid);
        await updateDoc(friendRef, {
            lastInteraction: serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating last interaction:', error);
    }
}

/**
 * Get friend statistics
 */
export async function getFriendStats(uid) {
    try {
        const [friends, pendingRequests, sentRequests] = await Promise.all([
            getFriendsList(uid),
            getPendingRequests(uid),
            getSentRequests(uid)
        ]);

        return {
            totalFriends: friends.length,
            pendingRequests: pendingRequests.length,
            sentRequests: sentRequests.length
        };
    } catch (error) {
        console.error('Error getting friend stats:', error);
        return {
            totalFriends: 0,
            pendingRequests: 0,
            sentRequests: 0
        };
    }
}

/**
 * Get mutual friends
 */
export async function getMutualFriends(uid1, uid2) {
    try {
        const [friends1, friends2] = await Promise.all([
            getFriendsList(uid1),
            getFriendsList(uid2)
        ]);

        const friends1Ids = new Set(friends1.map(f => f.uid));
        const mutualFriends = friends2.filter(f => friends1Ids.has(f.uid));

        return mutualFriends;
    } catch (error) {
        console.error('Error getting mutual friends:', error);
        return [];
    }
}

/**
 * Check if user is blocked
 */
export async function isUserBlocked(uid, targetUid) {
    try {
        const blockRef = doc(db, 'users', uid, 'blocked', targetUid);
        const blockDoc = await getDoc(blockRef);
        return blockDoc.exists();
    } catch (error) {
        console.error('Error checking if user is blocked:', error);
        return false;
    }
}

/**
 * Get friend online status (placeholder for future real-time feature)
 */
export function getFriendOnlineStatus(friendUid) {
    // TODO: Implement with Firebase Realtime Database or Firestore presence
    return 'offline';
}
