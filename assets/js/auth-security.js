/**
 * Authentication Security Enhancements
 * Additional security features for the authentication system
 */

/**
 * Force HTTPS (except localhost for development)
 */
export function enforceHTTPS() {
  if (location.protocol !== 'https:' && 
      location.hostname !== 'localhost' && 
      location.hostname !== '127.0.0.1') {
    console.warn('[Security] Redirecting to HTTPS...');
    location.replace(`https:${location.href.substring(location.protocol.length)}`);
  }
}

/**
 * Session Timeout Manager
 * Logs out users after inactivity
 */
export class SessionTimeoutManager {
  constructor(timeoutMinutes = 30) {
    this.timeoutDuration = timeoutMinutes * 60 * 1000;
    this.lastActivity = Date.now();
    this.checkInterval = null;
    this.isActive = false;
  }

  /**
   * Start monitoring for inactivity
   */
  start() {
    if (this.isActive) return;
    
    this.isActive = true;
    this.lastActivity = Date.now();
    
    // Track user activity
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(event => {
      document.addEventListener(event, () => this.resetTimer(), { passive: true });
    });
    
    // Check for timeout every minute
    this.checkInterval = setInterval(() => this.checkTimeout(), 60000);
    
    console.log('[SessionTimeout] Started monitoring (timeout:', this.timeoutDuration / 60000, 'minutes)');
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (!this.isActive) return;
    
    this.isActive = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    console.log('[SessionTimeout] Stopped monitoring');
  }

  /**
   * Reset the inactivity timer
   */
  resetTimer() {
    this.lastActivity = Date.now();
  }

  /**
   * Check if session has timed out
   */
  checkTimeout() {
    const idle = Date.now() - this.lastActivity;
    
    if (idle > this.timeoutDuration) {
      console.warn('[SessionTimeout] Session timed out due to inactivity');
      this.handleTimeout();
    }
  }

  /**
   * Handle timeout (override this)
   */
  handleTimeout() {
    // Import and call logout function
    if (typeof window.auth_logoutUser === 'function') {
      window.auth_logoutUser();
    }
    
    // Show message
    if (typeof window.showToast === 'function') {
      window.showToast({
        title: 'Session Expired',
        msg: 'You have been logged out due to inactivity.',
        type: 'info',
        timeout: 5000
      });
    } else {
      alert('You have been logged out due to inactivity.');
    }
    
    // Redirect to login
    if (window.location.pathname.includes('admin')) {
      window.location.reload();
    }
  }
}

/**
 * Password Strength Meter UI
 */
export class PasswordStrengthMeter {
  constructor(inputId, meterId, labelId) {
    this.input = document.getElementById(inputId);
    this.meter = document.getElementById(meterId);
    this.label = document.getElementById(labelId);
    
    if (this.input) {
      this.input.addEventListener('input', (e) => this.update(e.target.value));
    }
  }

  /**
   * Update strength meter display
   */
  update(password) {
    if (!this.meter || !this.label) return;
    
    // Calculate strength (same as auth.js)
    const requirements = {
      length: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    const score = Object.values(requirements).filter(Boolean).length;
    const strength = score < 3 ? 'weak' : score < 4 ? 'medium' : 'strong';
    
    // Update meter
    this.meter.className = `password-strength-meter strength-${strength}`;
    this.meter.style.width = `${(score / 5) * 100}%`;
    
    // Update label
    const labels = {
      'weak': 'Weak',
      'medium': 'Medium',
      'strong': 'Strong'
    };
    this.label.textContent = labels[strength] || '';
    this.label.className = `password-strength-label strength-${strength}`;
    
    // Show requirements
    if (score < 4 && password.length > 0) {
      const missing = [];
      if (!requirements.length) missing.push('8+ characters');
      if (!requirements.hasUpper) missing.push('uppercase letter');
      if (!requirements.hasLower) missing.push('lowercase letter');
      if (!requirements.hasNumber) missing.push('number');
      
      this.label.textContent += missing.length > 0 ? ` (Need: ${missing.join(', ')})` : '';
    }
  }
}

/**
 * Login Attempt Tracker
 * Visual feedback for failed login attempts
 */
export class LoginAttemptTracker {
  constructor() {
    this.attempts = 0;
    this.maxAttempts = 5;
    this.locked = false;
    this.lockTimeout = null;
  }

  /**
   * Record a failed attempt
   */
  recordFailure() {
    this.attempts++;
    
    if (this.attempts >= this.maxAttempts) {
      this.lock();
    }
    
    return {
      attempts: this.attempts,
      remaining: Math.max(0, this.maxAttempts - this.attempts),
      locked: this.locked
    };
  }

  /**
   * Record a successful login
   */
  recordSuccess() {
    this.reset();
  }

  /**
   * Lock further attempts
   */
  lock() {
    this.locked = true;
    
    // Auto-unlock after 1 minute
    this.lockTimeout = setTimeout(() => {
      this.reset();
    }, 60000);
  }

  /**
   * Reset tracker
   */
  reset() {
    this.attempts = 0;
    this.locked = false;
    
    if (this.lockTimeout) {
      clearTimeout(this.lockTimeout);
      this.lockTimeout = null;
    }
  }

  /**
   * Check if locked
   */
  isLocked() {
    return this.locked;
  }
}

/**
 * Security Headers Check
 * Warns if site is missing important security headers
 */
export async function checkSecurityHeaders() {
  try {
    const response = await fetch(window.location.href, { method: 'HEAD' });
    
    const headers = {
      'Strict-Transport-Security': response.headers.get('Strict-Transport-Security'),
      'X-Content-Type-Options': response.headers.get('X-Content-Type-Options'),
      'X-Frame-Options': response.headers.get('X-Frame-Options'),
      'X-XSS-Protection': response.headers.get('X-XSS-Protection'),
      'Content-Security-Policy': response.headers.get('Content-Security-Policy')
    };
    
    const missing = [];
    for (const [header, value] of Object.entries(headers)) {
      if (!value) {
        missing.push(header);
      }
    }
    
    if (missing.length > 0) {
      console.warn('[Security] Missing security headers:', missing);
      console.warn('[Security] Consider adding these headers via Firebase Hosting config or web server.');
    } else {
      console.log('[Security] ✓ All recommended security headers present');
    }
    
    return { headers, missing };
  } catch (error) {
    console.error('[Security] Could not check headers:', error);
    return { headers: {}, missing: [] };
  }
}

/**
 * Credential Leak Detector
 * Prevents accidentally logging sensitive data
 */
export function sanitizeLogData(data) {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const sanitized = { ...data };
  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'credential'];
  
  for (const key in sanitized) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeLogData(sanitized[key]);
    }
  }
  
  return sanitized;
}

/**
 * Enhanced console.log that auto-sanitizes
 */
export function secureLog(message, data) {
  if (data) {
    console.log(message, sanitizeLogData(data));
  } else {
    console.log(message);
  }
}

// Auto-enforce HTTPS when module loads
if (typeof window !== 'undefined') {
  enforceHTTPS();
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.auth_enforceHTTPS = enforceHTTPS;
  window.auth_SessionTimeoutManager = SessionTimeoutManager;
  window.auth_PasswordStrengthMeter = PasswordStrengthMeter;
  window.auth_LoginAttemptTracker = LoginAttemptTracker;
  window.auth_checkSecurityHeaders = checkSecurityHeaders;
  window.auth_sanitizeLogData = sanitizeLogData;
  window.auth_secureLog = secureLog;
}
