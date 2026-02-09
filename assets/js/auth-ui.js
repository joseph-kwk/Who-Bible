/**
 * Authentication UI Components
 * Handles login/signup modals and user interface
 */

import { 
    registerUser, 
    loginUser, 
    loginWithGoogle, 
    logoutUser, 
    resetPassword,
    getCurrentUser,
    getUserProfile,
    isAuthenticated 
} from './auth.js';

import { getText } from './translations.js';

/**
 * Initialize authentication UI
 */
export function initAuthUI() {
    createAuthModals();
    setupAuthListeners();
    updateUIForAuthState();
}

/**
 * Create authentication modal HTML
 */
function createAuthModals() {
    const modalHTML = `
        <!-- Login/Signup Modal -->
        <div id="auth-modal" class="modal auth-modal" style="display: none;">
            <div class="modal-content auth-modal-content">
                <span class="close-modal" id="close-auth-modal">&times;</span>
                
                <!-- Tabs -->
                <div class="auth-tabs">
                    <button class="auth-tab active" data-tab="login">
                        <span data-i18n="auth.signIn">Sign In</span>
                    </button>
                    <button class="auth-tab" data-tab="signup">
                        <span data-i18n="auth.signUp">Sign Up</span>
                    </button>
                </div>

                <!-- Login Form -->
                <div id="login-form" class="auth-form active">
                    <h2 data-i18n="auth.welcomeBack">Welcome Back!</h2>
                    <p class="auth-subtitle" data-i18n="auth.continueJourney">Continue your biblical learning journey</p>
                    
                    <button class="google-signin-btn" id="google-signin-btn">
                        <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                            <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                        </svg>
                        <span data-i18n="auth.signInWithGoogle">Sign in with Google</span>
                    </button>
                    
                    <div class="auth-divider">
                        <span data-i18n="auth.orEmail">or with email</span>
                    </div>

                    <input type="email" id="login-email" class="auth-input" placeholder="Email" required>
                    <input type="password" id="login-password" class="auth-input" placeholder="Password" required>
                    
                    <div class="auth-options">
                        <button class="text-btn" id="forgot-password-btn">
                            <span data-i18n="auth.forgotPassword">Forgot password?</span>
                        </button>
                    </div>

                    <button class="auth-submit-btn" id="login-submit-btn">
                        <span data-i18n="auth.signIn">Sign In</span>
                    </button>

                    <button class="auth-guest-btn" id="continue-guest-btn">
                        <span data-i18n="auth.continueAsGuest">Continue as Guest</span>
                    </button>

                    <div id="login-error" class="auth-error" style="display: none;"></div>
                </div>

                <!-- Signup Form -->
                <div id="signup-form" class="auth-form">
                    <h2 data-i18n="auth.createAccount">Create Account</h2>
                    <p class="auth-subtitle" data-i18n="auth.startLearning">Start your biblical learning journey today</p>
                    
                    <button class="google-signin-btn" id="google-signup-btn">
                        <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                            <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                        </svg>
                        <span data-i18n="auth.signUpWithGoogle">Sign up with Google</span>
                    </button>
                    
                    <div class="auth-divider">
                        <span data-i18n="auth.orEmail">or with email</span>
                    </div>

                    <input type="text" id="signup-name" class="auth-input" placeholder="Display Name" required>
                    <input type="email" id="signup-email" class="auth-input" placeholder="Email" required>
                    <input type="password" id="signup-password" class="auth-input" placeholder="Password (min 6 characters)" required>
                    
                    <div class="password-strength" id="password-strength" style="display: none;">
                        <div class="strength-bar">
                            <div class="strength-fill" id="strength-fill"></div>
                        </div>
                        <span class="strength-text" id="strength-text"></span>
                    </div>

                    <label class="language-select-label">
                        <span data-i18n="auth.preferredLanguage">Preferred Language:</span>
                        <select id="signup-language" class="auth-select">
                            <option value="en">English</option>
                            <option value="es">Español</option>
                            <option value="fr">Français</option>
                        </select>
                    </label>

                    <label class="auth-checkbox">
                        <input type="checkbox" id="terms-agree" required>
                        <span data-i18n="auth.agreeToTerms">I agree to the Terms of Service and Privacy Policy</span>
                    </label>

                    <button class="auth-submit-btn" id="signup-submit-btn">
                        <span data-i18n="auth.createAccount">Create Account</span>
                    </button>

                    <div id="signup-error" class="auth-error" style="display: none;"></div>
                </div>

                <!-- Password Reset Form -->
                <div id="reset-form" class="auth-form">
                    <h2 data-i18n="auth.resetPassword">Reset Password</h2>
                    <p class="auth-subtitle" data-i18n="auth.resetInstructions">Enter your email and we'll send you a reset link</p>
                    
                    <input type="email" id="reset-email" class="auth-input" placeholder="Email" required>
                    
                    <button class="auth-submit-btn" id="reset-submit-btn">
                        <span data-i18n="auth.sendResetLink">Send Reset Link</span>
                    </button>
                    
                    <button class="text-btn" id="back-to-login-btn">
                        <span data-i18n="auth.backToSignIn">← Back to Sign In</span>
                    </button>

                    <div id="reset-error" class="auth-error" style="display: none;"></div>
                    <div id="reset-success" class="auth-success" style="display: none;"></div>
                </div>
            </div>
        </div>

        <!-- User Profile Dropdown -->
        <div id="user-profile-dropdown" class="profile-dropdown" style="display: none;">
            <div class="profile-header">
                <img id="profile-avatar" class="profile-avatar" src="" alt="Avatar">
                <div class="profile-info">
                    <div id="profile-name" class="profile-name"></div>
                    <div id="profile-level" class="profile-level">Level 1</div>
                </div>
            </div>
            <div class="profile-xp-bar">
                <div id="profile-xp-fill" class="profile-xp-fill" style="width: 0%"></div>
            </div>
            <div class="profile-menu">
                <button id="view-profile-btn" class="profile-menu-item">
                    <span data-i18n="auth.viewProfile">View Profile</span>
                </button>
                <button id="settings-btn" class="profile-menu-item">
                    <span data-i18n="auth.settings">Settings</span>
                </button>
                <hr class="profile-divider">
                <button id="logout-btn" class="profile-menu-item logout">
                    <span data-i18n="auth.signOut">Sign Out</span>
                </button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

/**
 * Setup event listeners
 */
function setupAuthListeners() {
    // Header Sign In button
    document.getElementById('btn-auth-signin')?.addEventListener('click', () => {
        if (isAuthenticated()) {
            // If already logged in, show profile dropdown (future feature)
            showNotification('Already signed in!');
        } else {
            openAuthModal('login');
        }
    });
    
    // Tab switching
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Close modal
    document.getElementById('close-auth-modal')?.addEventListener('click', closeAuthModal);
    
    // Click outside to close
    document.getElementById('auth-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'auth-modal') closeAuthModal();
    });

    // Login
    document.getElementById('login-submit-btn')?.addEventListener('click', handleLogin);
    document.getElementById('google-signin-btn')?.addEventListener('click', handleGoogleSignIn);
    
    // Signup
    document.getElementById('signup-submit-btn')?.addEventListener('click', handleSignup);
    document.getElementById('google-signup-btn')?.addEventListener('click', handleGoogleSignIn);
    document.getElementById('signup-password')?.addEventListener('input', checkPasswordStrength);
    
    // Password reset
    document.getElementById('forgot-password-btn')?.addEventListener('click', showResetForm);
    document.getElementById('back-to-login-btn')?.addEventListener('click', () => switchTab('login'));
    document.getElementById('reset-submit-btn')?.addEventListener('click', handlePasswordReset);
    
    // Guest mode
    document.getElementById('continue-guest-btn')?.addEventListener('click', closeAuthModal);
    
    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);

    // Listen for auth state changes
    window.addEventListener('auth:login', () => {
        closeAuthModal();
        updateUIForAuthState();
        showNotification(getText('auth.welcomeBack'));
    });

    window.addEventListener('auth:logout', () => {
        updateUIForAuthState();
    });

    // Enter key submissions
    ['login-email', 'login-password'].forEach(id => {
        document.getElementById(id)?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
    });
}

/**
 * Switch between login/signup tabs
 */
function switchTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');
    document.getElementById(`${tab}-form`)?.classList.add('active');
}

/**
 * Show reset password form
 */
function showResetForm() {
    switchTab('reset');
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('reset-form')?.classList.add('active');
}

/**
 * Handle login
 */
async function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    const button = document.getElementById('login-submit-btn');

    if (!email || !password) {
        showError(errorEl, getText('auth.fillAllFields'));
        return;
    }

    button.disabled = true;
    button.textContent = getText('auth.signingIn') || 'Signing in...';

    const result = await loginUser(email, password);
    
    if (result.success) {
        // Modal will close via auth:login event
    } else {
        showError(errorEl, result.error);
        button.disabled = false;
        button.textContent = getText('auth.signIn');
    }
}

/**
 * Handle signup
 */
async function handleSignup() {
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const language = document.getElementById('signup-language').value;
    const termsAgreed = document.getElementById('terms-agree').checked;
    const errorEl = document.getElementById('signup-error');
    const button = document.getElementById('signup-submit-btn');

    if (!name || !email || !password) {
        showError(errorEl, getText('auth.fillAllFields'));
        return;
    }

    if (!termsAgreed) {
        showError(errorEl, getText('auth.mustAgreeToTerms'));
        return;
    }

    if (password.length < 6) {
        showError(errorEl, getText('auth.passwordTooShort'));
        return;
    }

    button.disabled = true;
    button.textContent = getText('auth.creatingAccount') || 'Creating account...';

    const result = await registerUser(email, password, name, language);
    
    if (result.success) {
        showNotification(getText('auth.verificationEmailSent'));
        // Modal will close via auth:login event
    } else {
        showError(errorEl, result.error);
        button.disabled = false;
        button.textContent = getText('auth.createAccount');
    }
}

/**
 * Handle Google sign in
 */
async function handleGoogleSignIn() {
    const result = await loginWithGoogle();
    
    if (!result.success && result.error) {
        const errorEl = document.querySelector('.auth-form.active .auth-error');
        showError(errorEl, result.error);
    }
}

/**
 * Handle password reset
 */
async function handlePasswordReset() {
    const email = document.getElementById('reset-email').value;
    const errorEl = document.getElementById('reset-error');
    const successEl = document.getElementById('reset-success');
    const button = document.getElementById('reset-submit-btn');

    if (!email) {
        showError(errorEl, getText('auth.enterEmail'));
        return;
    }

    button.disabled = true;
    button.textContent = getText('auth.sending') || 'Sending...';

    const result = await resetPassword(email);
    
    if (result.success) {
        successEl.textContent = getText('auth.resetEmailSent');
        successEl.style.display = 'block';
        errorEl.style.display = 'none';
        setTimeout(() => switchTab('login'), 3000);
    } else {
        showError(errorEl, result.error);
    }

    button.disabled = false;
    button.textContent = getText('auth.sendResetLink');
}

/**
 * Handle logout
 */
async function handleLogout() {
    if (confirm(getText('auth.confirmLogout') || 'Are you sure you want to sign out?')) {
        await logoutUser();
        showNotification(getText('auth.signedOut'));
    }
}

/**
 * Check password strength
 */
function checkPasswordStrength() {
    const password = document.getElementById('signup-password').value;
    const strengthBar = document.getElementById('password-strength');
    const strengthFill = document.getElementById('strength-fill');
    const strengthText = document.getElementById('strength-text');

    if (password.length === 0) {
        strengthBar.style.display = 'none';
        return;
    }

    strengthBar.style.display = 'block';
    
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 10) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 15;
    if (/[^a-zA-Z\d]/.test(password)) strength += 10;

    strengthFill.style.width = `${strength}%`;
    
    if (strength < 40) {
        strengthFill.style.background = '#e74c3c';
        strengthText.textContent = getText('auth.weak');
    } else if (strength < 70) {
        strengthFill.style.background = '#f39c12';
        strengthText.textContent = getText('auth.medium');
    } else {
        strengthFill.style.background = '#27ae60';
        strengthText.textContent = getText('auth.strong');
    }
}

/**
 * Show auth modal
 */
export function showAuthModal(tab = 'login') {
    document.getElementById('auth-modal').style.display = 'flex';
    switchTab(tab);
}

/**
 * Close auth modal
 */
function closeAuthModal() {
    document.getElementById('auth-modal').style.display = 'none';
    clearAuthForms();
}

/**
 * Clear all auth forms
 */
function clearAuthForms() {
    document.querySelectorAll('.auth-input').forEach(input => input.value = '');
    document.querySelectorAll('.auth-error, .auth-success').forEach(el => {
        el.style.display = 'none';
        el.textContent = '';
    });
    document.getElementById('terms-agree').checked = false;
}

/**
 * Show error message
 */
function showError(element, message) {
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
        setTimeout(() => element.style.display = 'none', 5000);
    }
}

/**
 * Show notification (implement based on your notification system)
 */
function showNotification(message) {
    // This should integrate with your existing notification system
    console.log('Notification:', message);
    // TODO: Show toast notification
}

/**
 * Update UI based on authentication state
 */
function updateUIForAuthState() {
    const user = getCurrentUser();
    const profile = getUserProfile();
    
    // Update header Sign In button
    const authButton = document.getElementById('btn-auth-signin');
    const authButtonText = document.getElementById('auth-button-text');
    
    if (user && profile) {
        // User is logged in - show their name
        if (authButtonText) {
            authButtonText.textContent = profile.displayName || 'My Account';
        }
        if (authButton) {
            authButton.setAttribute('aria-label', 'View account');
        }
    } else {
        // User is guest - show Sign In
        if (authButtonText) {
            authButtonText.textContent = 'Sign In';
        }
        if (authButton) {
            authButton.setAttribute('aria-label', 'Sign in or create account');
        }
    }
    
    // Update any UI elements that need to know about auth state
    const loginButtons = document.querySelectorAll('.show-auth-btn');
    const userButtons = document.querySelectorAll('.user-profile-btn');
    
    if (user && profile) {
        // Show user profile button
        loginButtons.forEach(btn => btn.style.display = 'none');
        userButtons.forEach(btn => btn.style.display = 'block');
        
        // Update profile display
        updateProfileDisplay(profile);
    } else {
        // Show login button
        loginButtons.forEach(btn => btn.style.display = 'block');
        userButtons.forEach(btn => btn.style.display = 'none');
    }
}

/**
 * Update profile display in dropdown
 */
function updateProfileDisplay(profile) {
    if (!profile) return;
    
    document.getElementById('profile-name').textContent = profile.displayName || 'Scholar';
    document.getElementById('profile-avatar').src = profile.photoURL || 'assets/images/default-avatar.png';
    
    // Add language indicator
    const profileHeader = document.querySelector('.profile-header');
    if (profileHeader && profile.preferredLanguage) {
        const existingIndicator = profileHeader.querySelector('.language-indicator');
        if (existingIndicator) existingIndicator.remove();
        
        const languageIndicator = document.createElement('div');
        languageIndicator.className = 'language-indicator';
        languageIndicator.textContent = getLanguageFlag(profile.preferredLanguage);
        languageIndicator.title = `Preferred language: ${getLanguageName(profile.preferredLanguage)}`;
        profileHeader.appendChild(languageIndicator);
    }
    
    // Update level and XP from stats (would be loaded separately)
    // This is placeholder - actual stats loading happens in user-profile.js
}

/**
 * Get language flag emoji
 */
function getLanguageFlag(langCode) {
    const flags = {
        'en': '🇬🇧',
        'es': '🇪🇸',
        'fr': '🇫🇷'
    };
    return flags[langCode] || '🌐';
}

/**
 * Get language name
 */
function getLanguageName(langCode) {
    const names = {
        'en': 'English',
        'es': 'Español',
        'fr': 'Français'
    };
    return names[langCode] || langCode;
}

// Export for use by guest prompts and other modules
if (typeof window !== 'undefined') {
    window.openAuthModal = openAuthModal;
    window.closeAuthModal = closeAuthModal;
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthUI);
} else {
    initAuthUI();
}
