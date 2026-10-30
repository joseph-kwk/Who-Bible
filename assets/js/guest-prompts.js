/**
 * Guest Profile Name Reminder System
 * Gently reminds unnamed ("Guest") players that they can set a display name & avatar,
 * and clarifies that progress is saved locally on this device (no account required).
 */

const guestSession = {
  gamesPlayed: 0,
  firstPlayDate: null,
  hasSeenNamePrompt: false,
  hasSeenFollowUpReminder: false
};

const PROFILE_ICON_SVG = `
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
`;

const GUEST_FALLBACKS = {
  'guest.badge': 'Guest',
  'guest.badgeTooltip': 'Saved on this device',
  'guest.deviceOnly': 'Saved on device',
  'guest.deviceOnlyTooltip': 'Your name, XP, and streaks save automatically in this browser.',
  'guest.welcome.title': 'Set Your Player Name',
  'guest.welcome.message': 'Pick a name & avatar for multiplayer rooms and ranks. Progress saves automatically on this device.',
  'guest.welcome.primaryButton': 'Set Name',
  'guest.welcome.secondaryButton': 'Later',
  'guest.reminder.title': 'Still Playing as Guest',
  'guest.reminder.message': 'Add a display name for multiplayer lobbies and scoreboards. Stats stay saved on this device.',
  'guest.reminder.primaryButton': 'Set Name',
  'guest.reminder.secondaryButton': 'Later'
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

/**
 * True only when the player has not chosen a custom display name yet ("Guest" or empty).
 */
function isUnnamedGuest() {
  if (!window.state || !window.state.currentPlayer) return false;
  const rawName = (window.state.currentPlayer.name || '').trim().toLowerCase();
  let savedCustomName = '';
  try {
    savedCustomName = (localStorage.getItem('who-bible-profile-name') || '').trim().toLowerCase();
  } catch (_) {}
  if (savedCustomName && savedCustomName !== 'guest') return false;
  return !rawName || rawName === 'guest';
}

function isBlockingOverlayActive() {
  const welcomeModal = document.getElementById('welcome-modal');
  if (welcomeModal && welcomeModal.style.display === 'flex') return true;
  if (document.body && document.body.classList.contains('modal-open')) return true;
  if (window.state && window.state.mode && window.state.mode !== 'idle') return true;
  return false;
}

function loadGuestSession() {
  try {
    const saved = localStorage.getItem('who-bible-guest-session');
    if (saved) {
      const data = JSON.parse(saved);
      Object.assign(guestSession, data);
      // Migrate previous flag smoothly if only old flag existed and user already customized name
      if (!isUnnamedGuest()) {
        guestSession.hasSeenNamePrompt = true;
      }
    } else {
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

function openNameCustomizer() {
  if (typeof window.openProfileCustomizer === 'function') {
    window.openProfileCustomizer();
    return;
  }
  const btn = document.getElementById('btn-change-player') || document.getElementById('player-profile-card');
  if (btn) btn.click();
}

function initGuestPrompts() {
  loadGuestSession();

  document.addEventListener('gameCompleted', handleGameCompleted);

  if (isUnnamedGuest() && !guestSession.hasSeenNamePrompt) {
    const welcomeModal = document.getElementById('welcome-modal');
    if (welcomeModal && welcomeModal.style.display === 'flex') {
      document.addEventListener('welcomeModalClosed', () => {
        setTimeout(() => {
          if (isUnnamedGuest() && !guestSession.hasSeenNamePrompt && !isBlockingOverlayActive()) {
            showNameSetupPrompt();
          }
        }, 1200);
      }, { once: true });
    } else {
      setTimeout(() => {
        if (isUnnamedGuest() && !guestSession.hasSeenNamePrompt && !isBlockingOverlayActive()) {
          showNameSetupPrompt();
        }
      }, 1800);
    }
  }
}

function handleGameCompleted() {
  guestSession.gamesPlayed = (guestSession.gamesPlayed || 0) + 1;
  saveGuestSession();

  // Gentle one-time follow-up after 3 games ONLY if player still hasn't set a custom name
  if (isUnnamedGuest() && guestSession.gamesPlayed >= 3 && !guestSession.hasSeenFollowUpReminder) {
    guestSession.hasSeenFollowUpReminder = true;
    saveGuestSession();
    setTimeout(() => {
      if (isUnnamedGuest() && !isBlockingOverlayActive()) {
        showFollowUpNameReminder();
      }
    }, 1500);
  }
}

function showNameSetupPrompt() {
  showCompactPrompt({
    badge: tGuest('guest.deviceOnly'),
    title: tGuest('guest.welcome.title'),
    message: tGuest('guest.welcome.message'),
    primaryButton: {
      text: tGuest('guest.welcome.primaryButton'),
      action: () => openNameCustomizer()
    },
    secondaryButton: {
      text: tGuest('guest.welcome.secondaryButton'),
      action: () => closeCompactPrompt()
    }
  });

  guestSession.hasSeenNamePrompt = true;
  saveGuestSession();
}

function showFollowUpNameReminder() {
  showCompactPrompt({
    badge: tGuest('guest.deviceOnly'),
    title: tGuest('guest.reminder.title'),
    message: tGuest('guest.reminder.message'),
    primaryButton: {
      text: tGuest('guest.reminder.primaryButton'),
      action: () => openNameCustomizer()
    },
    secondaryButton: {
      text: tGuest('guest.reminder.secondaryButton'),
      action: () => closeCompactPrompt()
    }
  });
}

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
        ${PROFILE_ICON_SVG}
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
    autoTimer = setTimeout(() => dismissSmoothly(), remainingMs);
  };

  const pauseAutoTimer = () => {
    if (!autoTimer) return;
    clearTimeout(autoTimer);
    autoTimer = null;
    remainingMs = Math.max(3000, remainingMs - (Date.now() - startedAt));
  };

  const onEsc = (e) => {
    if (e.key === 'Escape' && prompt.parentNode) {
      dismissSmoothly();
    }
  };
  document.addEventListener('keydown', onEsc);

  prompt.addEventListener('mouseenter', pauseAutoTimer);
  prompt.addEventListener('mouseleave', startAutoTimer);
  prompt.addEventListener('focusin', pauseAutoTimer);
  prompt.addEventListener('focusout', startAutoTimer);

  prompt.querySelector('.guest-compact-close')?.addEventListener('click', () => {
    dismissSmoothly();
  });
  prompt.querySelector('.btn-action')?.addEventListener('click', () => {
    dismissSmoothly(() => config.primaryButton.action());
  });
  prompt.querySelector('.btn-dismiss')?.addEventListener('click', () => {
    dismissSmoothly(() => config.secondaryButton?.action());
  });

  startAutoTimer();
}

function closeCompactPrompt() {
  const prompt = document.querySelector('.guest-compact-prompt');
  if (prompt) {
    prompt.classList.add('closing');
    setTimeout(() => prompt.remove(), 220);
  }
}

function addGuestBadge(element) {
  if (!isUnnamedGuest() || !element) return;
  const badge = document.createElement('span');
  badge.className = 'player-badge guest';
  badge.textContent = tGuest('guest.badge');
  badge.title = tGuest('guest.badgeTooltip');
  element.appendChild(badge);
}

function addDeviceOnlyIndicator(element) {
  if (!element) return;
  const badge = document.createElement('span');
  badge.className = 'device-only-badge';
  badge.textContent = tGuest('guest.deviceOnly');
  badge.title = tGuest('guest.deviceOnlyTooltip');
  element.appendChild(badge);
}

function getGuestSessionInfo() {
  return { ...guestSession };
}

function resetGuestSession() {
  guestSession.gamesPlayed = 0;
  guestSession.firstPlayDate = null;
  guestSession.hasSeenNamePrompt = false;
  guestSession.hasSeenFollowUpReminder = false;
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
