/**
 * Guest Prompts System
 * Manages guest user warnings, conversion prompts, and session tracking
 */

// Guest session tracking
const guestSession = {
  gamesPlayed: 0,
  daysSinceFirstPlay: 0,
  firstPlayDate: null,
  hasSeenWelcomeWarning: false,
  hasSeenPerformancePrompt: false,
  lastWarningDate: null,
  lastPromptDate: null,
  conversionPromptsDismissed: 0,
  highestScore: 0,
  totalScore: 0
};

// Constants
const PROMPT_TRIGGERS = {
  GAMES_FOR_WARNING: 10,
  GAMES_FOR_PERFORMANCE: 5,
  DAYS_BETWEEN_REMINDERS: 7,
  HIGH_PERFORMANCE_PERCENTILE: 0.8, // Top 20%
  MAX_DISMISSALS_BEFORE_DELAY: 3
};

/**
 * Initialize guest prompts system
 */
function initGuestPrompts() {
  loadGuestSession();
  
  // Listen for game completions
  document.addEventListener('gameCompleted', handleGameCompleted);
  
  // Listen for social feature attempts
  document.addEventListener('socialFeatureAttempt', handleSocialFeatureAttempt);
  
  // Show welcome warning if first time guest
  if (isGuestUser() && !guestSession.hasSeenWelcomeWarning) {
    setTimeout(() => showWelcomeWarning(), 2000);
  }
}

/**
 * Load guest session from localStorage
 */
function loadGuestSession() {
  try {
    const saved = localStorage.getItem('who-bible-guest-session');
    if (saved) {
      const data = JSON.parse(saved);
      Object.assign(guestSession, data);
      
      // Calculate days since first play
      if (guestSession.firstPlayDate) {
        const daysDiff = Math.floor(
          (Date.now() - new Date(guestSession.firstPlayDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        guestSession.daysSinceFirstPlay = daysDiff;
      }
    } else if (isGuestUser()) {
      // First time guest
      guestSession.firstPlayDate = new Date().toISOString();
      saveGuestSession();
    }
  } catch (e) {
    console.error('Error loading guest session:', e);
  }
}

/**
 * Save guest session to localStorage
 */
function saveGuestSession() {
  try {
    localStorage.setItem('who-bible-guest-session', JSON.stringify(guestSession));
  } catch (e) {
    console.error('Error saving guest session:', e);
  }
}

/**
 * Check if current user is a guest
 */
function isGuestUser() {
  // Check if state.currentPlayer exists and is guest
  if (window.state && window.state.currentPlayer) {
    return window.state.currentPlayer.isGuest === true;
  }
  return false;
}

/**
 * Get player stats for display
 */
function getPlayerStats() {
  if (window.state && window.state.currentPlayer && window.state.currentPlayer.stats) {
    return window.state.currentPlayer.stats;
  }
  return {
    gamesPlayed: guestSession.gamesPlayed,
    highestScore: guestSession.highestScore,
    totalScore: guestSession.totalScore
  };
}

/**
 * Handle game completion
 */
function handleGameCompleted(event) {
  if (!isGuestUser()) return;
  
  const { score, streak, mode } = event.detail || {};
  
  // Update session
  guestSession.gamesPlayed++;
  guestSession.totalScore += score || 0;
  guestSession.highestScore = Math.max(guestSession.highestScore, score || 0);
  saveGuestSession();
  
  // Check triggers
  checkPromptTriggers(score, streak, mode);
}

/**
 * Check if any prompt should be shown
 */
function checkPromptTriggers(score, streak, mode) {
  // High performance prompt (after 5 games with good score)
  if (guestSession.gamesPlayed >= PROMPT_TRIGGERS.GAMES_FOR_PERFORMANCE && 
      !guestSession.hasSeenPerformancePrompt &&
      score >= 600) {
    setTimeout(() => showPerformancePrompt(score), 1000);
    return;
  }
  
  // Engagement prompt (after 10 games)
  if (guestSession.gamesPlayed >= PROMPT_TRIGGERS.GAMES_FOR_WARNING &&
      !hasRecentPrompt(7)) {
    setTimeout(() => showEngagementPrompt(), 1000);
    return;
  }
  
  // Periodic reminder (every 7 days or every 10 games after initial)
  if (shouldShowPeriodicReminder()) {
    setTimeout(() => showPeriodicReminder(), 1000);
    return;
  }
}

/**
 * Check if user has seen a prompt recently
 */
function hasRecentPrompt(days) {
  if (!guestSession.lastPromptDate) return false;
  
  const daysSince = Math.floor(
    (Date.now() - new Date(guestSession.lastPromptDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return daysSince < days;
}

/**
 * Check if periodic reminder should show
 */
function shouldShowPeriodicReminder() {
  // Don't show if dismissed too many times recently
  if (guestSession.conversionPromptsDismissed >= PROMPT_TRIGGERS.MAX_DISMISSALS_BEFORE_DELAY) {
    return false;
  }
  
  // Show every 7 days
  if (guestSession.lastWarningDate) {
    const daysSince = Math.floor(
      (Date.now() - new Date(guestSession.lastWarningDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSince >= PROMPT_TRIGGERS.DAYS_BETWEEN_REMINDERS;
  }
  
  return false;
}

/**
 * Handle social feature attempt (leaderboard, challenges, etc.)
 */
function handleSocialFeatureAttempt(event) {
  if (!isGuestUser()) return;
  
  const { feature } = event.detail || {};
  setTimeout(() => showSocialFeaturePrompt(feature), 500);
}

/**
 * Show welcome warning for first-time guests
 */
function showWelcomeWarning() {
  const getText = window.getText || ((key) => key);
  
  showCompactPrompt({
    icon: '🎮',
    title: getText('guest.welcome.title'),
    message: getText('guest.welcome.message'),
    primaryButton: {
      text: getText('guest.welcome.primaryButton'),
      action: () => closeCompactPrompt()
    },
    secondaryButton: {
      text: getText('guest.welcome.secondaryButton'),
      action: () => {
        closeCompactPrompt();
        triggerAccountCreation();
      }
    }
  });
  
  guestSession.hasSeenWelcomeWarning = true;
  saveGuestSession();
}

/**
 * Show performance congratulations prompt
 */
function showPerformancePrompt(score) {
  const getText = window.getText || ((key) => key);
  
  showFullModal({
    icon: '🌟',
    title: getText('guest.performance.title'),
    subtitle: getText('guest.performance.subtitle', { score }),
    stats: getPlayerStats(),
    benefits: [
      {
        icon: '💾',
        title: getText('guest.benefits.save.title'),
        description: getText('guest.benefits.save.description')
      },
      {
        icon: '🏆',
        title: getText('guest.benefits.leaderboard.title'),
        description: getText('guest.benefits.leaderboard.description')
      },
      {
        icon: '📱',
        title: getText('guest.benefits.sync.title'),
        description: getText('guest.benefits.sync.description')
      }
    ],
    warning: {
      title: getText('guest.warning.title'),
      items: [
        getText('guest.warning.clearBrowser'),
        getText('guest.warning.switchDevice'),
        getText('guest.warning.incognito')
      ]
    },
    primaryButton: {
      text: getText('guest.performance.primaryButton'),
      action: () => {
        closeFullModal();
        triggerAccountCreation();
      }
    },
    secondaryButton: {
      text: getText('guest.performance.secondaryButton'),
      action: () => {
        closeFullModal();
        recordPromptDismissal();
      }
    }
  });
  
  guestSession.hasSeenPerformancePrompt = true;
  guestSession.lastPromptDate = new Date().toISOString();
  saveGuestSession();
}

/**
 * Show engagement prompt (after many games)
 */
function showEngagementPrompt() {
  const getText = window.getText || ((key) => key);
  const stats = getPlayerStats();
  
  showFullModal({
    icon: '📊',
    title: getText('guest.engagement.title'),
    subtitle: getText('guest.engagement.subtitle', { games: stats.gamesPlayed }),
    stats: stats,
    benefits: [
      {
        icon: '🔄',
        title: getText('guest.benefits.sync.title'),
        description: getText('guest.benefits.sync.description')
      },
      {
        icon: '👥',
        title: getText('guest.benefits.social.title'),
        description: getText('guest.benefits.social.description')
      },
      {
        icon: '🎖️',
        title: getText('guest.benefits.badges.title'),
        description: getText('guest.benefits.badges.description')
      }
    ],
    warning: {
      title: getText('guest.warning.title'),
      items: [
        getText('guest.warning.clearBrowser'),
        getText('guest.warning.switchDevice')
      ]
    },
    primaryButton: {
      text: getText('guest.engagement.primaryButton'),
      action: () => {
        closeFullModal();
        triggerAccountCreation();
      }
    },
    secondaryButton: {
      text: getText('guest.engagement.secondaryButton'),
      action: () => {
        closeFullModal();
        recordPromptDismissal();
      }
    }
  });
  
  guestSession.lastPromptDate = new Date().toISOString();
  saveGuestSession();
}

/**
 * Show periodic reminder
 */
function showPeriodicReminder() {
  const getText = window.getText || ((key) => key);
  
  showCompactPrompt({
    icon: '⚠️',
    title: getText('guest.reminder.title'),
    message: getText('guest.reminder.message'),
    primaryButton: {
      text: getText('guest.reminder.primaryButton'),
      action: () => {
        closeCompactPrompt();
        triggerAccountCreation();
      }
    },
    secondaryButton: {
      text: getText('guest.reminder.secondaryButton'),
      action: () => {
        closeCompactPrompt();
        recordPromptDismissal();
      }
    }
  });
  
  guestSession.lastWarningDate = new Date().toISOString();
  saveGuestSession();
}

/**
 * Show social feature prompt
 */
function showSocialFeaturePrompt(feature) {
  const getText = window.getText || ((key) => key);
  
  showCompactPrompt({
    icon: '🔒',
    title: getText('guest.social.title'),
    message: getText('guest.social.message', { feature: feature || 'this feature' }),
    primaryButton: {
      text: getText('guest.social.primaryButton'),
      action: () => {
        closeCompactPrompt();
        triggerAccountCreation();
      }
    },
    secondaryButton: {
      text: getText('guest.social.secondaryButton'),
      action: () => closeCompactPrompt()
    }
  });
}

/**
 * Record that user dismissed a prompt
 */
function recordPromptDismissal() {
  guestSession.conversionPromptsDismissed++;
  saveGuestSession();
}

/**
 * Show compact prompt (bottom-right notification)
 */
function showCompactPrompt(config) {
  // Remove existing prompt
  const existing = document.querySelector('.guest-compact-prompt');
  if (existing) existing.remove();
  
  const prompt = document.createElement('div');
  prompt.className = 'guest-compact-prompt';
  prompt.innerHTML = `
    <div class="guest-compact-header">
      <span class="guest-compact-icon">${config.icon}</span>
      <h3 class="guest-compact-title">${config.title}</h3>
      <button class="guest-compact-close" aria-label="Close">×</button>
    </div>
    <div class="guest-compact-body">
      <p>${config.message}</p>
    </div>
    <div class="guest-compact-footer">
      ${config.secondaryButton ? `<button class="btn-text btn-dismiss">${config.secondaryButton.text}</button>` : ''}
      <button class="btn-primary btn-action">${config.primaryButton.text}</button>
    </div>
  `;
  
  document.body.appendChild(prompt);
  
  // Event listeners
  const closeBtn = prompt.querySelector('.guest-compact-close');
  const actionBtn = prompt.querySelector('.btn-action');
  const dismissBtn = prompt.querySelector('.btn-dismiss');
  
  closeBtn.addEventListener('click', () => {
    prompt.remove();
    recordPromptDismissal();
  });
  
  actionBtn.addEventListener('click', () => {
    prompt.remove();
    config.primaryButton.action();
  });
  
  if (dismissBtn && config.secondaryButton) {
    dismissBtn.addEventListener('click', () => {
      prompt.remove();
      config.secondaryButton.action();
    });
  }
  
  // Auto-remove after 15 seconds
  setTimeout(() => {
    if (prompt.parentNode) {
      prompt.remove();
      recordPromptDismissal();
    }
  }, 15000);
}

/**
 * Show full modal
 */
function showFullModal(config) {
  // Remove existing modal
  const existing = document.querySelector('.guest-modal-overlay');
  if (existing) existing.remove();
  
  const modal = document.createElement('div');
  modal.className = 'guest-modal-overlay';
  modal.innerHTML = `
    <div class="guest-modal">
      <div class="guest-modal-header">
        <span class="guest-modal-icon">${config.icon}</span>
        <h2>${config.title}</h2>
        <p>${config.subtitle}</p>
      </div>
      <div class="guest-modal-body">
        ${config.stats ? renderStatsSection(config.stats) : ''}
        ${config.benefits ? renderBenefitsSection(config.benefits) : ''}
        ${config.warning ? renderWarningSection(config.warning) : ''}
      </div>
      <div class="guest-modal-footer">
        <button class="btn-primary btn-action">${config.primaryButton.text}</button>
        <button class="btn-secondary btn-dismiss">${config.secondaryButton.text}</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Trigger animation
  requestAnimationFrame(() => {
    modal.classList.add('active');
  });
  
  // Event listeners
  const actionBtn = modal.querySelector('.btn-action');
  const dismissBtn = modal.querySelector('.btn-dismiss');
  
  actionBtn.addEventListener('click', () => {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
    config.primaryButton.action();
  });
  
  dismissBtn.addEventListener('click', () => {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
    config.secondaryButton.action();
  });
  
  // Close on overlay click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
      recordPromptDismissal();
    }
  });
}

/**
 * Render stats section
 */
function renderStatsSection(stats) {
  return `
    <div class="guest-stats-summary">
      <h3>📈 Your Progress</h3>
      <div class="guest-stats-grid">
        <div class="guest-stat-item">
          <span class="guest-stat-value">${stats.gamesPlayed || 0}</span>
          <span class="guest-stat-label">Games</span>
        </div>
        <div class="guest-stat-item">
          <span class="guest-stat-value">${stats.highestScore || 0}</span>
          <span class="guest-stat-label">Best Score</span>
        </div>
        <div class="guest-stat-item">
          <span class="guest-stat-value">${Math.round((stats.totalScore || 0) / (stats.gamesPlayed || 1))}</span>
          <span class="guest-stat-label">Avg Score</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render benefits section
 */
function renderBenefitsSection(benefits) {
  const getText = window.getText || ((key) => key);
  const benefitItems = benefits.map(b => `
    <li class="benefit-item">
      <span class="benefit-icon">${b.icon}</span>
      <div class="benefit-content">
        <h4>${b.title}</h4>
        <p>${b.description}</p>
      </div>
    </li>
  `).join('');
  
  return `
    <div class="guest-benefits">
      <h3>${getText('guest.benefits.title')}</h3>
      <ul class="benefit-list">
        ${benefitItems}
      </ul>
    </div>
  `;
}

/**
 * Render warning section
 */
function renderWarningSection(warning) {
  const warningItems = warning.items.map(item => `<li>${item}</li>`).join('');
  
  return `
    <div class="guest-warning-box">
      <span class="guest-warning-icon">⚠️</span>
      <div class="guest-warning-content">
        <h4>${warning.title}</h4>
        <ul>
          ${warningItems}
        </ul>
      </div>
    </div>
  `;
}

/**
 * Close compact prompt
 */
function closeCompactPrompt() {
  const prompt = document.querySelector('.guest-compact-prompt');
  if (prompt) prompt.remove();
}

/**
 * Close full modal
 */
function closeFullModal() {
  const modal = document.querySelector('.guest-modal-overlay');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
  }
}

/**
 * Trigger account creation flow
 */
function triggerAccountCreation() {
  // Open auth modal (auth-ui.js)
  if (window.openAuthModal) {
    window.openAuthModal('signup');
  } else {
    // Fallback: Dispatch event that app.js can listen to
    document.dispatchEvent(new CustomEvent('showAccountCreation', {
      detail: { source: 'guest-prompt', preserveStats: true }
    }));
    
    // Or directly call player change if available
    if (window.showPlayerChangeModal) {
      window.showPlayerChangeModal();
    }
  }
}

/**
 * Add guest badge to player name display
 */
function addGuestBadge(element, playerName) {
  if (!isGuestUser()) return;
  
  const getText = window.getText || ((key) => key);
  const badge = document.createElement('span');
  badge.className = 'player-badge guest';
  badge.innerHTML = '👤 ' + getText('guest.badge');
  badge.title = getText('guest.badge.tooltip');
  
  element.appendChild(badge);
}

/**
 * Add device-only indicator
 */
function addDeviceOnlyIndicator(element) {
  if (!isGuestUser()) return;
  
  const getText = window.getText || ((key) => key);
  const badge = document.createElement('span');
  badge.className = 'device-only-badge';
  badge.innerHTML = '📱 ' + getText('guest.deviceOnly');
  badge.title = getText('guest.deviceOnly.tooltip');
  
  element.appendChild(badge);
}

/**
 * Get guest session info (for debugging)
 */
function getGuestSessionInfo() {
  return { ...guestSession };
}

/**
 * Reset guest session (for testing)
 */
function resetGuestSession() {
  Object.keys(guestSession).forEach(key => {
    if (typeof guestSession[key] === 'number') guestSession[key] = 0;
    if (typeof guestSession[key] === 'boolean') guestSession[key] = false;
    if (key.includes('Date')) guestSession[key] = null;
  });
  saveGuestSession();
}

// Export for use in app.js
if (typeof window !== 'undefined') {
  window.GuestPrompts = {
    init: initGuestPrompts,
    addBadge: addGuestBadge,
    addDeviceIndicator: addDeviceOnlyIndicator,
    getSessionInfo: getGuestSessionInfo,
    resetSession: resetGuestSession
  };
}
