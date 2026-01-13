/**
 * Messaging System
 * Private messaging between friends
 */

import { db } from './firebase-config.js';
import { 
    collection, 
    query,
    where,
    orderBy,
    limit,
    getDocs,
    addDoc,
    updateDoc,
    serverTimestamp,
    onSnapshot,
    doc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import { getCurrentUser } from './auth.js';
import { checkFriendship } from './friends.js';

/**
 * Send a message
 */
export async function sendMessage(recipientUid, messageText) {
    const user = getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    // Verify friendship
    const areFriends = await checkFriendship(user.uid, recipientUid);
    if (!areFriends) {
        throw new Error('Can only message friends');
    }

    try {
        // Create conversation ID (alphabetically sorted UIDs)
        const conversationId = [user.uid, recipientUid].sort().join('_');

        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        
        await addDoc(messagesRef, {
            senderId: user.uid,
            recipientId: recipientUid,
            text: messageText,
            timestamp: serverTimestamp(),
            read: false
        });

        // Update conversation metadata
        const conversationRef = doc(db, 'conversations', conversationId);
        await updateDoc(conversationRef, {
            lastMessage: messageText,
            lastMessageTime: serverTimestamp(),
            lastSenderId: user.uid,
            participants: [user.uid, recipientUid]
        }).catch(async () => {
            // Create if doesn't exist
            await setDoc(conversationRef, {
                participants: [user.uid, recipientUid],
                lastMessage: messageText,
                lastMessageTime: serverTimestamp(),
                lastSenderId: user.uid,
                createdAt: serverTimestamp()
            });
        });

        return { success: true };
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
}

/**
 * Get conversation messages
 */
export async function getMessages(friendUid, limitCount = 50) {
    const user = getCurrentUser();
    if (!user) return [];

    try {
        const conversationId = [user.uid, friendUid].sort().join('_');
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        
        const q = query(
            messagesRef,
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        const messages = [];
        
        snapshot.forEach((doc) => {
            messages.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return messages.reverse(); // Chronological order
    } catch (error) {
        console.error('Error getting messages:', error);
        return [];
    }
}

/**
 * Listen to new messages in real-time
 */
export function subscribeToMessages(friendUid, callback) {
    const user = getCurrentUser();
    if (!user) return () => {};

    const conversationId = [user.uid, friendUid].sort().join('_');
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    
    const q = query(
        messagesRef,
        orderBy('timestamp', 'desc'),
        limit(50)
    );

    return onSnapshot(q, (snapshot) => {
        const messages = [];
        snapshot.forEach((doc) => {
            messages.push({
                id: doc.id,
                ...doc.data()
            });
        });
        callback(messages.reverse());
    });
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(friendUid) {
    const user = getCurrentUser();
    if (!user) return;

    try {
        const conversationId = [user.uid, friendUid].sort().join('_');
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        
        const q = query(
            messagesRef,
            where('recipientId', '==', user.uid),
            where('read', '==', false)
        );

        const snapshot = await getDocs(q);
        
        const updatePromises = [];
        snapshot.forEach((doc) => {
            updatePromises.push(
                updateDoc(doc.ref, { read: true })
            );
        });

        await Promise.all(updatePromises);
    } catch (error) {
        console.error('Error marking messages as read:', error);
    }
}

/**
 * Get unread message count
 */
export async function getUnreadCount(friendUid) {
    const user = getCurrentUser();
    if (!user) return 0;

    try {
        const conversationId = [user.uid, friendUid].sort().join('_');
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        
        const q = query(
            messagesRef,
            where('recipientId', '==', user.uid),
            where('read', '==', false)
        );

        const snapshot = await getDocs(q);
        return snapshot.size;
    } catch (error) {
        console.error('Error getting unread count:', error);
        return 0;
    }
}

/**
 * Get all conversations for user
 */
export async function getConversations() {
    const user = getCurrentUser();
    if (!user) return [];

    try {
        const conversationsRef = collection(db, 'conversations');
        const q = query(
            conversationsRef,
            where('participants', 'array-contains', user.uid),
            orderBy('lastMessageTime', 'desc')
        );

        const snapshot = await getDocs(q);
        const conversations = [];
        
        snapshot.forEach((doc) => {
            conversations.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return conversations;
    } catch (error) {
        console.error('Error getting conversations:', error);
        return [];
    }
}

/**
 * Delete a conversation
 */
export async function deleteConversation(friendUid) {
    const user = getCurrentUser();
    if (!user) return;

    try {
        const conversationId = [user.uid, friendUid].sort().join('_');
        
        // Delete all messages
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        const snapshot = await getDocs(messagesRef);
        
        const deletePromises = [];
        snapshot.forEach((doc) => {
            deletePromises.push(deleteDoc(doc.ref));
        });

        await Promise.all(deletePromises);

        // Delete conversation document
        const conversationRef = doc(db, 'conversations', conversationId);
        await deleteDoc(conversationRef);
    } catch (error) {
        console.error('Error deleting conversation:', error);
        throw error;
    }
}
