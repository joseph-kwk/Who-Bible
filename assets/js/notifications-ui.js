/**
 * Notifications UI
 * User interface for notification center and in-app notifications
 */

import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
    onNotificationsUpdate,
    getNotificationPreferences,
    updateNotificationPreferences,
    getNotificationIcon,
    formatNotificationTime,
    playNotificationSound,
    requestNotificationPermission
} from './notifications.js';
import { getCurrentUser } from './auth.js';
import { getText } from './translations.js';

let notificationsModal = null;
let notificationBadge = null;
let unsubscribeUpdates = null;

/**
 * Initialize notifications UI
 */
export function initNotificationsUI() {
    createNotificationBell();
    createNotificationsModal();
    subscribeToUpdates();
    updateBadge();
}

/**
 * Create notification bell button
 */
function createNotificationBell() {
    const header = document.querySelector('header .controls');
    if (!header) return;

    // Check if bell already exists
    if (document.getElementById('notifications-bell')) return;

    const bellContainer = document.createElement('div');
    bellContainer.className = 'notification-bell-container';
    bellContainer.innerHTML = `
        <button id="notifications-bell" class="icon-btn" title="${getText('notifications.title', {}, 'Notifications')}">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span id="notification-badge" class="notification-badge" style="display: none;">0</span>
        </button>
    `;

    // Insert before theme button
    const themeBtn = document.getElementById('btn-theme');
    if (themeBtn) {
        header.insertBefore(bellContainer, themeBtn);
    } else {
        header.appendChild(bellContainer);
    }

    notificationBadge = document.getElementById('notification-badge');

    document.getElementById('notifications-bell').addEventListener('click', openNotificationsModal);
}

/**
 * Create notifications modal
 */
function createNotificationsModal() {
    const modal = document.createElement('div');
    modal.id = 'notifications-modal';
    modal.className = 'modal notifications-modal';
    modal.innerHTML = `
        <div class="modal-content notifications-content">
            <div class="modal-header">
                <h2>
                    <span class="icon">🔔</span>
                    <span class="text">${getText('notifications.title', {}, 'Notifications')}</span>
                </h2>
                <div class="header-actions">
                    <button class="text-btn" id="mark-all-read-btn">
                        ${getText('notifications.markAllRead', {}, 'Mark all read')}
                    </button>
                    <button class="text-btn" id="notification-settings-btn">
                        ⚙️
                    </button>
                    <button class="close-btn" id="close-notifications-btn">×</button>
                </div>
            </div>

            <div class="notifications-tabs">
                <button class="tab-btn active" data-tab="all">
                    ${getText('notifications.all', {}, 'All')}
                </button>
                <button class="tab-btn" data-tab="unread">
                    ${getText('notifications.unread', {}, 'Unread')} 
                    <span class="badge" id="unread-count-tab">0</span>
                </button>
            </div>

            <div class="notifications-body">
                <div id="notifications-list" class="notifications-list">
                    <!-- Notifications will be rendered here -->
                </div>
            </div>

            <div class="notifications-footer">
                <button id="clear-read-btn" class="text-btn">
                    ${getText('notifications.clearRead', {}, 'Clear read notifications')}
                </button>
            </div>
        </div>

        <!-- Preferences Panel -->
        <div id="notification-preferences-panel" class="preferences-panel" style="display: none;">
            <div class="panel-header">
                <button class="back-btn" id="back-to-notifications">
                    ← ${getText('notifications.backToNotifications', {}, 'Back')}
                </button>
                <h3>${getText('notifications.preferences', {}, 'Notification Preferences')}</h3>
            </div>
            <div class="panel-body">
                <div class="preference-group">
                    <label class="preference-item">
                        <input type="checkbox" id="pref-achievements" checked>
                        <span>🏆 ${getText('notifications.achievements', {}, 'Achievements unlocked')}</span>
                    </label>
                    <label class="preference-item">
                        <input type="checkbox" id="pref-levelup" checked>
                        <span>⬆️ ${getText('notifications.levelUp', {}, 'Level up')}</span>
                    </label>
                    <label class="preference-item">
                        <input type="checkbox" id="pref-friends" checked>
                        <span>👥 ${getText('notifications.friendRequests', {}, 'Friend requests')}</span>
                    </label>
                    <label class="preference-item">
                        <input type="checkbox" id="pref-challenges" checked>
                        <span>⚔️ ${getText('notifications.challenges', {}, 'Challenges')}</span>
                    </label>
                    <label class="preference-item">
                        <input type="checkbox" id="pref-daily" checked>
                        <span>📅 ${getText('notifications.dailyChallenges', {}, 'Daily challenges')}</span>
                    </label>
                    <label class="preference-item">
                        <input type="checkbox" id="pref-milestones" checked>
                        <span>🌟 ${getText('notifications.milestones', {}, 'Milestones')}</span>
                    </label>
                    <label class="preference-item">
                        <input type="checkbox" id="pref-discussions" checked>
                        <span>💬 ${getText('notifications.discussions', {}, 'Discussion replies')}</span>
                    </label>
                    <label class="preference-item">
                        <input type="checkbox" id="pref-leaderboard" checked>
                        <span>📊 ${getText('notifications.leaderboard', {}, 'Leaderboard changes')}</span>
                    </label>
                </div>

                <div class="preference-group">
                    <h4>${getText('notifications.soundAndBrowser', {}, 'Sound & Browser')}</h4>
                    <label class="preference-item">
                        <input type="checkbox" id="pref-sound" checked>
                        <span>🔊 ${getText('notifications.soundEnabled', {}, 'Sound enabled')}</span>
                    </label>
                    <button id="request-browser-notifications" class="secondary-btn">
                        🔔 ${getText('notifications.enableBrowser', {}, 'Enable browser notifications')}
                    </button>
                </div>

                <div class="preference-actions">
                    <button id="save-preferences-btn" class="primary-btn">
                        ${getText('notifications.savePreferences', {}, 'Save Preferences')}
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    notificationsModal = modal;

    attachNotificationListeners();
}

/**
 * Attach notification listeners
 */
function attachNotificationListeners() {
    // Close button
    document.getElementById('close-notifications-btn')?.addEventListener('click', closeNotificationsModal);

    // Mark all as read
    document.getElementById('mark-all-read-btn')?.addEventListener('click', async () => {
        try {
            await markAllAsRead();
            showToast({
                title: '✅ ' + getText('notifications.markedAllRead', {}, 'All marked as read'),
                type: 'success',
                timeout: 1500
            });
        } catch (error) {
            showToast({
                title: 'Error',
                msg: error.message,
                type: 'error'
            });
        }
    });

    // Clear read notifications
    document.getElementById('clear-read-btn')?.addEventListener('click', async () => {
        if (confirm(getText('notifications.confirmClear', {}, 'Clear all read notifications?'))) {
            try {
                await clearReadNotifications();
                showToast({
                    title: '✅ ' + getText('notifications.cleared', {}, 'Cleared'),
                    type: 'success',
                    timeout: 1500
                });
            } catch (error) {
                showToast({
                    title: 'Error',
                    msg: error.message,
                    type: 'error'
                });
            }
        }
    });

    // Tabs
    document.querySelectorAll('.notifications-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.notifications-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tab = btn.dataset.tab;
            renderNotifications(tab);
        });
    });

    // Settings button
    document.getElementById('notification-settings-btn')?.addEventListener('click', openPreferencesPanel);

    // Back to notifications
    document.getElementById('back-to-notifications')?.addEventListener('click', closePreferencesPanel);

    // Save preferences
    document.getElementById('save-preferences-btn')?.addEventListener('click', savePreferences);

    // Request browser notifications
    document.getElementById('request-browser-notifications')?.addEventListener('click', async () => {
        const permission = await requestNotificationPermission();
        if (permission === 'granted') {
            showToast({
                title: '✅ ' + getText('notifications.browserEnabled', {}, 'Browser notifications enabled'),
                type: 'success'
            });
        }
    });

    // Click outside to close
    notificationsModal.addEventListener('click', (e) => {
        if (e.target === notificationsModal) {
            closeNotificationsModal();
        }
    });
}

/**
 * Subscribe to notification updates
 */
function subscribeToUpdates() {
    unsubscribeUpdates = onNotificationsUpdate((notifications) => {
        updateBadge();
        
        // Play sound for new notifications
        if (notifications.length > 0) {
            playNotificationSound();
        }

        // Refresh list if modal is open
        if (notificationsModal && notificationsModal.style.display !== 'none') {
            const activeTab = document.querySelector('.notifications-tabs .tab-btn.active')?.dataset.tab || 'all';
            renderNotifications(activeTab);
        }
    });
}

/**
 * Update notification badge
 */
async function updateBadge() {
    const count = await getUnreadCount();
    
    if (notificationBadge) {
        if (count > 0) {
            notificationBadge.textContent = count > 99 ? '99+' : count;
            notificationBadge.style.display = 'block';
        } else {
            notificationBadge.style.display = 'none';
        }
    }

    // Update tab badge
    const tabBadge = document.getElementById('unread-count-tab');
    if (tabBadge) {
        tabBadge.textContent = count;
    }
}

/**
 * Open notifications modal
 */
async function openNotificationsModal() {
    const user = await getCurrentUser();
    if (!user) {
        showToast({
            title: getText('auth.loginRequired', {}, 'Login Required'),
            msg: getText('auth.loginToView', {}, 'Please login to view notifications'),
            type: 'info'
        });
        return;
    }

    if (notificationsModal) {
        notificationsModal.style.display = 'flex';
        await loadPreferences();
        renderNotifications('all');
    }
}

/**
 * Close notifications modal
 */
function closeNotificationsModal() {
    if (notificationsModal) {
        notificationsModal.style.display = 'none';
    }
    closePreferencesPanel();
}

/**
 * Render notifications list
 */
async function renderNotifications(tab = 'all') {
    const list = document.getElementById('notifications-list');
    if (!list) return;

    list.innerHTML = '<div class="loading">Loading notifications...</div>';

    try {
        let notifications = await getNotifications();

        if (tab === 'unread') {
            notifications = notifications.filter(n => !n.read);
        }

        if (notifications.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <p class="large-icon">🔔</p>
                    <p>${getText('notifications.noNotifications', {}, 'No notifications yet')}</p>
                </div>
            `;
            return;
        }

        list.innerHTML = notifications.map(n => createNotificationElement(n)).join('');

        // Attach listeners
        attachNotificationItemListeners();
    } catch (error) {
        list.innerHTML = '<div class="error">Failed to load notifications</div>';
    }
}

/**
 * Create notification element
 */
function createNotificationElement(notification) {
    const icon = getNotificationIcon(notification.type);
    const time = formatNotificationTime(notification.timestamp);
    const unreadClass = notification.read ? '' : 'unread';

    return `
        <div class="notification-item ${unreadClass}" data-id="${notification.id}">
            <div class="notification-icon">${icon}</div>
            <div class="notification-content">
                <div class="notification-title">${escapeHtml(notification.title)}</div>
                ${notification.message ? `<div class="notification-message">${escapeHtml(notification.message)}</div>` : ''}
                <div class="notification-time">${time}</div>
            </div>
            <div class="notification-actions">
                ${!notification.read ? `<button class="mark-read-btn" data-id="${notification.id}" title="${getText('notifications.markRead', {}, 'Mark as read')}">✓</button>` : ''}
                <button class="delete-notification-btn" data-id="${notification.id}" title="${getText('notifications.delete', {}, 'Delete')}">🗑️</button>
            </div>
        </div>
    `;
}

/**
 * Attach notification item listeners
 */
function attachNotificationItemListeners() {
    // Mark as read buttons
    document.querySelectorAll('.mark-read-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            try {
                await markAsRead(id);
                updateBadge();
            } catch (error) {
                console.error('Error marking as read:', error);
            }
        });
    });

    // Delete buttons
    document.querySelectorAll('.delete-notification-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            try {
                await deleteNotification(id);
                updateBadge();
            } catch (error) {
                console.error('Error deleting notification:', error);
            }
        });
    });

    // Click notification to mark as read
    document.querySelectorAll('.notification-item.unread').forEach(item => {
        item.addEventListener('click', async () => {
            const id = item.dataset.id;
            try {
                await markAsRead(id);
                item.classList.remove('unread');
                updateBadge();
            } catch (error) {
                console.error('Error marking as read:', error);
            }
        });
    });
}

/**
 * Open preferences panel
 */
function openPreferencesPanel() {
    document.getElementById('notification-preferences-panel').style.display = 'block';
    document.querySelector('.notifications-content').style.display = 'none';
}

/**
 * Close preferences panel
 */
function closePreferencesPanel() {
    document.getElementById('notification-preferences-panel').style.display = 'none';
    document.querySelector('.notifications-content').style.display = 'block';
}

/**
 * Load preferences into UI
 */
async function loadPreferences() {
    const prefs = await getNotificationPreferences();

    document.getElementById('pref-achievements').checked = prefs.achievements !== false;
    document.getElementById('pref-levelup').checked = prefs.levelUp !== false;
    document.getElementById('pref-friends').checked = prefs.friendRequests !== false;
    document.getElementById('pref-challenges').checked = prefs.challenges !== false;
    document.getElementById('pref-daily').checked = prefs.dailyChallenges !== false;
    document.getElementById('pref-milestones').checked = prefs.milestones !== false;
    document.getElementById('pref-discussions').checked = prefs.discussionReplies !== false;
    document.getElementById('pref-leaderboard').checked = prefs.leaderboardRanks !== false;
    document.getElementById('pref-sound').checked = prefs.soundEnabled !== false;
}

/**
 * Save preferences
 */
async function savePreferences() {
    const prefs = {
        achievements: document.getElementById('pref-achievements').checked,
        levelUp: document.getElementById('pref-levelup').checked,
        friendRequests: document.getElementById('pref-friends').checked,
        challenges: document.getElementById('pref-challenges').checked,
        dailyChallenges: document.getElementById('pref-daily').checked,
        milestones: document.getElementById('pref-milestones').checked,
        discussionReplies: document.getElementById('pref-discussions').checked,
        leaderboardRanks: document.getElementById('pref-leaderboard').checked,
        soundEnabled: document.getElementById('pref-sound').checked
    };

    try {
        await updateNotificationPreferences(prefs);
        showToast({
            title: '✅ ' + getText('notifications.preferencesSaved', {}, 'Preferences saved'),
            type: 'success',
            timeout: 1500
        });
        closePreferencesPanel();
    } catch (error) {
        showToast({
            title: 'Error',
            msg: error.message,
            type: 'error'
        });
    }
}

/**
 * Show toast notification
 */
function showToast({ title, msg, type, timeout = 2000 }) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-title">${title}</div>
        ${msg ? `<div class="toast-msg">${msg}</div>` : ''}
    `;

    toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, timeout);
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Cleanup
 */
export function cleanupNotificationsUI() {
    if (unsubscribeUpdates) {
        unsubscribeUpdates();
        unsubscribeUpdates = null;
    }
}
