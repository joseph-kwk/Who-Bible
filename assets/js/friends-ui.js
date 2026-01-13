/**
 * Friends UI
 * User interface for friend management, search, and social features
 */

import {
    getFriendsList,
    getPendingRequests,
    getSentRequests,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    searchUsers,
    checkFriendship,
    getFriendStats,
    getMutualFriends
} from './friends.js';
import { getCurrentUser } from './auth.js';
import { getText } from './translations.js';

let friendsModal = null;
let currentTab = 'friends'; // 'friends', 'requests', 'search'

/**
 * Initialize friends UI
 */
export function initFriendsUI() {
    createFriendsModal();
    attachFriendsButton();
}

/**
 * Create friends modal
 */
function createFriendsModal() {
    const modal = document.createElement('div');
    modal.id = 'friends-modal';
    modal.className = 'modal friends-modal';
    modal.innerHTML = `
        <div class="modal-content friends-content">
            <div class="modal-header">
                <h2>
                    <span class="icon">👥</span>
                    <span class="text">${getText('friends.title', {}, 'Friends')}</span>
                </h2>
                <button class="close-btn" onclick="document.getElementById('friends-modal').style.display='none'">
                    ×
                </button>
            </div>

            <div class="friends-tabs">
                <button class="tab-btn active" data-tab="friends">
                    👥 <span class="tab-text">${getText('friends.myFriends', {}, 'My Friends')}</span>
                    <span class="badge" id="friends-count">0</span>
                </button>
                <button class="tab-btn" data-tab="requests">
                    📬 <span class="tab-text">${getText('friends.requests', {}, 'Requests')}</span>
                    <span class="badge" id="requests-count">0</span>
                </button>
                <button class="tab-btn" data-tab="search">
                    🔍 <span class="tab-text">${getText('friends.findFriends', {}, 'Find Friends')}</span>
                </button>
            </div>

            <div class="friends-body">
                <!-- Friends List Tab -->
                <div class="tab-content active" id="friends-tab">
                    <div class="friends-stats">
                        <div class="stat-item">
                            <span class="stat-value" id="total-friends">0</span>
                            <span class="stat-label">${getText('friends.totalFriends', {}, 'Friends')}</span>
                        </div>
                    </div>
                    <div id="friends-list" class="friends-list">
                        <!-- Friends will be rendered here -->
                    </div>
                </div>

                <!-- Requests Tab -->
                <div class="tab-content" id="requests-tab">
                    <div class="requests-section">
                        <h3>${getText('friends.pendingRequests', {}, 'Pending Requests')}</h3>
                        <div id="pending-requests-list" class="requests-list">
                            <!-- Pending requests will be rendered here -->
                        </div>
                    </div>
                    <div class="requests-section">
                        <h3>${getText('friends.sentRequests', {}, 'Sent Requests')}</h3>
                        <div id="sent-requests-list" class="requests-list">
                            <!-- Sent requests will be rendered here -->
                        </div>
                    </div>
                </div>

                <!-- Search Tab -->
                <div class="tab-content" id="search-tab">
                    <div class="search-box">
                        <input type="text" id="user-search-input" 
                               placeholder="${getText('friends.searchPlaceholder', {}, 'Search users by name...')}"
                               class="search-input">
                        <button id="search-btn" class="search-button">
                            🔍 ${getText('friends.search', {}, 'Search')}
                        </button>
                    </div>
                    <div id="search-results" class="search-results">
                        <!-- Search results will be rendered here -->
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    friendsModal = modal;

    // Attach tab listeners
    attachTabListeners();

    // Attach search listener
    attachSearchListener();

    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

/**
 * Attach tab listeners
 */
function attachTabListeners() {
    friendsModal.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });
}

/**
 * Switch between tabs
 */
function switchTab(tab) {
    currentTab = tab;

    // Update buttons
    friendsModal.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // Update content
    friendsModal.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tab}-tab`);
    });

    // Load content for the active tab
    if (tab === 'friends') {
        loadFriendsList();
    } else if (tab === 'requests') {
        loadRequests();
    }
}

/**
 * Attach friends button to UI
 */
function attachFriendsButton() {
    const profileDropdown = document.querySelector('.profile-dropdown');
    if (profileDropdown) {
        const friendsBtn = document.createElement('button');
        friendsBtn.className = 'dropdown-item friends-btn';
        friendsBtn.innerHTML = '👥 ' + getText('friends.title', {}, 'Friends');
        friendsBtn.addEventListener('click', () => {
            profileDropdown.style.display = 'none';
            showFriendsModal();
        });
        
        // Insert before leaderboard button
        const leaderboardBtn = profileDropdown.querySelector('.leaderboard-btn');
        if (leaderboardBtn) {
            profileDropdown.insertBefore(friendsBtn, leaderboardBtn);
        } else {
            const badgesBtn = profileDropdown.querySelector('.badges-btn');
            profileDropdown.insertBefore(friendsBtn, badgesBtn);
        }
    }
}

/**
 * Show friends modal
 */
export async function showFriendsModal() {
    const user = getCurrentUser();
    if (!user) {
        alert(getText('friends.loginRequired', {}, 'Please log in to view friends'));
        return;
    }

    friendsModal.style.display = 'flex';
    await updateFriendStats();
    await loadFriendsList();
}

/**
 * Update friend statistics
 */
async function updateFriendStats() {
    const user = getCurrentUser();
    if (!user) return;

    try {
        const stats = await getFriendStats(user.uid);
        
        document.getElementById('friends-count').textContent = stats.totalFriends;
        document.getElementById('requests-count').textContent = stats.pendingRequests;
        document.getElementById('total-friends').textContent = stats.totalFriends;

        // Show badge if there are pending requests
        const requestsBadge = document.getElementById('requests-count');
        requestsBadge.style.display = stats.pendingRequests > 0 ? 'inline' : 'none';
    } catch (error) {
        console.error('Error updating friend stats:', error);
    }
}

/**
 * Load friends list
 */
async function loadFriendsList() {
    const user = getCurrentUser();
    if (!user) return;

    const listContainer = document.getElementById('friends-list');
    listContainer.innerHTML = '<div class="loading">Loading friends...</div>';

    try {
        const friends = await getFriendsList(user.uid);

        if (friends.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👥</div>
                    <div class="empty-text">${getText('friends.noFriends', {}, 'No friends yet')}</div>
                    <div class="empty-hint">${getText('friends.searchHint', {}, 'Search for users to add friends')}</div>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = friends.map(friend => createFriendCard(friend)).join('');
        attachFriendCardListeners();
    } catch (error) {
        console.error('Error loading friends list:', error);
        listContainer.innerHTML = '<div class="error">Failed to load friends</div>';
    }
}

/**
 * Create friend card HTML
 */
function createFriendCard(friend) {
    const friendsSince = friend.friendsSince ? 
        friend.friendsSince.toDate().toLocaleDateString() : 'Unknown';
    
    return `
        <div class="friend-card" data-uid="${friend.uid}">
            <div class="friend-avatar">
                ${friend.photoURL ? 
                    `<img src="${friend.photoURL}" alt="${friend.displayName}">` :
                    `<div class="avatar-placeholder">${friend.displayName.charAt(0).toUpperCase()}</div>`
                }
            </div>
            <div class="friend-info">
                <div class="friend-name">${friend.displayName}</div>
                <div class="friend-meta">
                    <span class="friend-language">${getLanguageFlag(friend.preferredLanguage)}</span>
                    <span class="friend-since">Friends since ${friendsSince}</span>
                </div>
            </div>
            <div class="friend-actions">
                <button class="action-btn challenge-btn" data-uid="${friend.uid}" title="${getText('friends.challenge', {}, 'Challenge')}">
                    ⚔️
                </button>
                <button class="action-btn message-btn" data-uid="${friend.uid}" title="${getText('friends.message', {}, 'Message')}">
                    💬
                </button>
                <button class="action-btn remove-btn" data-uid="${friend.uid}" title="${getText('friends.remove', {}, 'Remove Friend')}">
                    ❌
                </button>
            </div>
        </div>
    `;
}

/**
 * Load friend requests
 */
async function loadRequests() {
    const user = getCurrentUser();
    if (!user) return;

    const pendingContainer = document.getElementById('pending-requests-list');
    const sentContainer = document.getElementById('sent-requests-list');

    pendingContainer.innerHTML = '<div class="loading">Loading...</div>';
    sentContainer.innerHTML = '<div class="loading">Loading...</div>';

    try {
        const [pendingRequests, sentRequests] = await Promise.all([
            getPendingRequests(user.uid),
            getSentRequests(user.uid)
        ]);

        // Render pending requests
        if (pendingRequests.length === 0) {
            pendingContainer.innerHTML = `
                <div class="empty-state-small">
                    ${getText('friends.noPendingRequests', {}, 'No pending requests')}
                </div>
            `;
        } else {
            pendingContainer.innerHTML = pendingRequests.map(request => createRequestCard(request, 'pending')).join('');
            attachRequestListeners();
        }

        // Render sent requests
        if (sentRequests.length === 0) {
            sentContainer.innerHTML = `
                <div class="empty-state-small">
                    ${getText('friends.noSentRequests', {}, 'No sent requests')}
                </div>
            `;
        } else {
            sentContainer.innerHTML = sentRequests.map(request => createRequestCard(request, 'sent')).join('');
        }
    } catch (error) {
        console.error('Error loading requests:', error);
        pendingContainer.innerHTML = '<div class="error">Failed to load requests</div>';
        sentContainer.innerHTML = '<div class="error">Failed to load requests</div>';
    }
}

/**
 * Create request card HTML
 */
function createRequestCard(request, type) {
    if (type === 'pending') {
        return `
            <div class="request-card" data-sender="${request.senderId}">
                <div class="request-avatar">
                    ${request.senderPhoto ? 
                        `<img src="${request.senderPhoto}" alt="${request.senderName}">` :
                        `<div class="avatar-placeholder">${request.senderName.charAt(0).toUpperCase()}</div>`
                    }
                </div>
                <div class="request-info">
                    <div class="request-name">${request.senderName}</div>
                    <div class="request-meta">
                        <span class="request-language">${getLanguageFlag(request.senderLanguage)}</span>
                    </div>
                </div>
                <div class="request-actions">
                    <button class="action-btn accept-btn" data-sender="${request.senderId}">
                        ✓ ${getText('friends.accept', {}, 'Accept')}
                    </button>
                    <button class="action-btn decline-btn" data-sender="${request.senderId}">
                        ✗ ${getText('friends.decline', {}, 'Decline')}
                    </button>
                </div>
            </div>
        `;
    } else {
        const recipientName = request.recipientId; // In real app, fetch name
        return `
            <div class="request-card">
                <div class="request-info">
                    <div class="request-name">${getText('friends.requestSent', {}, 'Request sent')}</div>
                    <div class="request-status">${getText('friends.pending', {}, 'Pending...')}</div>
                </div>
            </div>
        `;
    }
}

/**
 * Attach search listener
 */
function attachSearchListener() {
    const searchInput = document.getElementById('user-search-input');
    const searchBtn = document.getElementById('search-btn');
    const resultsContainer = document.getElementById('search-results');

    const performSearch = async () => {
        const searchTerm = searchInput.value.trim();
        
        if (searchTerm.length < 2) {
            resultsContainer.innerHTML = `
                <div class="search-hint">
                    ${getText('friends.searchHint2', {}, 'Enter at least 2 characters to search')}
                </div>
            `;
            return;
        }

        resultsContainer.innerHTML = '<div class="loading">Searching...</div>';

        try {
            const results = await searchUsers(searchTerm);

            if (results.length === 0) {
                resultsContainer.innerHTML = `
                    <div class="empty-state-small">
                        ${getText('friends.noResults', {}, 'No users found')}
                    </div>
                `;
                return;
            }

            resultsContainer.innerHTML = await Promise.all(
                results.map(user => createSearchResultCard(user))
            ).then(cards => cards.join(''));
            
            attachSearchResultListeners();
        } catch (error) {
            console.error('Error searching users:', error);
            resultsContainer.innerHTML = '<div class="error">Search failed</div>';
        }
    };

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
}

/**
 * Create search result card
 */
async function createSearchResultCard(user) {
    const currentUser = getCurrentUser();
    const isFriend = await checkFriendship(currentUser.uid, user.uid);

    return `
        <div class="search-result-card" data-uid="${user.uid}">
            <div class="result-avatar">
                ${user.photoURL ? 
                    `<img src="${user.photoURL}" alt="${user.displayName}">` :
                    `<div class="avatar-placeholder">${user.displayName.charAt(0).toUpperCase()}</div>`
                }
            </div>
            <div class="result-info">
                <div class="result-name">${user.displayName}</div>
                <div class="result-meta">
                    <span class="result-language">${getLanguageFlag(user.preferredLanguage)}</span>
                    <span class="result-level">Lv. ${user.level}</span>
                </div>
            </div>
            <div class="result-actions">
                ${isFriend ? 
                    `<button class="action-btn friend-badge" disabled>✓ ${getText('friends.friends', {}, 'Friends')}</button>` :
                    `<button class="action-btn add-friend-btn" data-uid="${user.uid}">
                        ➕ ${getText('friends.addFriend', {}, 'Add Friend')}
                    </button>`
                }
            </div>
        </div>
    `;
}

/**
 * Attach friend card listeners
 */
function attachFriendCardListeners() {
    // Challenge buttons
    document.querySelectorAll('.challenge-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const friendUid = e.currentTarget.dataset.uid;
            // TODO: Open challenge modal
            alert('Challenge feature coming soon!');
        });
    });

    // Message buttons
    document.querySelectorAll('.message-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const friendUid = e.currentTarget.dataset.uid;
            // TODO: Open message modal
            alert('Messaging feature coming soon!');
        });
    });

    // Remove buttons
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const friendUid = e.currentTarget.dataset.uid;
            if (confirm(getText('friends.confirmRemove', {}, 'Are you sure you want to remove this friend?'))) {
                try {
                    await removeFriend(friendUid);
                    await loadFriendsList();
                    await updateFriendStats();
                } catch (error) {
                    alert('Failed to remove friend');
                }
            }
        });
    });
}

/**
 * Attach request listeners
 */
function attachRequestListeners() {
    // Accept buttons
    document.querySelectorAll('.accept-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const senderId = e.currentTarget.dataset.sender;
            try {
                await acceptFriendRequest(senderId);
                await loadRequests();
                await updateFriendStats();
                alert(getText('friends.requestAccepted', {}, 'Friend request accepted!'));
            } catch (error) {
                alert('Failed to accept request');
            }
        });
    });

    // Decline buttons
    document.querySelectorAll('.decline-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const senderId = e.currentTarget.dataset.sender;
            try {
                await declineFriendRequest(senderId);
                await loadRequests();
                await updateFriendStats();
            } catch (error) {
                alert('Failed to decline request');
            }
        });
    });
}

/**
 * Attach search result listeners
 */
function attachSearchResultListeners() {
    document.querySelectorAll('.add-friend-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const userUid = e.currentTarget.dataset.uid;
            try {
                await sendFriendRequest(userUid);
                e.currentTarget.textContent = '✓ ' + getText('friends.requestSent', {}, 'Request Sent');
                e.currentTarget.disabled = true;
                e.currentTarget.classList.add('disabled');
            } catch (error) {
                alert(error.message || 'Failed to send friend request');
            }
        });
    });
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
