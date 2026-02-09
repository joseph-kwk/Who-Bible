/**
 * Badge Collection UI
 * Display and manage achievement badges
 */

import { 
    ACHIEVEMENTS, 
    getUserAchievements, 
    getAchievementProgress,
    getAchievementsByCategory,
    getRarityColor,
    getCategoryIcon 
} from './achievements.js';
import { getCurrentUser } from './auth.js';
import { getUserStats } from './user-profile.js';
import { getText } from './translations.js';

let badgesModal = null;
let currentFilter = 'all';

/**
 * Initialize badges UI
 */
export function initBadgesUI() {
    createBadgesModal();
    attachBadgesButton();
}

/**
 * Create badges modal
 */
function createBadgesModal() {
    const modal = document.createElement('div');
    modal.id = 'badges-modal';
    modal.className = 'modal badges-modal';
    modal.innerHTML = `
        <div class="modal-content badges-content">
            <div class="modal-header">
                <h2>
                    <span class="icon">🏆</span>
                    <span class="text">${getText('badges.title', {}, 'Achievements')}</span>
                </h2>
                <button class="close-btn" onclick="document.getElementById('badges-modal').style.display='none'">
                    ×
                </button>
            </div>
            
            <div class="badges-stats">
                <div class="stat-item">
                    <div class="stat-value" id="badges-earned">0</div>
                    <div class="stat-label">${getText('badges.earned', {}, 'Earned')}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="badges-total">${Object.keys(ACHIEVEMENTS).length}</div>
                    <div class="stat-label">${getText('badges.total', {}, 'Total')}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="badges-percentage">0%</div>
                    <div class="stat-label">${getText('badges.completion', {}, 'Completion')}</div>
                </div>
            </div>

            <div class="badges-filters">
                <button class="filter-btn active" data-filter="all">
                    ${getText('badges.all', {}, 'All')}
                </button>
                <button class="filter-btn" data-filter="earned">
                    ✅ ${getText('badges.earned', {}, 'Earned')}
                </button>
                <button class="filter-btn" data-filter="locked">
                    🔒 ${getText('badges.locked', {}, 'Locked')}
                </button>
                <button class="filter-btn" data-filter="common">
                    ${getText('badges.common', {}, 'Common')}
                </button>
                <button class="filter-btn" data-filter="rare">
                    ${getText('badges.rare', {}, 'Rare')}
                </button>
                <button class="filter-btn" data-filter="epic">
                    ${getText('badges.epic', {}, 'Epic')}
                </button>
                <button class="filter-btn" data-filter="legendary">
                    ${getText('badges.legendary', {}, 'Legendary')}
                </button>
            </div>

            <div class="badges-categories">
                <!-- Categories will be dynamically rendered -->
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    badgesModal = modal;

    // Attach filter listeners
    modal.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            modal.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderBadges();
        });
    });

    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

/**
 * Attach badges button to UI
 */
function attachBadgesButton() {
    // Add to profile dropdown
    const profileDropdown = document.querySelector('.profile-dropdown');
    if (profileDropdown) {
        const badgesBtn = document.createElement('button');
        badgesBtn.className = 'dropdown-item badges-btn';
        badgesBtn.innerHTML = '🏆 ' + getText('badges.title', {}, 'Achievements');
        badgesBtn.addEventListener('click', () => {
            profileDropdown.style.display = 'none';
            showBadgesModal();
        });
        
        // Insert before sign out button
        const signOutBtn = profileDropdown.querySelector('.sign-out-btn');
        profileDropdown.insertBefore(badgesBtn, signOutBtn);
    }
}

/**
 * Show badges modal
 */
export async function showBadgesModal() {
    const user = getCurrentUser();
    if (!user) {
        alert(getText('badges.loginRequired', {}, 'Please log in to view achievements'));
        return;
    }

    badgesModal.style.display = 'flex';
    await renderBadges();
}

/**
 * Render badges
 */
async function renderBadges() {
    const user = getCurrentUser();
    if (!user) return;

    try {
        const userAchievements = await getUserAchievements(user.uid);
        const stats = getUserStats();
        
        // Update stats
        document.getElementById('badges-earned').textContent = userAchievements.length;
        const percentage = Math.round((userAchievements.length / Object.keys(ACHIEVEMENTS).length) * 100);
        document.getElementById('badges-percentage').textContent = percentage + '%';

        // Group by category
        const categories = {};
        Object.values(ACHIEVEMENTS).forEach(achievement => {
            if (!categories[achievement.category]) {
                categories[achievement.category] = [];
            }
            categories[achievement.category].push(achievement);
        });

        // Render categories
        const container = badgesModal.querySelector('.badges-categories');
        container.innerHTML = '';

        for (const [category, achievements] of Object.entries(categories)) {
            const categoryEl = createCategorySection(category, achievements, userAchievements, stats);
            container.appendChild(categoryEl);
        }
    } catch (error) {
        console.error('Error rendering badges:', error);
    }
}

/**
 * Create category section
 */
function createCategorySection(category, achievements, userAchievements, stats) {
    const section = document.createElement('div');
    section.className = 'badges-category';
    
    const categoryName = getText(`badges.category.${category}`, {}, category);
    const earned = achievements.filter(a => userAchievements.some(ua => ua.id === a.id)).length;
    
    section.innerHTML = `
        <div class="category-header">
            <h3>
                <span class="icon">${getCategoryIcon(category)}</span>
                <span class="text">${categoryName}</span>
                <span class="count">(${earned}/${achievements.length})</span>
            </h3>
        </div>
        <div class="badges-grid">
            ${achievements.map(a => createBadgeCard(a, userAchievements, stats)).join('')}
        </div>
    `;

    return section;
}

/**
 * Create badge card
 */
function createBadgeCard(achievement, userAchievements, stats) {
    const isEarned = userAchievements.some(a => a.id === achievement.id);
    const earnedData = userAchievements.find(a => a.id === achievement.id);
    
    // Apply filter
    if (currentFilter === 'earned' && !isEarned) return '';
    if (currentFilter === 'locked' && isEarned) return '';
    if (currentFilter !== 'all' && currentFilter !== 'earned' && currentFilter !== 'locked') {
        if (achievement.rarity !== currentFilter) return '';
    }

    const progress = getAchievementProgress(achievement.id, stats);
    const rarityColor = getRarityColor(achievement.rarity);

    let cardHTML = `
        <div class="badge-card ${isEarned ? 'earned' : 'locked'}" 
             style="--rarity-color: ${rarityColor}"
             title="${achievement.description}">
            <div class="badge-icon ${isEarned ? '' : 'grayscale'}">
                ${achievement.icon}
            </div>
            <div class="badge-name">${achievement.name}</div>
            <div class="badge-description">${achievement.description}</div>
            <div class="badge-rarity" style="color: ${rarityColor}">
                ${achievement.rarity.toUpperCase()}
            </div>
    `;

    if (isEarned && earnedData) {
        const date = earnedData.earnedAt ? earnedData.earnedAt.toDate().toLocaleDateString() : 'Unknown';
        cardHTML += `
            <div class="badge-earned-date">
                ✅ ${getText('badges.earnedOn', {}, 'Earned')}: ${date}
            </div>
            <div class="badge-xp">+${achievement.xpReward} XP</div>
        `;
    } else if (progress) {
        cardHTML += `
            <div class="badge-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress.percentage}%"></div>
                </div>
                <div class="progress-text">${progress.current}/${progress.target}</div>
            </div>
        `;
    } else {
        cardHTML += `
            <div class="badge-locked-message">
                🔒 ${getText('badges.locked', {}, 'Locked')}
            </div>
        `;
    }

    cardHTML += `</div>`;
    return cardHTML;
}

/**
 * Show achievement notification
 */
export function showAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <div class="achievement-notification-content">
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-info">
                <div class="achievement-title">
                    ${getText('badges.unlocked', {}, 'Achievement Unlocked!')}
                </div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-xp">+${achievement.xpReward} XP</div>
            </div>
        </div>
    `;

    document.body.appendChild(notification);

    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 100);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 500);
    }, 5000);

    // Click to dismiss
    notification.addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 500);
    });
}

/**
 * Update badge count in header
 */
export async function updateBadgeCount() {
    const user = getCurrentUser();
    if (!user) return;

    try {
        const userAchievements = await getUserAchievements(user.uid);
        const badgeBtn = document.querySelector('.badges-btn');
        if (badgeBtn) {
            const count = userAchievements.length;
            badgeBtn.innerHTML = `🏆 ${getText('badges.title', {}, 'Achievements')} (${count})`;
        }
    } catch (error) {
        console.error('Error updating badge count:', error);
    }
}
