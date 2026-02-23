/**
 * Content Filter & Security Module
 * Comprehensive content moderation for Who-Bible
 * Filters profanity, PII, spam, and inappropriate content
 */

(function() {
  'use strict';

  // Expanded profanity list (family-friendly Christian app)
  const PROFANITY_LIST = [
    // Common profanity
    'damn', 'hell', 'crap', 'ass', 'bastard', 'bitch', 'shit', 'fuck', 'piss',
    // Offensive terms
    'stupid', 'idiot', 'dumb', 'moron', 'retard', 'loser', 'noob', 'suck',
    // Hostile language
    'hate', 'kill', 'die', 'death', 'murder', 'kms', 'kys',
    // Sexual content
    'sex', 'sexy', 'porn', 'xxx', 'nude', 'naked', 'nsfw', 'onlyfans',
    // Drugs & alcohol abuse references
    'weed', 'drug', 'cocaine', 'meth', 'drunk', 'stoned', 'high',
    // Religious mockery (inappropriate for our context)
    'goddamn', 'wtf', 'omfg', 'wtfrick'
  ];

  // Spam patterns (with word boundaries to avoid false positives)
  const SPAM_PATTERNS = [
    /(.)\1{4,}/i, // Same character repeated 5+ times (aaaaa)
    /\b(follow\s+me|subscribe|click\s+here|buy\s+now|sell|cheap|winner|prize\s+money|cash\s+now)\b/gi,
    /(http|www\.|bit\.ly|tinyurl)/i, // URLs and URL shorteners
    /discord\.gg|t\.me/i // Social media invite links
  ];

  // PII (Personally Identifiable Information) patterns
  const PII_PATTERNS = {
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
    phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
    address: /(street|st\.|avenue|ave\.|road|rd\.|drive|dr\.)\s+\d+/i,
    ssn: /\d{3}-\d{2}-\d{4}/,
    creditCard: /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/
  };

  /**
   * Main content validation function
   */
  function validateContent(text, options = {}) {
    const {
      allowUrls = false,
      allowEmails = false,
      maxLength = 500,
      minLength = 1,
      type = 'generic' // 'username', 'bio', 'message', 'generic'
    } = options;

    const result = {
      valid: true,
      error: '',
      sanitized: text,
      flags: []
    };

    // Basic validation
    if (!text || typeof text !== 'string') {
      result.valid = false;
      result.error = 'Content is required';
      return result;
    }

    const trimmed = text.trim();

    // Length validation
    if (trimmed.length < minLength) {
      result.valid = false;
      result.error = `Content must be at least ${minLength} characters`;
      return result;
    }

    if (trimmed.length > maxLength) {
      result.valid = false;
      result.error = `Content must be less than ${maxLength} characters`;
      return result;
    }

    // Empty or whitespace only
    if (trimmed.length === 0 || /^\s+$/.test(text)) {
      result.valid = false;
      result.error = 'Content cannot be empty or whitespace only';
      return result;
    }

    // Profanity check
    const profanityCheck = checkProfanity(trimmed);
    if (!profanityCheck.clean) {
      result.valid = false;
      result.error = 'Content contains inappropriate language';
      result.flags.push('profanity');
      return result;
    }

    // URL check
    if (!allowUrls && containsUrl(trimmed)) {
      result.valid = false;
      result.error = 'URLs and links are not allowed';
      result.flags.push('url');
      return result;
    }

    // Email check
    if (!allowEmails && PII_PATTERNS.email.test(trimmed)) {
      result.valid = false;
      result.error = 'Email addresses are not allowed. Please remove personal contact information.';
      result.flags.push('email');
      return result;
    }

    // Phone number check
    if (PII_PATTERNS.phone.test(trimmed)) {
      result.valid = false;
      result.error = 'Phone numbers are not allowed. Please remove personal contact information.';
      result.flags.push('phone');
      return result;
    }

    // Address check
    if (PII_PATTERNS.address.test(trimmed)) {
      result.valid = false;
      result.error = 'Physical addresses are not allowed. Please remove location information.';
      result.flags.push('address');
      return result;
    }

    // SSN/Credit card check (safety)
    if (PII_PATTERNS.ssn.test(trimmed) || PII_PATTERNS.creditCard.test(trimmed)) {
      result.valid = false;
      result.error = 'Sensitive information detected. Never share SSN or credit card numbers!';
      result.flags.push('sensitive-data');
      return result;
    }

    // Spam check
    const spamCheck = checkSpam(trimmed);
    if (!spamCheck.clean) {
      result.valid = false;
      result.error = 'Content appears to be spam or promotional';
      result.flags.push('spam');
      return result;
    }

    // Excessive emoji/special characters check
    if (hasExcessiveEmoji(trimmed)) {
      result.valid = false;
      result.error = 'Too many emojis or special characters';
      result.flags.push('emoji-spam');
      return result;
    }

    // Type-specific validations
    if (type === 'username') {
      const usernameCheck = validateUsername(trimmed);
      if (!usernameCheck.valid) {
        return usernameCheck;
      }
    }

    // All checks passed
    result.sanitized = sanitizeText(trimmed);
    return result;
  }

  /**
   * Check for profanity
   */
  function checkProfanity(text) {
    const lower = text.toLowerCase();
    const normalizedText = lower
      .replace(/[0o]/g, 'o')
      .replace(/[1il]/g, 'i')
      .replace(/[3e]/g, 'e')
      .replace(/[4a]/g, 'a')
      .replace(/[5s]/g, 's')
      .replace(/[@]/g, 'a')
      .replace(/[$]/g, 's')
      .replace(/[!]/g, 'i')
      .replace(/\s+/g, ''); // Remove spaces

    for (const word of PROFANITY_LIST) {
      // Check exact word boundaries
      const pattern = new RegExp(`\\b${word}\\b`, 'i');
      if (pattern.test(lower)) {
        return { clean: false, word };
      }

      // Check for obfuscation (l33tspeak, spaces, symbols)
      if (normalizedText.includes(word)) {
        return { clean: false, word };
      }

      // Check for word with symbols around it
      if (lower.includes(word)) {
        return { clean: false, word };
      }
    }

    return { clean: true };
  }

  /**
   * Check for spam patterns
   */
  function checkSpam(text) {
    for (const pattern of SPAM_PATTERNS) {
      if (pattern.test(text)) {
        return { clean: false, pattern: pattern.toString() };
      }
    }

    // Check for excessive caps
    const capsCount = (text.match(/[A-Z]/g) || []).length;
    const letterCount = (text.match(/[A-Za-z]/g) || []).length;
    if (letterCount > 10 && capsCount / letterCount > 0.7) {
      return { clean: false, pattern: 'excessive-caps' };
    }

    return { clean: true };
  }

  /**
   * Check if text contains URLs
   */
  function containsUrl(text) {
    const urlPatterns = [
      /https?:\/\//i,
      /www\./i,
      /\w+\.(com|net|org|edu|gov|io|co|tv|me|gg|ly)\b/i,
      /discord\.gg/i,
      /t\.me/i,
      /bit\.ly/i,
      /tinyurl/i,
      /\w+\.link/i
    ];

    return urlPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Check for excessive emoji/special characters
   */
  function hasExcessiveEmoji(text) {
    // Count emojis and special characters
    const emojiPattern = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    const emojis = text.match(emojiPattern) || [];
    
    // Count non-alphanumeric characters (excluding spaces and basic punctuation)
    const specialChars = text.match(/[^a-zA-Z0-9\s.,!?'-]/g) || [];
    
    const textLength = text.length;
    const emojiCount = emojis.length;
    const specialCount = specialChars.length;

    // More than 30% emojis or special characters
    if (textLength > 0 && (emojiCount + specialCount) / textLength > 0.3) {
      return true;
    }

    // More than 5 consecutive emojis
    if (emojiCount > 5) {
      const consecutiveEmojis = text.match(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]{5,}/gu);
      if (consecutiveEmojis) return true;
    }

    return false;
  }

  /**
   * Username-specific validation
   */
  function validateUsername(username) {
    // Length check
    if (username.length < 2) {
      return { valid: false, error: 'Username must be at least 2 characters' };
    }

    if (username.length > 20) {
      return { valid: false, error: 'Username must be less than 20 characters' };
    }

    // Only letters, numbers, spaces, hyphens, apostrophes
    if (!/^[a-zA-Z0-9\s'-]+$/.test(username)) {
      return { valid: false, error: 'Username can only contain letters, numbers, spaces, hyphens, and apostrophes' };
    }

    // No excessive spaces
    if (/\s{2,}/.test(username)) {
      return { valid: false, error: 'Username cannot have multiple consecutive spaces' };
    }

    // Must start with a letter
    if (!/^[a-zA-Z]/.test(username)) {
      return { valid: false, error: 'Username must start with a letter' };
    }

    // Reserved words
    const reserved = ['admin', 'moderator', 'mod', 'host', 'system', 'official', 'who-bible', 'whobible'];
    if (reserved.some(word => username.toLowerCase().includes(word))) {
      return { valid: false, error: 'This username contains a reserved word' };
    }

    return { valid: true };
  }

  /**
   * Sanitize text for safe display
   */
  function sanitizeText(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Filter and clean text (for display)
   */
  function cleanText(text) {
    if (!text) return '';
    
    // Remove any HTML tags
    let cleaned = text.replace(/<[^>]*>/g, '');
    
    // Remove excessive whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // Truncate if too long
    if (cleaned.length > 500) {
      cleaned = cleaned.substring(0, 497) + '...';
    }
    
    return cleaned;
  }

  // Export functions
  window.ContentFilter = {
    validateContent,
    checkProfanity,
    validateUsername,
    sanitizeText,
    cleanText,
    containsUrl,
    checkSpam
  };

})();
