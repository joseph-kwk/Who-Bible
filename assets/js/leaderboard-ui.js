/**
 * Leaderboard UI
 * Display global and friend leaderboards
 */

import {
    getLeaderboard,
    getUserRank,
    getFriendsLeaderboard,
    getNearbyPlayers,
    getLeaderboardStats,
    getRankMedal,
    formatStatValue,
    TIMEFRAMES,
    CATEGORIES
} from './leaderboard.js';
import { getCurrentUser } from './auth.js';
import { getText } from './translations.js';

let leaderboardModal = null;
let currentTimeframe = TIMEFRAMES.ALL_TIME;
let currentCategory = CATEGORIES.XP;
let currentView = 'global'; // 'global', 'friends', 'nearby'

/**
 * Initialize leaderboard UI
 */
export function initLeaderboardUI() {
    createLeaderboardModal();
    attachLeaderboardButton();
}

/**
 * Create leaderboard modal
 */
function createLeaderboardModal() {
    const modal = document.createElement('div');
    modal.id = 'leaderboard-modal';
    modal.className = 'modal leaderboard-modal';
    modal.innerHTML = `
        <div class="modal-content leaderboard-content">
            <div class="modal-header">
                <h2>
                    <span class="icon">🏆</span>
                    <span class="text">${getText('leaderboard.title', {}, 'Leaderboard')}</span>
                </h2>
                <button class="close-btn" onclick="document.getElementById('leaderboard-modal').style.display='none'">
                    ×
                </button>
            </div>

            <div class="leaderboard-controls">
                <div class="control-group">
                    <label>${getText('leaderboard.timeframe', {}, 'Timeframe')}:</label>
                    <div class="button-group">
                        <button class="control-btn active" data-timeframe="${TIMEFRAMES.ALL_TIME}">
                            ${getText('leaderboard.allTime', {}, 'All Time')}
                        </button>
                        <button class="control-btn" data-timeframe="${TIMEFRAMES.MONTHLY}">
                            ${getText('leaderboard.monthly', {}, 'Monthly')}
                        </button>
                        <button class="control-btn" data-timeframe="${TIMEFRAMES.WEEKLY}">
                            ${getText('leaderboard.weekly', {}, 'Weekly')}
                        </button>
                        <button class="control-btn" data-timeframe="${TIMEFRAMES.DAILY}">
                            ${getText('leaderboard.daily', {}, 'Daily')}
                        </button>
                    </div>
                </div>

                <div class="control-group">
                    <label>${getText('leaderboard.category', {}, 'Category')}:</label>
                    <div class="button-group">
                        <button class="control-btn active" data-category="${CATEGORIES.XP}">
                            ⭐ XP
                        </button>
                        <button class="control-btn" data-category="${CATEGORIES.LEVEL}">
                            📈 ${getText('leaderboard.level', {}, 'Level')}
                        </button>
                        <button class="control-btn" data-category="${CATEGORIES.ACCURACY}">
                            🎯 ${getText('leaderboard.accuracy', {}, 'Accuracy')}
                        </button>
                        <button class="control-btn" data-category="${CATEGORIES.STREAK}">
                            🔥 ${getText('leaderboard.streak', {}, 'Streak')}
                        </button>
                        <button class="control-btn" data-category="${CATEGORIES.GAMES}">
                            🎮 ${getText('leaderboard.games', {}, 'Games')}
                        </button>
                    </div>
                </div>

                <div class="control-group">
                    <label>${getText('leaderboard.view', {}, 'View')}:</label>
                    <div class="button-group">
                        <button class="control-btn active" data-view="global">
                            🌍 ${getText('leaderboard.global', {}, 'Global')}
                        </button>
                        <button class="control-btn" data-view="nearby">
                            📍 ${getText('leaderboard.nearby', {}, 'Nearby')}
                        </button>
                        <button class="control-btn" data-view="friends">
                            👥 ${getText('leaderboard.friends', {}, 'Friends')}
                        </button>
                    </div>
                </div>
            </div>

            <div class="leaderboard-stats">
                <!-- Stats will be dynamically rendered -->
            </div>

            <div class="leaderboard-user-rank">
                <!-- User's rank will be displayed here -->
            </div>

            <div class="leaderboard-list">
                <!-- Leaderboard entries will be dynamically rendered -->
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    leaderboardModal = modal;

    // Attach control listeners
    attachControlListeners();

    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

/**
 * Attach control listeners
 */
function attachControlListeners() {
    // Timeframe buttons
    leaderboardModal.querySelectorAll('[data-timeframe]').forEach(btn => {
        btn.addEventListener('click', () => {
            leaderboardModal.querySelectorAll('[data-timeframe]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTimeframe = btn.dataset.timeframe;
            renderLeaderboard();
        });
    });

    // Category buttons
    leaderboardModal.querySelectorAll('[data-category]').forEach(btn => {
        btn.addEventListener('click', () => {
            leaderboardModal.querySelectorAll('[data-category]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            renderLeaderboard();
        });
    });

    // View buttons
    leaderboardModal.querySelectorAll('[data-view]').forEach(btn => {
        btn.addEventListener('click', () => {
            leaderboardModal.querySelectorAll('[data-view]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentView = btn.dataset.view;
            renderLeaderboard();
        });
    });
}

/**
 * Attach leaderboard button to UI
 */
function attachLeaderboardButton() {
    // Add to profile dropdown
    const profileDropdown = document.querySelector('.profile-dropdown');
    if (profileDropdown) {
        const leaderboardBtn = document.createElement('button');
        leaderboardBtn.className = 'dropdown-item leaderboard-btn';
        leaderboardBtn.innerHTML = '🏆 ' + getText('leaderboard.title', {}, 'Leaderboard');
        leaderboardBtn.addEventListener('click', () => {
            profileDropdown.style.display = 'none';
            showLeaderboardModal();
        });
        
        // Insert before badges button
        const badgesBtn = profileDropdown.querySelector('.badges-btn');
        if (badgesBtn) {
            profileDropdown.insertBefore(leaderboardBtn, badgesBtn);
        } else {
            const signOutBtn = profileDropdown.querySelector('.sign-out-btn');
            profileDropdown.insertBefore(leaderboardBtn, signOutBtn);
        }
    }
}

/**
 * Show leaderboard modal
 */
export async function showLeaderboardModal() {
    const user = getCurrentUser();
    if (!user) {
        alert(getText('leaderboard.loginRequired', {}, 'Please log in to view leaderboard'));
        return;
    }

    leaderboardModal.style.display = 'flex';
    await renderLeaderboard();
}

/**
 * Render leaderboard
 */
async function renderLeaderboard() {
    const user = getCurrentUser();
    if (!user) return;

    try {
        // Show loading
        const listContainer = leaderboardModal.querySelector('.leaderboard-list');
        listContainer.innerHTML = '<div class="loading">Loading...</div>';

        // Get data based on view
        let entries = [];
        if (currentView === 'global') {
            entries = await getLeaderboard(currentTimeframe, currentCategory, 100);
        } else if (currentView === 'nearby') {
            entries = await getNearbyPlayers(user.uid, currentTimeframe, currentCategory, 10);
        } else if (currentView === 'friends') {
            // TODO: Get friend UIDs
            const friendUids = []; // Placeholder
            entries = await getFriendsLeaderboard(friendUids, currentCategory);
        }

        // Render stats
        await renderLeaderboardStats();

        // Render user's rank
        await renderUserRank(user.uid);

        // Render entries
        renderLeaderboardEntries(entries);

    } catch (error) {
        console.error('Error rendering leaderboard:', error);
        const listContainer = leaderboardModal.querySelector('.leaderboard-list');
        listContainer.innerHTML = '<div class="error">Failed to load leaderboard</div>';
    }
}

/**
 * Render leaderboard stats
 */
async function renderLeaderboardStats() {
    try {
        const stats = await getLeaderboardStats(currentTimeframe);
        const statsContainer = leaderboardModal.querySelector('.leaderboard-stats');

        if (!stats) {
            statsContainer.innerHTML = '';
            return;
        }

        statsContainer.innerHTML = `
            <div class="stat-item">
                <div class="stat-icon">👥</div>
                <div class="stat-value">${stats.totalPlayers.toLocaleString()}</div>
                <div class="stat-label">${getText('leaderboard.players', {}, 'Players')}</div>
            </div>
            <div class="stat-item">
                <div class="stat-icon">⭐</div>
                <div class="stat-value">${stats.totalXP.toLocaleString()}</div>
                <div class="stat-label">${getText('leaderboard.totalXP', {}, 'Total XP')}</div>
            </div>
            <div class="stat-item">
                <div class="stat-icon">🎮</div>
                <div class="stat-value">${stats.totalGames.toLocaleString()}</div>
                <div class="stat-label">${getText('leaderboard.totalGames', {}, 'Total Games')}</div>
            </div>
            <div class="stat-item">
                <div class="stat-icon">🎯</div>
                <div class="stat-value">${stats.avgAccuracy.toFixed(1)}%</div>
                <div class="stat-label">${getText('leaderboard.avgAccuracy', {}, 'Avg Accuracy')}</div>
            </div>
        `;
    } catch (error) {
        console.error('Error rendering stats:', error);
    }
}

/**
 * Render user's rank
 */
async function renderUserRank(uid) {
    try {
        const userRank = await getUserRank(uid, currentTimeframe, currentCategory);
        const rankContainer = leaderboardModal.querySelector('.leaderboard-user-rank');

        if (!userRank) {
            rankContainer.innerHTML = '';
            return;
        }

        const medal = getRankMedal(userRank.rank);
        const value = formatStatValue(currentCategory, userRank[getCategoryField(currentCategory)]);

        rankContainer.innerHTML = `
            <div class="user-rank-card">
                <div class="rank-badge">${medal} #${userRank.rank}</div>
                <div class="rank-info">
                    <div class="rank-name">${userRank.displayName}</div>
                    <div class="rank-value">${value}</div>
                </div>
                <div class="rank-language">${getLanguageFlag(userRank.preferredLanguage)}</div>
            </div>
        `;
    } catch (error) {
        console.error('Error rendering user rank:', error);
    }
}

/**
 * Render leaderboard entries
 */
function renderLeaderboardEntries(entries) {
    const listContainer = leaderboardModal.querySelector('.leaderboard-list');

    if (!entries || entries.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🏆</div>
                <div class="empty-text">${getText('leaderboard.noEntries', {}, 'No entries yet')}</div>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = entries.map(entry => {
        const medal = getRankMedal(entry.rank);
        const value = formatStatValue(currentCategory, entry[getCategoryField(currentCategory)]);
        const isCurrentUser = entry.uid === getCurrentUser()?.uid;

        return `
            <div class="leaderboard-entry ${isCurrentUser ? 'current-user' : ''}">
                <div class="entry-rank">${medal} ${entry.rank}</div>
                <div class="entry-info">
                    <div class="entry-name">${entry.displayName}</div>
                    <div class="entry-value">${value}</div>
                </div>
                <div class="entry-language">${getLanguageFlag(entry.preferredLanguage)}</div>
            </div>
        `;
    }).join('');
}

/**
 * Get category field name
 */
function getCategoryField(category) {
    switch (category) {
        case CATEGORIES.XP:
            return 'totalXP';
        case CATEGORIES.LEVEL:
            return 'level';
        case CATEGORIES.ACCURACY:
            return 'accuracy';
        case CATEGORIES.STREAK:
            return 'currentStreak';
        case CATEGORIES.GAMES:
            return 'totalGames';
        default:
            return 'totalXP';
    }
}

/**
 * Get language flag
 */
function getLanguageFlag(languageCode) {
    const flags = {
        'en': '🇬🇧',
        'es': '🇪🇸',
        'fr': '🇫🇷'
    };
    return flags[languageCode] || '🌍';
}
