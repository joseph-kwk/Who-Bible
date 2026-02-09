/**
 * Friend Challenges System
 * One-on-one quiz challenges between friends
 */

import { auth, db } from './firebase-config.js';
import { getCurrentUser } from './auth.js';
import { getFriendsList } from './friends.js';
import { createNotification, NOTIFICATION_TYPES } from './notifications.js';
import { addXP } from './achievements.js';

// Challenge status
export const CHALLENGE_STATUS = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    DECLINED: 'declined',
    COMPLETED: 'completed',
    EXPIRED: 'expired'
};

// Challenge settings
const CHALLENGE_EXPIRY_HOURS = 24;
const WIN_XP_REWARD = 100;
const PARTICIPATION_XP = 25;

/**
 * Create a friend challenge
 */
export async function createFriendChallenge(friendId, settings = {}) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    // Validate friendship
    const friends = await getFriendsList();
    const isFriend = friends.some(f => f.uid === friendId);
    if (!isFriend) {
        throw new Error('Can only challenge friends');
    }

    const defaultSettings = {
        difficulty: 'intermediate',
        numQuestions: 10,
        timeLimit: 300,
        categories: ['all']
    };

    const challengeSettings = { ...defaultSettings, ...settings };

    const challenge = {
        challengerId: user.uid,
        challengerName: user.displayName || 'Anonymous',
        challengerLanguage: user.preferredLanguage || 'en',
        opponentId: friendId,
        status: CHALLENGE_STATUS.PENDING,
        settings: challengeSettings,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + CHALLENGE_EXPIRY_HOURS * 60 * 60 * 1000).toISOString(),
        challengerScore: null,
        opponentScore: null,
        winnerId: null
    };

    try {
        const docRef = await db.collection('friend-challenges').add(challenge);

        // Send notification to opponent
        await createNotification(friendId, {
            type: NOTIFICATION_TYPES.CHALLENGE_RECEIVED,
            title: `⚔️ Challenge from ${user.displayName || 'A friend'}!`,
            message: `${challengeSettings.numQuestions} questions • ${challengeSettings.difficulty} difficulty`,
            data: {
                challengeId: docRef.id,
                challengerId: user.uid
            }
        });

        return {
            id: docRef.id,
            ...challenge
        };
    } catch (error) {
        console.error('Error creating challenge:', error);
        throw error;
    }
}

/**
 * Accept friend challenge
 */
export async function acceptFriendChallenge(challengeId) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    try {
        const challengeDoc = await db.collection('friend-challenges').doc(challengeId).get();
        
        if (!challengeDoc.exists) {
            throw new Error('Challenge not found');
        }

        const challenge = challengeDoc.data();

        if (challenge.opponentId !== user.uid) {
            throw new Error('Not your challenge');
        }

        if (challenge.status !== CHALLENGE_STATUS.PENDING) {
            throw new Error('Challenge already responded to');
        }

        // Check expiry
        if (new Date(challenge.expiresAt) < new Date()) {
            await db.collection('friend-challenges').doc(challengeId).update({
                status: CHALLENGE_STATUS.EXPIRED
            });
            throw new Error('Challenge expired');
        }

        await db.collection('friend-challenges').doc(challengeId).update({
            status: CHALLENGE_STATUS.ACCEPTED,
            acceptedAt: new Date().toISOString()
        });

        // Notify challenger
        await createNotification(challenge.challengerId, {
            type: NOTIFICATION_TYPES.CHALLENGE_COMPLETED,
            title: '✅ Challenge Accepted!',
            message: `${user.displayName || 'Your friend'} accepted your challenge!`,
            data: {
                challengeId,
                opponentId: user.uid
            }
        });

        return true;
    } catch (error) {
        console.error('Error accepting challenge:', error);
        throw error;
    }
}

/**
 * Decline friend challenge
 */
export async function declineFriendChallenge(challengeId) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    try {
        const challengeDoc = await db.collection('friend-challenges').doc(challengeId).get();
        
        if (!challengeDoc.exists) {
            throw new Error('Challenge not found');
        }

        const challenge = challengeDoc.data();

        if (challenge.opponentId !== user.uid) {
            throw new Error('Not your challenge');
        }

        await db.collection('friend-challenges').doc(challengeId).update({
            status: CHALLENGE_STATUS.DECLINED,
            declinedAt: new Date().toISOString()
        });

        return true;
    } catch (error) {
        console.error('Error declining challenge:', error);
        throw error;
    }
}

/**
 * Submit challenge score
 */
export async function submitChallengeScore(challengeId, score, correctAnswers, totalQuestions) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    try {
        const challengeDoc = await db.collection('friend-challenges').doc(challengeId).get();
        
        if (!challengeDoc.exists) {
            throw new Error('Challenge not found');
        }

        const challenge = challengeDoc.data();

        if (challenge.challengerId !== user.uid && challenge.opponentId !== user.uid) {
            throw new Error('Not your challenge');
        }

        const isChallenger = challenge.challengerId === user.uid;
        const updateData = {
            [isChallenger ? 'challengerScore' : 'opponentScore']: score,
            [isChallenger ? 'challengerCorrect' : 'opponentCorrect']: correctAnswers,
            [isChallenger ? 'challengerCompletedAt' : 'opponentCompletedAt']: new Date().toISOString()
        };

        // Check if both completed
        const bothCompleted = isChallenger 
            ? challenge.opponentScore !== null
            : challenge.challengerScore !== null;

        if (bothCompleted) {
            // Determine winner
            const challengerScore = isChallenger ? score : challenge.challengerScore;
            const opponentScore = isChallenger ? challenge.opponentScore : score;

            let winnerId = null;
            if (challengerScore > opponentScore) {
                winnerId = challenge.challengerId;
            } else if (opponentScore > challengerScore) {
                winnerId = challenge.opponentId;
            }

            updateData.status = CHALLENGE_STATUS.COMPLETED;
            updateData.winnerId = winnerId;
            updateData.completedAt = new Date().toISOString();

            // Award XP
            const winnerXP = WIN_XP_REWARD;
            const participantXP = PARTICIPATION_XP;

            if (winnerId) {
                await addXP(winnerId === user.uid ? winnerXP : participantXP, 
                           winnerId === user.uid ? 'Challenge Victory!' : 'Challenge Participation');
            } else {
                // Tie - both get participation XP
                await addXP(participantXP, 'Challenge Tie');
            }

            // Send completion notification
            const opponentId = isChallenger ? challenge.opponentId : challenge.challengerId;
            const resultText = winnerId === null 
                ? "It's a tie!" 
                : winnerId === user.uid 
                    ? `${user.displayName || 'Your friend'} won!`
                    : 'You won!';

            await createNotification(opponentId, {
                type: NOTIFICATION_TYPES.CHALLENGE_COMPLETED,
                title: '🎯 Challenge Complete!',
                message: resultText,
                data: {
                    challengeId,
                    winnerId
                }
            });
        }

        await db.collection('friend-challenges').doc(challengeId).update(updateData);

        return {
            completed: bothCompleted,
            winnerId: updateData.winnerId || null
        };
    } catch (error) {
        console.error('Error submitting score:', error);
        throw error;
    }
}

/**
 * Get pending challenges (received)
 */
export async function getPendingChallenges() {
    const user = await getCurrentUser();
    if (!user) return [];

    try {
        const snapshot = await db.collection('friend-challenges')
            .where('opponentId', '==', user.uid)
            .where('status', '==', CHALLENGE_STATUS.PENDING)
            .orderBy('createdAt', 'desc')
            .get();

        const challenges = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            // Check expiry
            if (new Date(data.expiresAt) > new Date()) {
                challenges.push({
                    id: doc.id,
                    ...data
                });
            }
        });

        return challenges;
    } catch (error) {
        console.error('Error getting pending challenges:', error);
        return [];
    }
}

/**
 * Get sent challenges (waiting for opponent)
 */
export async function getSentChallenges() {
    const user = await getCurrentUser();
    if (!user) return [];

    try {
        const snapshot = await db.collection('friend-challenges')
            .where('challengerId', '==', user.uid)
            .where('status', '==', CHALLENGE_STATUS.PENDING)
            .orderBy('createdAt', 'desc')
            .get();

        const challenges = [];
        snapshot.forEach((doc) => {
            challenges.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return challenges;
    } catch (error) {
        console.error('Error getting sent challenges:', error);
        return [];
    }
}

/**
 * Get active challenges (accepted, waiting for scores)
 */
export async function getActiveChallenges() {
    const user = await getCurrentUser();
    if (!user) return [];

    try {
        // Challenges where user is challenger or opponent and status is accepted
        const asChallenger = await db.collection('friend-challenges')
            .where('challengerId', '==', user.uid)
            .where('status', '==', CHALLENGE_STATUS.ACCEPTED)
            .get();

        const asOpponent = await db.collection('friend-challenges')
            .where('opponentId', '==', user.uid)
            .where('status', '==', CHALLENGE_STATUS.ACCEPTED)
            .get();

        const challenges = [];

        asChallenger.forEach((doc) => {
            challenges.push({
                id: doc.id,
                role: 'challenger',
                ...doc.data()
            });
        });

        asOpponent.forEach((doc) => {
            challenges.push({
                id: doc.id,
                role: 'opponent',
                ...doc.data()
            });
        });

        // Sort by created date
        challenges.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return challenges;
    } catch (error) {
        console.error('Error getting active challenges:', error);
        return [];
    }
}

/**
 * Get completed challenges
 */
export async function getCompletedChallenges(limit = 20) {
    const user = await getCurrentUser();
    if (!user) return [];

    try {
        const asChallenger = await db.collection('friend-challenges')
            .where('challengerId', '==', user.uid)
            .where('status', '==', CHALLENGE_STATUS.COMPLETED)
            .orderBy('completedAt', 'desc')
            .limit(limit)
            .get();

        const asOpponent = await db.collection('friend-challenges')
            .where('opponentId', '==', user.uid)
            .where('status', '==', CHALLENGE_STATUS.COMPLETED)
            .orderBy('completedAt', 'desc')
            .limit(limit)
            .get();

        const challenges = [];

        asChallenger.forEach((doc) => {
            challenges.push({
                id: doc.id,
                role: 'challenger',
                ...doc.data()
            });
        });

        asOpponent.forEach((doc) => {
            challenges.push({
                id: doc.id,
                role: 'opponent',
                ...doc.data()
            });
        });

        // Sort by completed date
        challenges.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

        return challenges.slice(0, limit);
    } catch (error) {
        console.error('Error getting completed challenges:', error);
        return [];
    }
}

/**
 * Get challenge statistics
 */
export async function getChallengeStats() {
    const user = await getCurrentUser();
    if (!user) return null;

    try {
        const completed = await getCompletedChallenges(1000); // Get all

        const total = completed.length;
        const wins = completed.filter(c => c.winnerId === user.uid).length;
        const losses = completed.filter(c => c.winnerId && c.winnerId !== user.uid).length;
        const ties = completed.filter(c => c.winnerId === null).length;

        const winRate = total > 0 ? (wins / total) * 100 : 0;

        // Calculate average score
        const scores = completed.map(c => {
            return c.role === 'challenger' ? c.challengerScore : c.opponentScore;
        }).filter(s => s !== null);

        const avgScore = scores.length > 0 
            ? scores.reduce((sum, s) => sum + s, 0) / scores.length 
            : 0;

        // Get most challenged friend
        const friendChallenges = {};
        completed.forEach(c => {
            const friendId = c.role === 'challenger' ? c.opponentId : c.challengerId;
            friendChallenges[friendId] = (friendChallenges[friendId] || 0) + 1;
        });

        const mostChallenged = Object.entries(friendChallenges)
            .sort((a, b) => b[1] - a[1])[0];

        // Calculate unique opponents
        const uniqueOpponents = new Set(Object.keys(friendChallenges)).size;

        // Calculate consecutive wins
        let consecutiveWins = 0;
        let currentStreak = 0;
        
        // Sort by completion date (most recent first)
        const sortedCompleted = [...completed].sort((a, b) => 
            new Date(b.completedAt) - new Date(a.completedAt)
        );

        for (const challenge of sortedCompleted) {
            if (challenge.winnerId === user.uid) {
                currentStreak++;
                consecutiveWins = Math.max(consecutiveWins, currentStreak);
            } else {
                currentStreak = 0;
            }
        }

        return {
            total,
            wins,
            losses,
            ties,
            winRate: Math.round(winRate),
            avgScore: Math.round(avgScore),
            mostChallengedId: mostChallenged ? mostChallenged[0] : null,
            mostChallengedCount: mostChallenged ? mostChallenged[1] : 0,
            uniqueOpponents,
            consecutiveWins
        };
    } catch (error) {
        console.error('Error getting challenge stats:', error);
        return null;
    }
}

/**
 * Get challenge by ID
 */
export async function getChallenge(challengeId) {
    try {
        const doc = await db.collection('friend-challenges').doc(challengeId).get();
        
        if (!doc.exists) {
            return null;
        }

        return {
            id: doc.id,
            ...doc.data()
        };
    } catch (error) {
        console.error('Error getting challenge:', error);
        return null;
    }
}

/**
 * Format time remaining
 */
export function getTimeRemaining(expiresAt) {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry - now;

    if (diffMs <= 0) return 'Expired';

    const diffHours = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor((diffMs % 3600000) / 60000);

    if (diffHours > 0) return `${diffHours}h ${diffMins}m`;
    return `${diffMins}m`;
}
