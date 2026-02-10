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
    updateProfile,
    verifyBeforeUpdateEmail,
    reauthenticateWithCredential,
    EmailAuthProvider
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

// Session timeout management
let sessionTimeoutId = null;
let lastActivityTime = Date.now();
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes of inactivity
const SESSION_WARNING_TIME = 5 * 60 * 1000; // Warn 5 minutes before timeout

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
            startSessionTimeout(); // Start inactivity timer
            dispatchAuthEvent('login', user);
        } else {
            console.log('User signed out');
            userProfile = null;
            stopSessionTimeout(); // Clear timer
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
    stopSessionTimeout(); // Clear timer
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
 * Update user email with verification
 * Requires recent authentication (within 5 minutes)
 */
export async function updateUserEmail(newEmail, currentPassword) {
    if (!currentUser) {
        return { success: false, error: 'No user logged in' };
    }

    try {
        // Validate new email
        const emailValidation = validateEmail(newEmail);
        if (!emailValidation.valid) {
            return { success: false, error: emailValidation.error };
        }

        // Check if email is different
        if (currentUser.email === newEmail) {
            return { success: false, error: 'New email is the same as current email' };
        }

        // Re-authenticate user first (required for sensitive operations)
        const credential = EmailAuthProvider.credential(
            currentUser.email,
            currentPassword
        );
        await reauthenticateWithCredential(currentUser, credential);

        // Send verification to new email before updating
        // User must click link in email to complete change
        await verifyBeforeUpdateEmail(currentUser, newEmail);

        return { 
            success: true, 
            message: 'Verification email sent to ' + newEmail + '. Please check your inbox and click the link to confirm the change.' 
        };
    } catch (error) {
        console.error('Email update error:', error);
        
        // Handle specific errors
        if (error.code === 'auth/wrong-password') {
            return { success: false, error: 'Current password is incorrect' };
        }
        if (error.code === 'auth/email-already-in-use') {
            return { success: false, error: 'This email is already in use by another account' };
        }
        if (error.code === 'auth/requires-recent-login') {
            return { success: false, error: 'Please sign out and sign in again before changing your email' };
        }
        
        return { success: false, error: getAuthErrorMessage(error.code) };
    }
}

/**
 * Change user password
 * Requires current password for security
 */
export async function updateUserPassword(currentPassword, newPassword) {
    if (!currentUser) {
        return { success: false, error: 'No user logged in' };
    }

    try {
        // Validate new password strength
        const passwordCheck = validatePasswordStrength(newPassword);
        if (!passwordCheck.valid) {
            return { success: false, error: passwordCheck.message };
        }

        // Re-authenticate user first
        const credential = EmailAuthProvider.credential(
            currentUser.email,
            currentPassword
        );
        await reauthenticateWithCredential(currentUser, credential);

        // Update password using Firebase SDK method
        const { updatePassword } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        await updatePassword(currentUser, newPassword);

        return { 
            success: true, 
            message: 'Password updated successfully' 
        };
    } catch (error) {
        console.error('Password update error:', error);
        
        if (error.code === 'auth/wrong-password') {
            return { success: false, error: 'Current password is incorrect' };
        }
        if (error.code === 'auth/requires-recent-login') {
            return { success: false, error: 'Please sign out and sign in again before changing your password' };
        }
        
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
 

/**
 * Start session timeout monitoring
 * Logs user out after 30 minutes of inactivity
 */
function startSessionTimeout() {
    if (!currentUser) return;

    // Reset activity time
    lastActivityTime = Date.now();

    // Clear existing timeout
    stopSessionTimeout();

    // Set up activity listeners
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(event => {
        document.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Check every minute
    sessionTimeoutId = setInterval(checkSessionTimeout, 60000);
}

/**
 * Stop session timeout monitoring
 */
function stopSessionTimeout() {
    if (sessionTimeoutId) {
        clearInterval(sessionTimeoutId);
        sessionTimeoutId = null;
    }

    // Remove activity listeners
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
    });
}

/**
 * Handle user activity - reset timer
 */
function handleUserActivity() {
    lastActivityTime = Date.now();
}

/**
 * Check if session has timed out
 */
async function checkSessionTimeout() {
    if (!currentUser) {
        stopSessionTimeout();
        return;
    }

    const inactiveTime = Date.now() - lastActivityTime;
    
    // Warn user 5 minutes before timeout
    if (inactiveTime >= SESSION_TIMEOUT - SESSION_WARNING_TIME && 
        inactiveTime < SESSION_TIMEOUT) {
        showSessionWarning();
    }
    
    // Logout if inactive for 30 minutes
    if (inactiveTime >= SESSION_TIMEOUT) {
        console.log('Session timed out due to inactivity');
        await logoutUser();
        
        // Show message to user
        dispatchAuthEvent('session-timeout', null);
        
        // Optional: Show a toast or modal
        if (typeof window.showToast === 'function') {
            window.showToast('You have been logged out due to inactivity', 'info');
        }
    }
}

/**
 * Show warning that session will expire soon
 */
function showSessionWarning() {
    dispatchAuthEvent('session-warning', {
        remainingMinutes: Math.floor(SESSION_WARNING_TIME / 60000)
    });
    
    // Optional: Show a toast
    if (typeof window.showToast === 'function') {
        window.showToast('Your session will expire in 5 minutes. Move your mouse to stay logged in.', 'warning');
    }
}

/**
 * Manually refresh session (extend timeout)
 */
export function refreshSession() {
    if (currentUser) {
        lastActivityTime = Date.now();
        return { success: true, message: 'Session refreshed' };
    }
    return { success: false, error: 'No active session' };
}

/*
 * Get remaining session time in minutes

export function getSessionTimeRemaining() {
    if (!currentUser) return 0;
    
    const inactiveTime = Date.now() - lastActivityTime;
    const remainingTime = SESSION_TIMEOUT - inactiveTime;
    
    return Math.max(0, Math.floor(remainingTime / 60000));
}
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
