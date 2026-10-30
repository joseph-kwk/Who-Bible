/**
 * Guest Prompts System
 * Manages guest user welcome notice, milestone conversion prompts, and session tracking
 */

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

const PROMPT_TRIGGERS = {
  GAMES_FOR_WARNING: 10,
  GAMES_FOR_PERFORMANCE: 5,
  DAYS_BETWEEN_REMINDERS: 7,
  HIGH_PERFORMANCE_PERCENTILE: 0.8,
  MAX_DISMISSALS_BEFORE_DELAY: 3
};

// Safe translation lookup with built-in clean English fallbacks so raw keys never leak
const GUEST_FALLBACKS = {
  'guest.badge': 'Guest',
  'guest.badgeTooltip': 'Playing as guest — stats saved on this device',
  'guest.deviceOnly': 'Device Only',
  'guest.deviceOnlyTooltip': 'Your data is stored on this device. Create a free account to sync across devices.',
  'guest.welcome.title': 'Playing as Guest',
  'guest.welcome.message': 'All quiz modes are unlocked! Your progress saves on this device, or create a free account anytime to sync across devices.',
  'guest.welcome.primaryButton': 'Got it!',
  'guest.welcome.secondaryButton': 'Create Account',
  'guest.performance.title': 'Impressive Score!',
  'guest.performance.subtitle': 'You scored {score} points!',
  'guest.performance.primaryButton': 'Save My Progress',
  'guest.performance.secondaryButton': 'Maybe Later',
  'guest.engagement.title': "You're on a Roll!",
  'guest.engagement.subtitle': "You've played {games} games — great dedication!",
  'guest.engagement.primaryButton': 'Secure My Stats',
  'guest.engagement.secondaryButton': 'Continue as Guest',
  'guest.reminder.title': 'Guest Progress Reminder',
  'guest.reminder.message': 'Your progress is saved on this device only. Create a free account anytime to back up and sync your stats!',
  'guest.reminder.primaryButton': 'Secure My Stats',
  'guest.reminder.secondaryButton': 'Continue as Guest',
  'guest.social.title': 'Account Required',
  'guest.social.message': 'Create a free account to unlock {feature} and sync with friends!',
  'guest.social.primaryButton': 'Create Account',
  'guest.social.secondaryButton': 'Not Now',
  'guest.benefits.title': 'Create a Free Account to Unlock:',
  'guest.benefits.save.title': 'Permanent Progress',
  'guest.benefits.save.description': 'Never lose your stats, scores, or ranks',
  'guest.benefits.sync.title': 'Cross-Device Sync',
  'guest.benefits.sync.description': 'Play on phone, tablet, or computer seamlessly',
  'guest.benefits.leaderboard.title': 'Global Leaderboards',
  'guest.benefits.leaderboard.description': 'Compete worldwide and climb the ranks',
  'guest.benefits.social.title': 'Challenge Friends',
  'guest.benefits.social.description': 'Track head-to-head challenges and history',
  'guest.benefits.badges.title': 'Earn Badges',
  'guest.benefits.badges.description': 'Unlock achievements as your Scripture mastery grows',
  'guest.warning.title': 'Local-Only Storage Note:',
  'guest.warning.clearBrowser': 'Clearing browser data resets local guest stats',
  'guest.warning.switchDevice': 'Stats stay on this browser until synced',
  'guest.warning.incognito': 'Private/incognito windows do not persist stats'
};

function tGuest(key, params = {}) {
  let resolved = (typeof window.getText === 'function') ? window.getText(key, params) : key;
  if (!resolved || resolved === key || resolved.startsWith('guest.')) {
    resolved = GUEST_FALLBACKS[key] || key;
    Object.keys(params).forEach(k => {
      resolved = resolved.split(`{${k}}`).join(String(params[k]));
    });
  }
  return resolved;
}

function escapeGuestHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));
}

function isBlockingOverlayActive() {
  const welcomeModal = document.getElementById('welcome-modal');
  if (welcomeModal && welcomeModal.style.display === 'flex') return true;
  if (document.body && document.body.classList.contains('modal-open')) return true;
  if (window.state && window.state.mode && window.state.mode !== 'idle') return true;
  return false;
}

/**
 * Initialize guest prompts system
 */
function initGuestPrompts() {
  loadGuestSession();

  document.addEventListener('gameCompleted', handleGameCompleted);
  document.addEventListener('socialFeatureAttempt', handleSocialFeatureAttempt);

  // Schedule welcome notice smoothly — never colliding with #welcome-modal or active gameplay
  if (isGuestUser() && !guestSession.hasSeenWelcomeWarning) {
    const welcomeModal = document.getElementById('welcome-modal');
    if (welcomeModal && welcomeModal.style.display === 'flex') {
      document.addEventListener('welcomeModalClosed', () => {
        setTimeout(() => {
          if (isGuestUser() && !guestSession.hasSeenWelcomeWarning && !isBlockingOverlayActive()) {
            showWelcomeWarning();
          }
        }, 1200);
      }, { once: true });
    } else {
      setTimeout(() => {
        if (isGuestUser() && !guestSession.hasSeenWelcomeWarning && !isBlockingOverlayActive()) {
          showWelcomeWarning();
        }
      }, 1800);
    }
  }
}

function loadGuestSession() {
  try {
    const saved = localStorage.getItem('who-bible-guest-session');
    if (saved) {
      const data = JSON.parse(saved);
      Object.assign(guestSession, data);
      if (guestSession.firstPlayDate) {
        const daysDiff = Math.floor(
          (Date.now() - new Date(guestSession.firstPlayDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        guestSession.daysSinceFirstPlay = daysDiff;
      }
    } else if (isGuestUser()) {
      guestSession.firstPlayDate = new Date().toISOString();
      saveGuestSession();
    }
  } catch (e) {
    console.error('Error loading guest session:', e);
  }
}

function saveGuestSession() {
  try {
    localStorage.setItem('who-bible-guest-session', JSON.stringify(guestSession));
  } catch (e) {
    console.error('Error saving guest session:', e);
  }
}

function isGuestUser() {
  if (window.state && window.state.currentPlayer) {
    return window.state.currentPlayer.isGuest === true;
  }
  return false;
}

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

function handleGameCompleted(event) {
  if (!isGuestUser()) return;
  const { score, streak, mode } = event.detail || {};

  guestSession.gamesPlayed++;
  guestSession.totalScore += score || 0;
  guestSession.highestScore = Math.max(guestSession.highestScore, score || 0);
  saveGuestSession();

  checkPromptTriggers(score, streak, mode);
}

function checkPromptTriggers(score, streak, mode) {
  if (guestSession.gamesPlayed >= PROMPT_TRIGGERS.GAMES_FOR_PERFORMANCE &&
      !guestSession.hasSeenPerformancePrompt &&
      score >= 600) {
    setTimeout(() => showPerformancePrompt(score), 1200);
    return;
  }

  if (guestSession.gamesPlayed >= PROMPT_TRIGGERS.GAMES_FOR_WARNING &&
      !hasRecentPrompt(7)) {
    setTimeout(() => showEngagementPrompt(), 1200);
    return;
  }

  if (shouldShowPeriodicReminder()) {
    setTimeout(() => showPeriodicReminder(), 1200);
  }
}

function hasRecentPrompt(days) {
  if (!guestSession.lastPromptDate) return false;
  const daysSince = Math.floor(
    (Date.now() - new Date(guestSession.lastPromptDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysSince < days;
}

function shouldShowPeriodicReminder() {
  if (guestSession.conversionPromptsDismissed >= PROMPT_TRIGGERS.MAX_DISMISSALS_BEFORE_DELAY) {
    return false;
  }
  if (guestSession.lastWarningDate) {
    const daysSince = Math.floor(
      (Date.now() - new Date(guestSession.lastWarningDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSince >= PROMPT_TRIGGERS.DAYS_BETWEEN_REMINDERS;
  }
  return false;
}

function handleSocialFeatureAttempt(event) {
  if (!isGuestUser()) return;
  const { feature } = event.detail || {};
  setTimeout(() => showSocialFeaturePrompt(feature), 400);
}

function showWelcomeWarning() {
  showCompactPrompt({
    icon: '🕊️',
    badge: tGuest('guest.deviceOnly'),
    title: tGuest('guest.welcome.title'),
    message: tGuest('guest.welcome.message'),
    primaryButton: {
      text: tGuest('guest.welcome.primaryButton'),
      action: () => closeCompactPrompt()
    },
    secondaryButton: {
      text: tGuest('guest.welcome.secondaryButton'),
      action: () => {
        closeCompactPrompt();
        triggerAccountCreation();
      }
    }
  });

  guestSession.hasSeenWelcomeWarning = true;
  saveGuestSession();
}

function showPerformancePrompt(score) {
  showFullModal({
    icon: '🌟',
    title: tGuest('guest.performance.title'),
    subtitle: tGuest('guest.performance.subtitle', { score }),
    stats: getPlayerStats(),
    benefits: [
      {
        icon: '💾',
        title: tGuest('guest.benefits.save.title'),
        description: tGuest('guest.benefits.save.description')
      },
      {
        icon: '🏆',
        title: tGuest('guest.benefits.leaderboard.title'),
        description: tGuest('guest.benefits.leaderboard.description')
      },
      {
        icon: '📱',
        title: tGuest('guest.benefits.sync.title'),
        description: tGuest('guest.benefits.sync.description')
      }
    ],
    warning: {
      title: tGuest('guest.warning.title'),
      items: [
        tGuest('guest.warning.clearBrowser'),
        tGuest('guest.warning.switchDevice'),
        tGuest('guest.warning.incognito')
      ]
    },
    primaryButton: {
      text: tGuest('guest.performance.primaryButton'),
      action: () => {
        closeFullModal();
        triggerAccountCreation();
      }
    },
    secondaryButton: {
      text: tGuest('guest.performance.secondaryButton'),
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

function showEngagementPrompt() {
  const stats = getPlayerStats();

  showFullModal({
    icon: '📊',
    title: tGuest('guest.engagement.title'),
    subtitle: tGuest('guest.engagement.subtitle', { games: stats.gamesPlayed }),
    stats,
    benefits: [
      {
        icon: '🔄',
        title: tGuest('guest.benefits.sync.title'),
        description: tGuest('guest.benefits.sync.description')
      },
      {
        icon: '👥',
        title: tGuest('guest.benefits.social.title'),
        description: tGuest('guest.benefits.social.description')
      },
      {
        icon: '🎖️',
        title: tGuest('guest.benefits.badges.title'),
        description: tGuest('guest.benefits.badges.description')
      }
    ],
    warning: {
      title: tGuest('guest.warning.title'),
      items: [
        tGuest('guest.warning.clearBrowser'),
        tGuest('guest.warning.switchDevice')
      ]
    },
    primaryButton: {
      text: tGuest('guest.engagement.primaryButton'),
      action: () => {
        closeFullModal();
        triggerAccountCreation();
      }
    },
    secondaryButton: {
      text: tGuest('guest.engagement.secondaryButton'),
      action: () => {
        closeFullModal();
        recordPromptDismissal();
      }
    }
  });

  guestSession.lastPromptDate = new Date().toISOString();
  saveGuestSession();
}

function showPeriodicReminder() {
  showCompactPrompt({
    icon: '🛡️',
    badge: tGuest('guest.deviceOnly'),
    title: tGuest('guest.reminder.title'),
    message: tGuest('guest.reminder.message'),
    primaryButton: {
      text: tGuest('guest.reminder.primaryButton'),
      action: () => {
        closeCompactPrompt();
        triggerAccountCreation();
      }
    },
    secondaryButton: {
      text: tGuest('guest.reminder.secondaryButton'),
      action: () => {
        closeCompactPrompt();
        recordPromptDismissal();
      }
    }
  });

  guestSession.lastWarningDate = new Date().toISOString();
  saveGuestSession();
}

function showSocialFeaturePrompt(feature) {
  showCompactPrompt({
    icon: '🔒',
    title: tGuest('guest.social.title'),
    message: tGuest('guest.social.message', { feature: feature || 'this feature' }),
    primaryButton: {
      text: tGuest('guest.social.primaryButton'),
      action: () => {
        closeCompactPrompt();
        triggerAccountCreation();
      }
    },
    secondaryButton: {
      text: tGuest('guest.social.secondaryButton'),
      action: () => closeCompactPrompt()
    }
  });
}

function recordPromptDismissal() {
  guestSession.conversionPromptsDismissed++;
  saveGuestSession();
}

/**
 * Show refined compact card (bottom-right floating glass card)
 */
function showCompactPrompt(config) {
  const existing = document.querySelector('.guest-compact-prompt');
  if (existing) existing.remove();

  const prompt = document.createElement('aside');
  prompt.className = 'guest-compact-prompt';
  prompt.setAttribute('role', 'status');
  prompt.setAttribute('aria-live', 'polite');

  const badgeHtml = config.badge
    ? `<span class="guest-compact-pill">${escapeGuestHtml(config.badge)}</span>`
    : '';

  prompt.innerHTML = `
    <div class="guest-compact-header">
      <div class="guest-compact-icon-wrap" aria-hidden="true">
        <span class="guest-compact-icon">${config.icon || '🕊️'}</span>
      </div>
      <div class="guest-compact-heading-wrap">
        <div class="guest-compact-title-row">
          <h3 class="guest-compact-title">${escapeGuestHtml(config.title)}</h3>
          ${badgeHtml}
        </div>
      </div>
      <button type="button" class="guest-compact-close" aria-label="Dismiss notification">✕</button>
    </div>
    <div class="guest-compact-body">
      <p>${escapeGuestHtml(config.message)}</p>
    </div>
    <div class="guest-compact-footer">
      ${config.secondaryButton ? `<button type="button" class="guest-btn-secondary btn-dismiss">${escapeGuestHtml(config.secondaryButton.text)}</button>` : ''}
      <button type="button" class="guest-btn-primary btn-action">${escapeGuestHtml(config.primaryButton.text)}</button>
    </div>
  `;

  document.body.appendChild(prompt);

  let autoTimer = null;
  let remainingMs = 16000;
  let startedAt = Date.now();

  const dismissSmoothly = (cb) => {
    if (autoTimer) {
      clearTimeout(autoTimer);
      autoTimer = null;
    }
    document.removeEventListener('keydown', onEsc);
    prompt.classList.add('closing');
    setTimeout(() => {
      if (prompt.parentNode) prompt.remove();
      if (typeof cb === 'function') cb();
    }, 220);
  };

  const startAutoTimer = () => {
    startedAt = Date.now();
    autoTimer = setTimeout(() => {
      dismissSmoothly(() => recordPromptDismissal());
    }, remainingMs);
  };

  const pauseAutoTimer = () => {
    if (!autoTimer) return;
    clearTimeout(autoTimer);
    autoTimer = null;
    remainingMs = Math.max(3000, remainingMs - (Date.now() - startedAt));
  };

  const onEsc = (e) => {
    if (e.key === 'Escape' && prompt.parentNode) {
      dismissSmoothly(() => recordPromptDismissal());
    }
  };
  document.addEventListener('keydown', onEsc);

  prompt.addEventListener('mouseenter', pauseAutoTimer);
  prompt.addEventListener('mouseleave', startAutoTimer);
  prompt.addEventListener('focusin', pauseAutoTimer);
  prompt.addEventListener('focusout', startAutoTimer);

  const closeBtn = prompt.querySelector('.guest-compact-close');
  const actionBtn = prompt.querySelector('.btn-action');
  const dismissBtn = prompt.querySelector('.btn-dismiss');

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      dismissSmoothly(() => recordPromptDismissal());
    });
  }
  if (actionBtn) {
    actionBtn.addEventListener('click', () => {
      dismissSmoothly(() => config.primaryButton.action());
    });
  }
  if (dismissBtn && config.secondaryButton) {
    dismissBtn.addEventListener('click', () => {
      dismissSmoothly(() => config.secondaryButton.action());
    });
  }

  startAutoTimer();
}

/**
 * Show full milestone modal
 */
function showFullModal(config) {
  const existing = document.querySelector('.guest-modal-overlay');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.className = 'modal-overlay guest-modal-overlay';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.innerHTML = `
    <div class="guest-modal">
      <div class="guest-modal-header">
        <button type="button" class="guest-modal-close" aria-label="Close modal">✕</button>
        <span class="guest-modal-icon" aria-hidden="true">${config.icon}</span>
        <h2>${escapeGuestHtml(config.title)}</h2>
        <p>${escapeGuestHtml(config.subtitle)}</p>
      </div>
      <div class="guest-modal-body">
        ${config.stats ? renderStatsSection(config.stats) : ''}
        ${config.benefits ? renderBenefitsSection(config.benefits) : ''}
        ${config.warning ? renderWarningSection(config.warning) : ''}
      </div>
      <div class="guest-modal-footer">
        <button type="button" class="btn-primary btn-action">${escapeGuestHtml(config.primaryButton.text)}</button>
        <button type="button" class="btn-secondary btn-dismiss">${escapeGuestHtml(config.secondaryButton.text)}</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  if (typeof window.syncModalScrollLock === 'function') window.syncModalScrollLock();

  requestAnimationFrame(() => {
    modal.classList.add('active');
  });

  const closeAndUnlock = (cb) => {
    document.removeEventListener('keydown', onEsc);
    modal.classList.remove('active');
    setTimeout(() => {
      modal.remove();
      if (typeof window.syncModalScrollLock === 'function') window.syncModalScrollLock();
      if (typeof cb === 'function') cb();
    }, 240);
  };

  const onEsc = (e) => {
    if (e.key === 'Escape') {
      closeAndUnlock(() => recordPromptDismissal());
    }
  };
  document.addEventListener('keydown', onEsc);

  modal.querySelector('.guest-modal-close')?.addEventListener('click', () => {
    closeAndUnlock(() => recordPromptDismissal());
  });
  modal.querySelector('.btn-action')?.addEventListener('click', () => {
    closeAndUnlock(() => config.primaryButton.action());
  });
  modal.querySelector('.btn-dismiss')?.addEventListener('click', () => {
    closeAndUnlock(() => config.secondaryButton.action());
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeAndUnlock(() => recordPromptDismissal());
    }
  });
}

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

function renderBenefitsSection(benefits) {
  const benefitItems = benefits.map(b => `
    <li class="benefit-item">
      <span class="benefit-icon">${b.icon}</span>
      <div class="benefit-content">
        <h4>${escapeGuestHtml(b.title)}</h4>
        <p>${escapeGuestHtml(b.description)}</p>
      </div>
    </li>
  `).join('');

  return `
    <div class="guest-benefits">
      <h3>${escapeGuestHtml(tGuest('guest.benefits.title'))}</h3>
      <ul class="benefit-list">
        ${benefitItems}
      </ul>
    </div>
  `;
}

function renderWarningSection(warning) {
  const warningItems = warning.items.map(item => `<li>${escapeGuestHtml(item)}</li>`).join('');

  return `
    <div class="guest-warning-box">
      <span class="guest-warning-icon">⚠️</span>
      <div class="guest-warning-content">
        <h4>${escapeGuestHtml(warning.title)}</h4>
        <ul>
          ${warningItems}
        </ul>
      </div>
    </div>
  `;
}

function closeCompactPrompt() {
  const prompt = document.querySelector('.guest-compact-prompt');
  if (prompt) {
    prompt.classList.add('closing');
    setTimeout(() => prompt.remove(), 220);
  }
}

function closeFullModal() {
  const modal = document.querySelector('.guest-modal-overlay');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => {
      modal.remove();
      if (typeof window.syncModalScrollLock === 'function') window.syncModalScrollLock();
    }, 240);
  }
}

function triggerAccountCreation() {
  if (window.openAuthModal) {
    window.openAuthModal('signup');
  } else {
    document.dispatchEvent(new CustomEvent('showAccountCreation', {
      detail: { source: 'guest-prompt', preserveStats: true }
    }));
    const profileCard = document.getElementById('player-profile-card');
    if (profileCard) profileCard.click();
  }
}

function addGuestBadge(element) {
  if (!isGuestUser() || !element) return;
  const badge = document.createElement('span');
  badge.className = 'player-badge guest';
  badge.textContent = `👤 ${tGuest('guest.badge')}`;
  badge.title = tGuest('guest.badgeTooltip');
  element.appendChild(badge);
}

function addDeviceOnlyIndicator(element) {
  if (!isGuestUser() || !element) return;
  const badge = document.createElement('span');
  badge.className = 'device-only-badge';
  badge.textContent = `📱 ${tGuest('guest.deviceOnly')}`;
  badge.title = tGuest('guest.deviceOnlyTooltip');
  element.appendChild(badge);
}

function getGuestSessionInfo() {
  return { ...guestSession };
}

function resetGuestSession() {
  Object.keys(guestSession).forEach(key => {
    if (typeof guestSession[key] === 'number') guestSession[key] = 0;
    if (typeof guestSession[key] === 'boolean') guestSession[key] = false;
    if (key.includes('Date')) guestSession[key] = null;
  });
  saveGuestSession();
}

if (typeof window !== 'undefined') {
  window.GuestPrompts = {
    init: initGuestPrompts,
    closeCompact: closeCompactPrompt,
    addBadge: addGuestBadge,
    addDeviceIndicator: addDeviceOnlyIndicator,
    getSessionInfo: getGuestSessionInfo,
    resetSession: resetGuestSession
  };
}
