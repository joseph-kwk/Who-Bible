/**
 * Friend Challenges UI
 * User interface for creating, accepting, and viewing friend challenges
 */

import {
    createFriendChallenge,
    acceptFriendChallenge,
    declineFriendChallenge,
    getPendingChallenges,
    getSentChallenges,
    getActiveChallenges,
    getCompletedChallenges,
    getChallengeStats,
    getTimeRemaining,
    CHALLENGE_STATUS
} from './friend-challenges.js';
import { getFriendsList } from './friends.js';
import { getCurrentUser } from './auth.js';
import { getText } from './translations.js';

let challengesModal = null;

/**
 * Initialize challenges UI
 */
export function initChallengesUI() {
    createChallengesModal();
    attachChallengeButtonsTofriends();
}

/**
 * Create challenges modal
 */
function createChallengesModal() {
    const modal = document.createElement('div');
    modal.id = 'challenges-modal';
    modal.className = 'modal challenges-modal';
    modal.innerHTML = `
        <div class="modal-content challenges-content">
            <div class="modal-header">
                <h2>
                    <span class="icon">⚔️</span>
                    <span class="text">${getText('challenges.title', {}, 'Challenges')}</span>
                </h2>
                <button class="close-btn" id="close-challenges-btn">×</button>
            </div>

            <div class="challenges-tabs">
                <button class="tab-btn active" data-tab="pending">
                    📬 ${getText('challenges.pending', {}, 'Pending')}
                    <span class="badge" id="pending-count">0</span>
                </button>
                <button class="tab-btn" data-tab="active">
                    🎯 ${getText('challenges.active', {}, 'Active')}
                    <span class="badge" id="active-count">0</span>
                </button>
                <button class="tab-btn" data-tab="history">
                    📊 ${getText('challenges.history', {}, 'History')}
                </button>
                <button class="tab-btn" data-tab="stats">
                    📈 ${getText('challenges.stats', {}, 'Stats')}
                </button>
            </div>

            <div class="challenges-body">
                <!-- Pending Tab -->
                <div class="tab-content active" id="pending-tab">
                    <div id="pending-list" class="challenges-list"></div>
                </div>

                <!-- Active Tab -->
                <div class="tab-content" id="active-tab">
                    <div id="active-list" class="challenges-list"></div>
                </div>

                <!-- History Tab -->
                <div class="tab-content" id="history-tab">
                    <div id="history-list" class="challenges-list"></div>
                </div>

                <!-- Stats Tab -->
                <div class="tab-content" id="stats-tab">
                    <div id="stats-content" class="stats-content"></div>
                </div>
            </div>
        </div>

        <!-- Create Challenge Panel -->
        <div id="create-challenge-panel" class="create-panel" style="display: none;">
            <div class="panel-header">
                <button class="back-btn" id="back-from-create">
                    ← ${getText('challenges.back', {}, 'Back')}
                </button>
                <h3>${getText('challenges.createChallenge', {}, 'Create Challenge')}</h3>
            </div>
            <div class="panel-body">
                <div class="form-group">
                    <label>${getText('challenges.selectFriend', {}, 'Select Friend')}</label>
                    <select id="challenge-friend-select">
                        <option value="">${getText('challenges.chooseFriend', {}, 'Choose a friend...')}</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>${getText('challenges.difficulty', {}, 'Difficulty')}</label>
                    <select id="challenge-difficulty">
                        <option value="beginner">${getText('difficultyEasy', {}, 'Beginner')}</option>
                        <option value="intermediate" selected>${getText('difficultyMedium', {}, 'Intermediate')}</option>
                        <option value="expert">${getText('difficultyHard', {}, 'Expert')}</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>${getText('challenges.numQuestions', {}, 'Number of Questions')}</label>
                    <select id="challenge-questions">
                        <option value="5">5</option>
                        <option value="10" selected>10</option>
                        <option value="15">15</option>
                        <option value="20">20</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>${getText('challenges.timeLimit', {}, 'Time Limit')}</label>
                    <select id="challenge-time">
                        <option value="180">3 ${getText('minutes', {}, 'minutes')}</option>
                        <option value="300" selected>5 ${getText('minutes', {}, 'minutes')}</option>
                        <option value="600">10 ${getText('minutes', {}, 'minutes')}</option>
                        <option value="0">${getText('challenges.noLimit', {}, 'No limit')}</option>
                    </select>
                </div>

                <div class="form-actions">
                    <button id="send-challenge-btn" class="primary-btn">
                        ⚔️ ${getText('challenges.sendChallenge', {}, 'Send Challenge')}
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    challengesModal = modal;

    attachChallengeModalListeners();
}

/**
 * Attach challenge modal listeners
 */
function attachChallengeModalListeners() {
    // Close button
    document.getElementById('close-challenges-btn')?.addEventListener('click', closeChallengesModal);

    // Tabs
    document.querySelectorAll('.challenges-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchChallengeTab(tab);
        });
    });

    // Create challenge panel
    document.getElementById('back-from-create')?.addEventListener('click', closeCreatePanel);
    document.getElementById('send-challenge-btn')?.addEventListener('click', handleSendChallenge);

    // Click outside to close
    challengesModal.addEventListener('click', (e) => {
        if (e.target === challengesModal) {
            closeChallengesModal();
        }
    });
}

/**
 * Attach challenge buttons to friend cards
 */
function attachChallengeButtonsToFriends() {
    document.querySelectorAll('.challenge-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const friendId = btn.dataset.uid;
            openCreateChallengePanel(friendId);
        });
    });
}

/**
 * Open challenges modal
 */
export async function openChallengesModal() {
    const user = await getCurrentUser();
    if (!user) {
        showToast({
            title: getText('auth.loginRequired', {}, 'Login Required'),
            type: 'info'
        });
        return;
    }

    if (challengesModal) {
        challengesModal.style.display = 'flex';
        await refreshChallenges();
    }
}

/**
 * Close challenges modal
 */
function closeChallengesModal() {
    if (challengesModal) {
        challengesModal.style.display = 'none';
        closeCreatePanel();
    }
}

/**
 * Switch challenge tab
 */
async function switchChallengeTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.challenges-tabs .tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // Update tab content
    document.querySelectorAll('.challenges-body .tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tab}-tab`);
    });

    // Load tab data
    switch (tab) {
        case 'pending':
            await loadPendingChallenges();
            break;
        case 'active':
            await loadActiveChallenges();
            break;
        case 'history':
            await loadChallengeHistory();
            break;
        case 'stats':
            await loadChallengeStats();
            break;
    }
}

/**
 * Refresh all challenges
 */
async function refreshChallenges() {
    const pending = await getPendingChallenges();
    const active = await getActiveChallenges();

    document.getElementById('pending-count').textContent = pending.length;
    document.getElementById('active-count').textContent = active.length;

    await loadPendingChallenges();
}

/**
 * Load pending challenges
 */
async function loadPendingChallenges() {
    const list = document.getElementById('pending-list');
    list.innerHTML = '<div class="loading">Loading...</div>';

    try {
        const pending = await getPendingChallenges();
        const sent = await getSentChallenges();

        if (pending.length === 0 && sent.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <p class="large-icon">📬</p>
                    <p>${getText('challenges.noPending', {}, 'No pending challenges')}</p>
                </div>
            `;
            return;
        }

        let html = '';

        if (pending.length > 0) {
            html += `<h3 class="section-title">${getText('challenges.received', {}, 'Received Challenges')}</h3>`;
            html += pending.map(c => createChallengeCard(c, 'received')).join('');
        }

        if (sent.length > 0) {
            html += `<h3 class="section-title">${getText('challenges.sent', {}, 'Sent Challenges')}</h3>`;
            html += sent.map(c => createChallengeCard(c, 'sent')).join('');
        }

        list.innerHTML = html;
        attachChallengeActions();
    } catch (error) {
        list.innerHTML = '<div class="error">Failed to load challenges</div>';
    }
}

/**
 * Load active challenges
 */
async function loadActiveChallenges() {
    const list = document.getElementById('active-list');
    list.innerHTML = '<div class="loading">Loading...</div>';

    try {
        const active = await getActiveChallenges();

        if (active.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <p class="large-icon">🎯</p>
                    <p>${getText('challenges.noActive', {}, 'No active challenges')}</p>
                    <button class="primary-btn" onclick="document.getElementById('create-challenge-panel').style.display='block'">
                        ⚔️ ${getText('challenges.createNew', {}, 'Create Challenge')}
                    </button>
                </div>
            `;
            return;
        }

        list.innerHTML = active.map(c => createChallengeCard(c, 'active')).join('');
        attachChallengeActions();
    } catch (error) {
        list.innerHTML = '<div class="error">Failed to load challenges</div>';
    }
}

/**
 * Load challenge history
 */
async function loadChallengeHistory() {
    const list = document.getElementById('history-list');
    list.innerHTML = '<div class="loading">Loading...</div>';

    try {
        const history = await getCompletedChallenges(50);

        if (history.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <p class="large-icon">📊</p>
                    <p>${getText('challenges.noHistory', {}, 'No completed challenges yet')}</p>
                </div>
            `;
            return;
        }

        list.innerHTML = history.map(c => createChallengeCard(c, 'completed')).join('');
    } catch (error) {
        list.innerHTML = '<div class="error">Failed to load history</div>';
    }
}

/**
 * Load challenge stats
 */
async function loadChallengeStats() {
    const content = document.getElementById('stats-content');
    content.innerHTML = '<div class="loading">Loading stats...</div>';

    try {
        const stats = await getChallengeStats();

        if (!stats || stats.total === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <p class="large-icon">📈</p>
                    <p>${getText('challenges.noStats', {}, 'No challenge statistics yet')}</p>
                </div>
            `;
            return;
        }

        content.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${stats.total}</div>
                    <div class="stat-label">${getText('challenges.totalChallenges', {}, 'Total Challenges')}</div>
                </div>
                <div class="stat-card win">
                    <div class="stat-value">${stats.wins}</div>
                    <div class="stat-label">${getText('challenges.wins', {}, 'Wins')}</div>
                </div>
                <div class="stat-card loss">
                    <div class="stat-value">${stats.losses}</div>
                    <div class="stat-label">${getText('challenges.losses', {}, 'Losses')}</div>
                </div>
                <div class="stat-card tie">
                    <div class="stat-value">${stats.ties}</div>
                    <div class="stat-label">${getText('challenges.ties', {}, 'Ties')}</div>
                </div>
                <div class="stat-card accent">
                    <div class="stat-value">${stats.winRate}%</div>
                    <div class="stat-label">${getText('challenges.winRate', {}, 'Win Rate')}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.avgScore}</div>
                    <div class="stat-label">${getText('challenges.avgScore', {}, 'Avg Score')}</div>
                </div>
            </div>
        `;
    } catch (error) {
        content.innerHTML = '<div class="error">Failed to load stats</div>';
    }
}

/**
 * Create challenge card HTML
 */
function createChallengeCard(challenge, type) {
    const { settings } = challenge;
    const timeRemaining = getTimeRemaining(challenge.expiresAt);

    if (type === 'received') {
        return `
            <div class="challenge-card received">
                <div class="challenge-header">
                    <div class="challenger-info">
                        <span class="flag">${getLanguageFlag(challenge.challengerLanguage)}</span>
                        <strong>${challenge.challengerName}</strong>
                    </div>
                    <span class="time-remaining">${timeRemaining}</span>
                </div>
                <div class="challenge-details">
                    <span>${settings.numQuestions} questions</span>
                    <span>•</span>
                    <span>${settings.difficulty}</span>
                    <span>•</span>
                    <span>${settings.timeLimit > 0 ? settings.timeLimit + 's' : 'No limit'}</span>
                </div>
                <div class="challenge-actions">
                    <button class="accept-btn" data-id="${challenge.id}">
                        ✓ ${getText('challenges.accept', {}, 'Accept')}
                    </button>
                    <button class="decline-btn" data-id="${challenge.id}">
                        ✗ ${getText('challenges.decline', {}, 'Decline')}
                    </button>
                </div>
            </div>
        `;
    }

    if (type === 'sent') {
        return `
            <div class="challenge-card sent">
                <div class="challenge-header">
                    <span class="status-badge pending">${getText('challenges.waitingResponse', {}, 'Waiting for response')}</span>
                    <span class="time-remaining">${timeRemaining}</span>
                </div>
                <div class="challenge-details">
                    <span>${settings.numQuestions} questions</span>
                    <span>•</span>
                    <span>${settings.difficulty}</span>
                </div>
            </div>
        `;
    }

    if (type === 'active') {
        const isChallenger = challenge.role === 'challenger';
        const yourScore = isChallenger ? challenge.challengerScore : challenge.opponentScore;
        const theirScore = isChallenger ? challenge.opponentScore : challenge.challengerScore;

        return `
            <div class="challenge-card active">
                <div class="challenge-header">
                    <div>${isChallenger ? 'vs ' + (challenge.opponentName || 'Opponent') : 'from ' + challenge.challengerName}</div>
                </div>
                <div class="challenge-details">
                    <span>${settings.numQuestions} questions</span>
                    <span>•</span>
                    <span>${settings.difficulty}</span>
                </div>
                <div class="challenge-scores">
                    <div class="score ${yourScore !== null ? 'completed' : ''}">
                        You: ${yourScore !== null ? yourScore : '—'}
                    </div>
                    <div class="score ${theirScore !== null ? 'completed' : ''}">
                        Them: ${theirScore !== null ? theirScore : '—'}
                    </div>
                </div>
                ${yourScore === null ? `
                    <button class="start-challenge-btn" data-id="${challenge.id}">
                        🎯 ${getText('challenges.startNow', {}, 'Start Now')}
                    </button>
                ` : ''}
            </div>
        `;
    }

    if (type === 'completed') {
        const user = getCurrentUser();
        const isChallenger = challenge.role === 'challenger';
        const yourScore = isChallenger ? challenge.challengerScore : challenge.opponentScore;
        const theirScore = isChallenger ? challenge.opponentScore : challenge.challengerScore;
        const won = challenge.winnerId && challenge.winnerId === (isChallenger ? challenge.challengerId : challenge.opponentId);
        const tied = challenge.winnerId === null;

        return `
            <div class="challenge-card completed ${won ? 'won' : tied ? 'tied' : 'lost'}">
                <div class="challenge-header">
                    <div>${isChallenger ? 'vs ' + (challenge.opponentName || 'Opponent') : 'from ' + challenge.challengerName}</div>
                    <span class="result-badge ${won ? 'win' : tied ? 'tie' : 'loss'}">
                        ${won ? '🏆 Won' : tied ? '🤝 Tie' : '❌ Lost'}
                    </span>
                </div>
                <div class="challenge-scores">
                    <div class="score">You: ${yourScore}</div>
                    <div class="score">Them: ${theirScore}</div>
                </div>
                <div class="challenge-date">
                    ${new Date(challenge.completedAt).toLocaleDateString()}
                </div>
            </div>
        `;
    }

    return '';
}

/**
 * Attach challenge action listeners
 */
function attachChallengeActions() {
    // Accept buttons
    document.querySelectorAll('.accept-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            try {
                await acceptFriendChallenge(id);
                showToast({ title: '✅ Challenge accepted!', type: 'success' });
                await refreshChallenges();
            } catch (error) {
                showToast({ title: 'Error', msg: error.message, type: 'error' });
            }
        });
    });

    // Decline buttons
    document.querySelectorAll('.decline-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            try {
                await declineFriendChallenge(id);
                showToast({ title: '✅ Challenge declined', type: 'success' });
                await refreshChallenges();
            } catch (error) {
                showToast({ title: 'Error', msg: error.message, type: 'error' });
            }
        });
    });

    // Start challenge buttons
    document.querySelectorAll('.start-challenge-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            // This would trigger the quiz mode with the challenge settings
            showToast({ title: 'Challenge quiz starting...', type: 'info' });
            // TODO: Implement quiz start with challenge settings
        });
    });
}

/**
 * Open create challenge panel
 */
async function openCreateChallengePanel(friendId = null) {
    const panel = document.getElementById('create-challenge-panel');
    if (!panel) return;

    // Load friends list
    const friends = await getFriendsList();
    const select = document.getElementById('challenge-friend-select');
    
    select.innerHTML = `<option value="">${getText('challenges.chooseFriend', {}, 'Choose a friend...')}</option>`;
    friends.forEach(friend => {
        const option = document.createElement('option');
        option.value = friend.uid;
        option.textContent = `${getLanguageFlag(friend.preferredLanguage)} ${friend.displayName}`;
        if (friendId && friend.uid === friendId) {
            option.selected = true;
        }
        select.appendChild(option);
    });

    panel.style.display = 'block';
    document.querySelector('.challenges-content').style.display = 'none';
}

/**
 * Close create challenge panel
 */
function closeCreatePanel() {
    document.getElementById('create-challenge-panel').style.display = 'none';
    document.querySelector('.challenges-content').style.display = 'block';
}

/**
 * Handle send challenge
 */
async function handleSendChallenge() {
    const friendId = document.getElementById('challenge-friend-select').value;
    const difficulty = document.getElementById('challenge-difficulty').value;
    const numQuestions = parseInt(document.getElementById('challenge-questions').value);
    const timeLimit = parseInt(document.getElementById('challenge-time').value);

    if (!friendId) {
        showToast({ title: 'Error', msg: 'Please select a friend', type: 'error' });
        return;
    }

    try {
        await createFriendChallenge(friendId, {
            difficulty,
            numQuestions,
            timeLimit
        });

        showToast({ title: '✅ Challenge sent!', type: 'success' });
        closeCreatePanel();
        await refreshChallenges();
    } catch (error) {
        showToast({ title: 'Error', msg: error.message, type: 'error' });
    }
}

/**
 * Get language flag
 */
function getLanguageFlag(lang) {
    const flags = { 'en': '🇬🇧', 'es': '🇪🇸', 'fr': '🇫🇷' };
    return flags[lang] || '🌐';
}

/**
 * Show toast
 */
function showToast({ title, msg, type, timeout = 2000 }) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-title">${title}</div>
        ${msg ? `<div class="toast-msg">${msg}</div>` : ''}
    `;

    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, timeout);
}

// Export for use in friends-ui.js
export { attachChallengeButtonsToFriends };
