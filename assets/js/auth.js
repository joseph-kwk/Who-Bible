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

// Login rate limiting
const loginAttempts = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_LOGIN_ATTEMPTS = 5;

/**
 * Validate password strength
 * Requirements: 8+ chars, uppercase, lowercase, number
 */
export function validatePasswordStrength(password) {
  const requirements = {
    length: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  
  const score = Object.values(requirements).filter(Boolean).length;
  
  return {
    valid: requirements.length && requirements.hasUpper && requirements.hasLower && requirements.hasNumber,
    score: score,
    requirements: requirements,
    strength: score < 3 ? 'weak' : score < 4 ? 'medium' : 'strong',
    message: score < 4 ? 'Password must be at least 8 characters with uppercase, lowercase, and numbers' : 'Password strength: ' + (score < 4 ? 'medium' : 'strong')
  };
}

/**
 * Validate email format and reject disposable emails
 */
export function validateEmail(email) {
  // RFC 5322 compliant regex (simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!email || !emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  // Check for common disposable email domains
  const disposableDomains = [
    'tempmail.com', '10minutemail.com', 'guerrillamail.com',
    'throwaway.email', 'mailinator.com', 'temp-mail.org'
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (disposableDomains.includes(domain)) {
    return { valid: false, error: 'Disposable email addresses are not allowed' };
  }
  
  return { valid: true };
}

/**
 * Sanitize display name
 */
function sanitizeDisplayName(name) {
  if (!name) return '';
  
  // Remove HTML tags
  const div = document.createElement('div');
  div.textContent = name;
  let safe = div.innerHTML;
  
  // Trim and limit length
  safe = safe.trim().substring(0, 50);
  
  // Only allow alphanumeric, spaces, hyphens, underscores
  if (!/^[a-zA-Z0-9\s_-]+$/.test(safe)) {
    return '';
  }
  
  return safe;
}

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
        // Validate email
        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) {
            return { success: false, error: emailValidation.error };
        }
        
        // Validate password strength
        const passwordCheck = validatePasswordStrength(password);
        if (!passwordCheck.valid) {
            return { success: false, error: passwordCheck.message };
        }
        
        // Sanitize display name
        const safeName = sanitizeDisplayName(displayName);
        if (!safeName || safeName.length < 2) {
            return { success: false, error: 'Display name must be 2-50 characters and contain only letters, numbers, spaces, hyphens, or underscores' };
        }
        
        // Create authentication account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update display name
        await updateProfile(user, { displayName: safeName });

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
        // Check rate limit for this email
        const attempts = loginAttempts.get(email) || [];
        const now = Date.now();
        const recentAttempts = attempts.filter(t => now - t < RATE_LIMIT_WINDOW);
        
        if (recentAttempts.length >= MAX_LOGIN_ATTEMPTS) {
            const oldestAttempt = recentAttempts[0];
            const timeToWait = Math.ceil((RATE_LIMIT_WINDOW - (now - oldestAttempt)) / 1000);
            return { 
                success: false, 
                error: `Too many login attempts. Please wait ${timeToWait} seconds before trying again.` 
            };
        }
        
        // Record this attempt
        recentAttempts.push(now);
        loginAttempts.set(email, recentAttempts);
        
        // Attempt login
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Clear attempts on successful login
        loginAttempts.delete(email);
        
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
        'auth/invalid-email': 'Invalid email address format.',
        'auth/operation-not-allowed': 'Email/password accounts are not enabled.',
        'auth/weak-password': 'Password is too weak. Please use a stronger password.',
        'auth/user-disabled': 'This account has been disabled. Please contact support.',
        // Prevent account enumeration - same message for both
        'auth/user-not-found': 'Invalid email or password.',
        'auth/wrong-password': 'Invalid email or password.',
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later or reset your password.',
        'auth/network-request-failed': 'Network error. Please check your internet connection.',
        'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
        'auth/cancelled-popup-request': 'Another popup is already open.'
    };

    return errorMessages[errorCode] || 'An error occurred. Please try again.';
}

// Initialize auth on load
if (typeof auth !== 'undefined') {
    initAuth();
}
