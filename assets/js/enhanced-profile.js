/**
 * Enhanced Profile Features
 * Display challenge stats, badges, and social features on user profiles
 */

import { getChallengeStats } from './friend-challenges.js';
import { getUserAchievements } from './achievements.js';
import { getFriendsList } from './friends.js';
import { getCurrentUser } from './auth.js';
import { getText } from './translations.js';

/**
 * Render enhanced profile card with challenge stats
 */
export async function renderEnhancedProfile(container, uid = null) {
    const user = await getCurrentUser();
    if (!user && !uid) return;

    const targetUid = uid || user.uid;
    const isOwnProfile = !uid || uid === user.uid;

    try {
        const [challengeStats, achievements, friendsList] = await Promise.all([
            getChallengeStats(),
            getUserAchievements(targetUid),
            isOwnProfile ? getFriendsList() : null
        ]);

        const html = `
            <div class="enhanced-profile">
                ${renderChallengeStatsSection(challengeStats)}
                ${renderAchievementHighlights(achievements)}
                ${isOwnProfile ? renderQuickActions() : ''}
            </div>
        `;

        if (container) {
            container.innerHTML = html;
        }

        return html;
    } catch (error) {
        console.error('Error rendering enhanced profile:', error);
        return '';
    }
}

/**
 * Render challenge stats section
 */
function renderChallengeStatsSection(stats) {
    if (!stats || stats.total === 0) {
        return `
            <div class="profile-section challenge-stats">
                <h3 class="section-title">
                    ⚔️ ${getText('profile.challengeStats', {}, 'Challenge Stats')}
                </h3>
                <div class="empty-message">
                    ${getText('profile.noChallenges', {}, 'No challenges completed yet')}
                </div>
            </div>
        `;
    }

    const winPercentage = stats.winRate;
    const lossPercentage = stats.total > 0 ? ((stats.losses / stats.total) * 100).toFixed(0) : 0;
    const tiePercentage = stats.total > 0 ? ((stats.ties / stats.total) * 100).toFixed(0) : 0;

    return `
        <div class="profile-section challenge-stats">
            <h3 class="section-title">
                ⚔️ ${getText('profile.challengeStats', {}, 'Challenge Stats')}
            </h3>
            
            <div class="stats-summary">
                <div class="stat-item">
                    <div class="stat-icon">🎯</div>
                    <div class="stat-info">
                        <div class="stat-value">${stats.total}</div>
                        <div class="stat-label">${getText('profile.totalChallenges', {}, 'Total Challenges')}</div>
                    </div>
                </div>
                
                <div class="stat-item win">
                    <div class="stat-icon">🏆</div>
                    <div class="stat-info">
                        <div class="stat-value">${stats.wins}</div>
                        <div class="stat-label">${getText('profile.wins', {}, 'Wins')} (${winPercentage}%)</div>
                    </div>
                </div>
                
                <div class="stat-item">
                    <div class="stat-icon">📊</div>
                    <div class="stat-info">
                        <div class="stat-value">${stats.avgScore}</div>
                        <div class="stat-label">${getText('profile.avgScore', {}, 'Avg Score')}</div>
                    </div>
                </div>
            </div>

            <div class="progress-bars">
                <div class="progress-bar win" style="width: ${winPercentage}%" title="${getText('profile.wins', {}, 'Wins')}: ${winPercentage}%"></div>
                <div class="progress-bar loss" style="width: ${lossPercentage}%" title="${getText('profile.losses', {}, 'Losses')}: ${lossPercentage}%"></div>
                <div class="progress-bar tie" style="width: ${tiePercentage}%" title="${getText('profile.ties', {}, 'Ties')}: ${tiePercentage}%"></div>
            </div>

            ${stats.consecutiveWins > 0 ? `
                <div class="highlight-stat">
                    <span class="icon">🔥</span>
                    ${getText('profile.bestStreak', { count: stats.consecutiveWins }, `Best Win Streak: ${stats.consecutiveWins}`)}
                </div>
            ` : ''}

            ${stats.mostChallengedCount > 0 ? `
                <div class="favorite-opponent">
                    <span class="icon">🤝</span>
                    ${getText('profile.mostChallenged', { count: stats.mostChallengedCount }, `Most Challenged Opponent: ${stats.mostChallengedCount} times`)}
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Render achievement highlights
 */
function renderAchievementHighlights(achievements) {
    if (!achievements || achievements.length === 0) {
        return '';
    }

    // Get recent achievements (last 5)
    const recentAchievements = achievements
        .sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))
        .slice(0, 5);

    // Get rarest achievements
    const rarestAchievements = achievements
        .filter(a => a.rarity === 'legendary' || a.rarity === 'epic')
        .slice(0, 3);

    return `
        <div class="profile-section achievement-highlights">
            <h3 class="section-title">
                🏅 ${getText('profile.achievements', {}, 'Recent Achievements')}
            </h3>
            
            <div class="achievement-showcase">
                ${recentAchievements.map(achievement => `
                    <div class="achievement-badge ${achievement.rarity}">
                        <div class="badge-icon">${achievement.icon}</div>
                        <div class="badge-info">
                            <div class="badge-name">${achievement.name}</div>
                            <div class="badge-desc">${achievement.description}</div>
                        </div>
                    </div>
                `).join('')}
            </div>

            ${rarestAchievements.length > 0 ? `
                <div class="rare-achievements">
                    <h4>${getText('profile.rareAchievements', {}, 'Rare Achievements')}</h4>
                    <div class="rare-badges">
                        ${rarestAchievements.map(a => `
                            <span class="rare-badge ${a.rarity}" title="${a.name}: ${a.description}">
                                ${a.icon}
                            </span>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Render quick actions
 */
function renderQuickActions() {
    return `
        <div class="profile-section quick-actions">
            <h3 class="section-title">
                ⚡ ${getText('profile.quickActions', {}, 'Quick Actions')}
            </h3>
            
            <div class="action-buttons">
                <button class="action-btn" id="view-challenges-btn">
                    <span class="btn-icon">⚔️</span>
                    <span class="btn-text">${getText('profile.viewChallenges', {}, 'View Challenges')}</span>
                </button>
                
                <button class="action-btn" id="view-friends-btn">
                    <span class="btn-icon">👥</span>
                    <span class="btn-text">${getText('profile.viewFriends', {}, 'View Friends')}</span>
                </button>
                
                <button class="action-btn" id="view-achievements-btn">
                    <span class="btn-icon">🏆</span>
                    <span class="btn-text">${getText('profile.viewAchievements', {}, 'View Achievements')}</span>
                </button>
                
                <button class="action-btn" id="view-leaderboard-btn">
                    <span class="btn-icon">📊</span>
                    <span class="btn-text">${getText('profile.viewLeaderboard', {}, 'Leaderboard')}</span>
                </button>
            </div>
        </div>
    `;
}

/**
 * Attach profile action listeners
 */
export function attachProfileActionListeners() {
    // View challenges
    document.getElementById('view-challenges-btn')?.addEventListener('click', () => {
        // Import and open challenges modal
        import('./challenge-ui.js').then(module => {
            module.openChallengesModal();
        });
    });

    // View friends
    document.getElementById('view-friends-btn')?.addEventListener('click', () => {
        // Import and open friends modal
        import('./friends-ui.js').then(module => {
            module.openFriendsModal();
        });
    });

    // View achievements
    document.getElementById('view-achievements-btn')?.addEventListener('click', () => {
        // Import and open badges modal
        import('./badges-ui.js').then(module => {
            module.openBadgesModal();
        });
    });

    // View leaderboard
    document.getElementById('view-leaderboard-btn')?.addEventListener('click', () => {
        // Import and open leaderboard modal
        import('./leaderboard-ui.js').then(module => {
            module.openLeaderboardModal();
        });
    });
}

/**
 * Get user profile summary (for friend cards, etc.)
 */
export async function getUserProfileSummary(uid) {
    try {
        const [challengeStats, achievements] = await Promise.all([
            getChallengeStats(),
            getUserAchievements(uid)
        ]);

        return {
            totalChallenges: challengeStats?.total || 0,
            wins: challengeStats?.wins || 0,
            winRate: challengeStats?.winRate || 0,
            totalAchievements: achievements?.length || 0,
            rareAchievements: achievements?.filter(a => 
                a.rarity === 'legendary' || a.rarity === 'epic'
            ).length || 0
        };
    } catch (error) {
        console.error('Error getting profile summary:', error);
        return null;
    }
}

/**
 * Enhanced profile CSS (inline for component)
 */
export const enhancedProfileStyles = `
    .enhanced-profile {
        display: flex;
        flex-direction: column;
        gap: 24px;
    }

    .profile-section {
        background: var(--bg-secondary);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        padding: 20px;
    }

    .section-title {
        font-size: 1.3rem;
        color: var(--text-primary);
        margin: 0 0 16px 0;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .stats-summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 16px;
        margin-bottom: 20px;
    }

    .stat-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: var(--bg-primary);
        border-radius: 8px;
        border: 2px solid var(--border-color);
    }

    .stat-item.win {
        border-color: #FFD700;
    }

    .stat-icon {
        font-size: 2rem;
    }

    .stat-value {
        font-size: 1.8rem;
        font-weight: 700;
        color: var(--accent-color);
    }

    .stat-item.win .stat-value {
        color: #FFD700;
    }

    .stat-label {
        font-size: 0.9rem;
        color: var(--text-secondary);
    }

    .progress-bars {
        display: flex;
        height: 8px;
        border-radius: 4px;
        overflow: hidden;
        background: var(--bg-primary);
        margin-bottom: 16px;
    }

    .progress-bar {
        transition: width 0.5s ease;
    }

    .progress-bar.win {
        background: linear-gradient(90deg, #FFD700, #FFA500);
    }

    .progress-bar.loss {
        background: linear-gradient(90deg, #757575, #9E9E9E);
    }

    .progress-bar.tie {
        background: linear-gradient(90deg, #9C27B0, #BA68C8);
    }

    .highlight-stat, .favorite-opponent {
        padding: 12px;
        background: var(--accent-color)10;
        border-radius: 8px;
        color: var(--text-primary);
        margin-top: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .achievement-showcase {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .achievement-badge {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: var(--bg-primary);
        border-radius: 8px;
        border: 2px solid var(--border-color);
    }

    .achievement-badge.epic {
        border-color: #9C27B0;
    }

    .achievement-badge.legendary {
        border-color: #FFD700;
    }

    .badge-icon {
        font-size: 2.5rem;
    }

    .badge-name {
        font-weight: 600;
        color: var(--text-primary);
    }

    .badge-desc {
        font-size: 0.9rem;
        color: var(--text-secondary);
    }

    .rare-achievements {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 2px solid var(--border-color);
    }

    .rare-achievements h4 {
        margin: 0 0 12px 0;
        color: var(--text-primary);
    }

    .rare-badges {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
    }

    .rare-badge {
        font-size: 3rem;
        cursor: pointer;
        transition: transform 0.3s ease;
    }

    .rare-badge:hover {
        transform: scale(1.2);
    }

    .action-buttons {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
    }

    .action-btn {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px 20px;
        background: var(--accent-color);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .action-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px var(--accent-color)40;
    }

    .btn-icon {
        font-size: 1.4rem;
    }

    .empty-message {
        text-align: center;
        padding: 40px 20px;
        color: var(--text-secondary);
    }

    @media (max-width: 768px) {
        .stats-summary {
            grid-template-columns: 1fr;
        }

        .action-buttons {
            grid-template-columns: 1fr;
        }
    }
`;
