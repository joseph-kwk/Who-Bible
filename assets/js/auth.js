/**
 * Authentication Service
 * Handles user authentication, registration, and session management
 */

import { auth, db } from './firebase-config.js';
import { 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    sendEmailVerification,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

import { 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc,
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Current user state
let currentUser = null;
let userProfile = null;

/**
 * Initialize authentication state listener
 */
export function initAuth() {
    onAuthStateChanged(auth, async (user) => {
        currentUser = user;
        
        if (user) {
            console.log('User authenticated:', user.uid);
            await loadUserProfile(user.uid);
            await syncUserLanguage();
            await updateLastLogin();
            dispatchAuthEvent('login', user);
        } else {
            console.log('User signed out');
            userProfile = null;
            dispatchAuthEvent('logout', null);
        }
    });
}

/**
 * Register a new user with email and password
 */
export async function registerUser(email, password, displayName, preferredLanguage = 'en') {
    try {
        // Create authentication account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update display name
        await updateProfile(user, { displayName });

        // Send verification email
        await sendEmailVerification(user);

        // Create user profile in Firestore
        await createUserProfile(user.uid, {
            displayName,
            email,
            preferredLanguage,
            photoURL: null
        });

        return { success: true, user };
    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, error: getAuthErrorMessage(error.code) };
    }
}

/**
 * Sign in existing user
 */
export async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: getAuthErrorMessage(error.code) };
    }
}

/**
 * Sign in with Google
 */
export async function loginWithGoogle() {
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Check if this is a new user
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
            // Create profile for new Google user
            await createUserProfile(user.uid, {
                displayName: user.displayName,
                email: user.email,
                preferredLanguage: navigator.language.split('-')[0] || 'en',
                photoURL: user.photoURL
            });
        }

        return { success: true, user };
    } catch (error) {
        console.error('Google sign-in error:', error);
        return { success: false, error: getAuthErrorMessage(error.code) };
    }
}

/**
 * Sign out current user
 */
export async function logoutUser() {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        console.error('Logout error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send password reset email
 */
export async function resetPassword(email) {
    try {
        await sendPasswordResetEmail(auth, email);
        return { success: true };
    } catch (error) {
        console.error('Password reset error:', error);
        return { success: false, error: getAuthErrorMessage(error.code) };
    }
}

/**
 * Create user profile in Firestore
 */
async function createUserProfile(uid, profileData) {
    const userRef = doc(db, 'users', uid);
    
    const profile = {
        displayName: profileData.displayName || 'Scholar',
        email: profileData.email,
        photoURL: profileData.photoURL || null,
        preferredLanguage: profileData.preferredLanguage || 'en',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
    };

    const stats = {
        totalGames: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        accuracy: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastPlayedDate: null,
        totalXP: 0,
        level: 1
    };

    const settings = {
        theme: localStorage.getItem('theme') || 'dark',
        difficulty: 'medium',
        notifications: {
            email: true,
            challenges: true,
            streaks: true,
            achievements: true,
            weeklyReport: true
        }
    };

    // Create all user documents
    await Promise.all([
        setDoc(userRef, { profile }),
        setDoc(doc(db, 'users', uid, 'data', 'stats'), stats),
        setDoc(doc(db, 'users', uid, 'data', 'settings'), settings)
    ]);

    console.log('User profile created for:', uid);
}

/**
 * Load user profile from Firestore
 */
async function loadUserProfile(uid) {
    try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
            userProfile = userDoc.data().profile;
            console.log('User profile loaded:', userProfile);
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

/**
 * Update user's last login timestamp
 */
async function updateLastLogin() {
    if (!currentUser) return;
    
    try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
            'profile.lastLogin': serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating last login:', error);
    }
}

/**
 * Sync user's preferred language to app
 */
async function syncUserLanguage() {
    if (!userProfile) return;
    
    const preferredLang = userProfile.preferredLanguage;
    if (preferredLang && typeof window.setLanguage === 'function') {
        window.setLanguage(preferredLang);
    }
}

/**
 * Update user profile
 */
export async function updateUserProfile(updates) {
    if (!currentUser) {
        return { success: false, error: 'No user logged in' };
    }

    try {
        const userRef = doc(db, 'users', currentUser.uid);
        
        // Prepare update object with proper nesting
        const profileUpdates = {};
        for (const [key, value] of Object.entries(updates)) {
            profileUpdates[`profile.${key}`] = value;
        }

        await updateDoc(userRef, profileUpdates);
        
        // Update local profile
        userProfile = { ...userProfile, ...updates };
        
        // If display name changed, update auth profile
        if (updates.displayName) {
            await updateProfile(currentUser, { displayName: updates.displayName });
        }

        // If language changed, sync it
        if (updates.preferredLanguage) {
            await syncUserLanguage();
        }

        return { success: true };
    } catch (error) {
        console.error('Error updating profile:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get current user
 */
export function getCurrentUser() {
    return currentUser;
}

/**
 * Get user profile
 */
export function getUserProfile() {
    return userProfile;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
    return currentUser !== null;
}

/**
 * Check if user is guest (not authenticated)
 */
export function isGuest() {
    return currentUser === null;
}

/**
 * Dispatch custom authentication events
 */
function dispatchAuthEvent(type, user) {
    window.dispatchEvent(new CustomEvent(`auth:${type}`, { 
        detail: { user, profile: userProfile } 
    }));
}

/**
 * Get user-friendly error messages
 */
function getAuthErrorMessage(errorCode) {
    const errorMessages = {
        'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/operation-not-allowed': 'Email/password accounts are not enabled.',
        'auth/weak-password': 'Password should be at least 6 characters.',
        'auth/user-disabled': 'This account has been disabled.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
        'auth/popup-closed-by-user': 'Sign-in popup was closed.',
        'auth/cancelled-popup-request': 'Another popup is already open.'
    };

    return errorMessages[errorCode] || 'An error occurred. Please try again.';
}

// Initialize auth on load
if (typeof auth !== 'undefined') {
    initAuth();
}
