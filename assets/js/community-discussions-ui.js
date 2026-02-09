/**
 * Community Discussions UI
 * User interface for discussion rooms and community engagement
 */

import {
    DISCUSSION_ROOMS,
    getRoomMessages,
    sendRoomMessage,
    subscribeToRoom,
    reportMessage,
    toggleMessageLike,
    getUserLikes,
    getRoomStats,
    deleteMessage,
    formatMessageTime,
    cleanupDiscussions
} from './community-discussions.js';
import { getCurrentUser } from './auth.js';
import { getText } from './translations.js';

let currentRoom = null;
let userLikes = new Set();
let unsubscribe = null;

/**
 * Initialize discussions UI in community page
 */
export function initDiscussionsUI() {
    createDiscussionsSection();
    attachDiscussionsListeners();
}

/**
 * Create discussions section in community page
 */
function createDiscussionsSection() {
    const discussTab = document.getElementById('section-discussions');
    if (!discussTab) {
        console.warn('Discussions section not found in community page');
        return;
    }

    discussTab.innerHTML = `
        <div class="discussions-container">
            <!-- Room List View -->
            <div class="room-list-view" id="room-list-view">
                <div class="rooms-header">
                    <h2>📚 ${getText('discussions.title', {}, 'Bible Discussions')}</h2>
                    <p class="muted">${getText('discussions.subtitle', {}, 'Join a room to discuss Bible topics with the community')}</p>
                </div>

                <div class="room-categories">
                    <div class="category">
                        <h3>📖 ${getText('discussions.oldTestament', {}, 'Old Testament')}</h3>
                        <div class="room-grid" id="old-testament-rooms"></div>
                    </div>

                    <div class="category">
                        <h3>✝️ ${getText('discussions.newTestament', {}, 'New Testament')}</h3>
                        <div class="room-grid" id="new-testament-rooms"></div>
                    </div>

                    <div class="category">
                        <h3>💬 ${getText('discussions.general', {}, 'General & Community')}</h3>
                        <div class="room-grid" id="general-rooms"></div>
                    </div>
                </div>
            </div>

            <!-- Room Chat View -->
            <div class="room-chat-view" id="room-chat-view" style="display: none;">
                <div class="chat-header">
                    <button class="back-btn" id="back-to-rooms">
                        ← ${getText('discussions.backToRooms', {}, 'Back to Rooms')}
                    </button>
                    <div class="room-info">
                        <h2 id="current-room-name"></h2>
                        <p class="muted" id="current-room-description"></p>
                    </div>
                </div>

                <div class="chat-messages" id="chat-messages">
                    <!-- Messages will be rendered here -->
                </div>

                <div class="chat-input-container">
                    <div class="community-reminder">
                        📖 Remember: All discussions are public. Follow our <button class="link-btn" id="show-guidelines-link">Community Guidelines</button>
                    </div>
                    <div class="chat-input-wrapper">
                        <textarea 
                            id="message-input" 
                            placeholder="${getText('discussions.messagePlaceholder', {}, 'Share your thoughts... (max 500 characters)')}"
                            maxlength="500"
                            rows="2"
                        ></textarea>
                        <button id="send-message-btn" class="primary-btn" disabled>
                            ${getText('discussions.send', {}, 'Send')} ➤
                        </button>
                    </div>
                    <div class="char-counter">
                        <span id="char-count">0</span>/500
                    </div>
                </div>
            </div>
        </div>
    `;

    renderRoomCards();
}

/**
 * Render room cards
 */
async function renderRoomCards() {
    const oldTestamentContainer = document.getElementById('old-testament-rooms');
    const newTestamentContainer = document.getElementById('new-testament-rooms');
    const generalContainer = document.getElementById('general-rooms');

    if (!oldTestamentContainer || !newTestamentContainer || !generalContainer) return;

    // Clear containers
    oldTestamentContainer.innerHTML = '';
    newTestamentContainer.innerHTML = '';
    generalContainer.innerHTML = '';

    // Render rooms by category
    for (const room of Object.values(DISCUSSION_ROOMS)) {
        const stats = await getRoomStats(room.id);
        const card = createRoomCard(room, stats);

        if (room.category === 'old-testament') {
            oldTestamentContainer.appendChild(card);
        } else if (room.category === 'new-testament') {
            newTestamentContainer.appendChild(card);
        } else {
            generalContainer.appendChild(card);
        }
    }
}

/**
 * Create room card element
 */
function createRoomCard(room, stats) {
    const card = document.createElement('div');
    card.className = 'room-card';
    card.dataset.roomId = room.id;

    const lastActivity = stats.lastMessageTime 
        ? formatMessageTime(stats.lastMessageTime)
        : 'No messages yet';

    card.innerHTML = `
        <div class="room-icon">${room.icon}</div>
        <div class="room-details">
            <h3>${room.name}</h3>
            <p class="room-description">${room.description}</p>
            <div class="room-stats">
                <span>💬 ${stats.messageCount || 0} messages</span>
                <span>•</span>
                <span>🕐 ${lastActivity}</span>
            </div>
        </div>
    `;

    card.addEventListener('click', () => openRoom(room));

    return card;
}

/**
 * Open a discussion room
 */
async function openRoom(room) {
    const user = await getCurrentUser();
    if (!user) {
        showToast({
            title: '🔒 Login Required',
            msg: 'Please login to join discussions',
            type: 'info'
        });
        return;
    }

    currentRoom = room;

    // Switch views
    document.getElementById('room-list-view').style.display = 'none';
    document.getElementById('room-chat-view').style.display = 'flex';

    // Update room info
    document.getElementById('current-room-name').textContent = `${room.icon} ${room.name}`;
    document.getElementById('current-room-description').textContent = room.description;

    // Load messages
    loadRoomMessages(room.id);

    // Subscribe to real-time updates
    if (unsubscribe) unsubscribe();
    unsubscribe = subscribeToRoom(room.id, (messages) => {
        renderMessages(messages);
    });

    // Load user likes
    userLikes = await getUserLikes(room.id);
}

/**
 * Close room and return to list
 */
function closeRoom() {
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
    }

    currentRoom = null;
    document.getElementById('room-list-view').style.display = 'block';
    document.getElementById('room-chat-view').style.display = 'none';
    document.getElementById('message-input').value = '';
}

/**
 * Load room messages
 */
async function loadRoomMessages(roomId) {
    const messagesContainer = document.getElementById('chat-messages');
    messagesContainer.innerHTML = '<div class="loading">Loading messages...</div>';

    try {
        const messages = await getRoomMessages(roomId);
        renderMessages(messages);
    } catch (error) {
        console.error('Error loading messages:', error);
        messagesContainer.innerHTML = '<div class="error">Failed to load messages</div>';
    }
}

/**
 * Render messages
 */
async function renderMessages(messages) {
    const container = document.getElementById('chat-messages');
    const currentUser = await getCurrentUser();

    if (messages.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p class="large-icon">💬</p>
                <p>${getText('discussions.noMessages', {}, 'No messages yet. Start the conversation!')}</p>
            </div>
        `;
        return;
    }

    container.innerHTML = messages.map(msg => createMessageElement(msg, currentUser)).join('');

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;

    // Attach message listeners
    attachMessageListeners();
}

/**
 * Create message element
 */
function createMessageElement(message, currentUser) {
    const isOwnMessage = currentUser && message.userId === currentUser.uid;
    const isLiked = userLikes.has(message.id);
    const languageFlag = getLanguageFlag(message.preferredLanguage);

    return `
        <div class="message ${isOwnMessage ? 'own-message' : ''}" data-message-id="${message.id}">
            <div class="message-header">
                <span class="message-author">
                    ${languageFlag} ${message.displayName}
                    ${isOwnMessage ? '<span class="you-badge">(You)</span>' : ''}
                </span>
                <span class="message-time">${formatMessageTime(message.timestamp)}</span>
            </div>
            <div class="message-content">${escapeHtml(message.content)}</div>
            <div class="message-actions">
                <button class="like-btn ${isLiked ? 'liked' : ''}" data-message-id="${message.id}">
                    ❤️ <span>${message.likes || 0}</span>
                </button>
                ${isOwnMessage && canDeleteMessage(message.timestamp) ? 
                    `<button class="delete-btn" data-message-id="${message.id}">🗑️ Delete</button>` : ''}
                ${!isOwnMessage ? 
                    `<button class="report-btn" data-message-id="${message.id}">⚠️ Report</button>` : ''}
            </div>
        </div>
    `;
}

/**
 * Check if message can be deleted (within 5 minutes)
 */
function canDeleteMessage(timestamp) {
    const messageTime = new Date(timestamp).getTime();
    const now = Date.now();
    return (now - messageTime) < 5 * 60 * 1000;
}

/**
 * Get language flag emoji
 */
function getLanguageFlag(lang) {
    const flags = {
        'en': '🇬🇧',
        'es': '🇪🇸',
        'fr': '🇫🇷'
    };
    return flags[lang] || '🌐';
}

/**
 * Attach message listeners (likes, delete, report)
 */
function attachMessageListeners() {
    // Like buttons
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const messageId = btn.dataset.messageId;
            try {
                const liked = await toggleMessageLike(currentRoom.id, messageId);
                if (liked) {
                    userLikes.add(messageId);
                } else {
                    userLikes.delete(messageId);
                }
            } catch (error) {
                showToast({
                    title: 'Error',
                    msg: error.message,
                    type: 'error'
                });
            }
        });
    });

    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const messageId = btn.dataset.messageId;
            if (confirm(getText('discussions.confirmDelete', {}, 'Delete this message?'))) {
                try {
                    await deleteMessage(currentRoom.id, messageId);
                    showToast({
                        title: '✅ Deleted',
                        msg: 'Message deleted',
                        type: 'success'
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
    });

    // Report buttons
    document.querySelectorAll('.report-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const messageId = btn.dataset.messageId;
            const reason = prompt(getText('discussions.reportReason', {}, 'Why are you reporting this message?'));
            if (reason && reason.trim()) {
                try {
                    await reportMessage(currentRoom.id, messageId, reason);
                    showToast({
                        title: '✅ Reported',
                        msg: 'Thank you. Moderators will review this.',
                        type: 'success'
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
    });
}

/**
 * Attach discussions listeners
 */
function attachDiscussionsListeners() {
    // Back to rooms button
    const backBtn = document.getElementById('back-to-rooms');
    if (backBtn) {
        backBtn.addEventListener('click', closeRoom);
    }

    // Message input
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-message-btn');
    const charCount = document.getElementById('char-count');

    if (messageInput && sendBtn) {
        messageInput.addEventListener('input', () => {
            const length = messageInput.value.length;
            charCount.textContent = length;
            sendBtn.disabled = length === 0 || length > 500;
        });

        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!sendBtn.disabled) {
                    handleSendMessage();
                }
            }
        });

        sendBtn.addEventListener('click', handleSendMessage);
    }

    // Show guidelines link
    const guidelinesLink = document.getElementById('show-guidelines-link');
    if (guidelinesLink) {
        guidelinesLink.addEventListener('click', () => {
            const guidelinesModal = document.getElementById('guidelines-modal');
            if (guidelinesModal) {
                guidelinesModal.style.display = 'flex';
            }
        });
    }
}

/**
 * Handle sending a message
 */
async function handleSendMessage() {
    const input = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-message-btn');
    const content = input.value.trim();

    if (!content || !currentRoom) return;

    // Disable input while sending
    input.disabled = true;
    sendBtn.disabled = true;

    try {
        await sendRoomMessage(currentRoom.id, content);
        input.value = '';
        document.getElementById('char-count').textContent = '0';
        
        showToast({
            title: '✅ Sent',
            msg: 'Message posted to room',
            type: 'success',
            timeout: 1500
        });
    } catch (error) {
        showToast({
            title: 'Error',
            msg: error.message,
            type: 'error'
        });
    } finally {
        input.disabled = false;
        sendBtn.disabled = false;
        input.focus();
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
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Cleanup on page unload
 */
window.addEventListener('beforeunload', () => {
    cleanupDiscussions();
});
