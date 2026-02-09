/**
 * Security Module for Who-Bible
 * Provides input validation, sanitization, rate limiting, and XSS protection
 */

const SecurityModule = {
  // Profanity filter list (basic - expand as needed)
  PROFANITY_LIST: [
    'damn', 'hell', 'crap', 'stupid', 'idiot', 'dumb', 'hate', 'kill', 'die',
    'sex', 'porn', 'xxx', 'ass', 'bitch', 'bastard', 'shit', 'fuck'
  ],

  /**
   * Sanitize HTML to prevent XSS attacks
   * Converts special characters to HTML entities
   */
  sanitizeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  /**
   * Escape HTML for safe rendering
   * Use this before setting textContent to ensure no scripts execute
   */
  escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /**
   * Validate player name
   * Rules: 2-30 chars, alphanumeric + spaces/hyphens/underscores, no profanity
   */
  validatePlayerName(name) {
    if (!name || typeof name !== 'string') {
      return { valid: false, error: 'Name is required' };
    }
    
    const trimmed = name.trim();
    
    if (trimmed.length < 2) {
      return { valid: false, error: 'Name must be at least 2 characters' };
    }
    
    if (trimmed.length > 30) {
      return { valid: false, error: 'Name must be 30 characters or less' };
    }
    
    if (!/^[a-zA-Z0-9\s_-]+$/.test(trimmed)) {
      return { valid: false, error: 'Name can only contain letters, numbers, spaces, hyphens and underscores' };
    }
    
    if (this.containsProfanity(trimmed)) {
      return { valid: false, error: 'Name contains inappropriate language' };
    }
    
    return { valid: true, value: trimmed };
  },

  /**
   * Validate room code
   * Format: WORD-123 (e.g., FAITH-247)
   */
  validateRoomCode(code) {
    if (!code || typeof code !== 'string') {
      return { valid: false, error: 'Room code is required' };
    }
    
    const trimmed = code.trim().toUpperCase();
    
    if (!/^[A-Z]+-\d{1,4}$/.test(trimmed)) {
      return { valid: false, error: 'Invalid room code format. Should be like FAITH-123' };
    }
    
    return { valid: true, value: trimmed };
  },

  /**
   * Validate host name
   * Same rules as player name
   */
  validateHostName(name) {
    return this.validatePlayerName(name);
  },

  /**
   * Validate quiz settings
   */
  validateQuizSettings(settings) {
    const errors = [];
    
    // Validate number of questions
    const numQuestions = parseInt(settings.numQuestions);
    if (isNaN(numQuestions) || numQuestions < 5 || numQuestions > 30) {
      errors.push('Number of questions must be between 5 and 30');
    }
    
    // Validate time per question
    const timePerQuestion = parseInt(settings.timePerQuestion);
    if (isNaN(timePerQuestion) || timePerQuestion < 10 || timePerQuestion > 60) {
      errors.push('Time per question must be between 10 and 60 seconds');
    }
    
    // Validate difficulty
    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!validDifficulties.includes(settings.difficulty)) {
      errors.push('Invalid difficulty level');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors,
      sanitized: {
        numQuestions: Math.min(30, Math.max(5, numQuestions)),
        timePerQuestion: Math.min(60, Math.max(10, timePerQuestion)),
        difficulty: validDifficulties.includes(settings.difficulty) ? settings.difficulty : 'medium'
      }
    };
  },

  /**
   * Check if text contains profanity
   */
  containsProfanity(text) {
    if (!text) return false;
    const lower = text.toLowerCase();
    return this.PROFANITY_LIST.some(word => {
      // Check for word boundaries to avoid false positives
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      return regex.test(lower);
    });
  },

  /**
   * Validate score value
   * Prevents score tampering
   */
  validateScore(score) {
    const num = parseInt(score);
    if (isNaN(num) || num < 0 || num > 1000000) {
      return { valid: false, error: 'Invalid score value' };
    }
    return { valid: true, value: num };
  },

  /**
   * Validate timestamp
   * Prevents time manipulation
   */
  validateTimestamp(timestamp) {
    const num = parseInt(timestamp);
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    const oneMinuteFuture = now + (1 * 60 * 1000);
    
    if (isNaN(num) || num < fiveMinutesAgo || num > oneMinuteFuture) {
      return { valid: false, error: 'Invalid timestamp' };
    }
    return { valid: true, value: num };
  },

  /**
   * Validate answer text
   * Ensures answer is reasonable length
   */
  validateAnswer(answer) {
    if (!answer || typeof answer !== 'string') {
      return { valid: false, error: 'Answer is required' };
    }
    
    if (answer.length > 200) {
      return { valid: false, error: 'Answer is too long' };
    }
    
    return { valid: true, value: answer.trim() };
  }
};

/**
 * Rate Limiter Module
 * Prevents spam and DoS attacks
 */
const RateLimiter = {
  limits: new Map(),
  
  /**
   * Check if action is within rate limit
   * @param {string} action - Action identifier (e.g., 'createRoom', 'joinRoom')
   * @param {number} maxPerMinute - Maximum allowed attempts per minute
   * @returns {boolean} - True if within limit, false if exceeded
   */
  check(action, maxPerMinute = 10) {
    const now = Date.now();
    const key = action;
    
    if (!this.limits.has(key)) {
      this.limits.set(key, []);
    }
    
    const timestamps = this.limits.get(key);
    
    // Remove timestamps older than 1 minute
    const recentAttempts = timestamps.filter(t => now - t < 60000);
    
    if (recentAttempts.length >= maxPerMinute) {
      console.warn(`[RateLimiter] Action '${action}' exceeded rate limit: ${recentAttempts.length}/${maxPerMinute}`);
      return false; // Rate limit exceeded
    }
    
    // Add current attempt
    recentAttempts.push(now);
    this.limits.set(key, recentAttempts);
    return true;
  },
  
  /**
   * Reset rate limit for a specific action
   */
  reset(action) {
    this.limits.delete(action);
  },
  
  /**
   * Clear all rate limits
   */
  clearAll() {
    this.limits.clear();
  },
  
  /**
   * Get current attempt count for an action
   */
  getAttempts(action) {
    if (!this.limits.has(action)) return 0;
    const now = Date.now();
    const timestamps = this.limits.get(action);
    return timestamps.filter(t => now - t < 60000).length;
  }
};

/**
 * Data Cleanup Module
 * Removes old game data to prevent database bloat
 */
const DataCleanup = {
  /**
   * Clean up old classroom games
   * Removes games older than specified hours
   */
  async cleanupOldGames(database, maxAgeHours = 24) {
    if (!database) {
      console.error('[DataCleanup] No database provided');
      return;
    }
    
    try {
      const classroomsRef = database.ref('classrooms');
      const snapshot = await classroomsRef.once('value');
      
      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000;
      let cleanedCount = 0;
      
      const promises = [];
      
      snapshot.forEach(child => {
        const game = child.val();
        if (game && game.createdAt) {
          const age = now - game.createdAt;
          if (age > maxAge) {
            promises.push(
              child.ref.remove()
                .then(() => {
                  console.log(`[DataCleanup] Removed old game: ${child.key} (age: ${Math.round(age / 3600000)}h)`);
                  cleanedCount++;
                })
                .catch(err => {
                  console.error(`[DataCleanup] Error removing ${child.key}:`, err);
                })
            );
          }
        }
      });
      
      await Promise.all(promises);
      console.log(`[DataCleanup] Cleanup complete. Removed ${cleanedCount} old games.`);
      return cleanedCount;
      
    } catch (error) {
      console.error('[DataCleanup] Error during cleanup:', error);
      return 0;
    }
  },
  
  /**
   * Clean up abandoned games (no activity for X minutes)
   */
  async cleanupAbandonedGames(database, inactiveMinutes = 120) {
    if (!database) return;
    
    try {
      const classroomsRef = database.ref('classrooms');
      const snapshot = await classroomsRef.once('value');
      
      const now = Date.now();
      const maxInactivity = inactiveMinutes * 60 * 1000;
      let cleanedCount = 0;
      
      snapshot.forEach(child => {
        const game = child.val();
        if (game && game.lastActivity) {
          const inactive = now - game.lastActivity;
          if (inactive > maxInactivity && game.status !== 'finished') {
            child.ref.child('status').set('abandoned');
            cleanedCount++;
            console.log(`[DataCleanup] Marked abandoned game: ${child.key}`);
          }
        }
      });
      
      return cleanedCount;
      
    } catch (error) {
      console.error('[DataCleanup] Error cleaning abandoned games:', error);
      return 0;
    }
  }
};

/**
 * localStorage Encryption Module
 * Simple encryption for guest data (not cryptographically secure, but better than plaintext)
 */
const StorageEncryption = {
  /**
   * Encode and save data to localStorage
   */
  saveEncrypted(key, data) {
    try {
      const json = JSON.stringify(data);
      const encoded = btoa(json); // Base64 encoding
      localStorage.setItem(key, encoded);
      return true;
    } catch (error) {
      console.error('[StorageEncryption] Error saving:', error);
      return false;
    }
  },
  
  /**
   * Load and decode data from localStorage
   */
  loadEncrypted(key) {
    try {
      const encoded = localStorage.getItem(key);
      if (!encoded) return null;
      const json = atob(encoded); // Base64 decoding
      return JSON.parse(json);
    } catch (error) {
      console.error('[StorageEncryption] Error loading:', error);
      return null;
    }
  },
  
  /**
   * Remove encrypted data
   */
  removeEncrypted(key) {
    localStorage.removeItem(key);
  }
};

// Export modules
if (typeof window !== 'undefined') {
  window.SecurityModule = SecurityModule;
  window.RateLimiter = RateLimiter;
  window.DataCleanup = DataCleanup;
  window.StorageEncryption = StorageEncryption;
}
